import * as jwt from "jsonwebtoken";
import * as https from "https";

export function generateStringeeRestToken(): string {
  const { STRINGEE_ACCOUNT_SID, STRINGEE_ACCOUNT_KEY } = process.env as any;
  if (!STRINGEE_ACCOUNT_SID || !STRINGEE_ACCOUNT_KEY) {
    throw new Error("Missing required Stringee credentials");
  }
  const now = Math.floor(Date.now() / 1000);
  const payload: any = {
    iss: STRINGEE_ACCOUNT_SID,
    jti: `${STRINGEE_ACCOUNT_SID}_${now}`,
    exp: now + 300,
    rest_api: true,
  };
  return jwt.sign(payload, STRINGEE_ACCOUNT_KEY, {
    algorithm: "HS256",
    header: { alg: "HS256", cty: "stringee-api;v=1" } as any,
  } as any);
}

export async function getOnlineUsers(): Promise<string[]> {
  try {
    const token = generateStringeeRestToken();
    const options: https.RequestOptions = {
      method: "GET",
      hostname: "api.stringee.com",
      path: "/v1/users",
      headers: { "X-STRINGEE-AUTH": token },
    };
    const body = await new Promise<string>((resolve, reject) => {
      const req = https.request(options, (res) => {
        const chunks: Buffer[] = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
      });
      req.on("error", reject);
      req.end();
    });
    const json = JSON.parse(body || "{}");
    const users = Array.isArray(json.users) ? json.users : [];
    return users
      .map((u: any) => (u && (u.userId || u.userid || u.id)) as string)
      .filter(Boolean);
  } catch (_e) {
    return [];
  }
}

export function generateStringeeSDKToken(userId: string): string {
  const { STRINGEE_ACCOUNT_SID, STRINGEE_ACCOUNT_KEY } = process.env as any;
  if (!STRINGEE_ACCOUNT_SID || !STRINGEE_ACCOUNT_KEY) {
    throw new Error("Missing required Stringee credentials");
  }
  const now = Math.floor(Date.now() / 1000);
  const payload: any = {
    iss: STRINGEE_ACCOUNT_SID,
    sub: STRINGEE_ACCOUNT_SID,
    jti: STRINGEE_ACCOUNT_KEY,
    iat: now,
    exp: now + 3600,
    userId,
  };
  return jwt.sign(payload, STRINGEE_ACCOUNT_KEY, { algorithm: "HS256" });
}


