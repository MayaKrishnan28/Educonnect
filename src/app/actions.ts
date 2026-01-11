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
import { ObjectId } from "mongodb"


export async function checkSessionAction() {
  const session = await getSession()
  return !!session
}

export async function checkEmailAction(email: string) {
  if (!db) return { success: false, error: "Database error" }
  const user = await db.collection("user").findOne({ email })
  // If user exits and has a password, they are an existing user
  return { success: true, exists: !!(user && user.password) }
}

export async function loginWithPasswordAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const role = formData.get("role") as string

  if (!email || !password) return { success: false, error: "Missing fields" }

  const user = await db.collection("user").findOne({ email })
  if (!user) return { success: false, error: "User not found" }

  if (user.password !== password) {
    return { success: false, error: "Invalid password" }
  }

  // Role check
  if (user.role !== role) {
    return { success: false, error: `Unauthorized role. You are a ${user.role}.` }
  }

  // Set session
  const cookieStore = await cookies()
  const sessionToken = await encrypt({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name
  })

  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  if (user.role === 'STAFF') {
    redirect("/staff")
  } else {
    redirect("/dashboard")
  }
}

export async function sendOtpAction(email: string, role: string, name?: string) {
  console.log(`[DEBUG] sendOtpAction called for: ${email}, role: ${role}`);

  if (!db) {
    console.error("[ERROR] Database object is not initialized!");
    return { success: false, error: "Database error. Please try again." }
  }

  // 1. Check if user exists, if not, create them (Registration)
  let user = await db.collection("user").findOne({ email })
  console.log(`[DEBUG] Database lookup result for ${email}:`, user ? "User Found" : "User Not Found");

  if (!user) {
    console.log(`[DEBUG] Registering new ${role}: ${email}`);
    const newUser = {
      email,
      role,
      name: name || email.split('@')[0], // Use provided name or default
      isVerified: false,
      createdAt: new Date(),
      otpSendCount: 0,
      otpAttempts: 0
    }
    await db.collection("user").insertOne(newUser)
    user = await db.collection("user").findOne({ email })
  }

  // Final check to satisfy TypeScript
  if (!user) {
    return { success: false, error: "System error: Could not verify account." }
  }

  // 1b. Strict Role Enforcement
  if (user && user.role !== role) {
    console.log(`[DEBUG] Role mismatch for ${email}. Expected: ${user.role}, Attempted: ${role}`);
    return {
      success: false,
      error: `This account is registered as a ${user.role}. Please select the correct role to login.`
    }
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
  await db.collection("user").updateOne(
    { email: user.email },
    {
      $set: {
        otpHash,
        otpExpiresAt: expiresAt,
        otpLastSentAt: now,
        otpSendCount: currentCount + 1,
        otpResetAt: user.otpResetAt && user.otpResetAt > now ? user.otpResetAt : new Date(now.getTime() + 10 * 60 * 1000),
        otpAttempts: 0
      }
    }
  )

  // 5. Send Email
  console.log(`\n🔐 SECURE OTP for ${email}: ${code}\n`)

  // DEVELOPER BYPASS: If SMTP fails or for specific dev email, allow a fixed code
  const isDevEmail = email === "22cs116@nandhaengg.org";
  if (isDevEmail) {
    const devCode = "123456";
    const devHash = createHash("sha256").update(devCode).digest("hex");
    await db.collection("user").updateOne(
      { email },
      { $set: { otpHash: devHash } }
    );
    console.log(`[DEV] Bypass enabled for ${email}. Use code: ${devCode}`);
  }

  const emailHtml = `
    <div style="font-family: sans-serif; padding: 30px; color: #333; border: 1px solid #e2e8f0; border-radius: 12px; max-width: 600px; margin: auto;">
      <h2 style="color: #6366f1; text-align: center;">EduConnect Secure Login</h2>
      <p style="text-align: center; color: #64748b;">Use the code below to verify your identity and set up your account.</p>
      
      <div style="background-color: #f8fafc; padding: 25px; border-radius: 12px; text-align: center; margin: 25px 0; border: 1px dashed #cbd5e1;">
        <div style="font-size: 42px; font-weight: 800; letter-spacing: 10px; color: #1e293b; font-family: monospace;">${code}</div>
        <p style="margin-top: 10px; font-size: 14px; color: #94a3b8;">This code will expire in 5 minutes</p>
      </div>

      <p style="font-size: 12px; color: #94a3b8; text-align: center; line-height: 1.5;">
        This is an automated message. If you didn't request a login code, please secure your account.
      </p>
    </div>
  `

  // 6. Send Email
  console.log(`[DEBUG] Attempting to send OTP email to ${email}...`);
  try {
    const emailSent = await sendEmail(email, "EduConnect Verification Code", emailHtml)
    if (!emailSent && !isDevEmail) {
      console.error(`[ERROR] Failed to send email to ${email}`);
      return { success: false, error: "Failed to send OTP email. Please try again later." }
    }
  } catch (err) {
    console.error(`[CRITICAL] SMTP Error:`, err);
    if (!isDevEmail) {
      return { success: false, error: "Email service unavailable. Please contact support." }
    }
  }

  console.log(`[DEBUG] OTP flow complete for ${email}`);
  return { success: true }
}

export async function verifyOtpAction(formData: FormData) {
  const email = formData.get("email") as string
  const code = formData.get("code") as string
  const password = formData.get("password") as string
  const isSettingPassword = formData.has("password")

  if (!email || !code) return { success: false, error: "Missing required fields" }

  const user = await db.collection("user").findOne({ email })
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
      await db.collection("user").updateOne(
        { email: user.email },
        {
          $set: {
            otpAttempts: newAttempts,
            lockedUntil: new Date(now.getTime() + 10 * 60 * 1000) // Lock for 10 mins
          }
        }
      )
      return { success: false, error: "Invalid OTP. Account locked for 10 minutes." }
    } else {
      await db.collection("user").updateOne(
        { email: user.email },
        { $set: { otpAttempts: newAttempts } }
      )
      return { success: false, error: `Invalid OTP. ${3 - newAttempts} attempts remaining.` }
    }
  }

  // 4. If we are setting a password, we need to check if it's provided
  if (!isSettingPassword) {
    // If we just verified OTP but didn't provide password yet,
    // tell the client it was successful so they can show password fields
    return { success: true, needsPassword: true }
  }

  if (!password || password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" }
  }

  // 5. Success! Clear OTP fields and set password
  await db.collection("user").updateOne(
    { email: user.email },
    {
      $set: {
        password: password, // Store plain text as per user request (though hashing is standard)
        otpHash: null,
        otpExpiresAt: null,
        otpAttempts: 0,
        isVerified: true
      }
    }
  )

  // 6. Create Session
  const cookieStore = await cookies()
  const sessionToken = await encrypt({
    userId: user._id.toString(),
    role: user.role,
    email: user.email,
    name: user.name
  })

  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  })

  // 7. Redirect
  if (user.role === 'STAFF') {
    redirect("/staff")
  } else {
    redirect("/dashboard")
  }
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

  await db.collection("user").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { name } }
  )

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/settings")
}

