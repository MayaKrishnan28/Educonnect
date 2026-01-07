require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const prisma = new PrismaClient();

// Mock sendEmail from mail.ts
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

async function sendEmail(to, subject, html) {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ SMTP Credentials missing.");
        return false;
    }
    try {
        const info = await transporter.sendMail({
            from: `"EduConnect" <${process.env.SMTP_USER}>`,
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return true;
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}

// Mimic sendOtpAction
async function sendOtpAction(email, role) {
    console.log(`Testing OTP for ${email} as ${role}`);

    if (!email) return { success: false, error: "Email is required" };

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        console.log("User not found via Prisma");
        return { success: false, error: "Email not registered." };
    }
    console.log(`User found: ${user.name} (${user.role})`);

    if (user.role !== role) {
        console.log(`Role mismatch: Expected ${role}, got ${user.role}`);
        return { success: false, error: "Role mismatch." };
    }

    // Rate Limiting
    const now = new Date();
    // Simplified checks for debug
    console.log("Rate limit checks passed (simulated)");

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(code).digest("hex");
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    console.log("Generated OTP:", code);
    console.log("Saving to DB...");

    try {
        await prisma.user.update({
            where: { id: user.id },
            data: {
                otpHash,
                otpExpiresAt: expiresAt,
                otpLastSentAt: now,
                otpSendCount: (user.otpSendCount || 0) + 1,
            }
        });
        console.log("DB Updated.");
    } catch (e) {
        console.error("DB Update Failed:", e);
        return { success: false, error: "DB Error" };
    }

    console.log("Sending Email...");
    const emailSent = await sendEmail(email, "EduConnect Debug Code", `Code: ${code}`);

    if (!emailSent) {
        console.log("Email sending failed!");
        return { success: false, error: "Failed to send OTP email." };
    }

    console.log("Email sent successfully.");
    return { success: true };
}

async function main() {
    // TEST 1: Valid User
    console.log("--- TEST 1: Valid Teacher ---");
    const res1 = await sendOtpAction("sabi.sabi9102004@gmail.com", "TEACHER");
    console.log("Result 1:", res1);

    // TEST 2: Wrong Role
    console.log("\n--- TEST 2: Wrong Role ---");
    const res2 = await sendOtpAction("sabi.sabi9102004@gmail.com", "STUDENT");
    console.log("Result 2:", res2);

    await prisma.$disconnect();
}

main();
