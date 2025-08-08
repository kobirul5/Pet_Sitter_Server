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

          // Authenticate with JWT token
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

          //  Receive location and update memory + DB + notify subscribers
          case "locationUpdate": {
            const { lat, lng } = parsedData;
            if (!ws.userId || lat == null || lng == null) return;

            //  Update memory map
            userLocations.set(ws.userId, { lat, lng });

            // Update in database
            try {
              await prisma.user.update({
                where: { id: ws.userId },
                data: { lat, lng },
              });
            } catch (err) {
              console.error("DB update error:", err);
            }

            // Notify subscribers (only)
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

          //  Subscribe to another user’s location
          case "subscribeToLocation": {
            const { targetUserId } = parsedData;
            if (!ws.userId || !targetUserId) return;

            if (!locationSubscribers.has(targetUserId)) {
              locationSubscribers.set(targetUserId, new Set());
            }
            locationSubscribers.get(targetUserId)!.add(ws);

            console.log(`${ws.userId} is now tracking ${targetUserId}`);
            break;
          }

          default:
            console.log("Unknown event type:", parsedData.event);
        }
      } catch (error) {
        console.error("WebSocket Error:", error);
      }
    });

    ws.on("close", () => {
      if (ws.userId) {
        onlineUsers.delete(ws.userId);
        userSockets.delete(ws.userId);

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
