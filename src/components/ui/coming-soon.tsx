"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Construction, Sparkles, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { motion } from "framer-motion"

interface ComingSoonProps {
    title: string
    description: string
    icon?: React.ElementType
}

export function ComingSoon({ title, description, icon: Icon = Construction }: ComingSoonProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-4">
            <GlassCard className="max-w-md w-full p-8 flex flex-col items-center relative overflow-hidden group">

                {/* Background Gradients */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-all duration-1000" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl group-hover:bg-purple-500/20 transition-all duration-1000" />

                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="h-20 w-20 bg-white/5 rounded-2xl flex items-center justify-center mb-6 border border-white/10 shadow-xl"
                >
                    <Icon className="w-10 h-10 text-primary/80" />
                </motion.div>

                <h1 className="text-3xl font-bold mb-3 tracking-tight bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                    {title}
                </h1>

                <p className="text-muted-foreground mb-8 leading-relaxed">
                    {description}
                    <br />
                    <span className="text-xs uppercase tracking-widest opacity-60 mt-2 block">Work in Progress</span>
                </p>

                <Link href="/dashboard">
                    <Button variant="outline" className="glass hover:bg-white/10 group">
                        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                        Return to Dashboard
                    </Button>
                </Link>
            </GlassCard>
        </div>
    )
}
