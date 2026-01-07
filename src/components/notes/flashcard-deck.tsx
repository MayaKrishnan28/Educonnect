"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, RotateCw, CheckCircle2 } from "lucide-react"

interface Flashcard {
    front: string
    back: string
}

interface FlashcardDeckProps {
    cards: Flashcard[]
    onClose: () => void
}

export function FlashcardDeck({ cards, onClose }: FlashcardDeckProps) {
    const [index, setIndex] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)
    const [direction, setDirection] = useState(0) // -1 left, 1 right

    const currentCard = cards[index]

    const handleNext = () => {
        if (index < cards.length - 1) {
            setDirection(1)
            setIsFlipped(false)
            setIndex(index + 1)
        }
    }

    const handlePrev = () => {
        if (index > 0) {
            setDirection(-1)
            setIsFlipped(false)
            setIndex(index - 1)
        }
    }

    const handleFlip = () => setIsFlipped(!isFlipped)

    const variants = {
        enter: (dir: number) => ({
            x: dir > 0 ? 300 : -300,
            opacity: 0,
            scale: 0.8
        }),
        center: {
            x: 0,
            opacity: 1,
            scale: 1,
            transition: { duration: 0.4, type: "spring" }
        },
        exit: (dir: number) => ({
            x: dir > 0 ? -300 : 300,
            opacity: 0,
            scale: 0.8,
            transition: { duration: 0.3 }
        })
    } as any;

    return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm p-6">
            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                <span className="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">Smart Revision</span>
                <span className="text-sm font-normal text-muted-foreground bg-white/10 px-3 py-1 rounded-full">
                    {index + 1} / {cards.length}
                </span>
            </h2>

            <div className="relative w-full max-w-xl h-96 perspective-1000">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                    <motion.div
                        key={index}
                        custom={direction}
                        variants={variants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        className="w-full h-full cursor-pointer relative preserve-3d"
                        onClick={handleFlip}
                        style={{ perspective: 1000 }}
                    >
                        <motion.div
                            className="w-full h-full bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col items-center justify-center p-8 text-center absolute inset-0 backface-hidden"
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Concept</h3>
                            <p className="text-3xl font-bold text-white leading-relaxed">{currentCard.front}</p>
                            <div className="absolute bottom-6 text-sm text-white/50 flex items-center gap-2">
                                <RotateCw className="w-4 h-4" /> Click to flip
                            </div>
                        </motion.div>

                        <motion.div
                            className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-3xl backdrop-blur-md shadow-2xl flex flex-col items-center justify-center p-8 text-center absolute inset-0 backface-hidden"
                            initial={{ rotateY: 180 }}
                            animate={{ rotateY: isFlipped ? 360 : 180 }}
                            transition={{ duration: 0.6, type: "spring" }}
                            style={{ backfaceVisibility: 'hidden' }}
                        >
                            <h3 className="text-sm uppercase tracking-widest text-blue-300 mb-4">Explanation</h3>
                            <p className="text-xl font-medium text-white leading-relaxed">{currentCard.back}</p>
                            <div className="absolute bottom-6 text-sm text-blue-300/50 flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4" /> Mastered
                            </div>
                        </motion.div>
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-6 mt-12">
                <Button variant="outline" size="lg" onClick={handlePrev} disabled={index === 0} className="rounded-full h-12 w-12 p-0">
                    <ChevronLeft className="w-6 h-6" />
                </Button>

                <Button variant="ghost" className="text-muted-foreground hover:text-white" onClick={onClose}>
                    End Session
                </Button>

                <Button size="lg" onClick={handleNext} disabled={index === cards.length - 1} className="rounded-full h-12 w-12 p-0 bg-primary hover:bg-primary/90">
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>
        </div>
    )
}
