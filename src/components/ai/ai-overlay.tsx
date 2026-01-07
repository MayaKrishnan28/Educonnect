
"use client"

import { useState, useEffect, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sparkles, Send, Brain, ArrowRight, History, MessageSquarePlus, Trash2, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { explainTextAction, chatWithAIAction } from "@/app/actions"
import { GlassCard } from "@/components/ui/glass-card"
import { format } from "date-fns"

interface AIOverlayProps {
    isOpen: boolean
    onClose: () => void
    selectedText: string
}

type ChatSession = {
    id: string
    title: string
    date: number
    content: string
}

export function AIOverlay({ isOpen, onClose, selectedText }: AIOverlayProps) {
    const [response, setResponse] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [query, setQuery] = useState("")
    const [historyOpen, setHistoryOpen] = useState(false)
    const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    // Load history on mount
    useEffect(() => {
        const saved = localStorage.getItem("max_history")
        if (saved) {
            try {
                setChatHistory(JSON.parse(saved))
            } catch (e) {
                console.error("Failed to parse history", e)
            }
        }
    }, [])

    // Save history whenever it changes
    useEffect(() => {
        localStorage.setItem("max_history", JSON.stringify(chatHistory))
    }, [chatHistory])

    // Auto-explain selection
    useEffect(() => {
        if (isOpen && selectedText) {
            handleNewChat()
            handleExplain()
        }
        // Don't auto-clear response here to allow history browsing
    }, [isOpen, selectedText])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [response, loading])

    const handleExplain = async () => {
        setLoading(true)
        try {
            const res = await explainTextAction(selectedText, "General Context")
            setResponse(res)
            addToHistory(`Explanation: ${selectedText.substring(0, 20)}...`, res)
        } catch (e) {
            setResponse("Failed to get explanation. Please try again.")
        }
        setLoading(false)
    }

    const handleSend = async () => {
        if (!query) return;
        setLoading(true)

        const userQuestion = query;
        const currentContent = response || ""
        const newSegment = `\n\n**You:** ${userQuestion}\n\n`

        setResponse(currentContent + newSegment)
        setQuery("")

        try {
            const aiAnswer = await chatWithAIAction(userQuestion, selectedText || "General context")
            const finalContent = currentContent + newSegment + `**AI:** ${aiAnswer}`
            setResponse(finalContent)

            // Update history for current session or create new
            updateCurrentHistory(finalContent, userQuestion)

        } catch (e) {
            setResponse(prev => (prev || "") + `**AI:** Sorry, I couldn't reach the server.`)
        }
        setLoading(false)
    }

    // History Logic
    const handleNewChat = () => {
        setResponse(null)
        setQuery("")
        setHistoryOpen(false)
    }

    const addToHistory = (title: string, content: string) => {
        const newSession: ChatSession = {
            id: crypto.randomUUID(),
            title: title,
            date: Date.now(),
            content: content
        }
        setChatHistory(prev => [newSession, ...prev])
    }

    const updateCurrentHistory = (content: string, lastUserQuery: string) => {
        // If we just started, create a new entry
        // For simplicity in this version, we'll just add a new entry if response was null, 
        // OR update the most recent one if it matches the current session.
        // A robust app would track sessionId. For now, let's treat "response not null" as "active session".

        setChatHistory(prev => {
            const now = Date.now()
            // If empty history or user explicitly started new, add new
            // We need a way to know if we are "in" a session.
            // Let's assume the top of the list is the current session if it's very recent (< 5 mins?) or we just keep updating the top one.
            // BETTER: Just always add a new session for the first message, and update it subsequent times.

            // Simplified: If we have response text, we are editing the latest session? 
            // Let's just create a new session if "response" was initially empty.
            // But we don't have that state here. 

            // Strategy: Always upsert to the top item if it's "Recent" (e.g. created/updated < 1 hour ago) 
            // AND we haven't switched chats.

            // Actually, let's just make "New Chat" create a blank slate.
            // When we send a message, if we have no ID tracker, we create one.
            // Since we don't track ID in state, let's shift to:
            // "History" is just a log of past convos. Current workspace is transient until saved?
            // No, let's auto-save.

            const existing = prev[0]
            if (existing && existing.content === (response || "")) {
                // If the content matches what we had before the update, update it properly
            }

            // Working Solution: Just Add New Entry for simplicity every time? No, that's spammy.
            // Let's rely on `addToHistory` only for the FIRST interaction, and then update `prev[0]`?

            if (prev.length > 0 && response && response.startsWith(prev[0].content)) {
                // We are appending to the latest
                const updated = [...prev]
                updated[0] = { ...updated[0], content: content, date: now }
                return updated
            } else {
                // New session
                return [{
                    id: crypto.randomUUID(),
                    title: lastUserQuery.substring(0, 30) || "New Chat",
                    date: now,
                    content: content
                }, ...prev]
            }
        })
    }

    const loadSession = (session: ChatSession) => {
        setResponse(session.content)
        setHistoryOpen(false)
    }

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        setChatHistory(prev => prev.filter(s => s.id !== id))
    }

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                    />

                    {/* Slide-over Panel */}
                    <motion.div
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full md:w-[450px] bg-zinc-950/95 backdrop-blur-xl border-l border-white/10 z-[60] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-white/10 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-2 text-purple-400 font-bold text-lg">
                                <Brain className="w-6 h-6" />
                                {historyOpen ? "History" : "Max 🤖"}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setHistoryOpen(!historyOpen)}
                                    className={historyOpen ? "bg-purple-500/20 text-purple-300" : ""}
                                >
                                    <History className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={handleNewChat} title="New Chat">
                                    <MessageSquarePlus className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={onClose}>
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Content Area */}
                        {historyOpen ? (
                            // HISTORY LIST VIEW
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                <h3 className="text-sm font-medium text-muted-foreground mb-2">Recent Chats</h3>
                                {chatHistory.length === 0 && (
                                    <p className="text-center text-sm text-muted-foreground py-10">No history yet.</p>
                                )}
                                {chatHistory.map(session => (
                                    <div
                                        key={session.id}
                                        onClick={() => loadSession(session)}
                                        className="group flex flex-col p-3 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 cursor-pointer transition-colors relative"
                                    >
                                        <div className="flex justify-between items-start">
                                            <span className="font-medium text-sm text-zinc-200 truncate pr-6">{session.title}</span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 absolute right-2 top-2 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                                onClick={(e) => deleteSession(e, session.id)}
                                            >
                                                <Trash2 className="w-3 h-3" />
                                            </Button>
                                        </div>
                                        <span className="text-xs text-zinc-500 mt-1">
                                            {format(session.date, 'MMM d, h:mm a')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // CHAT VIEW
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent custom-scrollbar"
                            >
                                {selectedText && (
                                    <div className="mb-6 p-4 rounded-lg bg-white/5 border-l-2 border-purple-500 italic text-muted-foreground text-sm">
                                        "{selectedText.substring(0, 100)}..."
                                    </div>
                                )}

                                {loading && !response && (
                                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                                        <Sparkles className="w-8 h-8 text-purple-400 animate-spin" />
                                        <p className="text-sm text-muted-foreground animate-pulse">Thinking...</p>
                                    </div>
                                )}

                                {!response && !loading && (
                                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                                        <Brain className="w-12 h-12 text-muted-foreground" />
                                        <p className="text-sm text-muted-foreground">Ask me anything!</p>
                                    </div>
                                )}

                                {response && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="space-y-4"
                                    >
                                        <GlassCard className="bg-purple-500/10 border-purple-500/20">
                                            <h3 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                                                <Sparkles className="w-4 h-4" /> Max says:
                                            </h3>
                                            <div className="prose prose-invert prose-sm max-w-none">
                                                {/* Simple formatting for line breaks and bold */}
                                                <div dangerouslySetInnerHTML={{
                                                    __html: response
                                                        .replace(/\n/g, '<br/>')
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                }} />
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                )}
                            </div>
                        )}

                        {/* Input Area */}
                        {!historyOpen && (
                            <div className="p-4 border-t border-white/10 bg-black/20 shrink-0">
                                <div className="space-y-2 mb-2">
                                    {/* Quick Suggestions (Only if empty) */}
                                    {!response && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                            <Button variant="outline" size="sm" onClick={() => setQuery("Explain this like I'm 5")} className="whitespace-nowrap bg-white/5 border-white/10 text-xs">
                                                Explain like I'm 5
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => setQuery("Give me a quiz")} className="whitespace-nowrap bg-white/5 border-white/10 text-xs">
                                                Give me a quiz
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Ask a follow-up question..."
                                        className="bg-white/5 border-white/10"
                                        value={query}
                                        onChange={(e) => setQuery(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                    />
                                    <Button size="icon" className="bg-purple-600 hover:bg-purple-500" onClick={handleSend} disabled={loading}>
                                        {loading ? <Sparkles className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    )
}
