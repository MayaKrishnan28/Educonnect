"use server"

import { db } from "@/lib/db"
import { ObjectId } from "mongodb"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

async function getUserId() {
    const session = await getSession()
    return session?.userId
}

function genId() {
    return new ObjectId().toHexString()
}

async function findById(collName: string, id: string) {
    const col = db.collection(collName)
    let doc = await col.findOne({ id } as any)
    if (doc) return doc
    try {
        const objId = new ObjectId(id)
        return await col.findOne({ _id: objId } as any)
    } catch (e) {
        return null
    }
}

function toISO(d: any) {
    return d ? new Date(d) : null
}

// --- CLASS/COURSE MANAGEMENT ---

export async function createClassAction(name: string, description: string, subjectCode: string, staffDisplayName: string) {
    const session = await getSession()
    const userId = session?.userId
    if (!userId) throw new Error("Unauthorized")

    // Verify Staff Role
    const user = await findById('user', userId) as any
    if (user?.role !== "STAFF" && user?.role !== "ADMIN") {
        return { success: false, error: "Only staff can create classes" }
    }

    // Generate unique 6-char code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    try {
        const newCourse = {
            id: genId(),
            name,
            description,
            subjectCode,
            staffDisplayName,
            code,
            staffId: userId,
            createdAt: new Date()
        }
        await db.collection('course').insertOne(newCourse as any)
        revalidatePath("/dashboard/classes")
        return JSON.parse(JSON.stringify({ success: true, class: newCourse }))
    } catch (error) {
        console.error("Create Course Error:", error)
        return { success: false, error: "Failed to create class" }
    }
}

export async function joinClassAction(code: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    // BLOCK STAFF FROM JOINING CLASSES
    const user = await findById('user', userId) as any
    if (user?.role === "STAFF") {
        return { success: false, error: "Staff accounts cannot join classes as students." }
    }

    try {
        const targetCourse = await db.collection('course').findOne({ code })

        if (!targetCourse) return { success: false, error: "Invalid Class Code" }

        const actualCourseId = targetCourse.id || targetCourse._id.toString()

        // Check if already enrolled
        const existing = await db.collection('enrollment').findOne({ userId, courseId: actualCourseId })
        if (existing) return { success: false, error: "Already joined this class" }

        // Prevent staff from joining own class
        if (targetCourse.staffId === userId) return { success: false, error: "You are the staff of this class" }

        await db.collection('enrollment').insertOne({ id: genId(), userId, courseId: actualCourseId, joinedAt: new Date() })

        revalidatePath("/dashboard/classes")
        return { success: true, classId: actualCourseId }
    } catch (error) {
        console.error("Join Course Error:", error)
        return { success: false, error: "Failed to join class" }
    }
}

export async function getUserClassesAction() {
    const userId = await getUserId()
    if (!userId) return { teaching: [], enrolled: [] }

    const teaching = await db.collection('course').find({ staffId: userId }).sort({ createdAt: -1 }).toArray()
    const enrollments = await db.collection('enrollment').find({ userId }).sort({ joinedAt: -1 }).toArray()
    const enrolled = await Promise.all(enrollments.map(async (e: any) => {
        const course = await findById('course', e.courseId)
        return course
    }))
    return JSON.parse(JSON.stringify({ teaching, enrolled }))
}

// --- ASSIGNMENT MANAGEMENT ---

export async function createAssignmentAction(courseId: string, title: string, description: string, points: number, dueDate: Date | null) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    // Check staff permission
    const course = await findById('course', courseId) as any
    if (!course || (course.staffId !== userId && course.staffId?.toString() !== userId)) return { success: false, error: "Unauthorized" }

    try {
        await db.collection('assignment').insertOne({ id: genId(), title, description, points, dueDate: toISO(dueDate), courseId, createdAt: new Date() })
        revalidatePath(`/dashboard/classes/${course.code}`)
        return { success: true }
    } catch (error) {
        console.error("Create Assignment Error:", error)
        return { success: false, error: "Failed to create assignment" }
    }
}

