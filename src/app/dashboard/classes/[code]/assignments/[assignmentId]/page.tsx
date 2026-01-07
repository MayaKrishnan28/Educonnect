
import { getAssignmentDetailsAction } from "@/app/actions-lms"
import { GlassCard } from "@/components/ui/glass-card"
import { SubmissionCard } from "@/components/lms/submission-card"
import { Calendar, Clock, FileText, User } from "lucide-react"
import { redirect } from "next/navigation"

interface PageProps {
    params: Promise<{ code: string; assignmentId: string }>
}

export default async function AssignmentPage({ params }: PageProps) {
    const { code, assignmentId } = await params
    const { success, assignment, submission, isTeacher, error } = await getAssignmentDetailsAction(assignmentId)

    if (!success || !assignment) {
        // Handle error (could redirects or show error UI)
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold text-red-400">Error loading assignment</h2>
                <p className="text-muted-foreground">{error}</p>
            </div>
        )
    }

    const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null
    const isLate = dueDate && new Date() > dueDate

    return (
        <div className="min-h-screen pb-20">
            <div className="max-w-6xl mx-auto p-6 md:p-8">

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* LEFT COLUMN: Assignment Details */}
                    <div className="lg:col-span-2 space-y-6">

                        {/* Header Info */}
                        <div className="border-b border-white/10 pb-6">
                            <div className="flex items-center gap-3 text-primary mb-4">
                                <FileText className="w-8 h-8 p-1.5 bg-primary/20 rounded-md" />
                                <span className="text-sm font-medium tracking-wide uppercase">{assignment.course.name}</span>
                            </div>

                            <h1 className="text-4xl font-bold mb-4">{assignment.title}</h1>

                            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground items-center">
                                <div className="flex items-center gap-1.5">
                                    <User className="w-4 h-4" />
                                    <span>{assignment.course.teacher.name}</span>
                                </div>
                                <div className="w-1 h-1 rounded-full bg-white/20" />
                                <span>{assignment.points} points</span>
                                {dueDate && (
                                    <>
                                        <div className="w-1 h-1 rounded-full bg-white/20" />
                                        <div className={`flex items-center gap-1.5 ${isLate ? "text-red-400" : ""}`}>
                                            <Calendar className="w-4 h-4" />
                                            <span>Due {dueDate.toLocaleDateString()} at {dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Description */}
                        {assignment.description && (
                            <div className="prose prose-invert max-w-none">
                                <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed text-lg">
                                    {assignment.description}
                                </p>
                            </div>
                        )}

                        {/* Class Comments (Future) */}
                        <div className="mt-12 pt-6 border-t border-white/10">
                            <div className="flex items-center gap-2 mb-4 text-muted-foreground">
                                <User className="w-5 h-5" />
                                <span className="font-medium">Class comments</span>
                            </div>
                            <div className="text-sm text-muted-foreground italic pl-8">
                                Comments are currently disabled for this class.
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Submission or Teacher View */}
                    <div className="lg:col-span-1">
                        {isTeacher ? (
                            <GlassCard className="p-6">
                                <h3 className="text-xl font-semibold mb-4 text-primary">Teacher View</h3>
                                <p className="text-muted-foreground mb-4">
                                    You can view all student submissions in the main class dashboard or by clicking below.
                                </p>
                                <div className="space-y-4">
                                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex justify-between items-center">
                                        <span className="text-green-400 font-medium">Turned in</span>
                                        <span className="text-2xl font-bold">--</span>
                                    </div>
                                    <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex justify-between items-center">
                                        <span className="text-blue-400 font-medium">Assigned</span>
                                        <span className="text-2xl font-bold">--</span>
                                    </div>
                                    {/* Link to full grading view could go here */}
                                </div>
                            </GlassCard>
                        ) : (
                            <SubmissionCard
                                assignmentId={assignmentId}
                                dueDate={dueDate}
                                existingSubmission={submission}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
