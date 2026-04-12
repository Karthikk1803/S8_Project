import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./jwt";

const COOKIE_NAME = "recopoint_session";

export async function getSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export function getSessionCookieName(): string {
  return COOKIE_NAME;
}
