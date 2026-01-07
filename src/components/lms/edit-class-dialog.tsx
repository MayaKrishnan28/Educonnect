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
import { updateClassDetailsAction } from "@/app/actions-lms"
import { Loader2, Settings } from "lucide-react"
import { useRouter } from "next/navigation"

interface EditClassDialogProps {
    course: {
        id: string
        name: string
        description: string | null
    }
}

export function EditClassDialog({ course }: EditClassDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsLoading(true)

        const formData = new FormData(e.currentTarget)
        formData.append("courseId", course.id)

        const res = await updateClassDetailsAction(formData)

        if (res.success) {
            setOpen(false)
            router.refresh()
        } else {
            console.error(res.error)
            // Ideally show a toast here
        }
        setIsLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="absolute top-4 right-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full z-10 transition-colors">
                    <Settings className="w-5 h-5" />
                    <span className="sr-only">Edit Class Settings</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Class Details</DialogTitle>
                    <DialogDescription>
                        Update the name and description of your class.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                defaultValue={course.name}
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">
                                About
                            </Label>
                            <Textarea
                                id="description"
                                name="description"
                                defaultValue={course.description || ""}
                                className="col-span-3"
                                placeholder="What is this class about?"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading} className="bg-purple-600 hover:bg-purple-700">
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
