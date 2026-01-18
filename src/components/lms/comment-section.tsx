"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { addCommentAction, getCommentsAction, deleteCommentAction } from "@/app/actions-stream"
import { formatDistanceToNow } from "date-fns"
import { Loader2, Send, Trash2, MessageSquare } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Comment {
    id: string
    content: string
    authorName: string
    authorRole: string
    createdAt: string | Date
    authorId: string
}

interface CommentSectionProps {
    entityId: string
    entityType: string
    initialComments?: Comment[]
    currentUserId: string
}

export function CommentSection({ entityId, entityType, initialComments = [], currentUserId }: CommentSectionProps) {
    const [comments, setComments] = useState<Comment[]>(initialComments)
    const [isOpen, setIsOpen] = useState(false)
    const [newComment, setNewComment] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [hasFetched, setHasFetched] = useState(!!initialComments.length)
    const [isLoading, setIsLoading] = useState(false)

    const fetchComments = async () => {
        setIsLoading(true)
        const res = await getCommentsAction(entityId)
        if (res.success && res.comments) {
            setComments(res.comments)
            setHasFetched(true)
        }
        setIsLoading(false)
    }

    const toggleOpen = () => {
        if (!isOpen && !hasFetched) {
            fetchComments()
        }
        setIsOpen(!isOpen)
    }

    const handleSubmit = async () => {
        if (!newComment.trim()) return

        // Optimistic Update
        const tempId = Math.random().toString()
        const tempComment: Comment = {
            id: tempId,
            content: newComment,
            authorName: "You",
            authorRole: "STUDENT", // Placeholder
            authorId: currentUserId,
            createdAt: new Date()
        }

        setComments(prev => [...prev, tempComment])
        setNewComment("")
        setIsSubmitting(true)

        try {
            const res = await addCommentAction(entityId, entityType, tempComment.content)
            if (res.success && res.comment) {
                // Replace temp with real
                setComments(prev => prev.map(c => c.id === tempId ? res.comment : c))
            } else {
                // Revert
                setComments(prev => prev.filter(c => c.id !== tempId))
                toast.error("Failed to post comment")
            }
        } catch (e) {
            setComments(prev => prev.filter(c => c.id !== tempId))
            toast.error("Error posting comment")
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async (id: string) => {
        setComments(prev => prev.filter(c => c.id !== id))
        try {
            await deleteCommentAction(id)
        } catch (e) {
            toast.error("Failed to delete")
        }
    }

    return (
        <div className="mt-4 border-t border-white/5 pt-2">
            <Button
                variant="ghost"
                size="sm"
                onClick={toggleOpen}
                className="text-xs text-muted-foreground hover:text-white flex items-center gap-2 mb-2 p-0 h-auto hover:bg-transparent"
            >
                <MessageSquare className="w-3 h-3" />
                {comments.length > 0 ? `${comments.length} Comments` : "Add a comment"}
            </Button>

            {isOpen && (
                <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                    {/* Comments List */}
                    <div className="space-y-3 pl-2 sm:pl-4 border-l-2 border-white/5">
                        {isLoading ? (
                            <div className="flex justify-center py-2">
                                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : comments.map((comment) => (
                            <div key={comment.id} className="group flex gap-3 text-sm">
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
                                    comment.authorRole === 'STAFF'
                                        ? "bg-purple-500 text-white"
                                        : "bg-zinc-700 text-zinc-300"
                                )}>
                                    {comment.authorName.charAt(0)}
                                </div>
                                <div className="flex-grow">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white/90 text-xs sm:text-sm">{comment.authorName}</span>
                                        <span className="text-[10px] text-muted-foreground">
                                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                        </span>
                                    </div>
                                    <p className="text-white/80 leading-relaxed break-words text-xs sm:text-sm">
                                        {comment.content}
                                    </p>
                                </div>
                                {(comment.authorId === currentUserId) && (
                                    <button
                                        onClick={() => handleDelete(comment.id)}
                                        className="text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Input */}
                    <div className="flex gap-2 items-start mt-2">
                        <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="min-h-[40px] h-[40px] py-2 text-sm bg-zinc-900/50 border-white/10 focus-visible:ring-1 focus-visible:ring-purple-500/50 resize-y"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                            }}
                        />
                        <Button
                            size="icon"
                            className="h-[40px] w-[40px] shrink-0 bg-zinc-800 hover:bg-zinc-700 text-white border border-white/10"
                            onClick={handleSubmit}
                            disabled={isSubmitting || !newComment.trim()}
                        >
                            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
