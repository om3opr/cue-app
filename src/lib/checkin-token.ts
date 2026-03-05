import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.CHECKIN_SECRET ?? "fallback-secret"
);

export async function createCheckinToken(
  intentionId: string,
  userId: string
): Promise<string> {
  return new SignJWT({ intentionId, userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("48h")
    .sign(secret);
}

export async function verifyCheckinToken(
  token: string
): Promise<{ intentionId: string; userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return {
      intentionId: payload.intentionId as string,
      userId: payload.userId as string,
    };
  } catch {
    return null;
  }
}
