
"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Brain, Sparkles, Zap, GraduationCap, Users, Shield } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"

export default function AboutPage() {
    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    }

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Dynamic Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="max-w-6xl mx-auto px-6 py-20 relative z-10">
                <Link href="/">
                    <Button variant="ghost" className="mb-8 hover:bg-white/5 gap-2">
                        <ArrowLeft className="w-4 h-4" /> Back to Home
                    </Button>
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-3xl mx-auto mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        <span>Our Mission</span>
                    </div>
                    <h1 className="text-5xl font-bold tracking-tight mb-6 bg-gradient-to-br from-white via-white to-white/60 bg-clip-text text-transparent">
                        Empowering Every Student to Achieve More
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        EduConnect bridges the gap between traditional learning and modern technology.
                        We provide an intelligent, personalized, and collaborative environment where knowledge flows freely.
                    </p>
                </motion.div>

                <motion.div
                    variants={container}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <motion.div variants={item}>
                        <GlassCard className="h-full p-8">
                            <div className="h-12 w-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-6 text-purple-400">
                                <Brain className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">AI-Powered Companion</h3>
                            <p className="text-muted-foreground">
                                Meet Max, your personal AI tutor. Max explains complex concepts, analyzes your doubts, and helps you navigate your academic journey 24/7.
                            </p>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={item}>
                        <GlassCard className="h-full p-8">
                            <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-6 text-blue-400">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Smart Note Management</h3>
                            <p className="text-muted-foreground">
                                Upload your class notes and let our system organize them. Get instant summaries, key takeaways, and relevant revision material automatically.
                            </p>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={item}>
                        <GlassCard className="h-full p-8">
                            <div className="h-12 w-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-6 text-green-400">
                                <GraduationCap className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Personalized Timeline</h3>
                            <p className="text-muted-foreground">
                                Track your progress on a visual roadmap. See upcoming milestones, past achievements, and get recommendations on what to study next.
                            </p>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={item}>
                        <GlassCard className="h-full p-8">
                            <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center mb-6 text-orange-400">
                                <Users className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Collaborative Learning</h3>
                            <p className="text-muted-foreground">
                                Join class streams, share resources, and participate in global discussions. Learning is better when we do it together.
                            </p>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={item}>
                        <GlassCard className="h-full p-8">
                            <div className="h-12 w-12 rounded-xl bg-pink-500/20 flex items-center justify-center mb-6 text-pink-400">
                                <Shield className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
                            <p className="text-muted-foreground">
                                Your innovative ideas and personal data are protected with enterprise-grade security. We value your privacy above all.
                            </p>
                        </GlassCard>
                    </motion.div>

                    <motion.div variants={item} className="flex flex-col justify-center text-center">
                        <div className="p-8 rounded-3xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/10 h-full flex flex-col items-center justify-center group hover:bg-white/5 transition-colors cursor-pointer">
                            <h3 className="text-2xl font-bold mb-4">Ready to start?</h3>
                            <Link href="/login">
                                <Button size="lg" className="rounded-full px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                                    Get Started Now
                                </Button>
                            </Link>
                        </div>
                    </motion.div>

                </motion.div>
            </div>
        </div>
    )
}
