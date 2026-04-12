import crypto from "crypto";
import QRCode from "qrcode";

// Update this constant with your personal UPI ID so QRs scan directly to your bank account!
const UPI_ID = "gvkarthik18-2@oksbi";
const MERCHANT_NAME = "CollegeProject";

export function generateTransactionId(): string {
  return "RCO" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(4).toString("hex").toUpperCase();
}

export function buildUpiUrl(amountINR: number, transactionId: string): string {
  return `upi://pay?pa=${UPI_ID}&pn=${MERCHANT_NAME}&am=${amountINR}&cu=INR&tn=RECOPOINT%20Credits&tr=${transactionId}`;
}

export async function generateQrDataUrl(upiUrl: string): Promise<string> {
  return QRCode.toDataURL(upiUrl, {
    width: 300,
    margin: 2,
    color: { dark: "#000000", light: "#ffffff" },
  });
}

export function calculateCredits(amountINR: number): number {
  return Math.floor(amountINR / 10);
}
