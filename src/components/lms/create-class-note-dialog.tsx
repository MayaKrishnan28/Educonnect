
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, StickyNote } from "lucide-react"
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
            <DialogContent className="sm:max-w-[600px] bg-[#0A0A0B] border-white/10 text-white overflow-hidden p-0 gap-0 shadow-2xl">
                {/* Header Gradient */}
                <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-purple-600/20 to-transparent pointer-events-none" />

                <div className="p-8 relative">
                    <DialogHeader className="mb-6">
                        <DialogTitle className="text-2xl font-bold tracking-tight text-white">Add Class Note</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            You can upload files and also add a YouTube video link.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-300">Title</Label>
                            <Input
                                name="title"
                                required
                                placeholder="e.g., Lecture 4: Algebra Basics"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="bg-white/5 border-white/10 focus:border-purple-500/50 h-11 transition-all text-white"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-gray-300">Content (Bio / Description)</Label>
                            <Textarea
                                name="content"
                                required
                                className="min-h-[120px] bg-white/5 border-white/10 focus:border-purple-500/50 transition-all resize-none text-white"
                                placeholder="Describe this resource..."
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h3 className="text-lg font-bold mb-2">Attachments</h3>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-300">Upload File (PDF, Images, etc.)</Label>
                                <Input
                                    type="file"
                                    name="file"
                                    multiple
                                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.mp4,.webm"
                                    className="bg-white/5 border-white/10 h-11 file:bg-transparent file:text-white file:border-0 file:text-sm file:font-medium cursor-pointer"
                                />
                                <p className="text-[10px] text-gray-500">Max 100MB.</p>
                            </div>



                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-300">YouTube Video Link</Label>
                                <Input
                                    name="youtubeLink"
                                    placeholder="https://youtube.com/watch?v=..."
                                    className="bg-red-500/5 border-red-500/20 focus:border-red-500/50 h-11 transition-all text-white"
                                />
                                <p className="text-[10px] text-gray-500 italic">The video will be embedded in the lesson.</p>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 h-12 shadow-lg shadow-emerald-600/20 transition-all"
                            >
                                {loading ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <StickyNote className="w-4 h-4" />
                                        Upload & Save
                                    </span>
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
