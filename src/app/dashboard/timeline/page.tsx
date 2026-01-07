import { GlassCard } from "@/components/ui/glass-card"
import { getNotes } from "@/app/actions"
import { Clock, Calendar, ArrowRight, BookOpen } from "lucide-react"
import Link from "next/link"

export default async function TimelinePage() {
    const notes = await getNotes()

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold">Learning Timeline</h1>
                <p className="text-muted-foreground">Train of thought: A chronological view of your course materials.</p>
            </div>

            <div className="relative border-l-2 border-white/10 ml-4 space-y-12 pb-12">
                {notes.length === 0 ? (
                    <div className="pl-8 pt-2">
                        <GlassCard className="p-6 border-dashed text-muted-foreground">
                            No timeline events yet. Upload a note to start the journey.
                        </GlassCard>
                    </div>
                ) : (
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    notes.map((note: any, index: number) => (
                        <div key={note.id} className="relative pl-8">
                            {/* Timeline Node */}
                            <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-primary border-4 border-background shadow-[0_0_10px_rgba(59,130,246,0.5)]" />

                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="text-sm text-muted-foreground min-w-[100px] pt-0.5 font-mono">
                                    {new Date(note.createdAt).toLocaleDateString()}
                                </div>

                                <Link href={`/dashboard/notes/${note.id}`} className="flex-1 block">
                                    <GlassCard className="p-5 hover:bg-white/5 transition-all group border-white/5 hover:border-primary/20 relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <Clock size={80} />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-medium border border-blue-500/20">
                                                    {note.subject || "General"}
                                                </span>
                                                {index === 0 && (
                                                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-xs font-medium border border-green-500/20 animate-pulse">
                                                        New
                                                    </span>
                                                )}
                                            </div>

                                            <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors flex items-center gap-2">
                                                {note.title}
                                                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                            </h3>

                                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                                {note.aiSummary || "Click to view full content and AI analysis..."}
                                            </p>

                                            <div className="flex items-center text-xs text-muted-foreground gap-4">
                                                <span className="flex items-center gap-1">
                                                    <BookOpen className="w-3 h-3" /> Note
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    By {note.author?.name || "Instructor"}
                                                </span>
                                            </div>
                                        </div>
                                    </GlassCard>
                                </Link>
                            </div>
                        </div>
                    ))
                )}

                {notes.length > 0 && (
                    <div className="relative pl-8">
                        <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-muted border-4 border-background" />
                        <div className="py-2 text-muted-foreground text-sm">
                            Start of Semester
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
