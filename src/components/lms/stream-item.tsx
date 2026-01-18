"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { DeleteLMSItemButton } from "@/components/lms/delete-lms-item-button"
import { deleteAssignmentAction, deleteQuizAction } from "@/app/actions-lms"
import { deletePostAction } from "@/app/actions-stream"
import { Sparkles, Calendar, MessageSquare, Pin } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import { CommentSection } from "@/components/lms/comment-section"
import { cn } from "@/lib/utils"

interface StreamItemProps {
    item: any
    courseId: string
    currentUserId: string
    isStaff: boolean
}

export function StreamItem({ item, courseId, currentUserId, isStaff }: StreamItemProps) {
    const isPost = item.type === 'post'
    const isAssignment = item.type === 'assignment'
    const isQuiz = item.type === 'quiz'

    // Styling logic
    const accentColor = isAssignment ? 'bg-purple-500'
        : isQuiz ? 'bg-indigo-500'
            : 'bg-zinc-500/50'

    const badgeClass = isAssignment ? "bg-purple-500/20 text-purple-300"
        : isQuiz ? "bg-indigo-500/20 text-indigo-300"
            : "bg-zinc-500/20 text-zinc-300"

    const label = isAssignment ? "Assignment" : isQuiz ? "Quiz" : "Announcement"

    return (
        <GlassCard className="p-4 sm:p-6 hover:border-white/20 transition-colors relative overflow-hidden group">
            <div className={`absolute top-0 left-0 w-1 h-full ${accentColor}`} />

            <div className="pl-2 sm:pl-3">
                {/* Header: Author + Meta */}
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className={cn("text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded flex items-center gap-1", badgeClass)}>
                            {isQuiz && <Sparkles className="w-3 h-3" />}
                            {label}
                        </div>
                        <span className="text-xs text-muted-foreground hidden sm:inline-block">
                            • {format(new Date(item.createdAt), 'MMM d, h:mm a')}
                        </span>
                    </div>
                    {isStaff && (
                        <div className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <DeleteLMSItemButton
                                id={item.id}
                                courseId={courseId}
                                itemName={label}
                                action={isPost ? deletePostAction : (isAssignment ? deleteAssignmentAction : deleteQuizAction)}
                            />
                        </div>
                    )}
                </div>

                {/* Main Content */}
                <div className="mb-4">
                    {!isPost && <h3 className="font-bold text-base sm:text-lg mb-1">{item.title}</h3>}

                    <p className={cn("text-white/90 leading-relaxed whitespace-pre-wrap", isPost ? "text-base sm:text-lg" : "text-sm text-muted-foreground")}>
                        {isPost ? item.content : (item.description || item.topic || "")}
                    </p>

                    {isQuiz && (
                        <p className="text-xs text-muted-foreground mt-1">
                            {item._count?.questions || 0} Questions • AI Generated
                        </p>
                    )}
                </div>

                {/* Due Date Badge for Assignments */}
                {isAssignment && item.dueDate && (
                    <div className="mb-4 inline-block">
                        <span className="text-xs text-red-300 font-medium bg-red-500/10 px-2 py-1 rounded-md flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> Due {format(new Date(item.dueDate), 'MMM d')}
                        </span>
                    </div>
                )}

                {/* Action Buttons (Actionable Items) */}
                {!isPost && (
                    <div className="flex justify-end border-t border-white/5 pt-3 mb-2">
                        {isAssignment ? (
                            <Button variant="ghost" size="sm" className="hover:bg-white/5 w-full sm:w-auto text-sm h-9">
                                Submit Work →
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full sm:w-auto">
                                {isStaff && (
                                    <Link href={`/dashboard/quiz/${item.id}/results`} className="flex-1 sm:flex-none">
                                        <Button variant="outline" size="sm" className="w-full sm:w-auto hover:bg-white/5 border-purple-500/30 text-purple-300 h-9">
                                            Results
                                        </Button>
                                    </Link>
                                )}
                                <Link href={`/dashboard/quiz/${item.id}`} className="flex-1 sm:flex-none">
                                    <Button variant="ghost" size="sm" className="w-full sm:w-auto hover:bg-white/5 h-9">
                                        {isStaff ? "Preview" : "Start Quiz →"}
                                    </Button>
                                </Link>
                            </div>
                        )}
                    </div>
                )}

                {/* Comments Section integrated directly */}
                <CommentSection
                    entityId={item.id}
                    entityType={item.type}
                    initialComments={item.comments || []} // Note: We need to populate this server-side!
                    currentUserId={currentUserId}
                />
            </div>
        </GlassCard>
    )
}
