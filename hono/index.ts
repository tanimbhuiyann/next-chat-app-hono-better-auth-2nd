import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { db } from "@/db";
import { friendRequest, user, chatMessage, userKeys } from "@/db/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Server } from "socket.io";
import { createServer } from "http";

/* 
import {join } from "path";
import { mkdir } from "fs/promises";
 */
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/* const allowedOrigins =
  process.env.NODE_ENV === "production"
    ? [
        process.env.FRONTEND_URL ||
          "https://next-chat-app-hono-better-auth-2nd.vercel.app",
        "https://next-chat-app-hono-better-auth-2nd.vercel.app", // Add your actual Vercel URL
      ]
    : ["http://localhost:3001"]; */
const allowedOriginsRaw = process.env.NODE_ENV === "production"
  ? [
      "https://next-chat-app-hono-better-auth-2nd.vercel.app",
      process.env.FRONTEND_URL,
    ]
  : ["http://localhost:3001"];

// Filter out undefined values to ensure type safety for Socket.IO
const allowedOrigins = allowedOriginsRaw.filter(
  (origin): origin is string => typeof origin === "string"
);

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  console.log("New client connected:", userId);

  // Join chat room
  socket.on("join_chat", async ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.join(roomId);
    console.log("New room created:", roomId);
  });

  socket.on("typing_On", async ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.to(roomId).emit("typing_On", { userId: senderId });
    console.log("Typing On:", senderId);
  });

  socket.on("typing_Off", async ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join("_");
    socket.to(roomId).emit("typing_Off", { userId: senderId });
    console.log("Typing Off:", senderId);
  });

  // Send message

// Update your socket handler in index.ts
socket.on("send_message", async (messageData) => {
  try {
    const newMessage = {
      id: nanoid(),
      senderId: messageData.senderId,
      receiverId: messageData.receiverId,
      content: messageData.content, // This is now encrypted
      imageUrl: messageData.imageUrl || null,
      encryptedAESKey: messageData.encryptedAESKey || null, // For receiver
      senderEncryptedAESKey: messageData.senderEncryptedAESKey || null, // For sender - NEW FIELD
      createdAt: new Date(),
    };

    // Save to database - Drizzle will handle the new field automatically
    await db.insert(chatMessage).values(newMessage);
    console.log("Encrypted message sent:", newMessage);

    // Broadcast to both users in the room
    const roomId = [messageData.senderId, messageData.receiverId]
      .sort()
      .join("_");

    io.to(roomId).emit("receive_message", newMessage);
    console.log("Encrypted message broadcasted to room:", roomId);
  } catch (error) {
    console.error("Message sending error:", error);
  }
});

// Update message history retrieval
socket.on("get_message_history", async ({ senderId, receiverId }) => {
  try {
    const messages = await db
      .select()
      .from(chatMessage)
      .where(
        and(
          or(
            and(
              eq(chatMessage.senderId, senderId),
              eq(chatMessage.receiverId, receiverId)
            ),
            and(
              eq(chatMessage.senderId, receiverId),
              eq(chatMessage.receiverId, senderId)
            )
          )
        )
      )
      .orderBy(chatMessage.createdAt)
      .limit(50);

    // Send encrypted messages as-is; decryption happens on client
    socket.emit("message_history", messages);
  } catch (error) {
    console.error("Message history error:", error);
  }
});

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});

/* httpServer.listen(3002, () => {
  console.log("Socket.IO server running on port 3002");
});
 */
// Socket.io port
const SOCKET_PORT = process.env.SOCKET_PORT || 3002;
httpServer.listen(SOCKET_PORT, () => {
  console.log(`Socket.IO server running on port ${SOCKET_PORT}`);
});

