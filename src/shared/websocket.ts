import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import { Secret } from "jsonwebtoken";
import prisma from "./prisma";
import config from "../config";
import {
  UserRole,
} from "@prisma/client";
import { jwtHelpers } from "../helpars/jwtHelpers";

// Extended WebSocket type to track user info
interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  userRole?: string;
  userName?: string;
  isAlive?: boolean;
  path?: string;
} 

export const onlineUsers = new Map<
  string,
  { socket: ExtendedWebSocket; path: string }
>();
const onlineCouriers = new Map<string, ExtendedWebSocket>();

// Set up WebSocket server
export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({
    server,
    perMessageDeflate: false,
    handleProtocols: (protocols: string[] | Set<string>) => {
      const protocolArray = Array.isArray(protocols)
        ? protocols
        : Array.from(protocols);
      return protocolArray.length === 0 ? "" : protocolArray[0];
    },
  });

  // Keep clients alive
  function heartbeat(ws: ExtendedWebSocket) {
    ws.isAlive = true;
  }

  // Check every 30 seconds for alive connections
  const interval = setInterval(() => {
    wss.clients.forEach((ws: ExtendedWebSocket) => {
      if (ws.isAlive === false) {
        if (ws.userId) {
          onlineUsers.delete(ws.userId);
          if (ws.userRole === UserRole.Driver) {
            onlineCouriers.delete(ws.userId);
          }
        }
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  // Handle WebSocket connections
  wss.on("connection", (ws: ExtendedWebSocket, req) => {
    ws.isAlive = true;
    ws.path = req.url;
    console.log("New WebSocket connection established on path:", ws.path);

    // Send message when connected
    ws.send(
      JSON.stringify({
        event: "info",
        message: "Connected to server. Please authenticate.",
      })
    );

    ws.on("pong", () => heartbeat(ws));

    // Handle incoming WebSocket messages
    ws.on("message", async (data: string) => {
      try {
        const parsedData = JSON.parse(data);
        console.log("Received event:", parsedData.event, "on path:", ws.path);

        if (!ws.userId && parsedData.event !== "authenticate") {
          ws.send(
            JSON.stringify({
              event: "error",
              message: "Please authenticate first",
            })
          );
          return;
        }

        if (parsedData.event === "authenticate") {
          const token = parsedData.token;
          if (!token) {
            ws.send(
              JSON.stringify({
                event: "error",
                message: "Token is required for authentication",
              })
            );
            return;
          }

          try {
            const user = jwtHelpers.verifyToken(
              token,
              config.jwt.jwt_secret as Secret
            );
            const { id, role, email } = user;

            // Remove existing connection for this user
            const existingConnection = onlineUsers.get(id);
            if (existingConnection && existingConnection.path === ws.path) {
              existingConnection.socket.close();
              onlineUsers.delete(id);
              if (role === UserRole.Driver) {
                onlineCouriers.delete(id);
              }
            }

            ws.userId = id;
            ws.userRole = role;
            ws.userName = email;
            onlineUsers.set(id, { socket: ws, path: ws.path! });

            if (role === UserRole.Driver) {
              onlineCouriers.set(id, ws);
            }

            ws.send(
              JSON.stringify({
                event: "authenticated",
                data: { userId: id, role, success: true },
              })
            );
          } catch (error) {
            ws.send(
              JSON.stringify({
                event: "error",
                message: "Invalid token",
              })
            );
          }
          return;
        }

        if (ws.path === "/driver-location") {
          await handleDriverLocationUpdate(ws, parsedData);
        } else {
          await handleParcelChatMessage(ws, parsedData);
        }
      } catch (error) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Invalid message format",
          })
        );
      }
    });

    // Close connection cleanup
    ws.on("close", () => {
      if (ws.userId) {
        onlineUsers.delete(ws.userId);
        if (ws.userRole === UserRole.Driver) {
          onlineCouriers.delete(ws.userId);
        }
      }
    });
  });

  return wss;
}

