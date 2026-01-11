"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, UserCheck, ShieldCheck, Loader2 } from "lucide-react"
import { switchRoleAction } from "@/app/actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function RoleSwitch({ currentRole, isCollapsed }: { currentRole?: string, isCollapsed?: boolean }) {
    const [isPending, setIsPending] = useState(false)

    const handleSwitch = async () => {
        setIsPending(true)
        try {
            const res = await switchRoleAction()
            if (res.success) {
                toast.success(`Switched to ${res.newRole} role`)
                // Next.js will re-render with the new cookie
                window.location.reload()
            } else {
                toast.error(res.error || "Failed to switch role")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setIsPending(false)
        }
    }

    const isStaff = currentRole === "STAFF"

    return (
        <Button
            variant="ghost"
            size={isCollapsed ? "icon" : "default"}
            className={cn(
                "w-full flex items-center justify-start gap-3 transition-all",
                isCollapsed && "justify-center",
                isStaff ? "text-purple-400 hover:text-purple-300 hover:bg-purple-500/10" : "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
            )}
            onClick={handleSwitch}
            disabled={isPending}
        >
            {isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : isStaff ? (
                <ShieldCheck className="w-5 h-5 text-purple-400" />
            ) : (
                <UserCheck className="w-5 h-5 text-emerald-400" />
            )}

            {!isCollapsed && (
                <div className="flex flex-col items-start leading-none gap-1">
                    <span className="text-sm font-medium">Switch to {isStaff ? "Student" : "Staff"}</span>
                    <span className="text-[10px] opacity-70">Current: {currentRole}</span>
                </div>
            )}
        </Button>
    )
}
