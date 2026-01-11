import { GlassCard } from "@/components/ui/glass-card"
import { getNotes } from "@/app/actions"
import { getStudentTodoItemsAction } from "@/app/actions-lms"
import { Clock, Calendar, ArrowRight, BookOpen, FileText, CheckCircle2, Sparkles } from "lucide-react"
import Link from "next/link"

export default async function TimelinePage() {
    const notes = await getNotes()
    const { items: todoItems } = await getStudentTodoItemsAction() || { items: [] }

    // Combine and sort all activities
    const allActivities = [
        ...notes.map((n: any) => ({ ...n, type: 'note' })),
        ...(todoItems || [])
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return (
        <div className="space-y-8 animate-in fade-in max-w-5xl mx-auto px-4 py-8">
            <div>
                <h1 className="text-4xl font-bold tracking-tight mb-2">Learning Timeline</h1>
                <p className="text-muted-foreground text-lg">Your academic journey, beautifully organized.</p>
            </div>

            <div className="relative border-l-2 border-white/10 ml-6 space-y-12 pb-12">
                {allActivities.length === 0 ? (
                    <div className="pl-10 pt-4">
                        <GlassCard className="p-8 border-dashed text-center">
                            <Calendar className="w-12 h-12 mx-auto mb-4 text-white/20" />
                            <h3 className="text-xl font-semibold mb-2">No timeline events yet</h3>
                            <p className="text-muted-foreground">Your notes, assignments, and quizzes will appear here as they are added.</p>
                        </GlassCard>
                    </div>
                ) : (
                    allActivities.map((item: any, index: number) => {
                        const isNote = item.type === 'note'
                        const isAssignment = item.type === 'assignment'
                        const isQuiz = item.type === 'quiz'

                        let href = `/dashboard/notes/${item.id}`
                        if (isAssignment) href = `/dashboard/classes/${item.courseCode}/assignments/${item.id}`
                        if (isQuiz) href = `/dashboard/quiz/${item.id}`

                        return (
                            <div key={item.id + item.type} className="relative pl-10 group">
                                {/* Timeline Node */}
                                <div className={`absolute -left-[11px] top-1 h-5 w-5 rounded-full border-4 border-background transition-all duration-300 group-hover:scale-125 ${isNote ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                                        isAssignment ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' :
                                            'bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                                    }`} />

                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="text-sm text-muted-foreground min-w-[120px] pt-1.5 font-medium">
                                        <div className="flex flex-col">
                                            <span>{new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                            <span className="text-[10px] opacity-50 uppercase tracking-tighter">
                                                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>

                                    <Link href={href} className="flex-1 block">
                                        <GlassCard className={`p-6 hover:bg-white/[0.03] transition-all group border-white/5 relative overflow-hidden ${isNote ? 'hover:border-blue-500/30' :
                                                isAssignment ? 'hover:border-emerald-500/30' :
                                                    'hover:border-purple-500/30'
                                            }`}>
                                            <div className="relative z-10">
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${isNote ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                                            isAssignment ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                                'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                                        }`}>
                                                        {isNote ? <BookOpen size={12} /> : isAssignment ? <FileText size={12} /> : <Sparkles size={12} />}
                                                        {isNote ? 'Note' : isAssignment ? 'Assignment' : 'Quiz'}
                                                    </span>

                                                    {item.courseName && (
                                                        <span className="px-2.5 py-1 rounded-md bg-white/5 text-white/50 text-[10px] font-bold border border-white/10 uppercase tracking-wider">
                                                            {item.courseName}
                                                        </span>
                                                    )}

                                                    {item.isDone && (
                                                        <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/20 flex items-center gap-1 uppercase tracking-wider">
                                                            <CheckCircle2 size={10} /> Completed
                                                        </span>
                                                    )}
                                                </div>

                                                <h3 className="text-2xl font-bold mb-3 group-hover:translate-x-1 transition-transform flex items-center gap-3">
                                                    {item.title}
                                                    <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-white/20" />
                                                </h3>

                                                <p className="text-muted-foreground leading-relaxed line-clamp-2 max-w-2xl">
                                                    {isNote ? (item.summary || "Deep dive into this topic with AI insights...") :
                                                        isAssignment ? (item.description || "Project assignment details and submissions.") :
                                                            `Topic: ${item.topic} • Test your knowledge with this interactive quiz.`}
                                                </p>

                                                {isAssignment && item.dueDate && (
                                                    <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-red-400/80 bg-red-400/5 px-2 py-1 rounded w-fit border border-red-400/10">
                                                        <Calendar className="w-3.5 h-3.5" />
                                                        DUE: {new Date(item.dueDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Type Watermark Icon */}
                                            <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                                {isNote ? <BookOpen size={140} /> : isAssignment ? <FileText size={140} /> : <Sparkles size={140} />}
                                            </div>
                                        </GlassCard>
                                    </Link>
                                </div>
                            </div>
                        )
                    })
                )}

                {allActivities.length > 0 && (
                    <div className="relative pl-10">
                        <div className="absolute -left-[11px] top-0 h-5 w-5 rounded-full bg-muted border-4 border-background" />
                        <div className="py-2 text-muted-foreground font-medium">
                            Semester Journey Started
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

