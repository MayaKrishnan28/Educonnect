
import { getUserClassesAction, createClassAction, joinClassAction } from "@/app/actions-lms"
import { db as prisma } from "@/lib/db"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { BookOpen, Plus, Users, School } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import { CreateClassDialog } from "@/components/lms/create-class-dialog" // Client component
import { JoinClassDialog } from "@/components/lms/join-class-dialog"   // Client component

import { getSession } from "@/lib/auth"

export default async function ClassesPage() {
    const session = await getSession()
    const userId = session?.userId
    if (!userId) redirect("/login")

    // Fetch User Role
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
    })

    const { teaching, enrolled } = await getUserClassesAction()
    const isTeacher = user?.role === "TEACHER" || user?.role === "ADMIN"

    return (
        <div className="space-y-8 p-8 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        My Classroom
                    </h2>
                    <p className="text-muted-foreground">
                        Manage your classes and assignments
                    </p>
                </div>
                <div className="flex gap-2">
                    <JoinClassDialog />
                    {isTeacher && <CreateClassDialog />}
                </div>
            </div>

            {/* Teaching Section */}
            {teaching.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <School className="w-5 h-5 text-purple-400" />
                        Teached Classes
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {teaching.map((cls) => (
                            <Link href={`/dashboard/classes/${cls.code}`} key={cls.id}>
                                <GlassCard className="h-full hover:border-purple-500/50 transition-colors p-6 cursor-pointer group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <BookOpen className="w-6 h-6 text-purple-400" />
                                        </div>
                                        <div className="px-2 py-1 rounded-md bg-white/5 text-xs font-mono text-muted-foreground border border-white/10">
                                            {cls.code}
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-lg mb-1">{cls.name}</h4>
                                    <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                                        {cls.description || "No description provided."}
                                    </p>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-sm text-muted-foreground">
                                        <Users className="w-4 h-4 mr-2" />
                                        {(cls as any)._count?.enrollments || 0} Students
                                    </div>
                                </GlassCard>
                            </Link>
                        ))}
                    </div>
                </div>
            )}

            {/* Enrolled Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-blue-400" />
                    Enrolled Classes
                </h3>
                {enrolled.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                        <School className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium">No classes yet</h3>
                        <p className="text-muted-foreground mb-4">Join a class to get started!</p>
                        <JoinClassDialog />
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {enrolled.map((cls) => (
                            <Link href={`/dashboard/classes/${cls.code}`} key={cls.id}>
                                <GlassCard className="h-full hover:border-blue-500/50 transition-colors p-6 cursor-pointer group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                            <BookOpen className="w-6 h-6 text-blue-400" />
                                        </div>
                                        <div className="px-2 py-1 rounded-md bg-white/5 text-xs text-muted-foreground border border-white/10">
                                            Student
                                        </div>
                                    </div>
                                    <h4 className="font-bold text-lg mb-1">{cls.name}</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Teacher: {(cls as any).teacher?.name || "Unknown"}
                                    </p>
                                </GlassCard>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
