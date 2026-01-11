import { GlassCard } from "@/components/ui/glass-card"
import { getNotes, getSubjects } from "@/app/actions"
import { Activity, TrendingUp, PieChart, Book, BrainCircuit, Target } from "lucide-react"

export default async function InsightsPage() {
    const notes = await getNotes()
    const subjects = await getSubjects()

    // Calculate Metrics
    const totalNotes = notes.length
    const totalSubjects = subjects.length
    const estimatedHours = (totalNotes * 0.5).toFixed(1) // Mock calculation: 30 mins per note

    // Find top subject
    const topSubject = subjects.sort((a, b) => b.count - a.count)[0]

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-3xl font-bold">Performance Insights</h1>
                <p className="text-muted-foreground">AI-driven analysis of your learning patterns.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                        <Book className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Materials Covered</p>
                        <h3 className="text-2xl font-bold">{totalNotes} <span className="text-sm font-normal text-muted-foreground">notes</span></h3>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                        <Activity className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Study Time (Est.)</p>
                        <h3 className="text-2xl font-bold">{estimatedHours} <span className="text-sm font-normal text-muted-foreground">hours</span></h3>
                    </div>
                </GlassCard>

                <GlassCard className="p-6 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                        <Target className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">Top Focus</p>
                        <h3 className="text-xl font-bold truncate max-w-[150px]">{topSubject?.name || "N/A"}</h3>
                    </div>
                </GlassCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Subject Distribution Chart */}
                <GlassCard className="p-8">
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-indigo-400" /> Subject Distribution
                    </h3>

                    <div className="space-y-6">
                        {subjects.length === 0 ? (
                            <p className="text-muted-foreground text-center py-8">No data available.</p>
                        ) : (
                            subjects.map((sub) => {
                                const percentage = totalNotes > 0 ? ((sub.count / totalNotes) * 100).toFixed(0) : "0";
                                return (
                                    <div key={sub.name} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{sub.name}</span>
                                            <span className="text-muted-foreground">{percentage}% ({sub.count})</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </GlassCard>

                {/* AI Recommendations */}
                <div className="space-y-6">
                    <GlassCard className="p-8 h-full bg-gradient-to-br from-white/5 to-purple-500/5 border-purple-500/20">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                            <BrainCircuit className="w-5 h-5 text-purple-400" /> AI Recommendations
                        </h3>

                        <div className="space-y-6">
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)] shrink-0" />
                                <div>
                                    <h4 className="font-medium text-sm text-purple-200">Diversify Your Reading</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {topSubject
                                            ? `You have a strong focus on ${topSubject.name}. Consider exploring other subjects to maintain a balanced curriculum `
                                            : "Start by exploring the Subject Library to build your learning profile."
                                        }
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 items-start">
                                <div className="mt-1 h-2 w-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)] shrink-0" />
                                <div>
                                    <h4 className="font-medium text-sm text-blue-200">Maintenance Review</h4>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Based on your timeline, you haven't reviewed older notes recently. The AI suggests a quick refresher on your earliest uploads.
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-white/5 border border-white/10 mt-4">
                                <p className="text-xs text-center text-muted-foreground italic">
                                    "Learning is not attained by chance, it must be sought for with ardor and attended to with diligence."
                                </p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}
