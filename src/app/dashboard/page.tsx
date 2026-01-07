import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Book, Clock, Flame, TrendingUp, MoreHorizontal } from "lucide-react"
import { getNotes, getCurrentUser } from "@/app/actions"
import Link from "next/link"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const user = await getCurrentUser()
    if (!user) {
        redirect("/login")
    }

    const notes = await getNotes()

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

            {/* Stats Grid - Kept visual for "Wow" factor */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    { label: "Notes Available", value: notes.length.toString(), icon: Book, color: "text-blue-400" },
                    { label: "Hours Spent", value: "12.5", icon: Clock, color: "text-purple-400" },
                    { label: "Day Streak", value: "7", icon: Flame, color: "text-orange-400" },
                    { label: "Avg Score", value: "88%", icon: TrendingUp, color: "text-green-400" },
                ].map((stat, i) => (
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
                    <h2 className="text-xl font-semibold mb-4">Recent Class Notes</h2>
                    <div className="space-y-4">
                        {notes.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground bg-white/5 rounded-xl border border-dashed border-white/10">
                                No notes uploaded yet. Check back later!
                            </div>
                        ) : (
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            notes.map((note: any) => (
                                <Link href={`/dashboard/notes/${note.id}`} key={note.id}>
                                    <GlassCard className="flex items-center gap-4 hover:bg-white/5 transition-colors cursor-pointer group mb-4">
                                        <div className="h-12 w-12 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                                            <Book size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium">{note.title}</h4>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(note.createdAt).toLocaleDateString()} • {note.summary ? "AI Summary Ready" : "Processing..."}
                                            </p>
                                        </div>
                                        <Button size="icon" variant="ghost">
                                            <MoreHorizontal className="w-4 h-4" />
                                        </Button>
                                    </GlassCard>
                                </Link>
                            ))
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
                            {notes.slice(0, 3).length > 0 ? (
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                notes.slice(0, 3).map((note: any, i: number) => (
                                    <div key={note.id} className="relative">
                                        <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 border-background ${i === 0 ? 'bg-blue-500 border-blue-500 animate-pulse' : 'bg-muted border-muted-foreground'
                                            }`} />
                                        <p className="text-sm font-medium truncate pr-4">{note.title}</p>
                                        <p className="text-xs text-muted-foreground">Uploaded {new Date(note.createdAt).toLocaleDateString()}</p>
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
