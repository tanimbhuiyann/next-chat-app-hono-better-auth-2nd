import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server";
import { db } from "@/db";
import { friendRequest, user, chatMessage  } from "@/db/schema";
import { eq, and, or, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { Server } from "socket.io";
import { createServer } from "http";



import {join } from "path";
import { mkdir } from "fs/promises";


const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId as string;
  console.log("New client connected:", userId);

  // Join chat room
  socket.on('join_chat', async ({ senderId, receiverId }) => {
    const roomId = [senderId, receiverId].sort().join('_');
    socket.join(roomId);
    console.log("New room created:", roomId);
  });


  socket.on('typing_On', async ({ senderId, receiverId }) =>{
    const roomId = [senderId, receiverId].sort().join('_');
    socket.to(roomId).emit('typing_On',  { userId: senderId });
    console.log('Typing On:', senderId);
  })


  socket.on('typing_Off', async ({ senderId, receiverId }) =>{
    const roomId = [senderId, receiverId].sort().join('_');
    socket.to(roomId).emit('typing_Off',  { userId: senderId });
    console.log('Typing Off:', senderId);
  })

  // Send message
  socket.on('send_message', async (messageData) => {
    try {
      const newMessage = {
        id: nanoid(),
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
        content: messageData.content,
        imageUrl: messageData.imageUrl || null,
        createdAt: new Date()
      };

      // Save to database
      await db.insert(chatMessage).values(newMessage);
      console.log('Message sent:', newMessage);


      // Broadcast to both users in the room
      const roomId = [messageData.senderId, messageData.receiverId].sort().join('_');
      io.to(roomId).emit('receive_message', newMessage);
      console.log('Message broadcasted to room:', roomId, newMessage);

    } catch (error) {
      console.error('Message sending error:', error);
    }
  });

  // Get message history
  socket.on('get_message_history', async ({ senderId, receiverId }) => {
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

      socket.emit('message_history', messages);
    } catch (error) {
      console.error('Message history error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

httpServer.listen(3002, () => {
  console.log('Socket.IO server running on port 3002');
});

const app = new Hono()

  .use(
    "*", // Allow all API routes
    cors({
      origin: "http://localhost:3001", // replace with  origin
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
      exposeHeaders: ["Content-Length"],
      maxAge: 600,
      credentials: true,
    })
  )


 
.post("/api/uploadImage", async (c) => {
  try{
    const fromData = await c.req.formData();
    const file = fromData.get("file") as File;

    if(!file){
      return c.json({error: "No file uploaded"}, 400);
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
   
    if(!allowedTypes.includes(file.type)){
      return c.json({error: "Invalid file type"}, 400);
    }

    const maxSize = 5 * 1024 * 1024; 

    if(file.size > maxSize){
      return c.json({error: "File size exceeds 5mb limit"}, 400);
    }

    const filename = `${nanoid()}-${file.name}`;
    const uploadPath = join(__dirname, "public", "uploads", filename);
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await mkdir(join(__dirname, "public", "uploads"), {recursive: true});
    await Bun.write(uploadPath, buffer);


   return c.json({url: `http://localhost:3000/uploads/${filename}`}, 201);

  }
  catch (error) {
    console.error("upload error:", error);
    return c.json({ error: "Failed to upload file" }, 500
    );
  }
})



.get("/uploads/:filename", async (c) => {
  try {
    const filename = c.req.param("filename");
    const path = join(__dirname, "public", "uploads", filename);
    const file = Bun.file(path);
    
    if (!(await file.exists())) {
      return c.json({ error: "File not found" }, 404);
    }
    
    return new Response(file, {
      headers: {
        'Content-Type': file.type || 'application/octet-stream'
      }
    });
  } catch (error) {
    console.error("Error serving file:", error);
    return c.json({ error: "Internal server error" }, 500);
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
            eq(friendRequest.status, 'PENDING')
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

  .get("/", (c) => c.text("Hono!"))

  .get("/api/auth/*", (c) => auth.handler(c.req.raw))
  .post("/api/auth/*", (c) => auth.handler(c.req.raw));

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Server is running on port ${info.port}`);
});

export type AppType = typeof app;
//bun run --hot hono/index.ts
