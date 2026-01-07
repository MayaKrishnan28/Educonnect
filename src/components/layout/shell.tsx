"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Menu, X, BookOpen, Clock, Activity, Settings, LogOut, GraduationCap, LayoutDashboard, School } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

interface SidebarItem {
    icon: React.ElementType
    label: string
    href: string
}

const items: SidebarItem[] = [
    { icon: LayoutDashboard, label: "Home", href: "/dashboard" },
    { icon: School, label: "Classes", href: "/dashboard/classes" },
    // Notes moved to within Classes
    { icon: Clock, label: "Timeline", href: "/dashboard/timeline" },
    { icon: Activity, label: "Insights", href: "/dashboard/insights" },
    { icon: Settings, label: "Settings", href: "/dashboard/settings" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true)
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-background text-foreground flex overflow-hidden selection:bg-primary/20">
            {/* Sidebar */}
            <motion.aside
                initial={false}
                animate={{ width: isOpen ? 240 : 80 }}
                className="glass border-r border-white/10 h-screen sticky top-0 flex flex-col z-40 hidden md:flex"
            >
                <div className="p-6 flex items-center justify-between">
                    <AnimatePresence mode="wait">
                        {isOpen ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                key="logo-full"
                                className="flex items-center gap-2 font-bold text-xl tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent"
                            >
                                <GraduationCap className="text-primary w-6 h-6" />
                                EduConnect
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                key="logo-icon"
                                className="mx-auto"
                            >
                                <GraduationCap className="text-primary w-6 h-6" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="flex-1 px-4 space-y-2 mt-4">
                    {items.map((item) => (
                        <Link href={item.href} key={item.label}>
                            <Button
                                variant="ghost"
                                className={cn(
                                    "w-full flex items-center justify-start gap-3 transition-all hover:bg-white/5",
                                    !isOpen && "justify-center px-0",
                                    pathname === item.href && "bg-primary/10 text-primary"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                {isOpen && <span>{item.label}</span>}
                            </Button>
                        </Link>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10">
                    <Link href="/login">
                        <Button variant="ghost" className={cn("w-full flex items-center gap-2 text-red-400 hover:text-red-300 hover:bg-red-500/10", !isOpen && "justify-center px-0")}>
                            <LogOut className="w-5 h-5" />
                            {isOpen && "Logout"}
                        </Button>
                    </Link>
                </div>

                {/* Toggle Button */}
                <div className="absolute -right-3 top-8">
                    <Button
                        size="icon"
                        className="h-6 w-6 rounded-full glass shadow-md"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="w-3 h-3" /> : <Menu className="w-3 h-3" />}
                    </Button>
                </div>
            </motion.aside>

            {/* Main Content */}
            <main className="flex-1 relative overflow-y-auto overflow-x-hidden no-scrollbar">
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-40 mix-blend-screen pointer-events-none" />
                <div className="p-8 max-w-7xl mx-auto space-y-8">
                    <header className="flex items-center justify-between mb-8 md:hidden">
                        <span className="font-bold">EduConnect</span>
                        <Menu className="w-6 h-6" />
                    </header>
                    {children}
                </div>
            </main>
        </div>
    )
}
