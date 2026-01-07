import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Book, MoreHorizontal, ArrowLeft } from "lucide-react"
import { getNotesBySubject } from "@/app/actions"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function SubjectDetailsPage({ params }: { params: Promise<{ subject: string }> }) {
    const { subject } = await params
    const decodedSubject = decodeURIComponent(subject)
    const notes = await getNotesBySubject(decodedSubject)

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/subjects">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{decodedSubject}</h1>
                    <p className="text-muted-foreground">Viewing all notes for {decodedSubject}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {notes.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground bg-white/5 rounded-xl border border-dashed border-white/10">
                        No notes found in this subject.
                    </div>
                ) : (
                    notes.map((note) => (
                        <Link href={`/dashboard/notes/${note.id}`} key={note.id}>
                            <GlassCard className="flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group">
                                <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                    <Book size={20} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-medium text-lg">{note.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(note.createdAt).toLocaleDateString()} • {note.summary ? "AI Summary Ready" : "Processing..."}
                                    </p>
                                </div>
                                <Button size="icon" variant="ghost">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </GlassCard>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
