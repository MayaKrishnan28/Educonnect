
import { db } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { QuizInterface } from "@/components/lms/quiz-interface"
import { getSession } from "@/lib/auth"

export default async function StaffQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
    const session = await getSession()
    const userId = session?.userId
    if (!userId) redirect("/login")

    const { quizId } = await params

    const quiz = await db.collection('quiz').findOne({ id: quizId }) as any
    if (!quiz) notFound()

    // Manual hydration because we are not using an ORM
    quiz.questions = await db.collection('quiz').findOne({ id: quizId }).then(q => q?.questions || [])
    quiz.course = await db.collection('course').findOne({ id: quiz.courseId })

    const isStaff = quiz.course?.staffId === userId || quiz.course?.staffId?.toString() === userId

    if (!isStaff) {
        redirect(`/dashboard/quiz/${quizId}`)
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12">
            <QuizInterface quiz={quiz} basePath="/staff" />
        </div>
    )
}
