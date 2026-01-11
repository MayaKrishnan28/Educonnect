import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail", // Easy setup for common users
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail(to: string, subject: string, html: string) {
    // If no credentials, fallback to console (safety net)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ SMTP Credentials missing. Email not sent. Check console for content.");
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
    } catch (error: any) {
        if (error.code === 'EAUTH') {
            console.error("\n❌ GMAIL AUTHENTICATION FAILED");
            console.error("==================================================================");
            console.error("Google rejected your login credentials. This is expected!");
            console.error("You cannot use your regular Gmail password for third-party apps.");
            console.error("\n👉 HOW TO FIX (Takes 2 minutes):");
            console.error("1. Go to https://myaccount.google.com/security");
            console.error("2. Enable '2-Step Verification' if not already on.");
            console.error("3. Search for 'App passwords' (or look under 2-Step Verification).");
            console.error("4. Create a new App Password named 'EduConnect'.");
            console.error("5. Copy the 16-character code (it looks like: abcd efgh ijkl mnop).");
            console.error("6. Update your .env file with this code as SMTP_PASS.");
            console.error("   SMTP_PASS=abcdefghijklmnop");
            console.error("==================================================================\n");
        } else {
            console.error("Error sending email:", error);
        }
        return false;
    }
}
