"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { createPostAction } from "@/app/actions-stream"
import { Loader2, Send } from "lucide-react"
import { toast } from "sonner"

interface CreatePostInputProps {
    courseId: string
    isStaff: boolean
}

export function CreatePostInput({ courseId, isStaff }: CreatePostInputProps) {
    const [content, setContent] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

    const handleSubmit = async () => {
        if (!content.trim()) return

        setIsLoading(true)
        try {
            const res = await createPostAction(courseId, content)
            if (res.success) {
                toast.success("Post created!")
                setContent("")
                setIsExpanded(false)
            } else {
                toast.error(res.error || "Failed to create post")
            }
        } catch (e) {
            toast.error("Something went wrong")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-4 mb-8 transition-all focus-within:ring-2 focus-within:ring-purple-500/50">
            {!isExpanded ? (
                <div
                    onClick={() => setIsExpanded(true)}
                    className="text-muted-foreground cursor-text text-sm p-2"
                >
                    Announce something to your class...
                </div>
            ) : (
                <div className="space-y-3">
                    <Textarea
                        autoFocus
                        placeholder="Announce something to your class..."
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="bg-transparent border-0 focus-visible:ring-0 min-h-[100px] text-base resize-none p-2"
                    />
                    <div className="flex justify-end gap-2 border-t border-white/5 pt-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={isLoading || !content.trim()}
                            className="bg-purple-600 hover:bg-purple-500 text-white min-h-[36px] min-w-[80px]"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                <>
                                    <Send className="w-3 h-3 mr-2" /> Post
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
