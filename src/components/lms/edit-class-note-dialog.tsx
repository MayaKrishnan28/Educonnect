"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, StickyNote, Edit } from "lucide-react"
import { updateClassNoteAction } from "@/app/actions-lms"

interface EditClassNoteDialogProps {
    note: {
        id: string
        title: string
        content: string
        fileUrl?: string | null
    }
    courseId: string
}

export function EditClassNoteDialog({ note, courseId }: EditClassNoteDialogProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState(note.title)
    const [content, setContent] = useState(note.content)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        const formElement = e.target as HTMLFormElement
        const formData = new FormData(formElement)
        formData.append("courseId", courseId)
        formData.append("noteId", note.id)

        try {
            const res = await updateClassNoteAction(formData)
            if (res.success) {
                setOpen(false)
            } else {
                alert(res.error || "Failed using update action")
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
                <Button variant="ghost" size="icon" className="text-white/40 hover:text-emerald-400 hover:bg-emerald-500/10">
                    <Edit className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] glass">
                <DialogHeader>
                    <DialogTitle>Edit Note</DialogTitle>
                    <DialogDescription>
                        Update the note details or replace the attached file.
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
                        <Label>Content</Label>
                        <Textarea
                            name="content"
                            required
                            className="min-h-[100px]"
                            placeholder="Type or paste text..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Attachment (Optional)</Label>
                        <div className="flex flex-col gap-2">
                            {note.fileUrl && (
                                <p className="text-xs text-emerald-400">Current file attached. Uploading a new one will replace it.</p>
                            )}
                            <Input
                                type="file"
                                name="file"
                                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                                className="file:text-white"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-500">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <StickyNote className="w-4 h-4 mr-2" />}
                            Update Note
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