const app = new Hono()

  /*   .use(
    "*", // Allow all API routes
    cors({
      origin: "http://localhost:3001", // replace with  origin
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    })
  ) */

  .use(
    "*",
    cors({
      origin: allowedOrigins, // FIXED: Use the updated allowedOrigins
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    })
  )



  .post("/api/uploadImage", async (c) => {
    try {
      const formData = await c.req.formData();
      const file = formData.get("file") as File;

      if (!file) {
        return c.json({ error: "No file uploaded" }, 400);
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (!allowedTypes.includes(file.type)) {
        return c.json({ error: "Invalid file type" }, 400);
      }

      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return c.json({ error: "File size exceeds 5mb limit" }, 400);
      }

      // Convert file to buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto",
              folder: "chat-app", // Optional: organize in folders
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          )
          .end(buffer);
      });
      console.log("Cloudinary upload result:", result);
      // Return the secure URL from Cloudinary
      return c.json({ url: result.secure_url }, 201);
    } catch (error) {
      console.error("upload error:", error);
      return c.json({ error: "Failed to upload file" }, 500);
    }
  })


  //send friend request
  .post("/api/friend-request/send", async (c) => {
    try {
      const body = await c.req.json();
      const { senderEmail, receiverEmail } = body;

      if (!senderEmail || !receiverEmail) {
        return c.json({ error: "Sender or receiver email is missing" }, 400);
      }

      // Fetch sender and receiver in parallel
      const [sender, receiver] = await Promise.all([
        db.select().from(user).where(eq(user.email, senderEmail)).get(),
        db.select().from(user).where(eq(user.email, receiverEmail)).get(),
      ]);

      if (!sender) {
        return c.json({ error: "Sender does not exist" }, 404);
      }

      if (!receiver) {
        return c.json({ error: "Receiver does not exist" }, 404);
      }

      const senderId = sender.id;
      const receiverId = receiver.id;

      if (senderId === receiverId) {
        return c.json(
          { error: "You cannot send a friend request to yourself" },
          401
        );
      }

      // Check for existing friend request in both directions
      const existingRequest = await db
        .select()
        .from(friendRequest)
        .where(
          and(
            or(
              and(
                eq(friendRequest.senderId, senderId),
                eq(friendRequest.receiverId, receiverId)
              ),
              and(
                eq(friendRequest.senderId, receiverId),
                eq(friendRequest.receiverId, senderId)
              )
            ),
            or(
              eq(friendRequest.status, "PENDING"),
              eq(friendRequest.status, "ACCEPTED")
            )
          )
        )
        .get();

      if (existingRequest) {
        return c.json({ error: "Friend request already exists" }, 400);
      }

      // Insert new friend request
      const requestId = nanoid();
      const now = new Date();

      const [newRequest] = await db
        .insert(friendRequest)
        .values({
          id: requestId,
          senderId,
          receiverId,
          senderEmail,
          receiverEmail,
          status: "PENDING",
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      return c.json(
        {
          message: "Friend request sent successfully",
          request: newRequest,
        },
        201
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
      return c.json(
        {
          error: "Failed to send friend request",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  })

  .get("/api/friend-request/incoming/:email", async (c) => {
    try {
      const email = c.req.param("email");

      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }
      const incomingRequest = await db
        .select({
          friendRequest,
          sender: user,
        })
        .from(friendRequest)
        .innerJoin(user, eq(friendRequest.senderEmail, user.email))
        .where(
          and(
            eq(friendRequest.receiverEmail, email),
            eq(friendRequest.status, "PENDING")
          )
        )
        .all();

      return c.json(
        {
          incomingRequest,
        },
        200
      );
    } catch (error) {
      console.error("Error retrieving incoming friend requests:", error);
      return c.json(
        { error: "Failed to retrieve incoming friend requests" },
        500
      );
    }
  })

  .get("/api/friend-request/friends/:email", async (c) => {
    try {
      const email = c.req.param("email");
      if (!email) {
        return c.json({ error: "Email is required" }, 400);
      }

      const friendRequestList = await db
        .select()
        .from(friendRequest)
        .where(
          and(
            or(
              eq(friendRequest.senderEmail, email),
              eq(friendRequest.receiverEmail, email)
            ),
            eq(friendRequest.status, "ACCEPTED")
          )
        )
        .all();

      // Extract friends' emails
      const friendEmails = friendRequestList.map((request) =>
        request.senderEmail === email
          ? request.receiverEmail
          : request.senderEmail
      );

      // Use 'in' to query multiple emails
      const friendList = await db
        .select()
        .from(user)
        .where(inArray(user.email, friendEmails))
        .all();

      return c.json(
        {
          friends: friendList, // Return full friend details
        },
        200
      );
    } catch (error) {
      console.error("Error retrieving friends list:", error);
      return c.json({ error: "Failed to retrieve friends list" }, 500);
    }
  })

  .put("/api/friend-request/update/:id", async (c) => {
    try {
      const id = c.req.param("id");
      const { status } = await c.req.json();

      if (!id) {
        return c.json({ error: "Friend request ID is required" }, 400);
      }

      if (status !== "PENDING") {
        return c.json({ error: "Invalid status update" }, 400);
      }

      const existingRequest = await db
        .select()
        .from(friendRequest)
        .where(eq(friendRequest.id, id))
        .get();

      if (!existingRequest) {
        return c.json({ error: "Friend request not found" }, 404);
      }

      const [updatedRequest] = await db
        .update(friendRequest)
        .set({
          status: "ACCEPTED",
          updatedAt: new Date(),
        })
        .where(eq(friendRequest.id, id))
        .returning();

      return c.json(
        {
          message: "Friend request updated successfully",
          request: updatedRequest,
        },
        200
      );
    } catch (error) {
      console.error("Error updating friend request:", error);
      return c.json(
        {
          error: "Failed to update friend request",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        500
      );
    }
  })

  .delete("/api/friend-request/delete/:id", async (c) => {
    try {
      const id = c.req.param("id");
      if (!id) {
        return c.json({ error: "Missing required parameter: id" }, 400);
      }

      const existingRequest = await db
        .select()
        .from(friendRequest)
        .where(eq(friendRequest.id, id))
        .get();

      if (!existingRequest) {
        return c.json({ error: "Friend request not found" }, 404);
      }

      await db.delete(friendRequest).where(eq(friendRequest.id, id));
      return c.json(
        {
          message: "Friend request deleted successfully",
        },
        200
      );
    } catch (error) {
      console.error("Error deleting friend request:", error);
      return c.json(
        {
          error: "Failed to delete friend request",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        400
      );
    }
  })

  // Add these routes to your existing Hono app

// Save user's public key
.post("/api/keys/save", async (c) => {
  try {
    const { userId, publicKey } = await c.req.json();
    console.log("Saving public key for user:", userId); // Debug log
    
    if (!userId || !publicKey) {
      return c.json({ error: "Missing userId or publicKey" }, 400);
    }

    // Check if key already exists
    const existingKey = await db
      .select()
      .from(userKeys)
      .where(eq(userKeys.userId, userId))
      .get();

    if (existingKey) {
      console.log("Updating existing key for user:", userId);
      // Update existing key
      await db
        .update(userKeys)
        .set({ 
          publicKey, 
          updatedAt: new Date(),
          privateKeyEncrypted: "" // We don't store private keys
        })
        .where(eq(userKeys.userId, userId));
    } else {
      console.log("Creating new key for user:", userId);
      // Create new key record
      await db.insert(userKeys).values({
        userId,
        publicKey,
        privateKeyEncrypted: "", // We don't store private keys
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    return c.json({ message: "Public key saved successfully" }, 201);
  } catch (error) {
    console.error("Error saving public key:", error);
    return c.json({ error: "Failed to save public key", details: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
})
// Get user's public key
.get("/api/keys/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    console.log("Fetching public key for user:", userId); // Debug log
    
    const userKey = await db
      .select()
      .from(userKeys)
      .where(eq(userKeys.userId, userId))
      .get();

    if (!userKey) {
      console.log("Public key not found for user:", userId);
      return c.json({ error: "User public key not found" }, 404);
    }

    console.log("Public key found for user:", userId);
    return c.json({ publicKey: userKey.publicKey }, 200);
  } catch (error) {
    console.error("Error fetching public key:", error);
    return c.json({ error: "Failed to fetch public key", details: error instanceof Error ? error.message : "Unknown error" }, 500);
  }
})

  .get("/", (c) => c.text("Hono!"))

  .get("/api/auth/*", (c) => auth.handler(c.req.raw))
  .post("/api/auth/*", (c) => auth.handler(c.req.raw));

/* serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server is running on port ${info.port}`);
});
 */

// Update the serve port to use environment variable:
const PORT = Number(process.env.PORT) || 3000;
serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`Server is running on port ${info.port}`);
});
export type AppType = typeof app;
//bun run --hot hono/index.ts
