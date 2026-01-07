"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AIOverlay } from "@/components/ai/ai-overlay"
import { deleteNoteAction, updateNoteAction } from "@/app/actions"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Edit2, Trash2, Save, X, Lightbulb, Zap, StickyNote } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { useCopilot } from "@/hooks/use-copilot"
import { useRef } from "react"

import { createFlashcardsAction } from "@/app/actions-revision"
import { FlashcardDeck } from "@/components/notes/flashcard-deck"

// ... existing imports


interface NoteViewerProps {
    id: string
    title: string
    content: string
    rawContent: string
    authorName: string
    isAuthor: boolean
    youtubeId?: string | null
    fileUrl?: string | null
    fileType?: string | null
}

export function NoteViewer({ id, title, content, rawContent, authorName, isAuthor, youtubeId, fileUrl, fileType }: NoteViewerProps) {
    // Revision State
    const [isGeneratingRev, setIsGeneratingRev] = useState(false)
    const [flashcards, setFlashcards] = useState<any[] | null>(null)

    const handleRevise = async () => {
        setIsGeneratingRev(true)
        const res = await createFlashcardsAction(rawContent)
        setIsGeneratingRev(false)

        if (res.data) {
            setFlashcards(res.data)
        } else {
            toast.error("Could not generate flashcards.")
        }
    }

    const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null)
    const [showAI, setShowAI] = useState(false)
    const [showHeatmap, setShowHeatmap] = useState(false)

    // Edit Mode State
    const [isEditing, setIsEditing] = useState(false)
    const [editTitle, setEditTitle] = useState(title)
    const [editContent, setEditContent] = useState(rawContent)
    const [isPending, startTransition] = useTransition()
    const router = useRouter()

    // Real Heatmap Data
    const [heatmapPoints, setHeatmapPoints] = useState<number[]>([])

    // Fetch Heatmap on Toggle
    useEffect(() => {
        if (showHeatmap) {
            import("@/app/actions-heatmap").then(mod => {
                mod.getHeatmapDataAction(id).then(pts => setHeatmapPoints(pts))
            })
        }
    }, [showHeatmap, id])

    const handleDelete = () => {
        if (!confirm("Are you sure you want to delete this note?")) return;
        startTransition(async () => {
            await deleteNoteAction(id)
        })
    }

    const handleSave = () => {
        startTransition(async () => {
            await updateNoteAction(id, editTitle, editContent)
            setIsEditing(false)
        })
    }

    const handleSelection = () => {
        if (isEditing) return; // Disable AI selection during edit
        const sel = window.getSelection()
        if (sel && sel.toString().trim().length > 0) {
            const range = sel.getRangeAt(0)
            const rect = range.getBoundingClientRect()

            setSelection({
                text: sel.toString(),
                x: rect.left + rect.width / 2,
                y: rect.top - 10
            })
        }
    }

    // Copilot Logic
    const contentRef = useRef<HTMLDivElement>(null)
    const [copilotEnabled, setCopilotEnabled] = useState(false)

    useCopilot(contentRef, {
        noteId: id, // Pass ID for tracking
        enabled: copilotEnabled,
        dwellThreshold: 15000,
        onStuck: (context) => {
            toast("You seem to be focusing on this section...", {
                description: "Want a simpler explanation?",
                action: {
                    label: "Ask Max",
                    onClick: () => {
                        setSelection({
                            text: context,
                            x: window.innerWidth / 2,
                            y: window.innerHeight / 2
                        })
                        setShowAI(true)
                    }
                },
                duration: 8000,
                icon: <Lightbulb className="w-5 h-5 text-yellow-500" />
            })
        }
    })

    useEffect(() => {
        const fn = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest('.ai-trigger')) return;
            if (document.getSelection()?.isCollapsed) {
                setSelection(null)
            }
        }
        document.addEventListener('mouseup', handleSelection)
        document.addEventListener('mousedown', fn)
        return () => {
            document.removeEventListener('mouseup', handleSelection)
            document.removeEventListener('mousedown', fn)
        }
    }, [isEditing]) // Removed selection dependency to avoid loop

    if (isEditing) {
        return (
            <div className="space-y-4 animate-in fade-in">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Edit Note</h2>
                    <div className="flex gap-2">
                        <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={isPending}>
                            <X className="w-4 h-4 mr-2" /> Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isPending} className="bg-green-600 hover:bg-green-500">
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                        </Button>
                    </div>
                </div>
                <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="text-2xl font-bold bg-white/5 border-white/10 p-6 h-16"
                    placeholder="Note Title"
                />
                <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[500px] font-mono text-lg bg-white/5 border-white/10 leading-relaxed"
                    placeholder="Markdown content..."
                />
            </div>
        )
    }

    return (
        <div className="relative min-h-[500px]">
            {/* Author Controls */}
            {isAuthor && (
                <div className="absolute top-0 right-0 flex gap-2 z-20">
                    <Button size="sm" variant="ghost" className="text-blue-400 hover:bg-blue-500/10" onClick={() => setIsEditing(true)}>
                        <Edit2 className="w-4 h-4 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-400 hover:bg-red-500/10" onClick={handleDelete} disabled={isPending}>
                        <Trash2 className="w-4 h-4 mr-1" /> {isPending ? "Deleting..." : "Delete"}
                    </Button>
                </div>
            )}

            <header className="mb-8 border-b border-white/10 pb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{title}</h1>
                    <div className="flex gap-2 text-muted-foreground text-sm items-center">
                        <span className="font-medium text-white/80">By {authorName}</span>
                        <span>•</span>
                        <span>20 mins read</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-full border border-white/10">
                        <Switch id="copilot" checked={copilotEnabled} onCheckedChange={setCopilotEnabled} />
                        <label htmlFor="copilot" className="text-sm font-medium cursor-pointer flex items-center gap-1.5 select-none">
                            <Sparkles className={`w-3.5 h-3.5 ${copilotEnabled ? "text-purple-400" : "text-muted-foreground"}`} />
                            Study Copilot
                        </label>
                    </div>

                    <Button
                        variant="ghost"
                        className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/20"
                        onClick={handleRevise}
                        disabled={isGeneratingRev}
                    >
                        <Zap className={`w-4 h-4 mr-2 ${isGeneratingRev ? "animate-spin" : ""}`} />
                        {isGeneratingRev ? "Creating..." : "Revise"}
                    </Button>

                    <Button
                        variant="outline"
                        className={showHeatmap ? "bg-red-500/20 text-red-400 border-red-500/50" : ""}
                        onClick={() => setShowHeatmap(!showHeatmap)}
                    >
                        <Flame className="w-4 h-4 mr-2" />
                        {showHeatmap ? "Hide Heatmap" : "Doubt Heatmap"}
                    </Button>
                </div>
            </header>

            <div className="relative">
                {/* Media Embeds */}
                {fileType === 'YOUTUBE' && youtubeId && (
                    <div className="mb-8 rounded-xl overflow-hidden shadow-2xl border border-white/10 aspect-video relative bg-black">
                        <iframe
                            width="100%"
                            height="100%"
                            src={`https://www.youtube.com/embed/${youtubeId}`}
                            title={title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                        ></iframe>
                    </div>
                )}

                {/* Other File Attachments */}
                {fileUrl && fileType !== 'YOUTUBE' && (
                    <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/20 rounded-lg text-blue-400">
                                <StickyNote className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="font-semibold text-white">Attached Resource</p>
                                <p className="text-sm text-muted-foreground">{fileType} File</p>
                            </div>
                        </div>
                        <Button asChild variant="secondary">
                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">Download / View</a>
                        </Button>
                    </div>
                )}

                <div
                    ref={contentRef}
                    className="prose prose-invert max-w-none text-lg leading-relaxed text-gray-300 relative z-10"
                    dangerouslySetInnerHTML={{ __html: content }}
                />

                {/* Live Heatmap Overlay */}
                <AnimatePresence>
                    {showHeatmap && heatmapPoints.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 z-0 pointer-events-none w-full h-full"
                        >
                            {heatmapPoints.map((y, i) => (
                                <div
                                    key={i}
                                    className="absolute left-0 w-full h-[60px] bg-red-500/10 blur-xl rounded-full mix-blend-screen"
                                    style={{ top: `${y * 100}%` }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating AI Trigger */}
            <AnimatePresence>
                {selection && !showAI && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="fixed z-50 ai-trigger"
                        style={{ left: selection.x, top: selection.y, transform: 'translateX(-50%) translateY(-100%)' }}
                    >
                        <Button
                            size="sm"
                            className="rounded-full shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white border-0"
                            onClick={() => setShowAI(true)}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Ask AI
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <AIOverlay
                isOpen={showAI}
                onClose={() => setShowAI(false)}
                selectedText={selection?.text || ""}
            />

            {/* Flashcard Deck Overlay */}
            <AnimatePresence>
                {flashcards && (
                    <FlashcardDeck cards={flashcards} onClose={() => setFlashcards(null)} />
                )}
            </AnimatePresence>
        </div>
    )
}
