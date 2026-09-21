import nodemailer from "nodemailer";

interface SendInviteParams {
  to: string;
  inviterName: string;
  boardName: string;
  role: string;
  inviteUrl: string;
}

interface SendAppointmentReminderParams {
  to: string;
  recipientName: string;
  workspaceName: string;
  title: string;
  notes?: string;
  startAt: Date;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  previewUrl?: string | false;
  mode: "smtp" | "ethereal" | "failed";
  error?: string;
}

function buildTransportConfig() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const fromAddress =
    process.env.SMTP_FROM || `"WorkBoard" <${smtpUser || "noreply@workboard.io"}>`;
  return { smtpHost, smtpUser, smtpPass, smtpPort, smtpSecure, fromAddress };
}

export async function sendAppointmentReminderEmail(
  params: SendAppointmentReminderParams
): Promise<EmailSendResult> {
  const { to, recipientName, workspaceName, title, notes, startAt } = params;

  const startLabel = startAt.toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #111322; color: #f4f4f5; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #181b34; border: 1px solid #2a2d48; border-radius: 16px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
          .logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin-bottom: 24px; }
          .badge { display: inline-block; background-color: rgba(16, 185, 129, 0.15); color: #34d399; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
          h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 16px; }
          .highlight { color: #ffffff; font-weight: 600; }
          .time-box { background-color: #111322; border: 1px solid #272a45; border-radius: 10px; padding: 14px 16px; font-size: 14px; color: #93c5fd; font-weight: 600; margin-bottom: 20px; }
          .footer { margin-top: 32px; border-top: 1px solid #272a45; padding-top: 20px; font-size: 12px; color: #71717a; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">WorkBoard</div>
          <span class="badge">Appointment Reminder</span>
          <h1>${title}</h1>
          <p>Hi <span class="highlight">${recipientName}</span>, you have an upcoming appointment in <span class="highlight">${workspaceName}</span>.</p>
          <div class="time-box">🗓 ${startLabel}</div>
          ${notes ? `<p>${notes}</p>` : ""}
          <div class="footer">
            WorkBoard Enterprise Workspace • Sent securely to ${to}
          </div>
        </div>
      </body>
    </html>
  `;

  const { smtpHost, smtpUser, smtpPass, smtpPort, smtpSecure, fromAddress } =
    buildTransportConfig();

  const textContent = `Reminder: "${title}" in ${workspaceName} at ${startLabel}.${notes ? `\n\n${notes}` : ""}`;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject: `[WorkBoard] Reminder: ${title}`,
        text: textContent,
        html: htmlContent,
      });

      console.log(`[Email] Sent appointment reminder to ${to} (MessageId: ${info.messageId})`);
      return { success: true, messageId: info.messageId, mode: "smtp" };
    } catch (err: any) {
      console.error("[Email] Real SMTP delivery error:", err);
    }
  }

  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: { user: testAccount.user, pass: testAccount.pass },
    });

    const info = await testTransporter.sendMail({
      from: `"WorkBoard Team" <noreply@workboard.io>`,
      to,
      subject: `[WorkBoard] Reminder: ${title}`,
      text: textContent,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email] Ethereal SMTP live preview URL: ${previewUrl}`);
    return { success: true, messageId: info.messageId, previewUrl, mode: "ethereal" };
  } catch (err: any) {
    console.error("[Email] Ethereal fallback failed:", err);
    return { success: false, mode: "failed", error: err.message };
  }
}

