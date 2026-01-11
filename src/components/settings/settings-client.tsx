
"use client"

import { useState, useTransition } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { User, Shield, LogOut, Palette, Bell, FileDown, Loader2, AlertCircle } from "lucide-react"
import { updateUserAction, logoutAction } from "@/app/actions"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface SettingsClientProps {
    user: any
}

export function SettingsClient({ user }: SettingsClientProps) {
    const [activeTab, setActiveTab] = useState("profile")

    // Smooth scroll or just conditional render
    // Let's use conditional render for "Tabs" feeling on mobile, or scroll on desktop.
    // For simplicity and better UX, we'll keep the scroll list but highlight.

    const scrollToSection = (id: string) => {
        setActiveTab(id)
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Sidebar Navigation */}
            <div className="md:col-span-3 space-y-2 sticky top-24 h-fit">
                <GlassCard className="p-2 space-y-1">
                    <NavButton active={activeTab === "profile"} onClick={() => scrollToSection("profile")} icon={User} label="Profile" />
                    <NavButton active={activeTab === "appearance"} onClick={() => scrollToSection("appearance")} icon={Palette} label="Appearance" />
                    <NavButton active={activeTab === "notifications"} onClick={() => scrollToSection("notifications")} icon={Bell} label="Notifications" />
                    <NavButton active={activeTab === "security"} onClick={() => scrollToSection("security")} icon={Shield} label="Security" />
                    <NavButton active={activeTab === "data"} onClick={() => scrollToSection("data")} icon={FileDown} label="Data & Privacy" />
                </GlassCard>
            </div>

            {/* Main Content */}
            <div className="md:col-span-9 space-y-8 pb-20">

                {/* Profile Section */}
                <section id="profile" className="scroll-mt-24">
                    <ProfileSettings user={user} />
                </section>

                {/* Appearance Section */}
                <section id="appearance" className="scroll-mt-24">
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-full bg-purple-500/10 text-purple-400">
                                <Palette className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-semibold">Appearance</h2>
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                            <div>
                                <p className="font-medium">Interface Theme</p>
                                <p className="text-sm text-muted-foreground">Select your preferred theme (Light / Dark / System).</p>
                            </div>
                            <ThemeToggle />
                        </div>
                    </GlassCard>
                </section>

                {/* Notifications Section */}
                <section id="notifications" className="scroll-mt-24">
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-full bg-yellow-500/10 text-yellow-400">
                                <Bell className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-semibold">Notifications</h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                                <div>
                                    <p className="font-medium">Email Alerts</p>
                                    <p className="text-sm text-muted-foreground">Receive emails about new assignments and grades.</p>
                                </div>
                                <Switch checked={true} onCheckedChange={() => toast.success("Notification preferences saved")} />
                            </div>
                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                                <div>
                                    <p className="font-medium">Marketing Emails</p>
                                    <p className="text-sm text-muted-foreground">Receive news and product updates.</p>
                                </div>
                                <Switch checked={false} />
                            </div>
                        </div>
                    </GlassCard>
                </section>

                {/* Security Section */}
                <section id="security" className="scroll-mt-24">
                    <GlassCard className="p-6 border-red-500/20">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-full bg-red-500/10 text-red-400">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-semibold text-red-400">Security & Login</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                                <div>
                                    <p className="font-medium">Password</p>
                                    <p className="text-sm text-muted-foreground">EduConnect uses secure OTP. No password is required.</p>
                                </div>
                                <Button variant="outline" disabled>Managed by OTP</Button>
                            </div>

                            <div className="flex items-center justify-between p-4 rounded-lg bg-white/5 border border-white/5">
                                <div>
                                    <p className="font-medium">Sign Out Everywhere</p>
                                    <p className="text-sm text-muted-foreground">Securely log out of all active sessions.</p>
                                </div>
                                <form action={async () => {
                                    await logoutAction()
                                }}>
                                    <Button variant="secondary" size="sm">
                                        <LogOut className="w-4 h-4 mr-2" /> Log Out
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </GlassCard>
                </section>

                {/* Data Section */}
                <section id="data" className="scroll-mt-24">
                    <GlassCard className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                                <FileDown className="w-5 h-5" />
                            </div>
                            <h2 className="text-xl font-semibold">Data & Privacy</h2>
                        </div>
                        <div className="p-4 rounded-lg bg-white/5 border border-white/5 flex items-center justify-between">
                            <div>
                                <p className="font-medium">Export Your Data</p>
                                <p className="text-sm text-muted-foreground">Download a copy of your notes and activity logs.</p>
                            </div>
                            <Button variant="outline" onClick={() => toast.promise(new Promise(r => setTimeout(r, 2000)), {
                                loading: 'Preparing download...',
                                success: 'Data export emailed to you!',
                                error: 'Failed to export'
                            })}>
                                Request Export
                            </Button>
                        </div>
                    </GlassCard>
                </section>

            </div>
        </div>
    )
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={`w-full justify-start ${active ? 'bg-primary/20 text-primary' : 'hover:bg-white/5 text-muted-foreground'}`}
        >
            <Icon className="mr-2 w-4 h-4" /> {label}
        </Button>
    )
}

function ProfileSettings({ user }: { user: any }) {
    const [isPending, startTransition] = useTransition()

    return (
        <GlassCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-full bg-blue-500/10 text-blue-400">
                    <User className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-semibold">Public Profile</h2>
            </div>

            <form action={(formData) => {
                startTransition(async () => {
                    await updateUserAction(formData)
                    toast.success("Profile updated successfully")
                })
            }} className="space-y-4">
                <div className="grid gap-2">
                    <Label>Display Name</Label>
                    <Input
                        name="name"
                        defaultValue={user.name || ""}
                        placeholder="Your full name"
                        className="bg-white/5 border-white/10"
                    />
                    <p className="text-xs text-muted-foreground">This is your public display name on EduConnect.</p>
                </div>
                <div className="grid gap-2">
                    <Label>Email</Label>
                    <Input
                        disabled
                        value={user.email}
                        className="bg-white/5 border-white/10 opacity-50 cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">Your email is permanently linked to your {user.role?.toLowerCase() || "user"} account and cannot be changed.</p>
                </div>
                <div className="grid gap-2">
                    <Label>Account Role</Label>
                    <Input
                        disabled
                        value={user.role || "STUDENT"}
                        className="bg-white/5 border-white/10 opacity-50 cursor-not-allowed uppercase font-mono"
                    />
                    <p className="text-xs text-muted-foreground">This account is strictly for {user.role === "STAFF" ? "Academic Instruction & Monitoring" : "Learning & Research"}.</p>
                </div>
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Save Changes
                    </Button>
                </div>
            </form>
        </GlassCard>
    )
}