// --- QUIZ MANAGEMENT ---

export interface QuestionInput {
    text: string
    type: string
    options: string[]
    correctOption: number
    explanation: string
}

export async function createQuizAction(courseId: string, title: string, topic: string, questions: QuestionInput[], youtubeLink?: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    // Check staff permission
    const course = await findById('course', courseId) as any
    if (!course || (course.staffId !== userId && course.staffId?.toString() !== userId)) return { success: false, error: "Unauthorized" }

    let youtubeId = null;
    if (youtubeLink) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = youtubeLink.match(regExp);
        if (match && match[2].length === 11) {
            youtubeId = match[2];
        }
    }

    try {
        await db.collection('quiz').insertOne({
            id: genId(),
            title,
            topic,
            courseId,
            isAI: true,
            youtubeId,
            questions: questions.map(q => ({
                id: genId(),
                text: q.text,
                type: q.type,
                options: JSON.stringify(q.options),
                correctOption: q.correctOption,
                explanation: q.explanation
            })),
            createdAt: new Date()
        })
        revalidatePath(`/dashboard/classes/${course.code}`)
        return { success: true }
    } catch (error) {
        console.error("Create Quiz Error:", error)
        return { success: false, error: "Failed to create quiz" }
    }
}

export async function submitQuizAttemptAction(quizId: string, score: number) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    try {
        await db.collection('attempt').insertOne({ id: genId(), quizId, studentId: userId, score, completedAt: new Date() })
        revalidatePath(`/dashboard/quiz/${quizId}`)
        return { success: true }
    } catch (error) {
        console.error("Submit Quiz Error:", error)
        return { success: false, error: "Failed to submit quiz" }
    }
}

// Expose AI generation to client via server action
import { generateQuizQuestions } from "@/lib/ai"

export async function generateQuizAction(topic: string, count: number, difficulty: string) {
    const jsonStr = await generateQuizQuestions(topic, count, difficulty)
    console.log("AI Quiz Gen Response:", jsonStr)

    // Handle known error messages from lib/ai.ts
    if (jsonStr.startsWith("AI ") || jsonStr.startsWith("Error") || jsonStr.startsWith("No response")) {
        return { success: false, error: jsonStr }
    }

    try {
        const questions = JSON.parse(jsonStr)
        return { success: true, questions }
    } catch (e) {
        console.error("Quiz Parse Error:", e)
        return { success: false, error: "Failed to parse AI response. Please try again." }
    }
}

// --- CLASS NOTE MANAGEMENT ---

export async function createClassNoteAction(formData: FormData) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    const courseId = formData.get("courseId") as string
    const title = formData.get("title") as string || "Untitled"
    const content = formData.get("content") as string || ""
    const file = formData.get("file") as File

    const course = await findById('course', courseId) as any
    if (!course) return { success: false, error: "Course not found" }

    // Authorization Check
    if (course.staffId !== userId && course.staffId?.toString() !== userId) return { success: false, error: "Only staffs can upload notes" }

    const youtubeLink = formData.get("youtubeLink") as string
    let youtubeId = null
    let legacyFileType = null

    // Logic 1: Check YouTube Link
    if (youtubeLink) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = youtubeLink.match(regExp);
        if (match && match[2].length === 11) {
            youtubeId = match[2];
            legacyFileType = "YOUTUBE"
        }
    }

    const files = formData.getAll("file") as File[]
    const fileUrls: string[] = []
    const fileTypes: string[] = []

    for (const file of files) {
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

                const url = `/uploads/${fileName}`
                fileUrls.push(url)

                let type = "FILE"
                if (file.type.includes("pdf")) type = "PDF"
                else if (file.type.includes("image")) type = "IMAGE"
                else if (file.type.includes("word") || file.name.endsWith(".docx")) type = "DOCX"
                else if (file.type.includes("video") || file.name.endsWith(".mp4") || file.name.endsWith(".webm") || file.name.endsWith(".mov")) type = "VIDEO"
                fileTypes.push(type)
            } catch (err) {
                console.error("Upload error:", err)
            }
        }
    }

    // Legacy support for single values if needed by UI
    const singleFileUrl = fileUrls[0] || null
    let singleFileType = fileTypes[0] || (youtubeId ? "YOUTUBE" : legacyFileType || null)

    let aiSummary = "No summary available."
    try {
        const { generateSummary } = await import("@/lib/ai")
        // If content is empty but file exists, try to be smart? For now just use title.
        const summaryText = content.length > 10 ? content : `Attached files: ${fileUrls.length} resources`
        aiSummary = await generateSummary(`${title}\n\n${summaryText}`)
    } catch (aiError) {
        console.error("AI Summary Generation Failed (Non-fatal):", aiError)
        // Continue creating note without summary
    }

    try {
        await db.collection('note').insertOne({
            id: genId(),
            title,
            content,
            subject: course.name,
            summary: aiSummary,
            authorId: userId,
            courseId: courseId,
            fileUrl: singleFileUrl,
            fileType: singleFileType,
            multiFileUrls: fileUrls,
            multiFileTypes: fileTypes,
            youtubeId,
            createdAt: new Date()
        })

        revalidatePath(`/dashboard/classes/${course.code}`)
        return { success: true }
    } catch (error) {
        console.error("Create Class Note Error:", error)
        return { success: false, error: "Failed to create note" }
    }
}

