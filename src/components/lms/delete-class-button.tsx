"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Trash2, Loader2, AlertTriangle } from "lucide-react"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteCourseAction } from "@/app/actions-lms"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface DeleteClassButtonProps {
    courseId: string
    courseName: string
}

export function DeleteClassButton({ courseId, courseName }: DeleteClassButtonProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    const handleDelete = async () => {
        setLoading(true)
        try {
            const res = await deleteCourseAction(courseId)
            if (res.success) {
                toast.success("Class deleted successfully")
                router.push("/dashboard/classes")
            } else {
                toast.error(res.error || "Failed to delete class")
            }
        } catch (error) {
            toast.error("An error occurred")
        } finally {
            setLoading(false)
        }
    }

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2 bg-[#D15555] hover:bg-[#b04545] text-white border-0 font-medium rounded-lg h-12">
                    <Trash2 className="w-5 h-5 opacity-80" /> Delete Class
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-black/90 border-white/10 text-white">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="w-5 h-5" /> Danger Zone
                    </AlertDialogTitle>
                    <AlertDialogDescription asChild className="text-white/70">
                        <div className="text-sm">
                            Are you sure you want to delete <strong>{courseName}</strong>?
                            <br /><br />
                            This action cannot be undone. This will permanently delete the class and remove all associated data, including:
                            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                                <li>All Assignments and Submissions</li>
                                <li>All Quizzes and Results</li>
                                <li>All Class Notes</li>
                                <li>All Student Enrollments</li>
                            </ul>
                        </div>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel className="bg-white/5 border-white/10 hover:bg-white/10 text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-red-600 hover:bg-red-700 text-white border-0"
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Yes, Delete Class
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
