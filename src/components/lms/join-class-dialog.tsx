
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
import { Loader2, Users } from "lucide-react"
import { joinClassAction } from "@/app/actions-lms"

export function JoinClassDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [code, setCode] = useState("")

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const res = await joinClassAction(code.trim().toUpperCase())
            if (res.success) {
                setOpen(false)
                setCode("")
            } else {
                setError(res.error || "Failed to join")
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
                <Button variant="outline" className="border-white/10 bg-white/5 hover:bg-white/10">
                    <Users className="w-4 h-4 mr-2" />
                    Join Class
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle>Join a Class</DialogTitle>
                    <DialogDescription>
                        Enter the 6-character code provided by your staff.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="space-y-2">
                        <Label htmlFor="code">Class Code</Label>
                        <Input
                            id="code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.toUpperCase())}
                            placeholder="e.g. X7Y2Z9"
                            required
                            maxLength={6}
                            className="bg-zinc-900 border-white/10 font-mono text-center text-2xl tracking-widest uppercase"
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500">
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Join Class"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
