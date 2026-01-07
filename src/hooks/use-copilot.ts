
import { useState, useEffect, useRef, RefObject } from "react"
import { logDwellAction } from "@/app/actions-heatmap"

interface CopilotOptions {
    noteId: string
    enabled: boolean
    dwellThreshold?: number // ms to trigger help (default 30000)
    onStuck?: (context: string) => void
}

export function useCopilot(contentRef: RefObject<HTMLElement>, options: CopilotOptions) {
    const { noteId, enabled, dwellThreshold = 30000, onStuck } = options

    // Internal state
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const activeContextRef = useRef<string>("") // Use ref for access inside closure

    // Function to confirm context and calculate position
    const getContextAndPosition = () => {
        if (!contentRef.current) return { text: "", yPct: 0 };

        const paragraphs = contentRef.current.querySelectorAll('p, li, h2, h3')
        let bestCandidate = ""
        let maxVisibility = 0

        // Calculate scroll percentage relative to content height
        const scrollY = window.scrollY
        const docHeight = document.documentElement.scrollHeight - window.innerHeight
        const yPct = docHeight > 0 ? scrollY / docHeight : 0

        paragraphs.forEach((el) => {
            const rect = el.getBoundingClientRect()
            const viewportHeight = window.innerHeight
            const overlapTop = Math.max(rect.top, viewportHeight * 0.25)
            const overlapBottom = Math.min(rect.bottom, viewportHeight * 0.75)
            const visibleHeight = Math.max(0, overlapBottom - overlapTop)

            if (visibleHeight > maxVisibility) {
                maxVisibility = visibleHeight
                bestCandidate = el.textContent || ""
            }
        })

        return { text: bestCandidate, yPct }
    }

    // Scroll Handler
    useEffect(() => {
        if (!enabled) return;

        const handleScroll = () => {
            // Reset timer on scroll
            if (timerRef.current) {
                clearTimeout(timerRef.current)
                timerRef.current = null
            }

            // Start new dwell timer
            timerRef.current = setTimeout(() => {
                const { text, yPct } = getContextAndPosition()

                if (text && text.length > 50) {
                    // 1. Trigger AI Help
                    if (onStuck) onStuck(text)

                    // 2. Log to Heatmap (Real Live Data)
                    // Fire and forget - don't await
                    logDwellAction(noteId, yPct).catch(err => console.error(err))
                }
            }, dwellThreshold)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll() // Initial start

        return () => {
            window.removeEventListener('scroll', handleScroll)
            if (timerRef.current) clearTimeout(timerRef.current)
        }
    }, [enabled, dwellThreshold, noteId, onStuck]) // Refs not needed in deps

    return {}
}
