import { createRemoteJWKSet, JWTPayload, jwtVerify } from "jose";

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL("https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com")
);

export type FirebaseIdTokenPayload = JWTPayload & {
  user_id?: string;
  email?: string;
};

export function getFirebaseProjectId(): string {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
  if (!projectId) {
    throw new Error("Firebase project id is missing in environment variables.");
  }
  return projectId;
}

export async function verifyFirebaseIdToken(token: string): Promise<FirebaseIdTokenPayload> {
  const projectId = getFirebaseProjectId();

  const { payload } = await jwtVerify(token, FIREBASE_JWKS, {
    issuer: `https://securetoken.google.com/${projectId}`,
    audience: projectId,
    algorithms: ["RS256"],
  });

  return payload as FirebaseIdTokenPayload;
}
