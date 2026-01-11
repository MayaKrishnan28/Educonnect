require('dotenv').config();
const { MongoClient } = require('mongodb');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// --- SETUP ---
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.MONGODB_DB || 'educonnect';
const client = new MongoClient(MONGODB_URI);
async function getUsersCollection() {
    if (!client.topology || !client.topology.isConnected()) await client.connect();
    const db = client.db(DB_NAME);
    return db.collection('user');
}

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
    const col = await getUsersCollection();
    const user = await col.findOne({ email: TESTING_EMAIL });
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
    const manualPassword = "EduConnect@2024";
    await col.updateOne({ _id: user._id || user.id }, {
        $set: {
            password: manualPassword,
            otpHash,
            otpExpiresAt: expiresAt,
            otpLastSentAt: now
        }
    });
    console.log(`✅ DB Logged OTP Hash and Password: ${manualPassword}`);

    // 4. Send Email (Actual HTML)
    const emailHtml = `
    <div style="font-family: sans-serif; padding: 30px; color: #333; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: auto;">
      <h2 style="color: #6366f1; text-align: center;">EduConnect Secure Login</h2>
      <p style="text-align: center; color: #64748b;">Use the code below to verify your identity.</p>
      
      <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; border: 1px dashed #cbd5e1;">
        <div style="font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #1e293b; font-family: monospace;">${code}</div>
        <p style="margin-top: 10px; font-size: 14px; color: #94a3b8;">This code will expire in 5 minutes</p>
      </div>
      
      <div style="padding: 20px; background-color: #f5f3ff; border-radius: 10px; border-left: 5px solid #6366f1; margin-bottom: 25px;">
        <h3 style="margin: 0 0 10px 0; font-size: 16px; color: #4338ca;">Your Account Credentials</h3>
        <p style="margin: 0; color: #4f46e5;">Email: <strong>${TESTING_EMAIL}</strong></p>
        <p style="margin: 5px 0 0 0; color: #4f46e5;">Password: <code style="background: #fff; padding: 2px 8px; border-radius: 4px; border: 1px solid #e2e8f0;">${manualPassword}</code></p>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
        DEBUG: This is a verification test sent at ${new Date().toISOString()}
      </p>
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
    const updatedUser = await col.findOne({ _id: user._id || user.id });

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

    await client.close();
}

runFlow();
