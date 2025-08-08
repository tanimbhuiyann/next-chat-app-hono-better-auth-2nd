import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { nanoid } from "nanoid";


export const userKeys = sqliteTable("user_keys", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  publicKey: text("public_key").notNull(),
  privateKeyEncrypted: text("private_key_encrypted").notNull(), // We won't use this field
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const conversationKeys = sqliteTable("conversation_keys", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  conversationId: text("conversation_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id),
  encryptedAESKey: text("encrypted_aes_key").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});




export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: integer("accessTokenExpiresAt", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refreshTokenExpiresAt", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("createdAt", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updatedAt", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("createdAt", { mode: "timestamp" }),
  updatedAt: integer("updatedAt", { mode: "timestamp" }),
});

export const friendRequest = sqliteTable("friend_request", {
  id: text("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id),
  receiverId: text("receiver_id")
    .notNull()
    .references(() => user.id),
  senderEmail: text("sender_email")
    .notNull()
    .references(() => user.email),
  receiverEmail: text("receiver_email")
    .notNull()
    .references(() => user.email),
  status: text("status", { 
    enum: ["PENDING", "ACCEPTED", "REJECTED"] 
  }).notNull().default("PENDING"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Updated schema in your schema file (probably db/schema.ts)
export const chatMessage = sqliteTable("chat_messages", {
  id: text("id").primaryKey(),
  senderId: text("sender_id")
    .notNull()
    .references(() => user.id),
  receiverId: text("receiver_id")
    .notNull()
    .references(() => user.id),
  content: text("content").notNull(), // This will store encrypted content
  imageUrl: text("image_url"),
  encryptedAESKey: text("encrypted_aes_key"), // AES key encrypted with recipient's RSA public key
  senderEncryptedAESKey: text("sender_encrypted_aes_key"), // ADD THIS LINE - AES key encrypted with sender's RSA public key
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  readAt: integer("read_at", { mode: "timestamp" }),
  friendRequestId: text("friend_request_id")
    .references(() => friendRequest.id)
});

export const schema = {
  user,
  session,
  account,
  verification,
  friendRequest,
  chatMessage,
  userKeys,
  conversationKeys,
};
