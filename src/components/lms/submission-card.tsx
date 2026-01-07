
"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GlassCard } from "@/components/ui/glass-card"
import { Loader2, Upload, CheckCircle, FileText, AlertTriangle, CloudUpload } from "lucide-react"
import { submitAssignmentAction } from "@/app/actions-lms"
import { toast } from "sonner"
import { motion, AnimatePresence } from "framer-motion"

interface SubmissionCardProps {
    assignmentId: string
    dueDate: Date | null
    existingSubmission: any // refined type later
}

export function SubmissionCard({ assignmentId, dueDate, existingSubmission }: SubmissionCardProps) {
    const [isPending, startTransition] = useTransition()
    const [file, setFile] = useState<File | null>(null)
    const [content, setContent] = useState(existingSubmission?.content || "")
    const [isExpanded, setIsExpanded] = useState(!existingSubmission)

    // Check status
    const isLate = dueDate && new Date() > new Date(dueDate)
    const isSubmitted = !!existingSubmission

    // If submitted, was it late? (compare submittedAt vs dueDate)
    const wasSubmittedLate = isSubmitted && dueDate && new Date(existingSubmission.submittedAt) > new Date(dueDate)

    async function handleSubmit(isMarkAsDone: boolean = false) {
        if (!file && !content && !isMarkAsDone) {
            toast.error("Please add a file or comment before submitting")
            return
        }

        const formData = new FormData()
        formData.append("assignmentId", assignmentId)
        formData.append("content", content)
        if (file) formData.append("file", file)
        if (isMarkAsDone) formData.append("isMarkAsDone", "true")

        startTransition(async () => {
            const res = await submitAssignmentAction(formData)
            if (res.success) {
                toast.success(isMarkAsDone ? "Marked as done" : "Assignment submitted!")
                setIsExpanded(false)
            } else {
                toast.error(res.error || "Submission failed")
            }
        })
    }

    return (
        <GlassCard className="p-6 h-fit sticky top-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Your work</h3>
                {isSubmitted ? (
                    <span className={`text-sm px-2 py-1 rounded-full border ${wasSubmittedLate ? 'border-red-500/50 text-red-400 bg-red-500/10' : 'border-green-500/50 text-green-400 bg-green-500/10'}`}>
                        {wasSubmittedLate ? 'Turned in late' : 'Turned in'}
                    </span>
                ) : isLate ? (
                    <span className="text-sm px-2 py-1 rounded-full border border-red-500/50 text-red-400 bg-red-500/10">
                        Missing
                    </span>
                ) : (
                    <span className="text-sm text-green-400">Assigned</span>
                )}
            </div>

            {existingSubmission && (
                <div className="mb-6 space-y-3">
                    {existingSubmission.fileUrl && (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                            <FileText className="w-8 h-8 text-blue-400" />
                            <div className="overflow-hidden">
                                <p className="text-sm font-medium truncate w-full">Attached File</p>
                                <a href={existingSubmission.fileUrl} target="_blank" className="text-xs text-blue-400 hover:underline">View File</a>
                            </div>
                        </div>
                    )}
                    {existingSubmission.content && (
                        <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground italic">
                            "{existingSubmission.content}"
                        </div>
                    )}

                    {/* Allow Unsubmit? Requirement implies strict due date, but if BEFORE due date, unsubmit is arguably ok. 
                         For now, User said "after due date no should not able to submit". 
                         Let's just show "Unsubmit" button if NOT late.
                      */}
                    {!isLate && (
                        <Button variant="outline" className="w-full mt-2" onClick={() => setIsExpanded(true)}>
                            Unsubmit / Edit
                        </Button>
                    )}
                </div>
            )}

            <AnimatePresence>
                {(isExpanded || !isSubmitted) && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                    >
                        {/* File Upload Area */}
                        {!file ? (
                            <div className="border border-dashed border-white/20 rounded-lg p-4 text-center hover:bg-white/5 transition-colors relative cursor-pointer group">
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                                <CloudUpload className="mx-auto h-8 w-8 text-muted-foreground mb-2 group-hover:text-primary transition-colors" />
                                <p className="text-sm font-medium">Add or create</p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <FileText className="h-5 w-5 text-primary shrink-0" />
                                    <span className="text-sm truncate">{file.name}</span>
                                </div>
                                <button onClick={() => setFile(null)} className="text-xs hover:text-red-400 ml-2">Remove</button>
                            </div>
                        )}

                        <Textarea
                            placeholder="Add a comment or text response..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="bg-black/20 border-white/10 resize-none min-h-[100px]"
                        />

                        {isLate ? (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex gap-2 items-start">
                                <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                                <div className="text-sm">
                                    <p className="font-semibold text-red-400">Deadline Passed</p>
                                    <p className="text-muted-foreground">You can no longer submit this assignment.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <Button
                                    onClick={() => handleSubmit(false)}
                                    className="w-full"
                                    disabled={isPending || (!file && !content)}
                                >
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Turn in"}
                                </Button>

                                {(!file && !content) && (
                                    <Button
                                        variant="secondary"
                                        onClick={() => handleSubmit(true)}
                                        className="w-full"
                                        disabled={isPending}
                                    >
                                        Mark as done
                                    </Button>
                                )}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </GlassCard>
    )
}
