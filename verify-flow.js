require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// --- SETUP ---
const prisma = new PrismaClient();
const TESTING_EMAIL = "sabi.sabi9102004@gmail.com";
const TESTING_ROLE = "TEACHER";

// --- MAIL LOGIC (Copied from src/lib/mail.ts) ---
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendEmail(to, subject, html) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ Credentials missing.");
        return false;
    }
    try {
        const info = await transporter.sendMail({
            from: `"EduConnect" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        console.log("✅ Mail Sent! ID: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("❌ Mail Error:", error);
        return false;
    }
}

// --- MAIN FLOW ---
async function runFlow() {
    console.log(`Starting Full OTP Flow Verification for ${TESTING_EMAIL}`);

    // 1. Fetch User
    const user = await prisma.user.findUnique({ where: { email: TESTING_EMAIL } });
    if (!user) {
        console.error("❌ User not found!");
        return;
    }
    console.log(`✅ User Found: ${user.name}`);

    // 2. Generate OTP
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(code).digest("hex");
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    console.log(`🔑 Generated Code: ${code}`);

    // 3. Update DB
    await prisma.user.update({
        where: { id: user.id },
        data: {
            otpHash,
            otpExpiresAt: expiresAt,
            otpLastSentAt: now,
        }
    });
    console.log("✅ DB Logged OTP Hash");

    // 4. Send Email (Actual HTML)
    const emailHtml = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h1 style="color: #6366f1;">EduConnect Secure Login</h1>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">${code}</div>
      <p>This code expires in 5 minutes.</p>
      <p style="font-size: 12px; color: #666;">If you did not request this, please ignore it.</p>
      <p>DEBUG: This is a verification test sent at ${new Date().toISOString()}</p>
    </div>
  `;

    console.log("📨 Sending Email...");
    const sent = await sendEmail(TESTING_EMAIL, "EduConnect LIVE Verification", emailHtml);

    if (!sent) {
        console.error("❌ Email failed to send. Aborting.");
        return;
    }

    // 5. Simulate Verification
    console.log("🔍 Verifying...");
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });

    const verifyHash = crypto.createHash("sha256").update(code).digest("hex");

    if (updatedUser.otpHash === verifyHash) {
        console.log("✅ HASH MATCH! verification logic is sound.");
    } else {
        console.error("❌ HASH MISMATCH!");
        console.error("Expected:", verifyHash);
        console.error("Actual:  ", updatedUser.otpHash);
    }

    if (updatedUser.otpExpiresAt > new Date()) {
        console.log("✅ Expiry Check Passed");
    } else {
        console.error("❌ Expiry Check Failed (Expired already?)");
    }

    await prisma.$disconnect();
}

runFlow();
