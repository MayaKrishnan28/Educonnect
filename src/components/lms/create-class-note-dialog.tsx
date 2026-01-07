
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, StickyNote } from "lucide-react"
import { createClassNoteAction } from "@/app/actions-lms"

export function CreateClassNoteDialog({ courseId, children }: { courseId: string, children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const formElement = e.target as HTMLFormElement
        const formData = new FormData(formElement)
        formData.append("courseId", courseId) // Add courseId manually

        try {
            const res = await createClassNoteAction(formData)
            if (res.success) {
                setOpen(false)
                setTitle("")
                setContent("")
            } else {
                alert(res.error || "Failed")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] glass">
                <DialogHeader>
                    <DialogTitle>Add Class Note</DialogTitle>
                    <DialogDescription>
                        Create a note specific to this class. AI will summarize it automatically.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                    <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                            name="title"
                            required
                            placeholder="e.g., Lecture 4: Algebra Basics"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Content (Bio / Description)</Label>
                        <Textarea
                            name="content"
                            required
                            className="min-h-[100px]"
                            placeholder="Describe this resource..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <div className="space-y-4 border-t border-white/10 pt-4">
                        <Label className="text-base font-semibold">Attachments</Label>

                        <div className="space-y-2">
                            <Label>Upload Video or File</Label>
                            <Input
                                type="file"
                                name="file"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4,.webm"
                                className="file:text-white"
                            />
                            <p className="text-xs text-muted-foreground">Supports PDF, Documents, Images, MP4, WebM. Max 100MB.</p>
                        </div>

                        <div className="flex items-center gap-4 text-xs text-muted-foreground uppercase tracking-wider font-bold text-center">
                            <div className="h-px bg-white/10 flex-grow" /> OR <div className="h-px bg-white/10 flex-grow" />
                        </div>

                        <div className="space-y-2">
                            <Label>YouTube Video Link</Label>
                            <Input
                                name="youtubeLink"
                                placeholder="https://youtube.com/watch?v=..."
                                className="bg-red-500/5 border-red-500/20 focus:border-red-500/50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <StickyNote className="w-4 h-4 mr-2" />}
                            Upload & Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
