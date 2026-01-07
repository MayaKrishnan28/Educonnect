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
    } catch (error) {
        console.error("Error sending email:", error);
        return false;
    }
}
