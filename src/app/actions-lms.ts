"use server"

import { db as prisma } from "@/lib/db"
import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

async function getUserId() {
    const session = await getSession()
    return session?.userId
}

// --- CLASS/COURSE MANAGEMENT ---

export async function createClassAction(name: string, description: string) {
    const session = await getSession()
    const userId = session?.userId
    if (!userId) throw new Error("Unauthorized")

    // Verify Teacher Role
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user?.role !== "TEACHER" && user?.role !== "ADMIN") {
        return { success: false, error: "Only teachers can create classes" }
    }

    // Generate unique 6-char code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase()

    try {
        const newCourse = await prisma.course.create({
            data: {
                name,
                description,
                code,
                teacherId: userId
            }
        })
        revalidatePath("/dashboard/classes")
        return { success: true, class: newCourse }
    } catch (error) {
        console.error("Create Course Error:", error)
        return { success: false, error: "Failed to create class" }
    }
}

export async function joinClassAction(code: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    try {
        const targetCourse = await prisma.course.findUnique({
            where: { code }
        })

        if (!targetCourse) return { success: false, error: "Invalid Class Code" }

        // Check if already enrolled
        const existing = await prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: targetCourse.id
                }
            }
        })

        if (existing) return { success: false, error: "Already joined this class" }

        // Prevent teacher from joining own class
        if (targetCourse.teacherId === userId) return { success: false, error: "You are the teacher of this class" }

        await prisma.enrollment.create({
            data: {
                userId,
                courseId: targetCourse.id
            }
        })

        revalidatePath("/dashboard/classes")
        return { success: true, classId: targetCourse.id }
    } catch (error) {
        console.error("Join Course Error:", error)
        return { success: false, error: "Failed to join class" }
    }
}

export async function getUserClassesAction() {
    const userId = await getUserId()
    if (!userId) return { teaching: [], enrolled: [] }

    const teaching = await prisma.course.findMany({
        where: { teacherId: userId },
        include: { _count: { select: { enrollments: true } } },
        orderBy: { createdAt: 'desc' }
    })

    const enrolled = await prisma.enrollment.findMany({
        where: { userId },
        include: {
            course: {
                include: { teacher: { select: { name: true, email: true } } }
            }
        },
        orderBy: { joinedAt: 'desc' }
    })

    return { teaching, enrolled: enrolled.map(e => e.course) }
}

// --- ASSIGNMENT MANAGEMENT ---

export async function createAssignmentAction(courseId: string, title: string, description: string, points: number, dueDate: Date | null) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    // Check teacher permission
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== userId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.assignment.create({
            data: {
                title,
                description,
                points,
                dueDate,
                courseId
            }
        })
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

