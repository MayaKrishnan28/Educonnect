
import { db as prisma } from "@/lib/db"
import { notFound, redirect } from "next/navigation"
import { QuizInterface } from "@/components/lms/quiz-interface"
// Helper to get userId wrapper since actions-lms getUserId is not exported or async
import { cookies } from "next/headers"

import { getSession } from "@/lib/auth"

export default async function QuizPage({ params }: { params: Promise<{ quizId: string }> }) {
    const session = await getSession()
    const userId = session?.userId
    if (!userId) redirect("/login")

    const { quizId } = await params

    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
            questions: true,
            course: {
                include: {
                    enrollments: {
                        where: { userId },
                        select: { id: true }
                    }
                }
            }
        }
    })

    if (!quiz) notFound()

    const isTeacher = quiz.course.teacherId === userId
    const isEnrolled = quiz.course.enrollments.length > 0

    if (!isTeacher && !isEnrolled) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[#0A0A0A] text-center space-y-4">
                <h1 className="text-2xl font-bold text-red-500">Access Denied</h1>
                <p className="text-gray-400">You must be enrolled in the class <strong>{quiz.course.name}</strong> to take this quiz.</p>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0A0A0A] text-white p-6 md:p-12">
            <QuizInterface quiz={quiz} />
        </div>
    )
}