export async function sendBoardInvitationEmail(
  params: SendInviteParams
): Promise<EmailSendResult> {
  const { to, inviterName, boardName, role, inviteUrl } = params;

  // HTML Email Template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #111322; color: #f4f4f5; margin: 0; padding: 24px; }
          .container { max-width: 560px; margin: 0 auto; background-color: #181b34; border: 1px solid #2a2d48; border-radius: 16px; padding: 36px; box-shadow: 0 10px 30px rgba(0,0,0,0.4); }
          .logo-bar { display: flex; align-items: center; margin-bottom: 24px; }
          .logo { font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
          .badge { display: inline-block; background-color: rgba(59, 130, 246, 0.15); color: #60a5fa; padding: 4px 10px; border-radius: 8px; font-size: 11px; font-weight: 600; text-transform: uppercase; margin-bottom: 16px; }
          h1 { font-size: 22px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 12px; }
          p { font-size: 14px; line-height: 1.6; color: #a1a1aa; margin-bottom: 20px; }
          .highlight { color: #ffffff; font-weight: 600; }
          .btn-container { text-align: center; margin: 32px 0; }
          .btn { display: inline-block; background-color: #0073ea; color: #ffffff !important; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(0, 115, 234, 0.4); }
          .btn:hover { background-color: #0060c0; }
          .link-box { background-color: #111322; border: 1px solid #272a45; border-radius: 10px; padding: 12px; word-break: break-all; font-family: monospace; font-size: 11px; color: #93c5fd; }
          .footer { margin-top: 32px; border-top: 1px solid #272a45; padding-top: 20px; font-size: 12px; color: #71717a; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo-bar">
            <span class="logo">WorkBoard Enterprise</span>
          </div>
          <span class="badge">Team Invitation</span>
          <h1>You've been invited to join ${boardName}</h1>
          <p>
            <span class="highlight">${inviterName}</span> has invited you to collaborate on the project board 
            <span class="highlight">"${boardName}"</span> as <span class="highlight">${role}</span>.
          </p>
          <p>
            Join your teammates to track milestones, view assignments, and collaborate in real-time.
          </p>
          <div class="btn-container">
            <a href="${inviteUrl}" class="btn" target="_blank">Confirm & Join Project Team</a>
          </div>
          <p style="font-size: 12px; margin-bottom: 6px;">Or copy and paste this link into your browser:</p>
          <div class="link-box">${inviteUrl}</div>
          <div class="footer">
            WorkBoard Enterprise Workspace • Sent securely to ${to}
          </div>
        </div>
      </body>
    </html>
  `;

  // 1. Check if user configured real custom SMTP in environment
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const fromAddress =
    process.env.SMTP_FROM || `"WorkBoard" <${smtpUser || "noreply@workboard.io"}>`;

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: fromAddress,
        to,
        subject: `[WorkBoard] You are invited to join "${boardName}" as ${role}`,
        text: `You have been invited by ${inviterName} to join ${boardName} as ${role}. Confirm and join here: ${inviteUrl}`,
        html: htmlContent,
      });

      console.log(`[Email] Sent real SMTP email to ${to} (MessageId: ${info.messageId})`);
      return {
        success: true,
        messageId: info.messageId,
        mode: "smtp",
      };
    } catch (err: any) {
      console.error("[Email] Real SMTP delivery error:", err);
      // Fallback to test account below
    }
  }

  // 2. If SMTP is not configured or fails, use real Ethereal SMTP test account
  try {
    const testAccount = await nodemailer.createTestAccount();
    const testTransporter = nodemailer.createTransport({
      host: testAccount.smtp.host,
      port: testAccount.smtp.port,
      secure: testAccount.smtp.secure,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    const info = await testTransporter.sendMail({
      from: `"WorkBoard Team" <noreply@workboard.io>`,
      to,
      subject: `[WorkBoard] You are invited to join "${boardName}" as ${role}`,
      text: `You have been invited by ${inviterName} to join ${boardName} as ${role}. Confirm and join here: ${inviteUrl}`,
      html: htmlContent,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[Email] Ethereal SMTP live preview URL: ${previewUrl}`);

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
      mode: "ethereal",
    };
  } catch (err: any) {
    console.error("[Email] Ethereal fallback failed:", err);
    return {
      success: false,
      mode: "failed",
      error: err.message,
    };
  }
}
