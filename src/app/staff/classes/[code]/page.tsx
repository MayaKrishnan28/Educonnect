
import { db } from "@/lib/db"
import { ObjectId } from "mongodb"
import { redirect, notFound } from "next/navigation"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Users, BookOpen, Calendar, Plus, Sparkles, Lock } from "lucide-react"
import { format } from "date-fns"
import { CreateAssignmentDialog } from "@/components/lms/create-assignment-dialog"
import { CreateQuizDialog } from "@/components/lms/create-quiz-dialog"
import { CreateClassNoteDialog } from "@/components/lms/create-class-note-dialog"
import { StickyNote } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DeleteLMSItemButton } from "@/components/lms/delete-lms-item-button"
import { EditClassNoteDialog } from "@/components/lms/edit-class-note-dialog"
import { EditClassDialog } from "@/components/lms/edit-class-dialog"
import { ClassMembersList } from "@/components/lms/class-members-list"
import { DeleteClassButton } from "@/components/lms/delete-class-button"
import { deleteAssignmentAction, deleteQuizAction, deleteClassNoteAction } from "@/app/actions-lms"

import { getSession } from "@/lib/auth"

export default async function StaffClassPage({ params }: { params: Promise<{ code: string }> }) {
    const session = await getSession()
    const userId = session?.userId
    if (!userId) redirect("/login")

    const { code } = await params

    const classData = await db.collection('course').findOne({ code }) as any
    if (!classData) notFound()

    const classId = classData.id || classData._id.toString()
    classData.id = classId

    // Staff Lookup
    let staff = await db.collection('user').findOne({ id: classData.staffId })
    if (!staff) {
        try {
            staff = await db.collection('user').findOne({ _id: new ObjectId(classData.staffId) })
        } catch (e) { }
    }
    classData.staff = staff

    classData.assignments = await db.collection('assignment').find({ courseId: classId }).sort({ createdAt: -1 }).toArray()
    classData.quizzes = await db.collection('quiz').find({ courseId: classId }).sort({ createdAt: -1 }).toArray()
    classData.notes = await db.collection('note').find({ courseId: classId }).sort({ createdAt: -1 }).toArray()

    // Populate authors
    classData.notes = await Promise.all(classData.notes.map(async (note: any) => {
        let author = await db.collection('user').findOne({ id: note.authorId })
        if (!author) {
            try {
                author = await db.collection('user').findOne({ _id: new ObjectId(note.authorId) })
            } catch (e) { }
        }
        return { ...note, author: author || { name: "Unknown" } }
    }))

    classData._count = { enrollments: await db.collection('enrollment').countDocuments({ courseId: classId }) }

    const serializedClass = JSON.parse(JSON.stringify(classData))
    const isStaff = (serializedClass.staffId === userId) || (classData.staffId?.toString() === userId)

    if (!isStaff) {
        redirect(`/dashboard/classes/${code}`)
    }

    // Merge feed items
    const feedItems = [
        ...serializedClass.assignments.map((a: any) => ({ ...a, type: 'assignment' as const })),
        ...serializedClass.quizzes.map((q: any) => ({ ...q, type: 'quiz' as const }))
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Banner */}
            <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 p-8 flex flex-col justify-end shadow-2xl">
                <div className="absolute top-4 right-4 flex gap-2 items-center">
                    <EditClassDialog course={serializedClass} />
                    <div className="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-full font-mono text-sm border border-white/10 text-white">
                        Code: <strong>{serializedClass.code}</strong>
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">{serializedClass.name}</h1>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                    <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {serializedClass._count.enrollments} Students
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" /> Created {format(new Date(serializedClass.createdAt), 'MMM d, yyyy')}
                    </span>
                    <span>Staff: {serializedClass.staff?.name || "Unknown Staff"}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <Tabs defaultValue="stream" className="space-y-6">
                        <TabsList className="bg-purple-500/10 border border-purple-500/20 p-1">
                            <TabsTrigger value="stream" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Stream</TabsTrigger>
                            <TabsTrigger value="notes" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Class Notes</TabsTrigger>
                            <TabsTrigger value="members" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">Members</TabsTrigger>
                        </TabsList>

                        <TabsContent value="stream" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            {/* Actions Row */}
                            <div className="flex flex-wrap gap-4">
                                <CreateAssignmentDialog courseId={serializedClass.id}>
                                    <Button className="bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-500/20">
                                        <Plus className="w-4 h-4 mr-2" /> Post Assignment
                                    </Button>
                                </CreateAssignmentDialog>

                                <CreateQuizDialog courseId={serializedClass.id}>
                                    <Button variant="outline" className="border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10">
                                        <Sparkles className="w-4 h-4 mr-2" /> Create Quiz
                                    </Button>
                                </CreateQuizDialog>
                            </div>

                            {/* Stream Section */}
                            <div className="space-y-4">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <Calendar className="w-5 h-5 text-purple-400" /> &nbsp;Latest Updates
                                </h2>

                                {feedItems.length === 0 ? (
                                    <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                                        <p className="text-muted-foreground">No updates, assignments, or quizzes yet.</p>
                                    </div>
                                ) : (
                                    feedItems.map((item: any) => (
                                        <GlassCard key={item.id} className="p-6 hover:border-purple-500/30 transition-colors relative overflow-hidden group">
                                            <div className={`absolute top-0 left-0 w-1 h-full ${item.type === 'assignment' ? 'bg-purple-500' : 'bg-indigo-500'}`} />
                                            <div className="flex justify-between items-start pl-2">
                                                <div className="flex-grow">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        {item.type === 'assignment' ? (
                                                            <span className="text-[10px] uppercase tracking-wider font-bold bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded">Assignment</span>
                                                        ) : (
                                                            <span className="text-[10px] uppercase tracking-wider font-bold bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded flex items-center gap-1">
                                                                <Sparkles className="w-3 h-3" /> AI Quiz
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                                                        <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <DeleteLMSItemButton
                                                                id={item.id}
                                                                courseId={serializedClass.id}
                                                                itemName={item.type === 'assignment' ? "Assignment" : "Quiz"}
                                                                action={item.type === 'assignment' ? deleteAssignmentAction : deleteQuizAction}
                                                            />
                                                        </div>
                                                    </div>
                                                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 max-w-xl">
                                                        {item.type === 'assignment' ? (item as any).description : `Topic: ${(item as any).topic} • ${(item as any)._count?.questions || 0} Questions`}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-2 pt-2 border-t border-white/5 flex justify-end">
                                                {item.type === 'assignment' ? (
                                                    <Button variant="ghost" size="sm" className="hover:bg-white/5" disabled>
                                                        Review Submissions (Coming Soon)
                                                    </Button>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <Link href={`/staff/quiz/${item.id}/results`}>
                                                            <Button variant="outline" size="sm" className="hover:bg-white/5 border-purple-500/30 text-purple-300">
                                                                Results & Analytics
                                                            </Button>
                                                        </Link>
                                                        <Link href={`/staff/quiz/${item.id}`}>
                                                            <Button variant="ghost" size="sm" className="hover:bg-white/5">
                                                                Preview Quiz
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                        </GlassCard>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="notes" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-semibold flex items-center gap-2">
                                    <BookOpen className="w-5 h-5 text-emerald-400" /> Class Bookshelf
                                </h2>
                                <CreateClassNoteDialog courseId={serializedClass.id}>
                                    <Button className="bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/20">
                                        <StickyNote className="w-4 h-4 mr-2" /> Upload Note / File
                                    </Button>
                                </CreateClassNoteDialog>
                            </div>

                            {serializedClass.notes.length === 0 ? (
                                <div className="text-center py-12 border border-dashed border-white/10 rounded-lg">
                                    <p className="text-muted-foreground">No notes found for this class.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {serializedClass.notes.map((note: any) => (
                                        <div key={note.id} className="relative group/card h-full">
                                            <Link
                                                href={`/staff/notes/${note.id}`}
                                                className="block h-full"
                                            >
                                                <GlassCard className="p-4 hover:border-emerald-500/30 transition-all hover:scale-[1.01] cursor-pointer group h-full flex flex-col relative z-0">
                                                    <div className="flex justify-between items-start mb-2 pr-12">
                                                        <h3 className="font-bold text-lg group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                                                            {note.title}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground line-clamp-3 mb-4 flex-grow">
                                                        {note.summary || note.content || "Attached file."}
                                                    </p>
                                                    <div className="text-xs text-white/40 flex justify-between pt-4 border-t border-white/5 mt-auto">
                                                        <span className="flex items-center gap-1">
                                                            <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-[8px] font-bold text-emerald-400">
                                                                {note.author.name?.charAt(0) || 'U'}
                                                            </div>
                                                            {note.author.name?.split(' ')[0]}
                                                        </span>
                                                        <span>{format(note.createdAt, 'MMM d')}</span>
                                                    </div>
                                                </GlassCard>
                                            </Link>

                                            <div className="absolute top-2 right-2 flex gap-1 z-20 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                                <EditClassNoteDialog note={{ ...note, content: note.content || "" }} courseId={serializedClass.id} />
                                                <DeleteLMSItemButton
                                                    id={note.id}
                                                    courseId={serializedClass.id}
                                                    itemName="Note"
                                                    action={deleteClassNoteAction}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="members" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <ClassMembersList courseId={serializedClass.id} />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <GlassCard className="p-6 space-y-4">
                        <h3 className="font-semibold text-lg border-b border-white/10 pb-2">About Class</h3>
                        <p className="text-sm text-muted-foreground">
                            {serializedClass.description || "No description provided."}
                        </p>
                    </GlassCard>

                    <GlassCard className="p-6 space-y-4 border-red-500/20">
                        <h3 className="font-semibold text-lg text-red-400 border-b border-white/10 pb-2">Danger Zone</h3>
                        <p className="text-sm text-muted-foreground">
                            Deleting this class will remove all data permanently.
                        </p>
                        <DeleteClassButton courseId={serializedClass.id} courseName={serializedClass.name} />
                    </GlassCard>
                </div>
            </div>
        </div>
    )
}
