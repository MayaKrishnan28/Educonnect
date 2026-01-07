"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GlassCard } from "@/components/ui/glass-card"
import { CheckCircle2, XCircle, ArrowRight, BookOpen, AlertCircle } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import confetti from "canvas-confetti"
import Link from "next/link"
import { submitQuizAttemptAction } from "@/app/actions-lms"

interface Question {
    id: string
    text: string
    type: string // "MCQ" | "SHORT_ANSWER"
    options: string // JSON string array
    correctOption: number
    explanation: string | null
}

interface QuizInterfaceProps {
    quiz: {
        id: string
        title: string
        topic: string | null
        questions: Question[]
        course?: {
            id: string
            code: string
        } | null
    }
}

export function QuizInterface({ quiz }: QuizInterfaceProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [selectedOption, setSelectedOption] = useState<number | null>(null)
    const [isSubmitted, setIsSubmitted] = useState(false)
    const [score, setScore] = useState(0)
    const [showExplanation, setShowExplanation] = useState(false)
    const [answers, setAnswers] = useState<{ [key: string]: number }>({}) // questionId -> selectedOptionIndex

    if (!quiz.questions || quiz.questions.length === 0) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
                <GlassCard className="p-8 text-center space-y-6">
                    <AlertCircle className="w-16 h-16 mx-auto text-yellow-500/50" />
                    <h1 className="text-2xl font-bold">No Questions Found</h1>
                    <p className="text-muted-foreground">This quiz doesn't have any questions yet.</p>
                    <Link href={quiz.course ? `/dashboard/classes/${quiz.course.code}` : "/dashboard/classes"} className="w-full">
                        <Button className="w-full bg-purple-600 hover:bg-purple-500">
                            Back to Class
                        </Button>
                    </Link>
                </GlassCard>
            </div>
        )
    }

    const questionsCount = quiz.questions.length

    // RESULTS SCREEN
    if (currentIndex === questionsCount) {
        const percentage = Math.round((score / questionsCount) * 100)
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
                <GlassCard className="p-8 text-center space-y-6">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                        Quiz Completed!
                    </h1>

                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500" style={{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }} />
                        <div className="text-4xl font-bold">{percentage}%</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
                        <div className="bg-white/5 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Correct</div>
                            <div className="text-2xl font-bold text-emerald-400">{score}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total</div>
                            <div className="text-2xl font-bold">{questionsCount}</div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link href={quiz.course ? `/dashboard/classes/${quiz.course.code}` : "/dashboard/classes"} className="w-full">
                            <Button className="w-full bg-purple-600 hover:bg-purple-500">
                                Back to Class
                            </Button>
                        </Link>
                    </div>
                </GlassCard>
            </div>
        )
    }

    const currentQuestion = quiz.questions[currentIndex]
    const options = JSON.parse(currentQuestion.options) as string[]

    const handleOptionSelect = (index: number) => {
        if (isSubmitted) return
        setSelectedOption(index)
    }

    const handleSubmitAnswer = () => {
        if (selectedOption === null) return

        const isCorrect = selectedOption === currentQuestion.correctOption
        if (isCorrect) {
            setScore(prev => prev + 1)
            confetti({
                particleCount: 50,
                spread: 60,
                origin: { y: 0.7 },
                colors: ['#22c55e', '#4ade80']
            })
        }

        setAnswers(prev => ({ ...prev, [currentQuestion.id]: selectedOption }))
        setIsSubmitted(true)
        setShowExplanation(true)
    }

    const handleNextQuestion = () => {
        if (currentIndex < questionsCount - 1) {
            setCurrentIndex(prev => prev + 1)
            setSelectedOption(null)
            setIsSubmitted(false)
            setShowExplanation(false)
        } else {
            // Quiz Finished
            finishQuiz()
        }
    }

    const finishQuiz = async () => {
        // Save the attempt to the database
        try {
            await submitQuizAttemptAction(quiz.id, score)
        } catch (error) {
            console.error("Failed to submit quiz", error)
        }

        setCurrentIndex(questionsCount) // Show results screen
        confetti({
            particleCount: 200,
            spread: 100,
            origin: { y: 0.6 }
        })
    }

    // RESULTS SCREEN
    if (currentIndex === questionsCount) {
        const percentage = Math.round((score / questionsCount) * 100)
        return (
            <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500">
                <GlassCard className="p-8 text-center space-y-6">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                        Quiz Completed!
                    </h1>

                    <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                        <div className="absolute inset-0 rounded-full border-4 border-purple-500" style={{ clipPath: `inset(0 ${100 - percentage}% 0 0)` }} />
                        <div className="text-4xl font-bold">{percentage}%</div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-left max-w-sm mx-auto">
                        <div className="bg-white/5 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Correct</div>
                            <div className="text-2xl font-bold text-emerald-400">{score}</div>
                        </div>
                        <div className="bg-white/5 p-4 rounded-lg">
                            <div className="text-sm text-muted-foreground">Total</div>
                            <div className="text-2xl font-bold">{questionsCount}</div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Link href={quiz.course ? `/dashboard/classes/${quiz.course.code}` : "/dashboard/classes"} className="w-full">
                            <Button className="w-full bg-purple-600 hover:bg-purple-500">
                                Back to Class
                            </Button>
                        </Link>
                    </div>
                </GlassCard>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">{quiz.title}</h1>
                    <p className="text-muted-foreground text-sm">{quiz.topic}</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Question</div>
                    <div className="text-xl font-mono font-bold">
                        <span className="text-purple-400">{currentIndex + 1}</span>
                        <span className="text-white/30">/</span>
                        <span>{questionsCount}</span>
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex) / questionsCount) * 100}%` }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                />
            </div>

            <GlassCard className="p-8 min-h-[400px] flex flex-col relative overflow-hidden">
                {/* Question */}
                <h3 className="text-xl font-medium mb-8 leading-relaxed">
                    {currentQuestion.text}
                </h3>

                {/* Options */}
                <div className="space-y-3 flex-grow">
                    {options.map((option, idx) => {
                        const isSelected = selectedOption === idx
                        const isCorrect = idx === currentQuestion.correctOption

                        let variantClass = "hover:bg-white/5 border-white/10"
                        if (isSubmitted) {
                            if (isCorrect) variantClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-100" // Correct Answer
                            if (isSelected && !isCorrect) variantClass = "bg-red-500/20 border-red-500/50 text-red-100" // Wrong Selection
                            if (!isSelected && !isCorrect) variantClass = "opacity-50" // Irrelevant options
                        } else if (isSelected) {
                            variantClass = "bg-purple-500/20 border-purple-500 text-purple-100"
                        }

                        return (
                            <motion.div
                                key={idx}
                                whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                                onClick={() => handleOptionSelect(idx)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 flex items-center justify-between group ${variantClass}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border font-mono text-sm
                                        ${isSelected || (isSubmitted && isCorrect) ? 'border-transparent bg-white/20' : 'border-white/20 text-white/50 group-hover:border-white/40'}
                                    `}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span>{option}</span>
                                </div>

                                {isSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                                {isSubmitted && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                            </motion.div>
                        )
                    })}
                </div>

                {/* Explanation Reveal */}
                <AnimatePresence>
                    {showExplanation && currentQuestion.explanation && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6 p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-sm"
                        >
                            <div className="flex items-center gap-2 font-bold mb-1 text-indigo-400">
                                <AlertCircle className="w-4 h-4" /> Explanation
                            </div>
                            {currentQuestion.explanation}
                        </motion.div>
                    )}
                </AnimatePresence>

            </GlassCard>

            {/* Actions */}
            <div className="flex justify-end pt-4">
                {!isSubmitted ? (
                    <Button
                        size="lg"
                        onClick={handleSubmitAnswer}
                        disabled={selectedOption === null}
                        className="bg-white text-black hover:bg-white/90"
                    >
                        Submit Answer
                    </Button>
                ) : (
                    <Button
                        size="lg"
                        onClick={handleNextQuestion}
                        className="bg-purple-600 hover:bg-purple-500"
                    >
                        {currentIndex < questionsCount - 1 ? 'Next Question' : 'Finish Quiz'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                )}
            </div>
        </div>
    )
}
