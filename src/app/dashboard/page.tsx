import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Book, Clock, Flame, TrendingUp, MoreHorizontal, FileText, CheckCircle2 } from "lucide-react"
import { getNotes, getCurrentUser } from "@/app/actions"
import { getStudentTodoItemsAction } from "@/app/actions-lms"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const user = await getCurrentUser()
    if (!user) {
        redirect("/login")
    }

    const notes = await getNotes()
    const { items: todoItems } = await getStudentTodoItemsAction() || { items: [] }

    // Combine and sort all recent activity
    const allActivity = [
        ...notes.map((n: any) => ({ ...n, type: 'note' })),
        ...(todoItems || [])
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    const recentActivity = allActivity.slice(0, 5)

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user.name}</h1>
                    <p className="text-muted-foreground">Your personal AI learning center.</p>
                </div>
                <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarImage src="https://github.com/shadcn.png" />
                    <AvatarFallback>{user.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Notes Available", value: notes.length.toString(), icon: Book, color: "text-blue-400" },
                    { label: "Hours Spent", value: "12.5", icon: Clock, color: "text-purple-400" },
                    { label: "Day Streak", value: "7", icon: Flame, color: "text-orange-400" },
                    { label: "Avg Score", value: "88%", icon: TrendingUp, color: "text-green-400" },
                ].map((stat: any, i: number) => (
                    <GlassCard key={i} className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-bold">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-full bg-white/5 ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </GlassCard>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                    <div className="space-y-4">
                        {allActivity.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground bg-white/5 rounded-xl border border-dashed border-white/10">
                                No activity recorded yet. Check back later!
                            </div>
                        ) : (
                            recentActivity.map((item: any) => {
                                const isNote = item.type === 'note'
                                const isAssignment = item.type === 'assignment'
                                const isQuiz = item.type === 'quiz'

                                let href = `/dashboard/notes/${item.id}`
                                if (isAssignment) href = `/dashboard/classes/${item.courseCode}/assignments/${item.id}`
                                if (isQuiz) href = `/dashboard/quiz/${item.id}`

                                return (
                                    <Link href={href} key={item.id + item.type}>
                                        <GlassCard className="flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group mb-4">
                                            <div className={`h-12 w-12 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform ${isNote ? "bg-indigo-500/20 text-indigo-400" :
                                                isAssignment ? "bg-blue-500/20 text-blue-400" :
                                                    "bg-purple-500/20 text-purple-400"
                                                }`}>
                                                {isNote ? <Book size={20} /> : isAssignment ? <FileText size={20} /> : <CheckCircle2 size={20} />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">{item.title}</h4>
                                                    {item.isDone && <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded uppercase font-bold">Done</span>}
                                                    {item.isMissing && <span className="text-[10px] bg-red-500/20 text-red-100 px-1.5 py-0.5 rounded uppercase font-bold">Missing</span>}
                                                </div>
                                                <p className="text-xs text-muted-foreground">
                                                    {isNote ? (
                                                        `${new Date(item.createdAt).toLocaleDateString()} • ${item.summary ? "AI Summary Ready" : "Manual Note"}`
                                                    ) : (
                                                        `${item.courseName} • ${isAssignment ? 'Assignment' : 'Quiz'}`
                                                    )}
                                                </p>
                                            </div>
                                            <Button size="icon" variant="ghost">
                                                <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                        </GlassCard>
                                    </Link>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Sidebar / Timeline Preview */}
                <div className="space-y-6">
                    <GlassCard className="h-full">
                        <h3 className="font-semibold mb-6 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-400" />
                            Latest Updates
                        </h3>
                        <div className="relative pl-4 space-y-8 border-l border-white/10 ml-2">
                            {allActivity.slice(0, 4).length > 0 ? (
                                allActivity.slice(0, 4).map((item: any, i: number) => (
                                    <div key={item.id + item.type} className="relative">
                                        <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background ${i === 0 ? 'bg-primary border-primary animate-pulse' : 'bg-muted border-muted-foreground'
                                            }`} />
                                        <p className="text-sm font-medium truncate pr-4">{item.title}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {item.type} • {new Date(item.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No recent activity.</p>
                            )}

                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background bg-green-500 border-green-500" />
                                <p className="text-sm font-medium">Semester Started</p>
                                <p className="text-xs text-muted-foreground">Jan 2026</p>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}
