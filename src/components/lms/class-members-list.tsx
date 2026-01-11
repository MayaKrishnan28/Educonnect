"use client"

import { useState, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Crown, User } from "lucide-react"
import { getCourseMembersAction } from "@/app/actions-lms"

export function ClassMembersList({ courseId }: { courseId: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [members, setMembers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getCourseMembersAction(courseId).then(res => {
            if (res.success && res.members) {
                setMembers(res.members)
            }
            setLoading(false)
        })
    }, [courseId])

    if (loading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading members...</div>

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map((member, idx) => (
                <GlassCard key={member.id || member._id || idx} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors">
                    <Avatar className={`h-10 w-10 border ${member.isStaff ? 'border-yellow-500/50' : 'border-white/10'}`}>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`} />
                        <AvatarFallback>{member.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm truncate">{member.name}</h4>
                            {member.isStaff && (
                                <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                    <Crown className="w-3 h-3" /> Staff
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                    </div>
                </GlassCard>
            ))}
        </div>
    )
}
