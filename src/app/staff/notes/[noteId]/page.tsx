
import { NoteViewer } from "@/components/notes/note-viewer"
import { notFound, redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Lock } from "lucide-react"
import { getSession } from "@/lib/auth"

export default async function StaffNotePage({ params }: { params: Promise<{ noteId: string }> }) {
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
        }
    }

    if (!note) {
        return notFound()
    }

    const session = await getSession();
    const userId = session?.userId;
    const isAuthor = userId === note.authorId || userId?.toString() === note.authorId;

    if (!isAuthor) {
        redirect(`/dashboard/notes/${noteId}`) // Redirect students/others
    }

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

    return (
        <div className="max-w-4xl mx-auto py-6">
            <div className="mb-4">
                <Link href={`/staff/classes/${note.course?.code || ''}`} className="text-sm text-muted-foreground hover:text-white">
                    ← Back to Class
                </Link>
            </div>
            <NoteViewer
                id={note.id}
                title={note.title}
                content={displayContent}
                rawContent={note.content}
                authorName={note.author?.name || "Unknown Staff"}
                isAuthor={isAuthor}
                userRole={session?.role}
                youtubeId={(note as any).youtubeId}
                fileUrl={note.fileUrl}
                fileType={note.fileType}
                multiFileUrls={note.multiFileUrls}
                multiFileTypes={note.multiFileTypes}
            />
        </div>
    )
}
