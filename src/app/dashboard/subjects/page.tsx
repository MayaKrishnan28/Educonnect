import { GlassCard } from "@/components/ui/glass-card"
import { BookOpen, ArrowRight } from "lucide-react"
import { getSubjects } from "@/app/actions"
import Link from "next/link"

export default async function SubjectsPage() {
  const subjects = await getSubjects()

  // If no notes exist properly, use a fallback specific list for demo if DB is empty
  const displaySubjects = subjects.length > 0 ? subjects : [
    { name: "Computer Science", count: 0 },
    { name: "Mathematics", count: 0 }
  ]

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold">Subject Library</h1>
          <p className="text-muted-foreground">Browse notes by category.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displaySubjects.map((sub) => (
          <Link href={`/dashboard/subjects/${encodeURIComponent(sub.name)}`} key={sub.name}>
            <GlassCard className="p-6 hover:bg-white/5 transition-all cursor-pointer group border-white/5 hover:border-primary/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <BookOpen size={60} />
              </div>

              <div className="relative z-10">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 text-primary group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">{sub.name}</h3>
                <p className="text-muted-foreground text-sm">{sub.count} Notes Available</p>

                <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                  View Notes <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </GlassCard>
          </Link>
        ))}

        {subjects.length === 0 && (
          <GlassCard className="p-6 border-dashed flex flex-col items-center justify-center text-center text-muted-foreground md:col-span-3">
            <p>No subjects found. Ask a teacher to upload notes!</p>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
