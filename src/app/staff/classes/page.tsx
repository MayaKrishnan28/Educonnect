
import { getUserClassesAction } from "@/app/actions-lms"
import { ObjectId } from "mongodb"
import { db } from "@/lib/db"
import { GlassCard } from "@/components/ui/glass-card"
import { BookOpen, School, Users } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { CreateClassDialog } from "@/components/lms/create-class-dialog"
import { getSession } from "@/lib/auth"

export default async function StaffClassesPage() {
    const session = await getSession()
    const userId = session?.userId
    if (!userId) redirect("/login")

    // Fetch User Role
    const userDoc = await db.collection('user').findOne({ _id: new ObjectId(userId) })
    const user = JSON.parse(JSON.stringify(userDoc))

    if (user?.role !== "STAFF" && user?.role !== "ADMIN") {
        redirect("/dashboard/classes")
    }

    const { teaching } = await getUserClassesAction()

    return (
        <div className="space-y-8 p-8 pt-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
                        Staff's Classroom
                    </h2>
                    <p className="text-muted-foreground">
                        Manage your classes and assignments
                    </p>
                </div>
                <div className="flex gap-2">
                    <CreateClassDialog />
                </div>
            </div>

            {/* Teaching Section */}
            {teaching.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <School className="w-5 h-5 text-purple-400" />
                        Teaching Classes
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {teaching.map((cls: any) => (
                            <Link href={`/staff/classes/${cls.code}`} key={cls.id}>
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
            ) : (
                <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                    <p className="text-muted-foreground">No classes found.</p>
                </div>
            )}
        </div>
    )
}
