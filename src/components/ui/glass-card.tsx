"use client"

import { cn } from "@/lib/utils"
import { motion, HTMLMotionProps } from "framer-motion"
import { ReactNode } from "react"

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
    className?: string
    gradient?: boolean
    children?: ReactNode
}

export function GlassCard({ className, gradient, children, ...props }: GlassCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
            className={cn(
                "glass rounded-xl p-6 relative overflow-hidden",
                gradient && "bg-gradient-to-br from-white/10 to-white/5 dark:from-white/5 dark:to-transparent",
                className
            )}
            {...props}
        >
            {/* Glossy overlay effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-50 pointer-events-none" />

            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    )
}