// Handle the driver's location update and notify the user
async function handleDriverLocationUpdate(
  ws: ExtendedWebSocket,
  parsedData: any
) {
  const { lat, lng, location, transportId } = parsedData;

  if (lat === undefined || lng === undefined || !transportId) {
    ws.send(
      JSON.stringify({
        event: "error",
        message: "lat, lng, and transportId are required",
      })
    );
    return;
  }

  try {
    const transport = await prisma.carTransport.findUnique({
      where: { id: transportId },
    });

    if (!transport) {
      ws.send(
        JSON.stringify({
          event: "error",
          message: "Transport not found",
        })
      );
      return;
    }

    // Update the driver's location in the database
    await prisma.user.update({
      where: { id: ws.userId },
      data: { lat, lng, location },
    });

    // Calculate remaining distance between driver and destination
    const remainingDistance = calculateDistance(
      lat,
      lng,
      transport.dropOffLat!,
      transport.dropOffLng!
    );

    // Broadcast the location and remaining distance to the user
    const userConnection = onlineUsers.get(transport.userId);
    if (userConnection?.socket.readyState === WebSocket.OPEN) {
      userConnection.socket.send(
        JSON.stringify({
          event: "driverLocationUpdate",
          data: {
            transportId,
            location: { lat, lng, location },
            remainingDistance: remainingDistance.toFixed(2),
          },
        })
      );
    }

    // Confirm back to the driver
    ws.send(
      JSON.stringify({
        event: "driverLocationUpdate",
        data: {
          transportId,
          location: { lat, lng, location },
          remainingDistance: remainingDistance.toFixed(2),
        },
      })
    );
  } catch (error) {
    console.error("Error updating driver location:", error);
    ws.send(
      JSON.stringify({
        event: "error",
        message: "Failed to update location",
      })
    );
  }
}

// Function to calculate the distance between two points (lat/lng)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return distance;
}

