# RECOPOINT - Zero Waste Management Platform ♻️

Welcome to **RECOPOINT**, an enterprise-grade, decentralized platform designed to incentivize the circular green economy. RECOPOINT bridges the gap between localized waste reporting, AI-verified logistics, and blockchain-based tokenized rewards.

Our mission is to dramatically reduce landfill mass by tokenizing waste recovery into traceable, immutable assets (RECO Tokens), leveraging real-time computer vision for automated reporting verification.

## 🌟 Key Features

1. **AI-Powered Waste Verification**
   Upload an image of recyclables/waste, and our integrated Deep Learning Engine (Ultralytics YOLOv8) will classify the material (e.g., Plastic, Cardboard, E-Waste) and attribute real-time confidence scores to validate ecosystem rewards.

2. **Blockchain Tokenomics (RECO Token)**
   Say goodbye to transaction-heavy fiat payouts. Citizens earn RECOTokens, a simulated Layer-2 ERC-20 crypto asset. The system bypasses heavy bank transaction fees utilizing an internal gasless ledger before eventual on-chain liquidity conversion.

3. **Decentralized P2P Marketplace (Auctions)**
   Users can spend their newly acquired RECOTokens on upcycled, green products. The marketplace boasts a robust real-time auctioning system with pending escrows and immediate ledger balancing.

4. **Peer-to-Peer Encrypted Messaging**
   Interact flawlessly with local upcyclers and marketplace sellers via an isolated chat ecosystem tailored directly to listed assets.

5. **Gamification & Leaderboards**
   Engage with the community by ranking up through verified waste reports and ecosystem contributions.

## 🛠 Tech Stack Overview

- **Frontend & Core Framework:** Next.js 15.1.7 (React 19) hybrid SSR/RSC
- **Styling:** TailwindCSS w/ heavily customized Glassmorphism architecture
- **Database Engine:** SQLite (Write-Ahead Logging enabled)
- **ORM:** Drizzle ORM (Type-Safe Schema mapping)
- **Artificial Intelligence Subsystem:** PyTorch, Ultralytics (YOLOv8), Python Flask 3.0
- **Security:** `bcryptjs` hashing, `jose` Edge-compatible JWT HttpOnly Session Governance

## 🧑‍💻 Architecture

The system behaves as a fully decoupled microservices architecture running synchronously on localized edge infrastructure:
- The **Next.js Server** handles identity management (RBAC), database mutations, token distribution mechanics, and the marketplace core.
- The **Flask AI Server** safely intercepts unpickling tensors across the `api_server.py` inference gateway to prevent Python class exploits and provides isolated object detection metrics.

## 🤝 Contributions

Gurukarthik B 
Raheesh A
Sakthi Priya K