// --- DELETE & EDIT ACTIONS ---

export async function deleteAssignmentAction(id: string, courseId: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    const course = await findById('course', courseId) as any
    if (!course || (course.staffId !== userId && course.staffId?.toString() !== userId)) return { success: false, error: "Unauthorized" }

    try {
        await db.collection('assignment').deleteOne({ id })
        revalidatePath(`/dashboard/classes/${course.code}`)
        return { success: true }
    } catch (error) {
        console.error("Delete Assignment Error:", error)
        return { success: false, error: "Failed to delete assignment" }
    }
}

export async function deleteQuizAction(id: string, courseId: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    const course = await findById('course', courseId) as any
    if (!course || (course.staffId !== userId && course.staffId?.toString() !== userId)) return { success: false, error: "Unauthorized" }

    try {
        await db.collection('quiz').deleteOne({ id })
        revalidatePath(`/dashboard/classes/${course.code}`)
        return { success: true }
    } catch (error) {
        console.error("Delete Quiz Error:", error)
        return { success: false, error: "Failed to delete quiz" }
    }
}

export async function deleteClassNoteAction(id: string, courseId: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    const course = await findById('course', courseId) as any
    if (!course || (course.staffId !== userId && course.staffId?.toString() !== userId)) return { success: false, error: "Unauthorized" }

    try {
        let note = await db.collection('note').findOne({ id })
        if (!note) {
            try {
                note = await db.collection('note').findOne({ _id: new ObjectId(id) })
            } catch (e) { }
        }
        if (!note) return { success: false, error: "Note not found" }
        // Attempt to delete file if exists
        if (note?.fileUrl) {
            try {
                const fs = await import("fs")
                // fileUrl is like /uploads/filename.ext
                const filePath = `./public${note.fileUrl}`
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath)
                }
            } catch (e) {
                console.error("Failed to delete file:", e)
            }
        }

        await db.collection('note').deleteOne({ id })
        revalidatePath(`/dashboard/classes/${course.code}`)
        return { success: true }
    } catch (error) {
        console.error("Delete Note Error:", error)
        return { success: false, error: "Failed to delete note" }
    }
}

