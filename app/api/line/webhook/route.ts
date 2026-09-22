import { NextResponse } from "next/server";
import { linkLineAccountByCode } from "@/lib/server/db";
import { replyLineMessage, verifyLineSignature } from "@/lib/server/line";

// LINE calls this URL for every event on the Official Account (messages,
// follows, etc.) — configured as the channel's webhook URL in the LINE
// Developers Console. The only thing we care about right now is someone
// typing their 6-digit link code from Settings.
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-line-signature");

  if (!verifyLineSignature(rawBody, signature)) {
    return NextResponse.json({ success: false, error: "Invalid signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const events: any[] = Array.isArray(body?.events) ? body.events : [];

  await Promise.all(
    events.map(async (event) => {
      if (event.type !== "message" || event.message?.type !== "text") return;

      const text: string = String(event.message.text || "").trim();
      const lineUserId: string | undefined = event.source?.userId;
      const replyToken: string | undefined = event.replyToken;
      if (!lineUserId || !replyToken) return;

      const codeMatch = text.match(/^\d{6}$/);
      if (!codeMatch) {
        await replyLineMessage(
          replyToken,
          "สวัสดีครับ 👋 พิมพ์รหัส 6 หลักที่ได้จากหน้า Settings ของ WorkBoard เพื่อเชื่อมบัญชี"
        );
        return;
      }

      const linked = await linkLineAccountByCode(text, lineUserId);
      await replyLineMessage(
        replyToken,
        linked
          ? `เชื่อมบัญชีสำเร็จ! ✅ ยินดีต้อนรับคุณ ${linked.name} — ต่อไปนี้จะแจ้งเตือนงานผ่าน LINE ให้ครับ`
          : "รหัสไม่ถูกต้องหรือหมดอายุแล้วครับ กลับไปกดสร้างรหัสใหม่ที่หน้า Settings อีกครั้ง"
      );
    })
  );

  // LINE only needs a 200 to know the webhook succeeded — the actual
  // linking/reply work above already happened.
  return NextResponse.json({ success: true });
}
