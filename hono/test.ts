import { db } from "@/db";
import { schema } from "@/db/schema";
import { nanoid } from "nanoid"; // Generate unique IDs

app.post("/api/friend-request", async (c) => {
  const { senderEmail, receiverEmail } = await c.req.json();

  // Validate input
  if (!senderEmail || !receiverEmail) {
    return c.json(
      { error: "Both sender and receiver emails are required" },
      400
    );
  }

  // Find sender and receiver IDs
  const sender = await db
    .select()
    .from(schema.user)
    .where(schema.user.email.eq(senderEmail))
    .execute();
  const receiver = await db
    .select()
    .from(schema.user)
    .where(schema.user.email.eq(receiverEmail))
    .execute();

  if (!sender.length || !receiver.length) {
    return c.json({ error: "Invalid sender or receiver email" }, 404);
  }

  const senderId = sender[0].id;
  const receiverId = receiver[0].id;

  // Check if a friend request already exists
  const existingRequest = await db
    .select()
    .from(schema.friendRequest)
    .where(
      schema.friendRequest.senderId
        .eq(senderId)
        .and(schema.friendRequest.receiverId.eq(receiverId))
    )
    .execute();

  if (existingRequest.length) {
    return c.json({ error: "Friend request already sent" }, 400);
  }

  // Insert new friend request
  const friendRequestId = nanoid();
  const now = Date.now();

  await db
    .insert(schema.friendRequest)
    .values({
      id: friendRequestId,
      senderId,
      receiverId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .execute();

  return c.json({
    message: "Friend request sent successfully",
    requestId: friendRequestId,
  });
});

app.get("/api/friend-requests/:userId", async (c) => {
  const { userId } = c.req.param();

  // Get all incoming friend requests for the user
  const requests = await db
    .select()
    .from(schema.friendRequest)
    .where(schema.friendRequest.receiverId.eq(userId))
    .execute();

  return c.json(requests);
});

app.put("/api/friend-request/:requestId", async (c) => {
  const { requestId } = c.req.param();
  const { status } = await c.req.json();

  // Validate input
  if (!["accepted", "rejected"].includes(status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  // Update the friend request status
  const now = Date.now();
  const result = await db
    .update(schema.friendRequest)
    .set({ status, updatedAt: now })
    .where(schema.friendRequest.id.eq(requestId))
    .execute();

  if (result.affectedRows === 0) {
    return c.json({ error: "Friend request not found" }, 404);
  }

  return c.json({ message: "Friend request updated successfully" });
});
