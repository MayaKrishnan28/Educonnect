
import { getCurrentUser } from "@/app/actions"
import { redirect } from "next/navigation"
import { SettingsClient } from "@/components/settings/settings-client"

export default async function SettingsPage() {
    const user = await getCurrentUser()
    if (!user) redirect("/login")

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h1 className="text-3xl font-bold">Settings</h1>
                <p className="text-muted-foreground">Manage your account and preferences.</p>
            </div>
            <SettingsClient user={user} />
        </div>
    )
}
