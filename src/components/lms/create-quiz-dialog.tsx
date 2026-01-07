
"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Play } from "lucide-react"
import { generateQuizAction, createQuizAction, type QuestionInput } from "@/app/actions-lms"
import { ScrollArea } from "@/components/ui/scroll-area"

export function CreateQuizDialog({ courseId, children }: { courseId: string, children: React.ReactNode }) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<"SETUP" | "PREVIEW">("SETUP")
    const [loading, setLoading] = useState(false)
    const [generatedQuestions, setGeneratedQuestions] = useState<QuestionInput[]>([])

    const [topic, setTopic] = useState("")
    const [count, setCount] = useState("5")
    const [difficulty, setDifficulty] = useState("Medium")

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await generateQuizAction(topic, parseInt(count), difficulty)
            if (res.success && res.questions) {
                setGeneratedQuestions(res.questions)
                setStep("PREVIEW")
            } else {
                alert("Failed to generate quiz. Try again.")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleConfirm = async () => {
        setLoading(true)
        try {
            const res = await createQuizAction(
                courseId,
                `${topic} Quiz`,
                topic,
                generatedQuestions
            )
            if (res.success) {
                setOpen(false)
                // Reset state
                setStep("SETUP")
                setTopic("")
                setGeneratedQuestions([])
            } else {
                alert(res.error || "Failed to save quiz")
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] glass">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === "SETUP" ? "Create AI Quiz" : "Preview Questions"}
                        <Sparkles className="w-4 h-4 text-purple-400" />
                    </DialogTitle>
                    <DialogDescription>
                        {step === "SETUP" ? "Describe the topic and let Max generate the questions." : "Review the generated questions before posting."}
                    </DialogDescription>
                </DialogHeader>

                {step === "SETUP" ? (
                    <form onSubmit={handleGenerate} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label>Topic / Subject</Label>
                            <Input
                                required
                                placeholder="e.g., Photosynthesis, World War II..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Number of Questions</Label>
                                <Select value={count} onValueChange={setCount}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">3 Questions</SelectItem>
                                        <SelectItem value="5">5 Questions</SelectItem>
                                        <SelectItem value="10">10 Questions</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Difficulty</Label>
                                <Select value={difficulty} onValueChange={setDifficulty}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Easy">Easy</SelectItem>
                                        <SelectItem value="Medium">Medium</SelectItem>
                                        <SelectItem value="Hard">Hard</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={loading} className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="w-4 h-4 mr-2" />
                                        Generate with AI
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <ScrollArea className="h-[300px] rounded-md border border-white/10 p-4 bg-white/5">
                            <div className="space-y-6">
                                {generatedQuestions.map((q, i) => (
                                    <div key={i} className="space-y-2">
                                        <p className="font-medium text-sm">
                                            <span className="text-muted-foreground mr-2">{i + 1}.</span>
                                            {q.text}
                                        </p>
                                        <div className="grid grid-cols-2 gap-2 pl-6">
                                            {q.options.map((opt, idx) => (
                                                <div
                                                    key={idx}
                                                    className={`text-xs p-2 rounded border ${idx === q.correctOption ? "border-green-500/50 bg-green-500/10 text-green-300" : "border-transparent bg-white/5"}`}
                                                >
                                                    {opt}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <DialogFooter className="gap-2 sm:gap-0">
                            <Button variant="outline" onClick={() => setStep("SETUP")}>
                                Back
                            </Button>
                            <Button onClick={handleConfirm} disabled={loading} className="bg-green-600 hover:bg-green-500">
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post Quiz to Class"}
                            </Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
