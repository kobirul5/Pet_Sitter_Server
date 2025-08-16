import { Server } from "http";
import { WebSocket, WebSocketServer } from "ws";
import config from "../config";
import prisma from "../shared/prisma";
import { jwtHelpers } from "../helpars/jwtHelpers";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
}

const onlineUsers = new Set<string>();
const userSockets = new Map<string, ExtendedWebSocket>();

// For live location tracking
const userLocations = new Map<string, { lat: number; lng: number }>();
const locationSubscribers = new Map<string, Set<ExtendedWebSocket>>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });
  console.log("WebSocket server is running");

  wss.on("connection", (ws: ExtendedWebSocket) => {
    console.log("A user connected");

    ws.on("message", async (data: string) => {
      try {
        const parsedData = JSON.parse(data);

        switch (parsedData.event) {

          // ========== AUTHENTICATE ==========
          case "authenticate": {
            const token = parsedData.token;
            if (!token) return ws.close();

            const user = jwtHelpers.verifyToken(
              token,
              config.jwt.jwt_secret as string
            );
            if (!user) return ws.close();

            const { id } = user;
            ws.userId = id;

            onlineUsers.add(id);
            userSockets.set(id, ws);

            broadcastToAll(wss, {
              event: "userStatus",
              data: { userId: id, isOnline: true },
            });
            
            break;
          }

          // ========== LIVE LOCATION UPDATE ==========
          case "locationUpdate": {
            const { lat, lng } = parsedData;
            if (!ws.userId || lat == null || lng == null) return;

            userLocations.set(ws.userId, { lat, lng });

            try {
              await prisma.user.update({
                where: { id: ws.userId },
                data: { lat, lng },
              });
            } catch (err) {
              console.error("DB update error:", err);
            }

            // Notify subscribers who track this user's location
            const subscribers = locationSubscribers.get(ws.userId);
            if (subscribers) {
              subscribers.forEach((subscriberWs) => {
                if (subscriberWs.readyState === WebSocket.OPEN) {
                  subscriberWs.send(
                    JSON.stringify({
                      event: "locationUpdate",
                      data: { userId: ws.userId, lat, lng },
                    })
                  );
                }
              });
            }
            break;
          }

          // ========== SUBSCRIBE TO LOCATION ==========
          case "subscribeToLocation": {
            const { targetUserId } = parsedData;
            if (!ws.userId || !targetUserId) return;

            if (!locationSubscribers.has(targetUserId)) {
              locationSubscribers.set(targetUserId, new Set());
            }
            locationSubscribers.get(targetUserId)!.add(ws);

            console.log(`${ws.userId} subscribed to location of ${targetUserId}`);
            break;
          }

          // ========== SEND SINGLE MESSAGE ==========
          case "message": {
            const { receiverId, message, images } = parsedData;
            if (!ws.userId || !receiverId || !message) {
              console.log("Invalid message payload");
              return;
            }

            let room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              room = await prisma.room.create({
                data: { senderId: ws.userId, receiverId },
              });
            }

            const chat = await prisma.chat.create({
              data: {
                senderId: ws.userId,
                receiverId,
                roomId: room.id,
                message,
                images: { set: images || [] },
              },
            });

            // Send to receiver if online
            const receiverSocket = userSockets.get(receiverId);
            if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
              receiverSocket.send(JSON.stringify({ event: "message", data: chat }));
            }

            // Send confirmation to sender
            ws.send(JSON.stringify({ event: "message", data: chat }));
            break;
          }

          // ========== FETCH CHAT HISTORY ==========
          case "fetchChats": {
            const { receiverId } = parsedData;
            if (!ws.userId || !receiverId) return;

            const room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              ws.send(JSON.stringify({ event: "noRoomFound" }));
              return;
            }

            const chats = await prisma.chat.findMany({
              where: { roomId: room.id },
              orderBy: { createdAt: "asc" },
            });

            await prisma.chat.updateMany({
              where: { roomId: room.id, receiverId: ws.userId },
              data: { isRead: true },
            });

            ws.send(JSON.stringify({ event: "fetchChats", data: chats }));
            break;
          }

          // ========== FETCH UNREAD MESSAGES ==========
          case "unReadMessages": {
            const { receiverId } = parsedData;
            if (!ws.userId || !receiverId) return;

            const room = await prisma.room.findFirst({
              where: {
                OR: [
                  { senderId: ws.userId, receiverId },
                  { senderId: receiverId, receiverId: ws.userId },
                ],
              },
            });

            if (!room) {
              ws.send(JSON.stringify({ event: "noUnreadMessages", data: [] }));
              return;
            }

            const unReadMessages = await prisma.chat.findMany({
              where: { roomId: room.id, isRead: false, receiverId: ws.userId },
            });

            ws.send(
              JSON.stringify({
                event: "unReadMessages",
                data: { messages: unReadMessages, count: unReadMessages.length },
              })
            );
            break;
          }

          // ========== MESSAGE LIST (last msg per room) ==========
          case "messageList": {
            if (!ws.userId) return;
            try {
              const rooms = await prisma.room.findMany({
                where: {
                  OR: [{ senderId: ws.userId }, { receiverId: ws.userId }],
                },
                include: {
                  chats: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                  },
                },
              });

              const userIds = rooms.map((room) =>
                room.senderId === ws.userId ? room.receiverId : room.senderId
              );

              const userInfos = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { profileImage: true, firstName: true, lastName: true, id: true },
              });

              const userWithLastMessages = rooms.map((room) => {
                const otherUserId =
                  room.senderId === ws.userId ? room.receiverId : room.senderId;
                const userInfo = userInfos.find((u) => u.id === otherUserId);
                return {
                  user: userInfo || null,
                  lastMessage: room.chats && room.chats.length > 0 ? room.chats[0] : null,
                };
              });

              ws.send(JSON.stringify({ event: "messageList", data: userWithLastMessages }));
            } catch (error) {
              console.error("Error fetching message list:", error);
              ws.send(
                JSON.stringify({
                  event: "error",
                  message: "Failed to fetch message list",
                })
              );
            }
            break;
          }

          default:
            console.log("Unknown event:", parsedData.event);
        }
      } catch (error) {
        console.error("WebSocket message handling error:", error);
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        onlineUsers.delete(ws.userId);
        userSockets.delete(ws.userId);

        // Notify all users about offline status
        broadcastToAll(wss, {
          event: "userStatus",
          data: { userId: ws.userId, isOnline: false },
        });

        // Remove from location subscribers
        for (const [targetUserId, subscribers] of locationSubscribers) {
          subscribers.delete(ws);
        }
      }
      console.log("User disconnected");
    });
  });

  return wss;
}

function broadcastToAll(wss: WebSocketServer, message: object) {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
}
