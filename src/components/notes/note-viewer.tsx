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
    multiFileUrls?: string[] | null
    multiFileTypes?: string[] | null
    userRole?: string
}

export function NoteViewer({ id, title, content, rawContent, authorName, isAuthor, youtubeId, fileUrl, fileType, multiFileUrls, multiFileTypes, userRole }: NoteViewerProps) {
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
                mod.getHeatmapDataAction(id).then(pts => {
                    console.log("DEBUG: Heatmap Points Fetched:", pts)
                    setHeatmapPoints(pts)
                })
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
    const [copilotEnabled, setCopilotEnabled] = useState(true)

    useCopilot(contentRef, {
        noteId: id, // Pass ID for tracking
        enabled: copilotEnabled,
        dwellThreshold: 3000, // Reduced to 3s for testing
        // Disable "Ask Max" popup for students
        onStuck: userRole === "STUDENT" ? undefined : (context) => {
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
            {/* Premium Controls Overlay - Single Line Unified Layout */}
            <div className="absolute top-0 right-0 z-20">
                <div className="bg-[#0A0A0B]/80 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-2xl flex items-center gap-1.5">
                    {/* Student Tools: Study Copilot */}




                    {/* Doubt Heatmap */}
                    <button
                        onClick={() => setShowHeatmap(!showHeatmap)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${showHeatmap
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "text-gray-400 hover:text-white"
                            }`}
                    >
                        <Flame className={`w-4 h-4 ${showHeatmap ? "animate-pulse" : ""}`} />
                        <span className="text-[10px] font-bold uppercase tracking-tight">Heatmap</span>
                    </button>

                    {/* Revise Button (Student Only) */}
                    {userRole === "STUDENT" && (
                        <>
                            <div className="w-px h-4 bg-white/10 mx-0.5" />
                            <button
                                onClick={handleRevise}
                                disabled={isGeneratingRev}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 rounded-lg transition-all disabled:opacity-50"
                            >
                                <Zap className={`w-3.5 h-3.5 ${isGeneratingRev ? "animate-spin" : ""}`} />
                                <span className="text-[10px] font-bold uppercase tracking-tight">{isGeneratingRev ? "..." : "Revise"}</span>
                            </button>
                        </>
                    )}

                    {isAuthor && <div className="w-px h-4 bg-white/10 mx-0.5" />}

                    {/* Edit & Delete (Author Only) */}
                    {isAuthor && (
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors group"
                            >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Edit</span>
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-0.5" />
                            <button
                                onClick={handleDelete}
                                disabled={isPending}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors group"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold uppercase tracking-tight">{isPending ? "..." : "Delete"}</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <header className="mb-8 border-b border-white/10 pb-4 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{title}</h1>
                    <div className="flex gap-2 text-muted-foreground text-sm items-center">
                        <span className="font-medium text-white/80">By {authorName}</span>
                        <span>•</span>
                        <span>20 mins read</span>
                    </div>
                </div>
            </header>

            <div className="relative">
                {/* Media Embeds */}
                {youtubeId && (
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

                {/* Direct Video Upload Playback (Multiple Support & Legacy) */}
                {multiFileUrls ? multiFileUrls.map((url, index) => {
                    const type = multiFileTypes?.[index];
                    if (type === 'VIDEO') {
                        return (
                            <div key={`video-${index}`} className="mb-8 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                                <video
                                    src={url}
                                    controls
                                    className="w-full h-full"
                                    style={{ maxHeight: '600px' }}
                                />
                                <div className="p-3 bg-white/5 border-t border-white/10 text-xs text-gray-400 text-center italic">
                                    Video Lesson: {url.split('/').pop()?.split('-').slice(1).join('-')}
                                </div>
                            </div>
                        )
                    }
                    return null;
                }) : (fileUrl && fileType === 'VIDEO' && (
                    <div className="mb-8 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-black">
                        <video
                            src={fileUrl}
                            controls
                            className="w-full h-full"
                            style={{ maxHeight: '600px' }}
                        />
                    </div>
                ))}

                {/* Other File Attachments (Excluding Videos which are shown above) */}
                {(multiFileUrls && multiFileUrls.length > 0) ? (
                    <div className="space-y-3 mb-8">
                        {multiFileUrls.map((url, index) => {
                            const type = multiFileTypes?.[index] || 'FILE';
                            if (type === 'VIDEO') return null; // Skip video as it's handled above

                            const fileName = url.split('/').pop()?.split('-').slice(1).join('-') || 'Attachment';

                            return (
                                <div key={index} className="p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors shadow-lg shadow-black/20">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                            {type === 'IMAGE' ? (
                                                <Sparkles className="w-5 h-5" />
                                            ) : type === 'VIDEO' ? (
                                                <Zap className="w-5 h-5" />
                                            ) : (
                                                <StickyNote className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-white">{fileName}</p>
                                            <p className="text-xs text-muted-foreground uppercase tracking-tight">{type} Resource</p>
                                        </div>
                                    </div>
                                    <Button asChild size="sm" variant="ghost" className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10">
                                        <a href={url} target="_blank" rel="noopener noreferrer">View Resource</a>
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                ) : (fileUrl && fileType !== 'YOUTUBE' && fileType !== 'VIDEO') && (
                    <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/10 flex justify-between items-center group hover:bg-white/10 transition-colors shadow-lg shadow-black/20">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                {fileType === 'IMAGE' ? (
                                    <Sparkles className="w-6 h-6" />
                                ) : (
                                    <StickyNote className="w-6 h-6" />
                                )}
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
                                    className="absolute left-0 w-full h-[60px] bg-red-500/40 blur-3xl rounded-full mix-blend-screen"
                                    style={{ top: `${y * 100}%` }}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Floating AI Trigger */}
            <AnimatePresence>
                {selection && !showAI && userRole === "STUDENT" && (
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
