import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, BarChart, Save, Book, Clock } from "lucide-react"
import { createNoteAction, getNotes } from "@/app/actions"
import { Suspense } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// We make the content async to fetch data
async function TeacherContent() {
  // Fetch real notes for the "Activity" feed
  const recentNotes = await getNotes()
  const uploads = recentNotes.slice(0, 5) // Last 5 uploads

  return (
    <div className="space-y-8 animate-in fade-in">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teacher Workspace</h1>
          <p className="text-muted-foreground">Manage notes and track student progress.</p>
        </div>
      </header>

      {/* Upload/Create Section */}
      <GlassCard className="p-6">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-blue-400" /> Create New Note
        </h3>
        <form action={createNoteAction} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Topic / Title</label>
              <Input name="title" placeholder="e.g. Introduction to Thermodynamics" required className="bg-white/5 border-white/10" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Subject</label>
              <Select name="subject" defaultValue="General">
                <SelectTrigger className="bg-white/5 border-white/10">
                  <SelectValue placeholder="Select Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="General">General</SelectItem>
                  <SelectItem value="Computer Science">Computer Science</SelectItem>
                  <SelectItem value="Mathematics">Mathematics</SelectItem>
                  <SelectItem value="Physics">Physics</SelectItem>
                  <SelectItem value="History">History</SelectItem>
                  <SelectItem value="Chemistry">Chemistry</SelectItem>
                  <SelectItem value="Literature">Literature</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Content (Markdown supported)</label>
            <Textarea
              name="content"
              placeholder="# Chapter 1..."
              required
              className="min-h-[200px] font-mono text-sm bg-white/5 border-white/10"
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-500">
              <Save className="w-4 h-4 mr-2" /> Publish Note & Generate AI Summary
            </Button>
          </div>
        </form>
      </GlassCard>

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
              uploads.map((note) => (
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

export default function TeacherDashboard() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading workspace...</div>}>
      <TeacherContent />
    </Suspense>
  )
}
