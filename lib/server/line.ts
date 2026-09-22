import crypto from "crypto";

// LINE Messaging API — the free replacement for LINE Notify (shut down by
// LINE in March 2025). Sending a push message needs a LINE userId, which we
// only get once a person links their WorkBoard account to the bot (see the
// webhook below); there is no way to message someone by email/phone.

const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

export interface LineSendResult {
  success: boolean;
  error?: string;
}

function getChannelAccessToken(): string | null {
  return process.env.LINE_CHANNEL_ACCESS_TOKEN || null;
}

export function isLineConfigured(): boolean {
  return Boolean(process.env.LINE_CHANNEL_ACCESS_TOKEN && process.env.LINE_CHANNEL_SECRET);
}

export async function sendLinePushMessage(
  lineUserId: string,
  text: string
): Promise<LineSendResult> {
  const token = getChannelAccessToken();
  if (!token) {
    return { success: false, error: "LINE_CHANNEL_ACCESS_TOKEN is not configured" };
  }
  try {
    const res = await fetch(LINE_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        to: lineUserId,
        messages: [{ type: "text", text: text.slice(0, 5000) }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { success: false, error: `LINE push failed (${res.status}): ${body}` };
    }
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e.message || "Network error calling LINE" };
  }
}

export async function replyLineMessage(replyToken: string, text: string): Promise<void> {
  const token = getChannelAccessToken();
  if (!token) return;
  try {
    await fetch(LINE_REPLY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: "text", text: text.slice(0, 5000) }],
      }),
    });
  } catch {
    // best-effort — a failed reply shouldn't break the webhook
  }
}

// LINE signs every webhook body with the channel secret (HMAC-SHA256,
// base64). Verifying this is what stops anyone else from posting fake
// "link code" messages straight to our webhook and hijacking an account.
export function verifyLineSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("base64");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Short, easy-to-type-into-a-chat code — not a security secret on its own
// (that's what signature verification + the short expiry are for), just
// something for the person to copy from Settings and paste into LINE.
export function generateLineLinkCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export const LINE_LINK_CODE_TTL_MS = 10 * 60 * 1000; // 10 minutes