export async function updateClassNoteAction(formData: FormData) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    const noteId = formData.get("noteId") as string
    const courseId = formData.get("courseId") as string
    const title = formData.get("title") as string
    const content = formData.get("content") as string
    const file = formData.get("file") as File | null

    const course = await findById('course', courseId) as any
    if (!course || (course.staffId !== userId && course.staffId?.toString() !== userId)) return { success: false, error: "Unauthorized" }

    try {
        let existingNote = await db.collection('note').findOne({ id: noteId })
        if (!existingNote) {
            try {
                existingNote = await db.collection('note').findOne({ _id: new ObjectId(noteId) })
            } catch (e) { }
        }
        if (!existingNote) return { success: false, error: "Note not found" }

        let fileUrl = existingNote.fileUrl
        let fileType = existingNote.fileType

        // Handle File Replacement
        if (file && file.size > 0) {
            // Delete old file
            if (existingNote.fileUrl) {
                try {
                    const fs = await import("fs")
                    const oldPath = `./public${existingNote.fileUrl}`
                    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath)
                } catch (e) { console.error("Error deleting old file:", e) }
            }

            // Upload new file
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
            const uploadDir = "./public/uploads"
            const filePath = `${uploadDir}/${fileName}`

            const fs = await import("fs")
            if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
            fs.writeFileSync(filePath, buffer)

            fileUrl = `/uploads/${fileName}`

            if (file.type.includes("pdf")) fileType = "PDF"
            else if (file.type.includes("image")) fileType = "IMAGE"
            else if (file.type.includes("word") || file.name.endsWith(".docx")) fileType = "DOCX"
            else fileType = "FILE"
        }

        const youtubeLink = formData.get("youtubeLink") as string
        let youtubeId = existingNote.youtubeId

        if (youtubeLink) {
            const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
            const match = youtubeLink.match(regExp);
            if (match && match[2].length === 11) {
                youtubeId = match[2];
                fileType = "YOUTUBE"
            }
        }

        let aiSummary = existingNote.summary
        if (content !== existingNote.content || (file && file.name !== existingNote.title) || youtubeLink) {
            const { generateSummary } = await import("@/lib/ai")
            const summaryText = content.length > 10 ? content : `Reference Video: ${youtubeLink || 'No content'}`
            aiSummary = await generateSummary(`${title}\n\n${summaryText}`)
        }

        await db.collection('note').updateOne({ id: noteId }, {
            $set: {
                title,
                content,
                fileUrl,
                fileType,
                youtubeId,
                summary: aiSummary
            }
        })

        revalidatePath(`/dashboard/classes/${course.code}`)
        return { success: true }
    } catch (error) {
        console.error("Update Note Error:", error)
        return { success: false, error: "Failed to update note" }
    }
}

export async function updateClassDetailsAction(formData: FormData) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    const courseId = formData.get("courseId") as string
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    const course = await findById('course', courseId) as any
    if (!course || (course.staffId !== userId && course.staffId?.toString() !== userId)) return { success: false, error: "Unauthorized" }

    try {
        await db.collection('course').updateOne({ id: courseId }, { $set: { name, description } })

        revalidatePath(`/dashboard/classes/${course.code}`)
        return { success: true }
    } catch (error) {
        console.error("Update Class Error:", error)
        return { success: false, error: "Failed to update class details" }
    }
}

// --- RESULT ANALYTICS ---

export async function getQuizResultsAction(quizId: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    try {
        let quiz = await db.collection('quiz').findOne({ id: quizId }) as any

        // Fallback: try finding by _id if id not found (for legacy quizzes)
        if (!quiz) {
            try {
                const { ObjectId } = await import("mongodb")
                quiz = await db.collection('quiz').findOne({ _id: new ObjectId(quizId) }) as any
                if (quiz) quiz.id = quiz._id.toString() // Ensure id property exists
            } catch (e) { }
        }

        if (!quiz) return { success: false, error: "Quiz not found" }
        const course = await findById('course', quiz.courseId) as any
        if (course?.staffId !== userId && course?.staffId?.toString() !== userId) {
            return { success: false, error: "Only the class staff can view full results" }
        }

        const attempts = await db.collection('attempt').find({ quizId }).sort({ score: -1 }).toArray()
        const attemptsWithStudent = await Promise.all(attempts.map(async (a: any) => {
            const student = await findById('user', a.studentId)
            return { ...a, student }
        }))

        return JSON.parse(JSON.stringify({ success: true, quiz: { ...quiz, attempts: attemptsWithStudent, course } }))
    } catch (error) {
        console.error("Get Quiz Results Error:", error)
        return { success: false, error: "Failed to fetch results" }
    }
}

