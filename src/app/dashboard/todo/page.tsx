
"use client"

import { useState, useEffect } from "react"
import { getStudentTodoItemsAction } from "@/app/actions-lms"
import { GlassCard } from "@/components/ui/glass-card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { FileText, Sparkles, CheckCircle, Clock, AlertCircle } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

export default function TodoPage() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filterClass, setFilterClass] = useState("all")

    useEffect(() => {
        getStudentTodoItemsAction().then((res) => {
            if (res.success) {
                setItems(res.items)
            }
            setLoading(false)
        })
    }, [])

    const classes = Array.from(new Set(items.map(i => i.courseName)))

    const filteredItems = filterClass === "all"
        ? items
        : items.filter(i => i.courseName === filterClass)

    const assigned = filteredItems.filter(i => !i.isDone && !i.isMissing)
    const missing = filteredItems.filter(i => i.isMissing && !i.isDone)
    const done = filteredItems.filter(i => i.isDone)

    if (loading) {
        return <div className="p-8 text-center">Loading your tasks...</div>
    }

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">To-do</h1>
            </div>

            <div className="flex justify-end mb-4">
                <Select value={filterClass} onValueChange={setFilterClass}>
                    <SelectTrigger className="w-[180px] bg-white/5 border-white/10">
                        <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All classes</SelectItem>
                        {classes.map(c => (
                            <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <Tabs defaultValue="assigned" className="space-y-6">
                <TabsList className="bg-white/5 border border-white/10 p-1 w-full justify-start rounded-none border-b-0 border-l-0 border-r-0 border-t-0 bg-transparent h-auto gap-8">
                    <TabsTrigger
                        value="assigned"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500 data-[state=active]:bg-transparent data-[state=active]:text-blue-400 px-0 pb-2 text-base font-normal text-muted-foreground hover:text-white transition-colors"
                    >
                        Assigned ({assigned.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="missing"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-red-500 data-[state=active]:bg-transparent data-[state=active]:text-red-400 px-0 pb-2 text-base font-normal text-muted-foreground hover:text-white transition-colors"
                    >
                        Missing ({missing.length})
                    </TabsTrigger>
                    <TabsTrigger
                        value="done"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-green-500 data-[state=active]:bg-transparent data-[state=active]:text-green-400 px-0 pb-2 text-base font-normal text-muted-foreground hover:text-white transition-colors"
                    >
                        Done ({done.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="assigned" className="space-y-4">
                    {assigned.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No assigned work! 🎉</div>
                    ) : (
                        <TodoList items={assigned} />
                    )}
                </TabsContent>

                <TabsContent value="missing" className="space-y-4">
                    {missing.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No missing work! Great job. 👍</div>
                    ) : (
                        <TodoList items={missing} isMissing />
                    )}
                </TabsContent>

                <TabsContent value="done" className="space-y-4">
                    {done.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">No completed work yet. Get started! 🚀</div>
                    ) : (
                        <TodoList items={done} isDone />
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}

function TodoList({ items, isDone = false, isMissing = false }: { items: any[], isDone?: boolean, isMissing?: boolean }) {
    // Group "No due date" separately if needed, but for now simple list matching screenshot
    // Screenshot shows "No due date" items.

    return (
        <div className="space-y-1">
            {items.map((item) => (
                <Link
                    key={item.id}
                    href={item.type === 'assignment'
                        ? `/dashboard/classes/${item.courseId}/assignments/${item.id}`
                        : `/dashboard/quiz/${item.id}`
                    }
                    className="block group"
                >
                    <div className="flex items-center gap-4 p-4 rounded-lg hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                        <div className={`p-3 rounded-full ${item.type === 'assignment' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                            }`}>
                            {item.type === 'assignment' ? <FileText className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                        </div>

                        <div className="flex-grow min-w-0">
                            <h3 className="font-medium text-lg truncate group-hover:text-blue-400 transition-colors">
                                {item.title}
                            </h3>
                            <div className="flex gap-2 text-sm text-muted-foreground">
                                <span>{item.courseName}</span>
                                <span>•</span>
                                <span>
                                    {isDone
                                        ? `Turned in ${format(new Date(item.submittedAt || new Date()), 'MMM d')}`
                                        : item.dueDate
                                            ? <span className={isMissing ? "text-red-400 font-medium" : ""}>
                                                Due {format(new Date(item.dueDate), 'MMM d, h:mm a')}
                                            </span>
                                            : `Posted ${format(new Date(item.createdAt), 'MMM d, yyyy')}`
                                    }
                                </span>
                            </div>
                        </div>

                        {isDone && <CheckCircle className="w-5 h-5 text-green-500" />}
                        {isMissing && <AlertCircle className="w-5 h-5 text-red-500" />}
                    </div>
                </Link>
            ))}
        </div>
    )
}