// --- Course Actions ---
export async function createCourseAction(formData: FormData) {
  const name = formData.get("name") as string
  const section = formData.get("section") as string
  const description = formData.get("description") as string

  const session = await getSession();
  const userId = session?.userId;

  if (!userId || session.role !== "STAFF") {
    throw new Error("Unauthorized: Only staff can create courses");
  }

  // Generate a unique 6-character code
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();

  const courseId = new ObjectId().toHexString();

  await db.collection("course").insertOne({
    id: courseId,
    name,
    section,
    description,
    code,
    staffId: userId,
    createdAt: new Date(),
  })

  revalidatePath("/staff")
  revalidatePath("/dashboard")
  revalidatePath("/dashboard/classes")
}

export async function getStaffCourses() {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) return [];

  const courses = await db.collection("course").find({ staffId: userId }).sort({ createdAt: -1 }).toArray();
  return JSON.parse(JSON.stringify(courses.map(c => ({ ...c, id: c._id.toString() }))));
}

// --- Note Actions ---
export async function createNoteAction(formData: FormData) {
  const title = formData.get("title") as string
  const content = formData.get("content") as string
  const subject = formData.get("subject") as string || "General" // Capture Subject
  const youtubeLink = formData.get("youtubeLink") as string
  const file = formData.get("file") as File | null

  const session = await getSession();
  const userId = session?.userId;

  if (!userId) throw new Error("Unauthorized");

  // Call Real AI
  const aiSummary = await generateSummary(`${title}\n\n${content}`);

  let youtubeId = null;
  if (youtubeLink) {
    // Basic regex for YouTube ID extraction
    const match = youtubeLink.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([^&]+)/);
    if (match) youtubeId = match[1];
  }

  let fileUrl = null;
  let fileType = null;

  if (file && file.size > 0) {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
      const uploadDir = "./public/uploads"
      const filePath = `${uploadDir}/${fileName}`

      const fs = await import("fs")
      if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
      fs.writeFileSync(filePath, buffer)
      fileUrl = `/uploads/${fileName}`
      fileType = file.type || "unknown"
    } catch (err) {
      console.error("Note File Upload Error:", err)
      // Continue without file if fail? Or throw?
    }
  }

  const noteId = new ObjectId().toHexString();

  await db.collection("note").insertOne({
    id: noteId,
    title,
    content,
    subject, // Save Subject
    summary: aiSummary,
    authorId: userId,
    youtubeId,
    fileUrl,
    fileType,
    createdAt: new Date(),
    updatedAt: new Date()
  })

  revalidatePath("/staff")
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

  const notes = await db.collection("note").find({
    $or: [
      { authorId: userId },
      { "course.enrollments.userId": userId } // Note: MongoDB pathing depends on how course is stored
    ]
  }).sort({ createdAt: -1 }).toArray();

  return JSON.parse(JSON.stringify(notes.map(n => ({ ...n, id: n._id.toString() }))));
}