// --- MEMBERSHIP & SETTINGS ---

export async function deleteCourseAction(courseId: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    const course = await findById('course', courseId) as any
    if (!course || (course.staffId !== userId && course.staffId?.toString() !== userId)) return { success: false, error: "Unauthorized" }

    try {
        await db.collection('course').deleteOne({ id: courseId })
        revalidatePath("/dashboard/classes")
        return { success: true }
    } catch (error) {
        console.error("Delete Course Error:", error)
        return { success: false, error: "Failed to delete course" }
    }
}

export async function getCourseMembersAction(courseId: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    try {
        const course = await findById('course', courseId) as any
        if (!course) return { success: false, error: "Course not found" }

        const staff = await findById('user', course.staffId) as any
        const enrollments = await db.collection('enrollment').find({ courseId }).toArray()
        const isStaff = course.staffId === userId
        const isStudent = enrollments.some((e: any) => e.userId === userId)

        if (!isStaff && !isStudent) {
            return { success: false, error: "Access Denied" }
        }

        const members = [
            { ...staff, isStaff: true },
            ...(await Promise.all(enrollments.map(async (e: any) => {
                const u = await findById('user', e.userId)
                return { ...u, isStaff: false }
            })))
        ]

        return JSON.parse(JSON.stringify({ success: true, members }))
    } catch (error) {
        console.error("Get Members Error:", error)
        return { success: false, error: "Failed to fetch members" }
    }
}

// --- ASSIGNMENT SUBMISSION ---

export async function getAssignmentDetailsAction(assignmentId: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    try {
        const assignment = await db.collection('assignment').findOne({ id: assignmentId }) as any
        if (!assignment) return { success: false, error: "Assignment not found" }

        const course = await findById('course', assignment.courseId) as any

        let staff = null;
        if (course && course.staffId) {
            staff = await findById('user', course.staffId);
        }
        if (course) {
            course.staff = staff;
        }

        const submissions = await db.collection('submission').find({ assignmentId, studentId: userId }).limit(1).toArray()
        const isStaff = course?.staffId === userId

        return JSON.parse(JSON.stringify({
            success: true,
            assignment: { ...assignment, course },
            submission: submissions[0] || null,
            isStaff
        }))
    } catch (error) {
        console.error("Get Assignment Details Error:", error)
        return { success: false, error: "Failed to fetch assignment details" }
    }
}

