import { NoteViewer } from "@/components/notes/note-viewer"
import { getNoteById } from "@/app/actions"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Lock } from "lucide-react"
import { getSession } from "@/lib/auth"

export default async function NotePage({ params }: { params: Promise<{ noteId: string }> }) {
    const { noteId } = await params

    // Fetch Note with Auth Data
    let note = await db.collection('note').findOne({ id: noteId }) as any

    // Fallback: try finding by _id if id not found (for legacy notes)
    if (!note) {
        try {
            const { ObjectId } = await import("mongodb")
            note = await db.collection('note').findOne({ _id: new ObjectId(noteId) }) as any
            if (note) note.id = note._id.toString() // Ensure id property exists for frontend
        } catch (e) {
            // Invalid ObjectId format, ignore
        }
    }

    if (note) {
        note.author = await db.collection('user').findOne({ id: note.authorId })
        if (note.courseId) {
            note.course = await db.collection('course').findOne({ id: note.courseId })
            note.course.enrollments = await db.collection('enrollment').find({ courseId: note.courseId }).toArray()
        }
    }

    if (!note) {
        return notFound()
    }

    const session = await getSession();
    const userId = session?.userId;
    const isAuthor = userId === note.authorId;

    // Check enrollment if it's a class note
    // We need to check if THIS user is enrolled.
    // The previous Prisma query filtered enrollments by userId.
    // Let's do that again but with the secure userId.

    const isEnrolled = note.course?.enrollments.some((e: any) => e.userId === userId)
    // If note belongs to a course, enforce enrollment or authorship
    if (note.courseId && !isAuthor && !isEnrolled) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
                <div className="p-4 bg-red-500/10 rounded-full text-red-400">
                    <Lock className="w-8 h-8" />
                </div>
                <h1 className="text-2xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground max-w-md">
                    This note is part of a private class. You must be enrolled to view it.
                </p>
                <div className="flex gap-2">
                    <Button variant="outline" asChild>
                        <Link href="/dashboard">Go to Dashboard</Link>
                    </Button>
                </div>
            </div>
        )
    }

    // Combine content + AI summary for the view if needed, or just show content
    // We'll prepend the AI summary if it exists to show off the "AI Feature"
    let displayContent = note.content;
    if (note.summary) {
        displayContent = `
    <div class="bg-purple-500/10 border-l-4 border-purple-500 p-4 mb-8 rounded-r-lg">
        <h3 class="text-purple-300 font-bold text-sm uppercase mb-2">✨ AI Generated Summary</h3>
        <p class="text-sm text-gray-300">${note.summary.replace(/\n/g, '<br/>')}</p>
    </div>
    ${note.content}
    `
    }

    // Display logic continued

    return (
        <div className="max-w-4xl mx-auto py-6">
            <NoteViewer
                id={note.id}
                title={note.title}
                content={displayContent}
                rawContent={note.content} // Pass raw content for editing
                authorName={note.author?.name || "Unknown Staff"}
                isAuthor={isAuthor}
                userRole={session?.role}
                youtubeId={(note as any).youtubeId} // Pass YouTube ID
                fileUrl={note.fileUrl}
                fileType={note.fileType}
                multiFileUrls={note.multiFileUrls}
                multiFileTypes={note.multiFileTypes}
            />
        </div>
    )
}
