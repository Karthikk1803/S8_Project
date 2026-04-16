import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  walletAddress: text("wallet_address").notNull().unique(),
  walletSecretEnc: text("wallet_secret_enc").notNull(),
  cryptoBalance: real("crypto_balance").notNull().$default(() => 5.0),
  role: text("role").notNull().$default(() => "buyer"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const reports = sqliteTable("reports", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  location: text("location").notNull(),
  wasteType: text("waste_type").notNull(),
  amount: text("amount").notNull(),
  imageDataUrl: text("image_data_url"),
  verificationResultJson: text("verification_result_json"),
  status: text("status").notNull().$default(() => "pending"),
  collectorId: integer("collector_id").references(() => users.id),
  moderatorNotes: text("moderator_notes"),
  tokenReward: integer("token_reward").notNull().$default(() => 0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: integer("is_read").notNull().$default(() => 0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const ledgerEntries = sqliteTable("ledger_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  entryType: text("entry_type").notNull(),
  amountCredits: integer("amount_credits").notNull(),
  description: text("description").notNull(),
  relatedRef: text("related_ref"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const upiPayments = sqliteTable("upi_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  transactionId: text("transaction_id").notNull().unique(),
  upiUrl: text("upi_url").notNull(),
  amountINR: integer("amount_inr").notNull(),
  creditsAdded: integer("credits_added").notNull().$default(() => 0),
  status: text("status").notNull().$default(() => "pending"),
  utr: text("utr"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const walletTransactions = sqliteTable("wallet_txs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id").notNull().references(() => users.id),
  txHash: text("tx_hash").notNull().unique(),
  toAddress: text("to_address").notNull(),
  amountCredits: integer("amount_credits").notNull(),
  memo: text("memo"),
  signature: text("signature").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ─── Marketplace ────────────────────────────────────────────

export const marketplaceItems = sqliteTable("marketplace_items", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  imagePath: text("image_path").notNull(),
  aiClassification: text("ai_classification"),
  category: text("category").notNull().$default(() => "general"),
  startingPrice: integer("starting_price").notNull(),
  currentPrice: integer("current_price").notNull(),
  status: text("status").notNull().$default(() => "pending"),
  auctionEndsAt: text("auction_ends_at"),
  winnerId: integer("winner_id").references(() => users.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const bids = sqliteTable("bids", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id").notNull().references(() => marketplaceItems.id),
  bidderId: integer("bidder_id").notNull().references(() => users.id),
  amount: integer("amount").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// ─── Messaging ──────────────────────────────────────────────

export const chatThreads = sqliteTable("chat_threads", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  itemId: integer("item_id").references(() => marketplaceItems.id),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  threadId: integer("thread_id").notNull().references(() => chatThreads.id),
  senderId: integer("sender_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});
