import { db } from "./client";
import { users, notifications, ledgerEntries, marketplaceItems, chatMessages, chatThreads, bids, upiPayments, walletTransactions, reports } from "./schema";
import { hashPassword } from "../auth/password";
import { generateWallet } from "../wallet/mockWallet";
import { eq } from "drizzle-orm";

const REWARD_CATALOG = [
  { name: "Eco Tote Bag", cost: 30, description: "Reusable organic cotton tote bag" },
  { name: "Plant a Sapling", cost: 50, description: "Sponsor planting a native tree sapling" },
  { name: "Bamboo Straw Set", cost: 40, description: "Set of 6 reusable bamboo straws" },
  { name: "Recycled Notebook", cost: 20, description: "A5 notebook made from recycled paper" },
  { name: "Solar Keychain Light", cost: 60, description: "Mini solar-powered LED keychain" },
  { name: "Compost Starter Kit", cost: 75, description: "Home composting starter with instructions" },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Check if already seeded
  const existingUsers = db.select().from(users).all();
  if (existingUsers.length > 0) {
    console.log("Database already seeded. Cleaning up for new seed...");
    db.delete(chatMessages).run();
    db.delete(chatThreads).run();
    db.delete(bids).run();
    db.delete(marketplaceItems).run();
    db.delete(ledgerEntries).run();
    db.delete(notifications).run();
    db.delete(upiPayments).run();
    db.delete(walletTransactions).run();
    db.delete(reports).run();
    db.delete(users).run();
  }

  const commonHash = await hashPassword("password");

  // Create Guru user (buyer)
  const buyerWallet = generateWallet();
  db.insert(users).values({
    email: "guru@recopoint.in",
    name: "guru",
    passwordHash: commonHash,
    walletAddress: buyerWallet.address,
    walletSecretEnc: buyerWallet.encryptedSecret,
    role: "buyer",
    createdAt: new Date().toISOString(),
  }).run();

  // Create Raheesh user (seller)
  const sellerWallet = generateWallet();
  db.insert(users).values({
    email: "raheesh@recopoint.in",
    name: "raheesh",
    passwordHash: commonHash,
    walletAddress: sellerWallet.address,
    walletSecretEnc: sellerWallet.encryptedSecret,
    role: "seller",
    createdAt: new Date().toISOString(),
  }).run();

  // Create Eco Pioneer user (Admin role for full access)
  const adminWallet = generateWallet();
  db.insert(users).values({
    email: "pioneer@recopoint.in",
    name: "Eco Pioneer",
    passwordHash: commonHash,
    walletAddress: adminWallet.address,
    walletSecretEnc: adminWallet.encryptedSecret,
    cryptoBalance: 0.0085, // ~$15 worth of ETH limit
    role: "admin",
    createdAt: new Date().toISOString(),
  }).run();

  // Create Moderator user
  const modWallet = generateWallet();
  db.insert(users).values({
    email: "moderator@recopoint.in",
    name: "moderator",
    passwordHash: commonHash,
    walletAddress: modWallet.address,
    walletSecretEnc: modWallet.encryptedSecret,
    role: "moderator",
    createdAt: new Date().toISOString(),
  }).run();

  const buyer = db.select().from(users).where(eq(users.email, "guru@recopoint.in")).get()!;
  const seller = db.select().from(users).where(eq(users.email, "raheesh@recopoint.in")).get()!;
  const admin = db.select().from(users).where(eq(users.email, "pioneer@recopoint.in")).get()!;

  // Give buyer some starting credits
  db.insert(ledgerEntries).values({
    userId: buyer.id,
    entryType: "earn_report",
    amountCredits: 100,
    description: "Welcome bonus credits",
    createdAt: new Date().toISOString(),
  }).run();

  // Give seller some starting credits
  db.insert(ledgerEntries).values({
    userId: seller.id,
    entryType: "earn_report",
    amountCredits: 50,
    description: "Welcome bonus credits",
    createdAt: new Date().toISOString(),
  }).run();

  // Give Admin massive starting tokens/credits for demo
  db.insert(ledgerEntries).values({
    userId: admin.id,
    entryType: "earn_token_report",
    amountCredits: 12500,
    description: "Admin Platform Tokens",
    createdAt: new Date().toISOString(),
  }).run();

  // Seed marketplace items (approved, ready for auction)
  const now = new Date();
  const sixHoursLater = new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString();

  const insertedItems = db.insert(marketplaceItems).values([
    {
      sellerId: seller.id,
      title: "Recycled Plastic Planter Set",
      description: "Beautiful set of 3 planters made from 100% recycled ocean plastic. Each planter is unique in color pattern. Perfect for indoor herbs or succulents.",
      imagePath: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?q=80&w=600&auto=format&fit=crop",
      aiClassification: JSON.stringify({ wasteType: "Plastic", confidence: 0.94, recyclable: true }),
      category: "recycled_goods",
      startingPrice: 15,
      currentPrice: 20, // Updated by bid
      status: "active",
      auctionEndsAt: sixHoursLater,
      createdAt: now.toISOString(),
    },
    {
      sellerId: seller.id,
      title: "Upcycled Denim Tote Bag",
      description: "Handcrafted tote bag made from upcycled denim jeans. Features inner pockets and reinforced stitching. Each bag diverts 1 pair of jeans from landfill.",
      imagePath: "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?q=80&w=600&auto=format&fit=crop",
      aiClassification: JSON.stringify({ wasteType: "Textile", confidence: 0.89, recyclable: true }),
      category: "upcycled_fashion",
      startingPrice: 25,
      currentPrice: 25,
      status: "active",
      auctionEndsAt: sixHoursLater,
      createdAt: now.toISOString(),
    },
    {
      sellerId: seller.id,
      title: "Compressed Cardboard Art Frame",
      description: "Unique art frame crafted from compressed recycled cardboard. Lightweight yet sturdy. Holds standard 5x7 prints. A conversation starter for any room.",
      imagePath: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop",
      aiClassification: JSON.stringify({ wasteType: "Cardboard", confidence: 0.91, recyclable: true }),
      category: "recycled_goods",
      startingPrice: 10,
      currentPrice: 10,
      status: "pending",
      createdAt: now.toISOString(),
    },
  ]).returning().all();

  // Seed Reports (Reported & Collected Waste)
  db.insert(reports).values([
    {
      userId: seller.id,
      location: "Andheri West, Mumbai",
      wasteType: "Plastic Bottles",
      amount: "5 kg",
      imageDataUrl: "https://images.unsplash.com/photo-1528323273322-d81458248d40?q=80&w=800&auto=format&fit=crop",
      verificationResultJson: JSON.stringify({ classification: "Plastic", confidence: 0.95, recyclable: true }),
      status: "pending",
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: buyer.id,
      location: "Bandra East, Mumbai",
      wasteType: "Cardboard Boxes",
      amount: "12 kg",
      imageDataUrl: "https://images.unsplash.com/photo-1589938927878-c0fb9584b4ce?q=80&w=800&auto=format&fit=crop",
      verificationResultJson: JSON.stringify({ classification: "Cardboard", confidence: 0.88, recyclable: true }),
      status: "pending",
      createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: seller.id,
      location: "Juhu Beach",
      wasteType: "Mixed Recyclables",
      amount: "20 bags",
      imageDataUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=800&auto=format&fit=crop",
      verificationResultJson: JSON.stringify({ classification: "Mixed", confidence: 0.75, recyclable: true }),
      status: "verified",
      collectorId: buyer.id,
      createdAt: new Date(now.getTime() - 72 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: buyer.id,
      location: "Powai Lake",
      wasteType: "E-Waste (Old Keyboards)",
      amount: "3 items",
      imageDataUrl: "https://images.unsplash.com/photo-1550005973-54cd671c26f0?q=80&w=800&auto=format&fit=crop",
      verificationResultJson: JSON.stringify({ classification: "E-Waste", confidence: 0.99, recyclable: false }),
      status: "pending",
      createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
    },
    {
      userId: seller.id,
      location: "Andheri East Corporate Park",
      wasteType: "Metal Scraps",
      amount: "15 kg",
      imageDataUrl: "https://images.unsplash.com/photo-1558346399-52d3a39e7829?q=80&w=800&auto=format&fit=crop",
      verificationResultJson: JSON.stringify({ classification: "Metal", confidence: 0.91, recyclable: true }),
      status: "in_progress", // This will show directly in Admin's Collect view as actionable!
      collectorId: admin.id,
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    }
  ]).run();

  // Create welcome notifications
  db.insert(notifications).values([
    {
      userId: buyer.id,
      message: "Welcome to RECOPOINT! Start by reporting waste in your area or browse the marketplace.",
      type: "system",
      isRead: 0,
      createdAt: now.toISOString(),
    },
    {
      userId: seller.id,
      message: "Welcome to RECOPOINT! You can list recycled items on the marketplace for auction.",
      type: "system",
      isRead: 0,
      createdAt: now.toISOString(),
    },
  ]).run();

  // Insert Bids Demo Data
  const planterItem = insertedItems.find(i => i.title.includes("Planter"))!;
  db.insert(bids).values({
    itemId: planterItem.id,
    bidderId: buyer.id,
    amount: 20,
    createdAt: now.toISOString(),
  }).run();

  // Insert Chat Demo Data
  const chatThread = db.insert(chatThreads).values({
    itemId: planterItem.id,
    buyerId: buyer.id,
    sellerId: seller.id,
    createdAt: new Date(now.getTime() - 1000 * 60 * 60).toISOString(),
  }).returning().get();

  db.insert(chatMessages).values([
    {
      threadId: chatThread.id,
      senderId: buyer.id,
      content: "Hey Raheesh! I just placed a bid for 20 credits on your planter set. They look great!",
      createdAt: new Date(now.getTime() - 1000 * 60 * 50).toISOString(),
    },
    {
      threadId: chatThread.id,
      senderId: seller.id,
      content: "Hi Guru! Thanks. Good luck entirely! Let me know if you need any other recycled stuff.",
      createdAt: new Date(now.getTime() - 1000 * 60 * 45).toISOString(),
    }
  ]).run();

  // Insert Admin Demo Chats
  const chatThreadAdmin1 = db.insert(chatThreads).values({
    buyerId: buyer.id,
    sellerId: admin.id,
    createdAt: new Date(now.getTime() - 1000 * 60 * 120).toISOString(),
  }).returning().get();

  const chatThreadAdmin2 = db.insert(chatThreads).values({
    buyerId: seller.id,
    sellerId: admin.id,
    createdAt: new Date(now.getTime() - 1000 * 60 * 240).toISOString(),
  }).returning().get();

  db.insert(chatMessages).values([
    {
      threadId: chatThreadAdmin1.id,
      senderId: buyer.id,
      content: "Hello! I just wanted to say thank you for approving my waste collection so quickly earlier. The app perfectly tracked everything.",
      createdAt: new Date(now.getTime() - 1000 * 60 * 115).toISOString(),
    },
    {
      threadId: chatThreadAdmin1.id,
      senderId: admin.id,
      content: "Hi Guru, always happy to help! That's what the platform is built for. Your tokens should be in your wallet.",
      createdAt: new Date(now.getTime() - 1000 * 60 * 110).toISOString(),
    },
    {
      threadId: chatThreadAdmin2.id,
      senderId: seller.id,
      content: "Hi Eco Pioneer, I have a bulk textile drop coming in tomorrow from my factory. Are there specific marketplace slots I need to reserve?",
      createdAt: new Date(now.getTime() - 1000 * 60 * 235).toISOString(),
    },
    {
      threadId: chatThreadAdmin2.id,
      senderId: admin.id,
      content: "Hey Raheesh! Just list it normally through the Seller portal using the plus button. I'll personally verify the confidence score once it hits the queue.",
      createdAt: new Date(now.getTime() - 1000 * 60 * 225).toISOString(),
    }
  ]).run();

  console.log("✅ Seed complete!");
  console.log("   Buyer login:     guru@recopoint.in / password");
  console.log("   Seller login:    raheesh@recopoint.in / password");
  console.log("   Pioneer login:   pioneer@recopoint.in / password  <-- Use this for the demo!");
  console.log("   Moderator login: moderator@recopoint.in / password");
  console.log("   Marketplace items: 3 (2 active, 1 pending)");
}

seed().catch(console.error);

export { REWARD_CATALOG };
