
import { getQuizResultsAction } from "@/app/actions-lms"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { Trophy, ChevronLeft, User, Calendar, Target, Award } from "lucide-react"

export default async function QuizResultsPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = await params
    const res = await getQuizResultsAction(quizId)

    if (!res.success || !res.quiz) {
        if (res.error === "Unauthorized") redirect("/login")
        return notFound()
    }

    const quiz = res.quiz
    const attempts = quiz.attempts || []

    // Calculate stats
    const totalAttempts = attempts.length
    const averageScore = totalAttempts > 0
        ? (attempts.reduce((acc: number, curr: any) => acc + (curr.score || 0), 0) / totalAttempts).toFixed(1)
        : 0
    const highestScore = totalAttempts > 0
        ? Math.max(...attempts.map((a: any) => a.score || 0))
        : 0

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <Link href={`/staff/classes/${quiz.course?.code}`} className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors mb-2">
                        <ChevronLeft className="w-4 h-4" /> Back to Class
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">{quiz.title} - Full Results</h1>
                    <p className="text-muted-foreground flex items-center gap-2">
                        <Target className="w-4 h-4" /> {quiz.topic} • {quiz.course?.name}
                    </p>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Total Submissions</p>
                        <p className="text-3xl font-bold">{totalAttempts}</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4 border-l-4 border-l-yellow-500">
                    <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                        <Award className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Average Score</p>
                        <p className="text-3xl font-bold">{averageScore}%</p>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4 border-l-4 border-l-green-500">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                        <Trophy className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Highest Score</p>
                        <p className="text-3xl font-bold">{highestScore}%</p>
                    </div>
                </GlassCard>
            </div>

            {/* Detailed Results Table */}
            <GlassCard className="overflow-hidden">
                <div className="p-6 bg-white/[0.02] border-b border-white/10">
                    <h3 className="text-xl font-bold">Student Performance</h3>
                </div>
                <div className="overflow-x-auto">
                    {attempts.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="text-muted-foreground text-lg">No students have taken this quiz yet.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="text-sm text-muted-foreground border-b border-white/10">
                                    <th className="p-4 font-semibold px-6">Student Name</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold px-6">Score</th>
                                    <th className="p-4 font-semibold">Completed On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {attempts.map((attempt: any) => (
                                    <tr key={attempt.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="p-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-xs font-bold text-indigo-400">
                                                    {attempt.student?.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <span className="font-medium">{attempt.student?.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20">
                                                COMPLETED
                                            </span>
                                        </td>
                                        <td className="p-4 px-6">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden max-w-[120px]">
                                                    <div
                                                        className={`h-full ${attempt.score >= 80 ? 'bg-green-500' :
                                                                attempt.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                                            }`}
                                                        style={{ width: `${attempt.score}%` }}
                                                    />
                                                </div>
                                                <span className={`font-bold ${attempt.score >= 80 ? 'text-green-400' :
                                                        attempt.score >= 60 ? 'text-yellow-400' : 'text-red-400'
                                                    }`}>
                                                    {attempt.score}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <Calendar className="w-4 h-4" />
                                                {new Date(attempt.completedAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </GlassCard>
        </div>
    )
}
