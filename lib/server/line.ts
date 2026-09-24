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

async function pushMessages(lineUserId: string, messages: unknown[]): Promise<LineSendResult> {
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
      body: JSON.stringify({ to: lineUserId, messages }),
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

export async function sendLinePushMessage(
  lineUserId: string,
  text: string
): Promise<LineSendResult> {
  return pushMessages(lineUserId, [{ type: "text", text: text.slice(0, 5000) }]);
}

// The site's public base URL, for links inside LINE messages — those go
// out over LINE's own network, so `http://localhost` is never reachable;
// this needs a real deployed origin. Set NEXT_PUBLIC_SITE_URL explicitly in
// production; VERCEL_URL is Vercel's own runtime fallback.
export function getSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function buildTaskLink(taskId: string): string {
  return `${getSiteUrl()}/my-work?taskId=${encodeURIComponent(taskId)}`;
}

export interface FlexCardRow {
  label: string;
  value: string;
  valueColor?: string;
  bold?: boolean;
}

export interface FlexCardOptions {
  headerColor: string;
  headerLabel: string;
  emoji: string;
  title: string;
  rows?: FlexCardRow[];
  link: string;
  linkLabel: string;
  altText: string;
}

// A LINE "Flex Message" bubble — a small card with a colored header, a few
// labelled rows, and a button straight into the app — reads as an actual
// notification from a real system instead of a loose line of plain text.
export function buildFlexCard(opts: FlexCardOptions) {
  const detailRows = (opts.rows ?? []).map((r) => ({
    type: "box",
    layout: "baseline",
    spacing: "sm",
    contents: [
      { type: "text", text: r.label, size: "xs", color: "#71717A", flex: 2 },
      {
        type: "text",
        text: r.value,
        size: "xs",
        color: r.valueColor ?? "#3F3F46",
        flex: 5,
        ...(r.bold ? { weight: "bold" } : {}),
        wrap: true,
      },
    ],
  }));

  return {
    type: "flex",
    altText: opts.altText,
    contents: {
      type: "bubble",
      size: "kilo",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: opts.headerColor,
        paddingAll: "16px",
        contents: [
          {
            type: "text",
            text: "WorkBoard",
            color: "#FFFFFFB3",
            size: "xs",
            weight: "bold",
          },
          {
            type: "text",
            text: `${opts.emoji} ${opts.headerLabel}`,
            color: "#FFFFFF",
            size: "md",
            weight: "bold",
            margin: "sm",
            wrap: true,
          },
        ],
      },
      body: {
        type: "box",
        layout: "vertical",
        paddingAll: "16px",
        spacing: "md",
        contents: [
          {
            type: "text",
            text: opts.title,
            weight: "bold",
            size: "lg",
            wrap: true,
            color: "#18181B",
          },
          ...(detailRows.length > 0
            ? [{ type: "box", layout: "vertical", spacing: "xs", contents: detailRows }]
            : []),
        ],
      },
      footer: {
        type: "box",
        layout: "vertical",
        paddingAll: "12px",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            color: opts.headerColor,
            action: { type: "uri", label: opts.linkLabel, uri: opts.link },
          },
        ],
      },
      styles: { footer: { separator: true } },
    },
  };
}

export interface TaskFlexMessageOptions {
  headerColor: string;
  headerLabel: string;
  emoji: string;
  taskTitle: string;
  boardName?: string;
  dueLabel?: string;
  statusNote?: string;
  link: string;
  altText: string;
}

export function buildTaskFlexMessage(opts: TaskFlexMessageOptions) {
  const rows: FlexCardRow[] = [];
  if (opts.boardName) rows.push({ label: "บอร์ด", value: opts.boardName });
  if (opts.dueLabel) rows.push({ label: "กำหนดส่ง", value: opts.dueLabel });
  if (opts.statusNote) {
    rows.push({
      label: "สถานะ",
      value: opts.statusNote,
      valueColor: "#E11D48",
      bold: true,
    });
  }
  return buildFlexCard({
    headerColor: opts.headerColor,
    headerLabel: opts.headerLabel,
    emoji: opts.emoji,
    title: opts.taskTitle,
    rows,
    link: opts.link,
    linkLabel: "ดูรายละเอียดงาน",
    altText: opts.altText,
  });
}

export async function sendLineTaskNotification(
  lineUserId: string,
  opts: TaskFlexMessageOptions
): Promise<LineSendResult> {
  return pushMessages(lineUserId, [buildTaskFlexMessage(opts)]);
}

export function buildBoardLink(boardId: string): string {
  return `${getSiteUrl()}/board/${encodeURIComponent(boardId)}`;
}

export function buildCalendarLink(): string {
  return `${getSiteUrl()}/calendar`;
}

export interface AppointmentReminderOptions {
  title: string;
  dateLabel: string;
  /** Already formatted in Asia/Bangkok — e.g. "14:00 - 15:30 น." */
  timeRangeLabel: string;
  workspaceName?: string;
  notes?: string;
}

// The calendar's counterpart to the task reminders: fires at the appointment's
// reminder window for every attendee who has LINE linked.
export async function sendLineAppointmentReminder(
  lineUserId: string,
  opts: AppointmentReminderOptions
): Promise<LineSendResult> {
  const rows: FlexCardRow[] = [
    { label: "วันที่", value: opts.dateLabel },
    { label: "เวลา", value: opts.timeRangeLabel, valueColor: "#0073EA", bold: true },
  ];
  if (opts.workspaceName) rows.push({ label: "Workspace", value: opts.workspaceName });
  if (opts.notes) rows.push({ label: "หมายเหตุ", value: opts.notes });

  return pushMessages(lineUserId, [
    buildFlexCard({
      headerColor: "#7C3AED",
      headerLabel: "เตือนนัดหมาย",
      emoji: "📅",
      title: opts.title,
      rows,
      link: buildCalendarLink(),
      linkLabel: "เปิดปฏิทิน",
      altText: `เตือนนัดหมาย: ${opts.title} ${opts.timeRangeLabel}`,
    }),
  ]);
}

export interface MemberJoinedOptions {
  memberName: string;
  memberEmail?: string;
  boardName?: string;
  boardId: string;
}

// Sent to whoever issued the invitation, once the person they invited has
// actually accepted it — the invite itself is fire-and-forget email, so
// without this the inviter has no way to tell whether it was taken up.
export async function sendLineMemberJoinedNotification(
  lineUserId: string,
  opts: MemberJoinedOptions
): Promise<LineSendResult> {
  const rows: FlexCardRow[] = [];
  if (opts.boardName) rows.push({ label: "บอร์ด", value: opts.boardName });
  if (opts.memberEmail) rows.push({ label: "อีเมล", value: opts.memberEmail });

  return pushMessages(lineUserId, [
    buildFlexCard({
      headerColor: "#16A34A",
      headerLabel: "สมาชิกที่คุณเชิญเข้าร่วมแล้ว",
      emoji: "🎉",
      title: opts.memberName,
      rows,
      link: buildBoardLink(opts.boardId),
      linkLabel: "เปิดบอร์ด",
      altText: `${opts.memberName} เข้าร่วมบอร์ดที่คุณเชิญแล้ว`,
    }),
  ]);
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
