import { QuizResultsTable } from "@/components/lms/quiz-results-table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function QuizResultsPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = await params
    const session = await getSession()

    if (!session || (session.role !== "TEACHER" && session.role !== "ADMIN")) {
        redirect("/dashboard")
    }

    return (
        <div className="space-y-6 container mx-auto py-6 max-w-5xl">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/classes">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Quiz Results</h1>
                    <p className="text-muted-foreground">View student performance and download reports.</p>
                </div>
            </div>

            <QuizResultsTable quizId={quizId} />
        </div>
    )
}
