import { GlassCard } from "@/components/ui/glass-card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, BarChart, Save, Book, Clock } from "lucide-react"
import { createNoteAction, getNotes, createCourseAction, getStaffCourses } from "@/app/actions"
import { getStaffAlertsAction } from "@/app/actions-lms"
import { Users, Plus, Hash, Bell, AlertCircle } from "lucide-react"
import { Suspense } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// We make the content async to fetch data
async function StaffContent() {
  // Fetch real notes for the "Activity" feed
  const recentNotes = await getNotes()
  const uploads = recentNotes.slice(0, 5) // Last 5 uploads

  // Fetch courses
  const courses = await getStaffCourses()

  // Fetch alerts
  const { alerts } = await getStaffAlertsAction() || { alerts: [] }

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Staff Workspace</h1>
          <p className="text-muted-foreground">Manage notes and track student progress.</p>
        </div>
      </header>

      {/* Alerts Section - ONLY visible if there are alerts */}
      {alerts && alerts.length > 0 && (
        <GlassCard className="p-6 border-l-4 border-l-orange-500">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-orange-400">
            <Bell className="w-5 h-5" /> Student Alerts
          </h3>
          <div className="space-y-3">
            {alerts.map((alert: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                <AlertCircle className="w-5 h-5 text-orange-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-sm">
                    <span className="text-white">{alert.studentName}</span>
                    <span className="text-muted-foreground mx-1">has not completed</span>
                    <span className="text-orange-300">{alert.workTitle}</span>
                  </p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                    <span>{alert.courseName}</span>
                    {alert.type === 'MISSING_ASSIGNMENT' && (
                      <span>Due: {new Date(alert.date).toLocaleDateString()}</span>
                    )}
                    {alert.type === 'PENDING_QUIZ' && (
                      <span>Posted: {new Date(alert.date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}



      {/* Classes List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Hash className="w-6 h-6 text-primary" /> Active Classes
        </h2>
        {courses.length === 0 ? (
          <div className="p-10 border border-dashed border-white/10 rounded-xl text-center text-muted-foreground">
            No classes created yet. Create your first class above!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course: any) => (
              <GlassCard key={course.id} className="p-5 hover:bg-white/5 transition-all border-l-4 border-l-primary">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-bold text-lg">{course.name}</h4>
                    <p className="text-sm text-muted-foreground">{course.section}</p>
                  </div>
                  <div className="bg-primary/20 text-primary px-3 py-1 rounded-full font-mono text-sm font-bold">
                    {course.code}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-4">{course.description || "No description provided."}</p>
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Created {new Date(course.createdAt).toLocaleDateString()}</span>
                  <Link href={`/dashboard/classes/${course.code}`} className="text-primary hover:underline font-medium">Manage Class →</Link>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Analytics / Real Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart className="w-4 h-4 text-green-400" /> Recent Uploads
          </h3>
          <div className="space-y-4">
            {uploads.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes uploaded yet. Start publishing!</p>
            ) : (
              uploads.map((note: any) => (
                <div key={note.id} className="flex justify-between items-center text-sm p-2 hover:bg-white/5 rounded transition-colors">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Book className="w-4 h-4 text-primary shrink-0" />
                    <span className="truncate max-w-[200px]">{note.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground flex items-center shrink-0">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(note.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-6 flex flex-col justify-center items-center text-center">
          <div className="h-16 w-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
            <BarChart className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="font-semibold mb-2">Engagement Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Student engagement metrics and doubt heatmaps are calculated weekly.
            <br /><span className="text-xs opacity-50">(Next update: Monday)</span>
          </p>
        </GlassCard>
      </div>
    </div>
  )
}

export default function StaffDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading workspace...</div>}>
      <StaffContent />
    </Suspense>
  )
}
