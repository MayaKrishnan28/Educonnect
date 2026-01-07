"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ArrowRight, Sparkles } from "lucide-react"
import { GlassCard } from "@/components/ui/glass-card"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <main className="z-10 text-center px-4 max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm mb-6 text-muted-foreground">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Next-Gen Learning Experience</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-white">
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">EduConnect</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            EduConnect is the intelligent companion for your academic journey.
            AI-powered notes, personalized timelines, and instant doubt resolution.
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/login">
              <Button size="lg" className="rounded-full px-8 text-lg h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/about">
              <Button variant="outline" size="lg" className="rounded-full px-8 text-lg h-12 glass hover:bg-white/10">
                Learn More
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Feature Preview */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <GlassCard className="hover:scale-105 transition-transform">
            <div className="h-10 w-10 rounded-lg bg-blue-500/20 flex items-center justify-center mb-4 text-blue-400">
              <Sparkles size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">AI Companion</h3>
            <p className="text-sm text-muted-foreground">Context-aware AI that explains topics and solves doubts instantly.</p>
          </GlassCard>
          <GlassCard className="hover:scale-105 transition-transform delay-100">
            <div className="h-10 w-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
              <Sparkles size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Smart Notes</h3>
            <p className="text-sm text-muted-foreground">Auto-generated summaries, formulas, and revision sheets.</p>
          </GlassCard>
          <GlassCard className="hover:scale-105 transition-transform delay-200">
            <div className="h-10 w-10 rounded-lg bg-green-500/20 flex items-center justify-center mb-4 text-green-400">
              <Sparkles size={20} />
            </div>
            <h3 className="font-semibold text-lg mb-2">Doubt Heatmaps</h3>
            <p className="text-sm text-muted-foreground">See where everyone is confused and get targeted help.</p>
          </GlassCard>
        </div>
      </main>
    </div>
  )
}
