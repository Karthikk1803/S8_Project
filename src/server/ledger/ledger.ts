import { db } from "../db/client";
import { ledgerEntries } from "../db/schema";
import { eq, sql } from "drizzle-orm";

const ADD_TYPES = ["earn_report", "earn_collect", "purchase_upi", "transfer_in"];
const SUB_TYPES = ["redeem", "transfer_out"];

export function getBalance(userId: number): number {
  const rows = db
    .select({
      entryType: ledgerEntries.entryType,
      total: sql<number>`sum(${ledgerEntries.amountCredits})`,
    })
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId))
    .groupBy(ledgerEntries.entryType)
    .all();

  let balance = 0;
  for (const row of rows) {
    if (ADD_TYPES.includes(row.entryType)) {
      balance += row.total;
    } else if (SUB_TYPES.includes(row.entryType)) {
      balance -= row.total;
    }
  }
  return balance;
}

export function addLedgerEntry(
  userId: number,
  entryType: string,
  amountCredits: number,
  description: string,
  relatedRef?: string
) {
  db.insert(ledgerEntries)
    .values({
      userId,
      entryType,
      amountCredits,
      description,
      relatedRef: relatedRef || null,
      createdAt: new Date().toISOString(),
    })
    .run();
}

export function getTransactions(userId: number, limit = 50) {
  return db
    .select()
    .from(ledgerEntries)
    .where(eq(ledgerEntries.userId, userId))
    .orderBy(sql`${ledgerEntries.createdAt} desc`)
    .limit(limit)
    .all();
}
