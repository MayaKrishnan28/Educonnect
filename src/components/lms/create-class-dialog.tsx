
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { createClassAction } from "@/app/actions-lms"

export function CreateClassDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    // Form state
    const [name, setName] = useState("")
    const [desc, setDesc] = useState("")
    const [subjectCode, setSubjectCode] = useState("")
    const [staffName, setStaffName] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await createClassAction(name, desc, subjectCode, staffName)
            if (res.success) {
                setOpen(false)
                setName("")
                setDesc("")
                setSubjectCode("")
                setStaffName("")
            } else {
                setError(res.error || "Failed")
            }
        } catch (e) {
            setError("Something went wrong")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Create a New Class</DialogTitle>
                    <DialogDescription>
                        Set up a space for your students. We'll generate a code for them to join.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="space-y-2">
                        <Label htmlFor="name">Class Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Advanced Physics"
                            required
                            className="bg-zinc-900 border-white/10"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="subjectCode">Subject Code</Label>
                            <Input
                                id="subjectCode"
                                value={subjectCode}
                                onChange={(e) => setSubjectCode(e.target.value)}
                                placeholder="e.g. PHY101"
                                required
                                className="bg-zinc-900 border-white/10"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="staffName">Staff Name</Label>
                            <Input
                                id="staffName"
                                value={staffName}
                                onChange={(e) => setStaffName(e.target.value)}
                                placeholder="e.g. Dr. Smith"
                                required
                                className="bg-zinc-900 border-white/10"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="desc">Description (Optional)</Label>
                        <Textarea
                            id="desc"
                            value={desc}
                            onChange={(e) => setDesc(e.target.value)}
                            placeholder="What will students learn?"
                            className="bg-zinc-900 border-white/10"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-500">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Class"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
