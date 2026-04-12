import crypto from "crypto";

const WALLET_ENC_KEY = process.env.WALLET_ENC_KEY || "recopoint-wallet-encryption-key!";

function getEncKey(): Buffer {
  return crypto.createHash("sha256").update(WALLET_ENC_KEY).digest();
}

export function generateWallet(): { address: string; encryptedSecret: string } {
  const privateKey = crypto.randomBytes(32);
  const addressHash = crypto.createHash("sha256").update(privateKey).digest();
  const address = "0x" + addressHash.subarray(12, 32).toString("hex");

  // Encrypt private key with AES-256-GCM
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getEncKey(), iv);
  const encrypted = Buffer.concat([cipher.update(privateKey), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const encryptedSecret = Buffer.concat([iv, authTag, encrypted]).toString("base64");

  return { address, encryptedSecret };
}

function decryptSecret(encryptedSecret: string): Buffer {
  const data = Buffer.from(encryptedSecret, "base64");
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const encrypted = data.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getEncKey(), iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}

export function signMessage(encryptedSecret: string, message: string): string {
  const privateKey = decryptSecret(encryptedSecret);
  const hmac = crypto.createHmac("sha256", privateKey);
  hmac.update(message);
  return hmac.digest("hex");
}

export function createTxHash(fromAddress: string, toAddress: string, amount: number, timestamp: string): string {
  const data = `${fromAddress}:${toAddress}:${amount}:${timestamp}`;
  return "0x" + crypto.createHash("sha256").update(data).digest("hex");
}
