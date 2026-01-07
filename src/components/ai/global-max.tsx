"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"
import { AIOverlay } from "./ai-overlay"
import { motion, AnimatePresence } from "framer-motion"
import { usePathname } from "next/navigation"

export function GlobalMax() {
    const [isOpen, setIsOpen] = useState(false)
    const pathname = usePathname()

    // Don't show on login or landing page
    if (pathname === "/login" || pathname === "/") return null;

    return (
        <>
            <AnimatePresence>
                {!isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        className="fixed bottom-6 right-6 z-50"
                    >
                        <Button
                            size="lg"
                            className="h-14 w-14 rounded-full shadow-[0_0_20px_rgba(124,58,237,0.5)] bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 p-0"
                            onClick={() => setIsOpen(true)}
                        >
                            <Sparkles className="w-7 h-7 text-white" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AIOverlay
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                selectedText="" // No specific selection for global chat
            />
        </>
    )
}