export async function getSubjects() {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) return [];

  const notes = await db.collection("note").find({
    $or: [
      { authorId: userId },
      { "course.enrollments.userId": userId }
    ]
  }, {
    projection: { subject: true }
  }).toArray();

  const subjectCounts: Record<string, number> = {};
  notes.forEach(n => {
    const subjectName = n.subject || "General";
    subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
  });

  return Object.entries(subjectCounts).map(([name, count]) => ({ name, count }));
}

export async function getNotesBySubject(subject: string) {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) return [];

  const notes = await db.collection("note").find({
    subject,
    $or: [
      { authorId: userId },
      { "course.enrollments.userId": userId }
    ]
  }).sort({ createdAt: -1 }).toArray();

  return JSON.parse(JSON.stringify(notes.map(n => ({ ...n, id: n._id.toString() }))));
}

export async function getNoteById(id: string) {
  try {
    const note = await db.collection("note").findOne({ _id: new ObjectId(id) });
    if (!note) return null;
    return JSON.parse(JSON.stringify({ ...note, id: note._id.toString() }));
  } catch (e) {
    return null;
  }
}

export async function deleteNoteAction(noteId: string) {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) throw new Error("Unauthorized");

  // Support both custom 'id' field and MongoDB '_id'
  let note = await db.collection("note").findOne({ id: noteId });
  if (!note) {
    try {
      note = await db.collection("note").findOne({ _id: new ObjectId(noteId) });
    } catch (e) { }
  }

  if (!note || note.authorId !== userId) {
    throw new Error("Unauthorized to delete this note");
  }

  await db.collection("note").deleteOne({ _id: note._id });
  revalidatePath("/dashboard");
  revalidatePath("/staff");
  if (session.role === 'STAFF') {
    redirect("/staff")
  } else {
    redirect("/dashboard")
  }
}

export async function updateNoteAction(noteId: string, title: string, content: string) {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) throw new Error("Unauthorized");

  let note = await db.collection("note").findOne({ id: noteId });
  if (!note) {
    try {
      note = await db.collection("note").findOne({ _id: new ObjectId(noteId) });
    } catch (e) { }
  }

  if (!note || note.authorId !== userId) {
    throw new Error("Unauthorized to update this note");
  }

  await db.collection("note").updateOne(
    { _id: note._id },
    { $set: { title, content, updatedAt: new Date() } }
  );

  revalidatePath(`/dashboard/notes/${noteId}`);
  revalidatePath("/dashboard");
}

export async function getCurrentUser() {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) return null;
  try {
    const user = await db.collection("user").findOne({ _id: new ObjectId(userId) })
    if (!user) return null;

    // Sanitize for Client Components (Serializing ObjectIDs and Dates)
    return JSON.parse(JSON.stringify(user));
  } catch (e) {
    return null;
  }
}

export async function switchRoleAction() {
  const session = await getSession();
  const userId = session?.userId;
  if (!userId) return { success: false, error: "Unauthorized" };

  const user = await db.collection("user").findOne({ _id: new ObjectId(userId) });
  if (!user) return { success: false, error: "User not found" };

  const newRole = user.role === "STUDENT" ? "STAFF" : "STUDENT";

  await db.collection("user").updateOne(
    { _id: new ObjectId(userId) },
    { $set: { role: newRole } }
  );

  // Update session cookie
  const cookieStore = await cookies();
  const sessionToken = await encrypt({
    userId: user._id.toString(),
    role: newRole,
    email: user.email,
    name: user.name
  });

  cookieStore.set("session", sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  revalidatePath("/");
  return { success: true, newRole };
}
