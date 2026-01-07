"use server"

import { db } from "@/lib/db"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { cookies } from "next/headers"
import { sendEmail } from "@/lib/mail"
import { generateSummary, explainTopic, chatWithAI } from "@/lib/ai"
import { encrypt, getSession } from "@/lib/auth"

// --- Auth Actions ---
// --- Auth Actions ---
import { createHash } from "crypto"


export async function checkSessionAction() {
  const session = await getSession()
  return !!session
}

export async function sendOtpAction(email: string, role: string) {
  console.log(`[DEBUG] OTP Request - Email: '${email}', Role: '${role}'`) // Debug Log
  if (!email) return { success: false, error: "Email is required" }

  // 1. Strict Pre-registration Check
  const user = await db.user.findUnique({ where: { email } })
  if (!user) {
    // Security: Do not reveal if email exists?
    // User Requirement: If the email is NOT found, show: "Email not registered. Please contact admin."
    return { success: false, error: "Email not registered. Please contact admin." }
  }

  // 1b. Role Check (Prevent Student logging in as Teacher account owner?)
  // Requirement: "Student login works only for role = student"
  // If user tries to login as Teacher but is actually Student in DB -> should we block sending OTP?
  // Yes, to prevent role confusion or enumeration.
  if (user.role !== role) {
    if (role === "TEACHER" && user.role === "STUDENT") {
      return { success: false, error: "Access Denied: You are not a Teacher." }
    }
    if (role === "STUDENT" && user.role === "TEACHER") {
      return { success: false, error: "Access Denied: You are a Teacher (Please use Teacher login)." }
    }
    // General fallthrough
    return { success: false, error: "Role mismatch. Please contact admin." }
  }

  // 2. Rate Limiting (Max 3 per 10 minutes)
  const now = new Date()
  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000)

  // Reset count if window passed
  let currentCount = user.otpSendCount
  if (!user.otpResetAt || user.otpResetAt < now) {
    currentCount = 0
  }

  // Check Lock
  if (user.lockedUntil && user.lockedUntil > now) {
    const remaining = Math.ceil((user.lockedUntil.getTime() - now.getTime()) / 60000)
    return { success: false, error: `Account locked. Try again in ${remaining} minutes.` }
  }

  // Check Rate Limit
  if (currentCount >= 3) {
    // Lock for 10 minutes? Or just deny?
    // Requirement: "Rate-limit OTP requests (max 3 per 10 minutes)"
    // Let's just block sending
    return { success: false, error: "Too many OTP requests. Please wait 10 minutes." }
  }

  // 3. Generate OTP
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  // Hash the OTP
  const otpHash = createHash("sha256").update(code).digest("hex")
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000) // 5 minutes

  // 4. Update User DB
  await db.user.update({
    where: { id: user.id },
    data: {
      otpHash,
      otpExpiresAt: expiresAt,
      otpLastSentAt: now,
      otpSendCount: currentCount + 1,
      otpResetAt: user.otpResetAt && user.otpResetAt > now ? user.otpResetAt : new Date(now.getTime() + 10 * 60 * 1000), // Reset window 10 min from start of window
      otpAttempts: 0 // Reset attempts on new OTP
    }
  })

  // 5. Send Email
  console.log(`\n🔐 SECURE OTP for ${email}: ${code}\n`) // Debug Logging

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 20px; color: #333;">
      <h1 style="color: #6366f1;">EduConnect Secure Login</h1>
      <p>Your verification code is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">${code}</div>
      <p>This code expires in 5 minutes.</p>
      <p style="font-size: 12px; color: #666;">If you did not request this, please ignore it.</p>
    </div>
  `

  const emailSent = await sendEmail(email, "EduConnect Verification Code", emailHtml) // Capture result

  if (!emailSent) {
    return { success: false, error: "Failed to send OTP email. Please try again later." }
  }

  return { success: true }
}

export async function verifyOtpAction(formData: FormData) {
  const email = formData.get("email") as string
  const code = formData.get("code") as string
  const role = formData.get("role") as string

  if (!email || !code) return { success: false, error: "Missing required fields" }

  const user = await db.user.findUnique({ where: { email } })
  if (!user) return { success: false, error: "User not found" }

  const now = new Date()

  // 1. Check Lock
  if (user.lockedUntil && user.lockedUntil > now) {
    return { success: false, error: "Account is locked. Please try again later." }
  }

  // 2. Check Expiry
  if (!user.otpExpiresAt || user.otpExpiresAt < now) {
    return { success: false, error: "OTP Expired. Please request a new one." }
  }

  // 3. Verify Hash
  const hash = createHash("sha256").update(code).digest("hex")
  if (user.otpHash !== hash) {
    // Increment Failure Count
    const newAttempts = user.otpAttempts + 1

    if (newAttempts >= 3) {
      // Lock Account
      await db.user.update({
        where: { id: user.id },
        data: {
          otpAttempts: newAttempts,
          lockedUntil: new Date(now.getTime() + 10 * 60 * 1000) // Lock for 10 mins
        }
      })
      return { success: false, error: "Invalid OTP. Account locked for 10 minutes." }
    } else {
      await db.user.update({
        where: { id: user.id },
        data: { otpAttempts: newAttempts }
      })
      return { success: false, error: `Invalid OTP. ${3 - newAttempts} attempts remaining.` }
    }
  }

  // 4. Success!
  // Clear OTP fields
  await db.user.update({
    where: { id: user.id },
    data: {
      otpHash: null,
      otpExpiresAt: null,
      otpAttempts: 0,
      isVerified: true
    }
  })

  // 5. Create Session
  const cookieStore = await cookies()
  const sessionToken = await encrypt({
    userId: user.id,
    role: user.role,
    email: user.email,
    name: user.name
  })

  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  // 6. Redirect
  redirect(`/dashboard`)
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete("session")
  redirect("/login")
}

export async function updateUserAction(formData: FormData) {
  const name = formData.get("name") as string

  const session = await getSession();
  const userId = session?.userId;

  if (!userId) throw new Error("Unauthorized");

  await db.user.update({
    where: { id: userId },
    data: { name }
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/settings")
}

// --- Note Actions ---
export async function createNoteAction(formData: FormData) {
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const subject = formData.get("subject") as string || "General" // Capture Subject

  const session = await getSession();
  const userId = session?.userId;

  if (!userId) throw new Error("Unauthorized");

  // Call Real AI
  const aiSummary = await generateSummary(`${title}\n\n${content}`);

  await db.note.create({
    data: {
      title,
      content,
      subject, // Save Subject
      summary: aiSummary,
      authorId: userId
    }
  })

  revalidatePath("/teacher")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/subjects")
}

export async function explainTextAction(text: string, context: string) {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) throw new Error("Unauthorized");

  // Call Real AI
  try {
    return await explainTopic(text, context);
  } catch (err: any) {
    console.error("Explain Action Error:", err.message)
    return "Sorry, I couldn't explain this right now."
  }
}

export async function chatWithAIAction(query: string, context: string) {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) {
    console.error("Chat Action: Unauthorized - No Session User ID")
    throw new Error("Unauthorized")
  }

  try {
    return await chatWithAI(query, context);
  } catch (err: any) {
    console.error("Chat Action Error:", err.message)
    return "Sorry, I encountered an error connecting to my brain."
  }
}

export async function getNotes() {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) return [];

  return await db.note.findMany({
    where: {
      OR: [
        { authorId: userId },
        {
          course: {
            enrollments: {
              some: { userId: userId }
            }
          }
        }
      ]
    },
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  })
}

export async function getSubjects() {
  // Group notes by subject to finding active subjects
  // Prisma SQLite doesn't support distinct on specific columns well in older versions or finding distinct nicely without raw
  // We'll fetch all and dedup in JS for prototype speed or use groupBy if available
  const notes = await db.note.findMany({
    select: { subject: true }
  });

  // Count occurrences
  const subjectCounts: Record<string, number> = {};
  notes.forEach(n => {
    subjectCounts[n.subject] = (subjectCounts[n.subject] || 0) + 1;
  });

  return Object.entries(subjectCounts).map(([name, count]) => ({ name, count }));
}

export async function getNotesBySubject(subject: string) {
  return await db.note.findMany({
    where: { subject },
    orderBy: { createdAt: 'desc' },
    include: { author: true }
  })
}

export async function getNoteById(id: string) {
  return await db.note.findUnique({
    where: { id },
    include: { author: true }
  })
}

export async function deleteNoteAction(noteId: string) {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) throw new Error("Unauthorized");

  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note || note.authorId !== userId) {
    throw new Error("Unauthorized to delete this note");
  }

  await db.note.delete({ where: { id: noteId } });
  revalidatePath("/dashboard");
  revalidatePath("/teacher");
  redirect("/dashboard"); // Redirect after delete
}

export async function updateNoteAction(noteId: string, title: string, content: string) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;
  if (!userId) throw new Error("Unauthorized");

  const note = await db.note.findUnique({ where: { id: noteId } });
  if (!note || note.authorId !== userId) {
    throw new Error("Unauthorized to update this note");
  }

  await db.note.update({
    where: { id: noteId },
    data: { title, content }
  });

  revalidatePath(`/dashboard/notes/${noteId}`);
  revalidatePath("/dashboard");
}

export async function getCurrentUser() {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) return null;
  return await db.user.findUnique({ where: { id: userId } })
}