async function handleParcelChatMessage(ws: ExtendedWebSocket, parsedData: any) {
  switch (parsedData.event) {
    case "joinParcelChat": {
      const { carTransportId } = parsedData;

      if (!carTransportId) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "carTransportId is required",
          })
        );
        return;
      }

      try {
        const carTransport = await prisma.carTransport.findUnique({
          where: { id: carTransportId },
          include: {
            sender: {
              select: { id: true, fullName: true, email: true },
            },
            driver: {
              select: { id: true, fullName: true, email: true },
            },
          },
        });

        if (!carTransport) {
          ws.send(
            JSON.stringify({
              event: "error",
              message: "Car transport not found",
            })
          );
          return;
        }

        // Check if user is either sender or driver
        if (
          carTransport.userId !== ws.userId &&
          carTransport.assignedDriver !== ws.userId
        ) {
          ws.send(
            JSON.stringify({
              event: "error",
              message: "You are not authorized to join this chat",
            })
          );
          return;
        }

        // Check if chat is allowed
        // if (carTransport.status !== "COMPLETED") {
        //   ws.send(
        //     JSON.stringify({
        //       event: "error",
        //       message: "Chat is only available for accepted transports",
        //     })
        //   );
        //   return;
        // }

        // Get or create chat
        let chat = await prisma.parcelChat.findFirst({
          where: { carTransportId },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              include: {
                sender: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        });

        if (!chat) {
          chat = await prisma.parcelChat.create({
            data: {
              carTransportId: carTransport.id,
              senderId: carTransport.userId!,
              driverId: carTransport.assignedDriver!,
            },
            include: {
              messages: {
                orderBy: { createdAt: "asc" },
                include: {
                  sender: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                      profileImage: true,
                    },
                  },
                },
              },
            },
          });
        }

        ws.send(
          JSON.stringify({
            event: "joinedParcelChat",
            data: {
              chatId: chat.id,
              parcelId: carTransport.id,
              participants: {
                sender: carTransport.sender,
                driver: carTransport.driver,
              },
              messages: chat.messages,
            },
          })
        );
      } catch (error) {
        console.error("Error joining parcel chat:", error);
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Failed to join chat",
          })
        );
      }
      break;
    }

    // case "parcelMessage": {
    //   const { carTransportId, message, images = [] } = parsedData;

    //   try {
    //     const carTransport = await prisma.carTransport.findUnique({
    //       where: { id: carTransportId },
    //       include: {
    //         sender: {
    //           select: {
    //             id: true,
    //             fullName: true,
    //             email: true,
    //           },
    //         },
    //         driver: {
    //           select: {
    //             id: true,
    //             fullName: true,
    //             email: true,
    //           },
    //         },
    //       },
    //     });

    //     if (!carTransport) {
    //       ws.send(
    //         JSON.stringify({
    //           event: "error",
    //           message: "Car transport not found",
    //         })
    //       );
    //       return;
    //     }

    //     // Verify chat eligibility
    //     // if (carTransport.status !== "COMPLETED") {
    //     //   ws.send(
    //     //     JSON.stringify({
    //     //       event: "error",
    //     //       message: "Chat is only available for completed transports",
    //     //     })
    //     //   );
    //     //   return;
    //     // }

    //     // Get or create chat
    //     let chat = await prisma.parcelChat.findFirst({
    //       where: { carTransportId },
    //     });

    //     if (!chat) {
    //       chat = await prisma.parcelChat.create({
    //         data: {
    //           carTransportId,
    //           senderId: carTransport.userId!,
    //           driverId: carTransport.assignedDriver!,
    //         },
    //       });
    //     }

    //     // Create message with images
    //     const newMessage = await prisma.parcelMessage.create({
    //       data: {
    //         parcelChatId: chat.id,
    //         senderId: ws.userId!,
    //         message: message || "",
    //         images: images || [],
    //       },
    //       include: {
    //         sender: {
    //           select: {
    //             id: true,
    //             fullName: true,
    //             email: true,
    //             profileImage: true,
    //           },
    //         },
    //       },
    //     });

    //     // Send confirmation to sender
    //     ws.send(
    //       JSON.stringify({
    //         event: "messageSent",
    //         data: newMessage,
    //       })
    //     );
    //   } catch (error) {
    //     console.error("Error sending message:", error);
    //     ws.send(
    //       JSON.stringify({
    //         event: "error",
    //         message: "Failed to send message",
    //       })
    //     );
    //   }
    //   break;
    // }

    case "parcelMessage": {
  const { carTransportId, message, images = [] } = parsedData;

  try {
    const carTransport = await prisma.carTransport.findUnique({
      where: { id: carTransportId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        driver: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });

    if (!carTransport) {
      ws.send(
        JSON.stringify({
          event: "error",
          message: "Car transport not found",
        })
      );
      return;
    }

    // Get or create chat
    let chat = await prisma.parcelChat.findFirst({
      where: { carTransportId },
    });

    if (!chat) {
      chat = await prisma.parcelChat.create({
        data: {
          carTransportId,
          senderId: carTransport.userId!,
          driverId: carTransport.assignedDriver!,
        },
      });
    }

    // Create message with images
    const newMessage = await prisma.parcelMessage.create({
      data: {
        parcelChatId: chat.id,
        senderId: ws.userId!,
        message: message || "",
        images: images || [],
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    // Send confirmation to sender
    ws.send(
      JSON.stringify({
        event: "messageSent",
        data: newMessage,
      })
    );

    // Determine the recipient ID (either sender or driver)
    const recipientId = 
      ws.userId === carTransport.userId 
        ? carTransport.assignedDriver 
        : carTransport.userId;

    // Find the recipient's connection and send the message
    if (recipientId) {
      const recipientConnection = onlineUsers.get(recipientId);
      if (recipientConnection?.socket.readyState === WebSocket.OPEN) {
        recipientConnection.socket.send(
          JSON.stringify({
            event: "newParcelMessage",
            data: {
              ...newMessage,
              isSender: false, // This is a received message for the recipient
              carTransportId,
            },
          })
        );
      }
    }
  } catch (error) {
    console.error("Error sending message:", error);
    ws.send(
      JSON.stringify({
        event: "error",
        message: "Failed to send message",
      })
    );
  }
  break;
}

    case "markMessagesAsRead": {
      const { carTransportId } = parsedData;

      if (!carTransportId) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "carTransportId is required",
          })
        );
        return;
      }

      try {
        const carTransport = await prisma.carTransport.findUnique({
          where: { id: carTransportId },
        });

        if (!carTransport) {
          ws.send(
            JSON.stringify({
              event: "error",
              message: "Car transport not found",
            })
          );
          return;
        }

        // Verify user is either sender or courier
        if (
          carTransport.userId !== ws.userId &&
          carTransport.assignedDriver !== ws.userId
        ) {
          ws.send(
            JSON.stringify({
              event: "error",
              message: "Not authorized to access this chat",
            })
          );
          return;
        }

        // Find the chat
        const chat = await prisma.parcelChat.findFirst({
          where: { carTransportId },
        });

        if (!chat) {
          ws.send(
            JSON.stringify({
              event: "error",
              message: "Chat not found",
            })
          );
          return;
        }

        // Mark messages as read
        await prisma.parcelMessage.updateMany({
          where: {
            parcelChatId: chat.id,
            senderId: { not: ws.userId },
            isRead: false,
          },
          data: { isRead: true },
        });

        ws.send(
          JSON.stringify({
            event: "messagesMarkedAsRead",
            data: {
              carTransportId,
              success: true,
            },
          })
        );
      } catch (error) {
        console.error("Error marking messages as read:", error);
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Failed to mark messages as read",
          })
        );
      }
      break;
    }

    case "fetchParcelMessages": {
      const { carTransportId } = parsedData;

      if (!carTransportId) {
        ws.send(
          JSON.stringify({
            event: "error",
            message: "carTransportId is required",
          })
        );
        return;
      }

      try {
        const carTransport = await prisma.carTransport.findUnique({
          where: { id: carTransportId },
          include: {
            sender: {
              select: {
                id: true,
                fullName: true,
                email: true,
                profileImage: true,
              },
            },
            driver: {
              select: {
                id: true,
                fullName: true,
                email: true,
                profileImage: true,
              },
            },
          },
        });

        if (!carTransport) {
          ws.send(
            JSON.stringify({
              event: "error",
              message: "Car transport not found",
            })
          );
          return;
        }

        // Verify user is either sender or courier
        if (
          carTransport.userId !== ws.userId &&
          carTransport.assignedDriver !== ws.userId
        ) {
          ws.send(
            JSON.stringify({
              event: "error",
              message: "Not authorized to access this chat",
            })
          );
          return;
        }

        // Find the chat and all messages
        const chat = await prisma.parcelChat.findFirst({
          where: { carTransportId },
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              include: {
                sender: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    profileImage: true,
                  },
                },
              },
            },
          },
        });

        if (!chat) {
          // If no chat exists yet, return empty messages array
          ws.send(
            JSON.stringify({
              event: "parcelMessages",
              data: {
                carTransportId,
                participants: {
                  sender: carTransport.sender,
                  driver: carTransport.driver,
                },
                messages: [],
              },
            })
          );
          return;
        }

        // Mark messages as read
        await prisma.parcelMessage.updateMany({
          where: {
            parcelChatId: chat.id,
            senderId: { not: ws.userId },
            isRead: false,
          },
          data: { isRead: true },
        });

        // Add isSender flag to messages
        const messagesWithSenderFlag = chat.messages.map((msg) => ({
          ...msg,
          isSender: msg.senderId === ws.userId,
        }));

        ws.send(
          JSON.stringify({
            event: "parcelMessages",
            data: {
              carTransportId,
              participants: {
                sender: carTransport.sender,
                driver: carTransport.driver,
              },
              messages: messagesWithSenderFlag,
            },
          })
        );
      } catch (error) {
        console.error("Error fetching messages:", error);
        ws.send(
          JSON.stringify({
            event: "error",
            message: "Failed to fetch messages",
          })
        );
      }
      break;
    }

    default:
      ws.send(
        JSON.stringify({
          event: "error",
          message: "Unknown event type",
        })
      );
  }
}