export async function createQuizAction(courseId: string, title: string, topic: string, questions: QuestionInput[]) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    // Check teacher permission
    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== userId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.quiz.create({
            data: {
                title,
                topic,
                courseId,
                isAI: true,
                questions: {
                    create: questions.map(q => ({
                        text: q.text,
                        type: q.type,
                        options: JSON.stringify(q.options), // Store as JSON string
                        correctOption: q.correctOption,
                        explanation: q.explanation
                    }))
                }
            }
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
        await prisma.attempt.create({
            data: {
                quizId,
                studentId: userId,
                score,
                completedAt: new Date()
            }
        })
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
    try {
        const questions = JSON.parse(jsonStr)
        return { success: true, questions }
    } catch (e) {
        return { success: false, error: "Failed to parse AI response" }
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

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course) return { success: false, error: "Course not found" }

    // Authorization Check
    if (course.teacherId !== userId) return { success: false, error: "Only teachers can upload notes" }

    let fileUrl = null
    let fileType = null

    const youtubeLink = formData.get("youtubeLink") as string
    let youtubeId = null

    // Logic 1: Check YouTube Link
    if (youtubeLink) {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = youtubeLink.match(regExp);
        if (match && match[2].length === 11) {
            youtubeId = match[2];
            fileType = "YOUTUBE"
        }
    }

    if (file && file.size > 0) {
        // Basic File Upload Logic (Local FS)
        try {
            const arrayBuffer = await file.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)

            // Sanitize filename
            const fileName = `${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`
            const uploadDir = "./public/uploads"
            const filePath = `${uploadDir}/${fileName}`

            const fs = await import("fs")
            // Ensure dir exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true })
            }

            fs.writeFileSync(filePath, buffer)
            fileUrl = `/uploads/${fileName}`

            // Determine type
            if (file.type.includes("pdf")) fileType = "PDF"
            else if (file.type.includes("image")) fileType = "IMAGE"
            else if (file.type.includes("word") || file.name.endsWith(".docx")) fileType = "DOCX"
            else if (file.type.includes("video")) fileType = "VIDEO"
            else fileType = "FILE"

        } catch (err) {
            console.error("Upload error:", err)
            return { success: false, error: "File upload failed" }
        }
    }

    let aiSummary = "No summary available."
    try {
        const { generateSummary } = await import("@/lib/ai")
        // If content is empty but file exists, try to be smart? For now just use title.
        const summaryText = content.length > 10 ? content : `Attached file: ${file?.name || 'No content'}`
        aiSummary = await generateSummary(`${title}\n\n${summaryText}`)
    } catch (aiError) {
        console.error("AI Summary Generation Failed (Non-fatal):", aiError)
        // Continue creating note without summary
    }

    try {
        await prisma.note.create({
            data: {
                title,
                content,
                subject: course.name,
                summary: aiSummary,
                authorId: userId,
                courseId: courseId,
                fileUrl,
                fileType,
                youtubeId
            }
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

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== userId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.assignment.delete({ where: { id } })
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

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== userId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.quiz.delete({ where: { id } })
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

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== userId) return { success: false, error: "Unauthorized" }

    try {
        const note = await prisma.note.findUnique({ where: { id } })
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

        await prisma.note.delete({ where: { id } })
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

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== userId) return { success: false, error: "Unauthorized" }

    try {
        const existingNote = await prisma.note.findUnique({ where: { id: noteId } })
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

        let aiSummary = existingNote.summary
        if (content !== existingNote.content || (file && file.name !== existingNote.title)) {
            const { generateSummary } = await import("@/lib/ai")
            const summaryText = content.length > 10 ? content : `Attached file: ${file?.name || 'No content'}`
            aiSummary = await generateSummary(`${title}\n\n${summaryText}`)
        }

        await prisma.note.update({
            where: { id: noteId },
            data: {
                title,
                content,
                fileUrl,
                fileType,
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

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== userId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.course.update({
            where: { id: courseId },
            data: {
                name,
                description
            }
        })

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
        const quiz = await prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                course: true,
                questions: true,
                attempts: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    },
                    orderBy: { score: 'desc' }
                }
            }
        })

        if (!quiz) return { success: false, error: "Quiz not found" }

        if (quiz.course?.teacherId !== userId) {
            return { success: false, error: "Only the class teacher can view full results" }
        }

        return { success: true, quiz }
    } catch (error) {
        console.error("Get Quiz Results Error:", error)
        return { success: false, error: "Failed to fetch results" }
    }
}

// --- MEMBERSHIP & SETTINGS ---

export async function deleteCourseAction(courseId: string) {
    const userId = await getUserId()
    if (!userId) throw new Error("Unauthorized")

    const course = await prisma.course.findUnique({ where: { id: courseId } })
    if (!course || course.teacherId !== userId) return { success: false, error: "Unauthorized" }

    try {
        await prisma.course.delete({ where: { id: courseId } })
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
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: { select: { id: true, name: true, email: true, role: true } },
                enrollments: {
                    include: {
                        user: { select: { id: true, name: true, email: true, role: true } }
                    }
                }
            }
        })

        if (!course) return { success: false, error: "Course not found" }

        const isTeacher = course.teacherId === userId
        const isStudent = course.enrollments.some(e => e.userId === userId)

        if (!isTeacher && !isStudent) {
            return { success: false, error: "Access Denied" }
        }

        const members = [
            { ...course.teacher, isTeacher: true },
            ...course.enrollments.map(e => ({ ...e.user, isTeacher: false }))
        ]

        return { success: true, members }

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
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId },
            include: {
                course: {
                    include: {
                        teacher: { select: { name: true, email: true, id: true } }
                    }
                },
                submissions: {
                    where: { studentId: userId },
                    take: 1
                }
            }
        })

        if (!assignment) return { success: false, error: "Assignment not found" }

        const isTeacher = assignment.course.teacherId === userId

        return {
            success: true,
            assignment,
            submission: assignment.submissions[0] || null,
            isTeacher
        }
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
        const assignment = await prisma.assignment.findUnique({
            where: { id: assignmentId }
        })

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
        const existing = await prisma.submission.findFirst({
            where: {
                assignmentId,
                studentId: userId
            }
        })

        if (existing) {
            await prisma.submission.update({
                where: { id: existing.id },
                data: {
                    content: content || existing.content, // Only update if provided? Or overwrite? 
                    // Logic: If user clicks "Mark as Done", they might just want to set status. 
                    // But typically this action is "Submit".
                    fileUrl: fileUrl || existing.fileUrl,
                    submittedAt: new Date()
                }
            })
        } else {
            await prisma.submission.create({
                data: {
                    assignmentId,
                    studentId: userId,
                    content,
                    fileUrl
                }
            })
        }

        const course = await prisma.course.findUnique({ where: { id: assignment.courseId } })
        if (course) {
            revalidatePath(`/dashboard/classes/${course.code}/assignments/${assignmentId}`)
        }

        return { success: true }

    } catch (error) {
        console.error("Submit Assignment Error:", error)
        return { success: false, error: "Failed to submit assignment" }
    }
}
