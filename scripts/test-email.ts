import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

async function testEmail() {
  console.log("==================================================");
  console.log("   WorkBoard Live SMTP Diagnostic & Sender Tool   ");
  console.log("==================================================");

  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpSecure = process.env.SMTP_SECURE === "true" || smtpPort === 465;
  const fromAddress =
    process.env.SMTP_FROM || `"WorkBoard" <${smtpUser || "noreply@workboard.io"}>`;

  const targetEmail = process.argv[2] || "thamakhorn@gmail.com";

  console.log("Target recipient:", targetEmail);
  console.log("SMTP Host:", smtpHost || "(Not configured)");
  console.log("SMTP Port:", smtpPort);
  console.log("SMTP User:", smtpUser || "(Not configured)");
  console.log("SMTP Secure:", smtpSecure);
  console.log("SMTP From:", fromAddress);
  console.log("--------------------------------------------------");

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log("⚠️ SMTP ยังไม่ได้กรอกข้อมูลในไฟล์ .env");
    console.log("โปรดกรอกค่าใน .env เช่น:");
    console.log('SMTP_HOST="smtp.gmail.com"');
    console.log('SMTP_PORT="465"');
    console.log('SMTP_SECURE="true"');
    console.log('SMTP_USER="your-email@gmail.com"');
    console.log('SMTP_PASS="xxxx xxxx xxxx xxxx" (App Password 16 ตัว)');
    console.log('SMTP_FROM="WorkBoard <your-email@gmail.com>"');
    console.log("\nหรือหากต้องการให้ส่งผ่านเซิร์ฟเวอร์ทดสอบสด Ethereal ทันที ให้ดูด้านล่าง:");

    try {
      console.log("\nกำลังสร้าง Ethereal Live Test Account...");
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

      console.log("กำลังส่งอีเมลทดสอบ...");
      const info = await testTransporter.sendMail({
        from: '"WorkBoard Team" <noreply@workboard.io>',
        to: targetEmail,
        subject: "[WorkBoard] ทดสอบการส่งคำเชิญเข้าร่วมโครงการ",
        html: `<h2>WorkBoard Team Invitation</h2><p>อีเมลฉบับนี้ส่งถึง <strong>${targetEmail}</strong></p><p><a href="http://localhost:3000/board/board-1">กดเปิดดูบอร์ดโครงการ</a></p>`,
      });

      console.log("✅ ส่งสำเร็จ! (MessageId):", info.messageId);
      console.log("🔗 ดูหน้าตาอีเมลที่ส่งออกได้ที่ URL นี้:");
      console.log(nodemailer.getTestMessageUrl(info));
    } catch (e: any) {
      console.error("Error:", e.message);
    }
    return;
  }

  // Real Custom SMTP
  try {
    console.log("กำลังทดสอบเชื่อมต่อกับ SMTP Server...");
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.verify();
    console.log("✅ การเชื่อมต่อกับ SMTP Server ผ่านสมบูรณ์ (Handshake Success)!");

    console.log(`กำลังส่งอีเมลจริงตรงไปยังกล่องจดหมาย: ${targetEmail}...`);
    const info = await transporter.sendMail({
      from: fromAddress,
      to: targetEmail,
      subject: `[WorkBoard] คุณได้รับคำเชิญเข้าร่วมโครงการ "Projects & Deliverables"`,
      html: `
        <div style="font-family: sans-serif; background-color: #181b34; color: #ffffff; padding: 24px; border-radius: 12px; max-width: 500px;">
          <h2 style="color: #60a5fa; margin-top: 0;">WorkBoard Project Invitation</h2>
          <p>คุณ <strong>Somchai</strong> ได้เชิญคุณเข้าร่วมโครงการ <strong>Projects & Deliverables</strong></p>
          <p>คลิกปุ่มด้านล่างเพื่อเข้าสู่บอร์ดการทำงาน:</p>
          <div style="margin: 24px 0;">
            <a href="http://localhost:3000/board/board-1" style="background-color: #0073ea; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
              เปิดหน้างวดงานโครงการทันที
            </a>
          </div>
          <p style="font-size: 12px; color: #94a3b8;">WorkBoard Enterprise • อีเมลนี้ส่งตรงเข้ากล่องข้อความของคุณ</p>
        </div>
      `,
    });

    console.log("🎉 ส่งเข้า Inbox สำเร็จเรียบร้อยแล้ว!");
    console.log("Message ID:", info.messageId);
    console.log("Response:", info.response);
  } catch (err: any) {
    console.error("❌ เกิดข้อผิดพลาดในการส่ง SMTP:", err.message);
    if (err.code === "EAUTH") {
      console.log("💡 คำแนะนำ: รหัสผ่านอีเมลไม่ถูกต้อง หากใช้ Gmail ต้องสร้าง 'App Password' 16 หลักจาก https://myaccount.google.com/apppasswords");
    }
  }
}

testEmail()
  .catch(console.error)
  .finally(() => process.exit(0));