export async function submitAssignmentAction(formData: FormData) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    const assignmentId = formData.get("assignmentId") as string
    const content = formData.get("content") as string || ""
    const file = formData.get("file") as File | null
    const isMarkAsDone = formData.get("isMarkAsDone") === "true"

    try {
        const assignment = await db.collection('assignment').findOne({ id: assignmentId }) as any
        if (!assignment) return { success: false, error: "Assignment not found" }

        // Strict Due Date Enforcement
        if (assignment.dueDate && new Date() > new Date(assignment.dueDate)) {
            return { success: false, error: "Turn-in failed: The due date has passed." }
        }

        let fileUrl = null

        // Handle File Upload
        if (file && file.size > 0) {
            try {
                const arrayBuffer = await file.arrayBuffer()
                const buffer = Buffer.from(arrayBuffer)
                const fileName = `${Date.now()}-SUBMISSION-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
                const uploadDir = "./public/uploads"
                const filePath = `${uploadDir}/${fileName}`

                const fs = await import("fs")
                if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
                fs.writeFileSync(filePath, buffer)
                fileUrl = `/uploads/${fileName}`
            } catch (err) {
                console.error("Submission Upload Error:", err)
                return { success: false, error: "File upload failed" }
            }
        } else if (!content && !isMarkAsDone) {
            // If not marking as done, and no file/content, error?
            // Actually, the UI might allow "Mark as Done" with no content.
            // If isMarkAsDone is false, and no content/file, we should probably warn, but let's handle it in UI.
        }

        // Create or Update Submission
        const existing = await db.collection('submission').findOne({ assignmentId, studentId: userId })

        if (existing) {
            await db.collection('submission').updateOne({ id: existing.id }, { $set: { content: content || existing.content, fileUrl: fileUrl || existing.fileUrl, submittedAt: new Date() } })
        } else {
            await db.collection('submission').insertOne({ id: genId(), assignmentId, studentId: userId, content, fileUrl, submittedAt: new Date() })
        }

        const course = await findById('course', assignment.courseId) as any
        if (course) {
            revalidatePath(`/dashboard/classes/${course.code}/assignments/${assignmentId}`)
        }

        return { success: true }

    } catch (error) {
        console.error("Submit Assignment Error:", error)
        return { success: false, error: "Failed to submit assignment" }
    }
}

export async function getStudentTodoItemsAction() {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    try {
        // 1. Get Enrolled Courses
        const enrollments = await db.collection('enrollment').find({ userId }).toArray()
        const courseIds = enrollments.map((e: any) => e.courseId)

        console.log("DEBUG TODO: UserId:", userId)
        console.log("DEBUG TODO: Enrolled Course IDs:", courseIds)

        if (courseIds.length === 0) return { success: true, items: [] }

        // 2. Fetch Assignments & Quizzes from these courses
        // Try exact match first
        let assignments = await db.collection('assignment').find({ courseId: { $in: courseIds } }).toArray()

        // If no assignments found, try looking for ObjectId mismatches if courseIds are strings
        if (assignments.length === 0) {
            console.log("DEBUG TODO: No assignments found with exact ID match, checking types...")
            // This is just for debugging, in production we should ensure consistency
        }

        console.log("DEBUG TODO: Found Assignments:", assignments.length)

        const quizzes = await db.collection('quiz').find({ courseId: { $in: courseIds } }).toArray()
        const courses = await db.collection('course').find({ id: { $in: courseIds } }).toArray()
        const courseMap = courses.reduce((acc: any, c: any) => {
            acc[c.id] = c;
            // Also map objects to handle different ID formats if necessary
            if (c._id) acc[c._id.toString()] = c;
            return acc;
        }, {})

        // 3. Fetch Submissions (Assignments) & Attempts (Quizzes) for this user
        const assignmentIds = assignments.map((a: any) => a.id)
        const quizIds = quizzes.map((q: any) => q.id)

        const submissions = await db.collection('submission').find({ studentId: userId, assignmentId: { $in: assignmentIds } }).toArray()
        const attempts = await db.collection('attempt').find({ studentId: userId, quizId: { $in: quizIds } }).toArray()

        const submissionMap = submissions.reduce((acc: any, s: any) => { acc[s.assignmentId] = s; return acc }, {})
        const attemptMap = attempts.reduce((acc: any, a: any) => { acc[a.quizId] = a; return acc }, {})

        // 4. Transform & Merge Data
        const todoItems = [
            ...assignments.map((a: any) => {
                const submission = submissionMap[a.id];
                return {
                    id: a.id,
                    type: 'assignment',
                    title: a.title,
                    courseId: a.courseId,
                    courseName: courseMap[a.courseId]?.name || "Unknown Class",
                    courseCode: courseMap[a.courseId]?.code || "",
                    createdAt: a.createdAt,
                    dueDate: a.dueDate,
                    isDone: !!submission,
                    // "Missing" logic: Not Done AND Due Date Passed
                    isMissing: !submission && a.dueDate && new Date() > new Date(a.dueDate),
                    submittedAt: submission?.submittedAt
                }
            }),
            ...quizzes.map((q: any) => {
                const attempt = attemptMap[q.id];
                return {
                    id: q.id,
                    type: 'quiz',
                    title: q.title,
                    courseId: q.courseId,
                    courseName: courseMap[q.courseId]?.name || "Unknown Class",
                    courseCode: courseMap[q.courseId]?.code || "",
                    createdAt: q.createdAt,
                    isDone: !!attempt,
                    isMissing: false, // Quizzes usually don't have hard "missing" state in this simple system unless user adds due dates
                    submittedAt: attempt?.completedAt
                }
            })
        ]

        // Sort by date (newest first)
        todoItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

        return JSON.parse(JSON.stringify({ success: true, items: todoItems }))

    } catch (error) {
        console.error("Get Todo Error:", error)
    }
}

export async function getStaffAlertsAction() {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    try {
        // 1. Get Staff's Courses
        const courses = await db.collection('course').find({ staffId: userId }).toArray()
        const courseIds = courses.map((c: any) => c.id || c._id.toString())

        if (courseIds.length === 0) return { success: true, alerts: [] }

        // 2. Get Enrolled Students for these courses
        const enrollments = await db.collection('enrollment').find({ courseId: { $in: courseIds } }).toArray()
        const studentIds = [...new Set(enrollments.map((e: any) => e.userId))]

        if (studentIds.length === 0) return { success: true, alerts: [] }

        const students = await db.collection('user').find({ _id: { $in: studentIds.map((id: string) => new ObjectId(id)) } }).toArray()
        const studentMap = students.reduce((acc: any, s: any) => { acc[s._id.toString()] = s; return acc }, {})

        // 3. Get Assignments & Quizzes
        const assignments = await db.collection('assignment').find({ courseId: { $in: courseIds } }).toArray()
        const quizzes = await db.collection('quiz').find({ courseId: { $in: courseIds } }).toArray()

        // 4. Get Submissions & Attempts
        const submissions = await db.collection('submission').find({ assignmentId: { $in: assignments.map((a: any) => a.id) } }).toArray()
        const attempts = await db.collection('attempt').find({ quizId: { $in: quizzes.map((q: any) => q.id) } }).toArray()

        // 5. Generate Alerts
        const alerts: any[] = []

        // Helper to check if work is done
        const isAssignmentDone = (studentId: string, assignmentId: string) =>
            submissions.some((s: any) => s.studentId === studentId && s.assignmentId === assignmentId)

        const isQuizDone = (studentId: string, quizId: string) =>
            attempts.some((a: any) => a.studentId === studentId && a.quizId === quizId)

        // Iterate through enrollments to check each student against course work
        for (const enroll of enrollments) {
            const student = studentMap[enroll.userId]
            if (!student) continue

            // Check Assignments for this course
            const courseAssignments = assignments.filter((a: any) => a.courseId === enroll.courseId)
            for (const assign of courseAssignments) {
                if (!isAssignmentDone(enroll.userId, assign.id)) {
                    // Only alert if Due Date passed
                    if (assign.dueDate && new Date() > new Date(assign.dueDate)) {
                        alerts.push({
                            type: 'MISSING_ASSIGNMENT',
                            studentName: student.name,
                            workTitle: assign.title,
                            courseName: courses.find((c: any) => (c.id || c._id.toString()) === enroll.courseId)?.name,
                            date: assign.dueDate
                        })
                    }
                }
            }

            // Check Quizzes
            const courseQuizzes = quizzes.filter((q: any) => q.courseId === enroll.courseId)
            for (const quiz of courseQuizzes) {
                if (!isQuizDone(enroll.userId, quiz.id)) {
                    alerts.push({
                        type: 'PENDING_QUIZ',
                        studentName: student.name,
                        workTitle: quiz.title,
                        courseName: courses.find((c: any) => (c.id || c._id.toString()) === enroll.courseId)?.name,
                        date: quiz.createdAt
                    })
                }
            }
        }

        // Limit to 20 recent alerts
        return { success: true, alerts: alerts.slice(0, 20) }

    } catch (error) {
        console.error("Get Staff Alerts Error:", error)
        return { success: false, error: "Failed to fetch alerts" }
    }
}
