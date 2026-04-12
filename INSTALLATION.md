# ⚙️ Installation & Setup Guide

This guide will walk you through setting up the RECOPOINT architecture on any local machine. Because this project runs a dual-stack (Node.js for Web & Python for AI Inference), please strictly follow the order of setup.

## 📌 Prerequisites
1. **Node.js** (v18.17.0 or higher recommended)
2. **Python** (v3.9 - v3.12 recommended. *Note: PyTorch 2.6+ handles security restrictions securely via our custom patch*)
3. **Git**
4. (Optional) Visual Studio C++ Build Tools - Windows users only (Required if Python `ultralytics` fails to bind binaries).

---

## 1. Setup the Next.js Web Stack

1. **Clone the repository and navigate into the root directory.**
2. **Install JavaScript dependencies:**
   ```bash
   npm install
   ```
   *(Crucial versions automatically enforced: `next@15.1.7`, `drizzle-orm@0.39.3`, `class-variance-authority@0.7.1`)*

3. **Database Pre-requisites:**
   This project uses a pre-seeded SQLite database contained in the `/data` directory. For demonstration purposes, the seed logic and user credentials are included. You do **not** need to migrate or re-seed unless you want a fresh wipe.

   If you wish to wipe the remote DB and start fresh with the mock accounts, run:
   ```bash
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   ```

---

## 2. Setup the Python AI Inference Engine

RECOPOINT utilizes a Flask micro-server handling deep-learning classification via YOLO.

1. **Navigate to the AI server directory:**
   ```bash
   cd RECO_APP
   ```

2. **Establish a Virtual Environment:**
   ```bash
   python -m venv venv
   ```
   *Activate the environment:*
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. **Install Core Python Libraries:**
   ```bash
   pip install -r requirements.txt
   ```
   *Required packages:*
   - `flask >= 3.0.0`
   - `flask-cors >= 4.0.0`
   - `ultralytics >= 8.0.0`
   - `Pillow >= 10.0.0`

4. **Start the AI Server:**
   Ensure your environment is active, then run:
   ```bash
   python api_server.py
   ```
   *(The server will mount on `http://127.0.0.1:5000`)*

---

## 3. Run the Full Application

With the AI Server running in one terminal session, open a **brand new** terminal session at the root of the project (`/`) and execute:

```bash
npm run dev
```

### Accessing the Platform
Visit **`http://localhost:3000`** in your browser.

**Demonstration Test Accounts:**
- **Buyer/Standard User:** `guru@recopoint.in` (Pass: `password`)
- **Seller User:** `raheesh@recopoint.in` (Pass: `password`)
- **System Admin:** `admin@recopoint.in` (Pass: `password`)

> *Note: For immediate showcase, you can also use the "Quick Login" features deployed on the `/login` route!*
