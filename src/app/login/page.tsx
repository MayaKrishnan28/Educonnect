"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sendOtpAction, verifyOtpAction } from "@/app/actions"
import { GraduationCap, ArrowRight, KeyRound, Mail, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

export default function LoginPage() {
    const [role, setRole] = useState<"STUDENT" | "TEACHER">("STUDENT")
    const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL")
    const [email, setEmail] = useState("")
    const [isPending, startTransition] = useTransition()

    // Cooldown Logic
    const [lastSent, setLastSent] = useState<number>(0)
    const COOLDOWN_MS = 60000 // 1 minute client-side cooldown

    // Handle sending OTP
    async function handleSendOtp(formData: FormData) {
        const emailInput = formData.get("email") as string;

        if (!emailInput) {
            toast.error("Please enter your email")
            return
        }

        const now = Date.now()
        if (now - lastSent < COOLDOWN_MS) {
            const remaining = Math.ceil((COOLDOWN_MS - (now - lastSent)) / 1000)
            toast.error(`Please wait ${remaining}s before requesting again`)
            return
        }

        setEmail(emailInput);

        startTransition(async () => {
            try {
                const res = await sendOtpAction(emailInput, role);
                if (res.success) {
                    toast.success("Code sent! Check your inbox.")
                    setStep("OTP");
                    setLastSent(Date.now())
                } else {
                    toast.error(res.error || "Failed to send OTP")
                }
            } catch (error) {
                console.error(error)
                toast.error("An unexpected error occurred")
            }
        });
    }

    // Handle Verify OTP
    async function handleVerify(formData: FormData) {
        const codeInput = formData.get("code") as string;
        if (!codeInput || codeInput.length !== 6) {
            toast.error("Please enter a valid 6-digit code")
            return
        }

        startTransition(async () => {
            try {
                // Pass role again to verify/redirect correctly
                formData.append("role", role)
                const res = await verifyOtpAction(formData);

                // verifyOtpAction handles redirect on success. 
                // If we get a response object here, it implies failure (or we missed the redirect throw).
                if (!res?.success) {
                    toast.error(res?.error || "Verification failed")
                }
            } catch (error) {
                // Next.js Redirects throw "NEXT_REDIRECT" errors, we must let them pass.
                // We shouldn't catch them as 'errors' generally, but if it's a real error:
                console.error(error)
                // toast.error("Verification failed") 
                // Actually, if it redirects, this catch might not fire or it might. 
                // In Server Actions, redirect() throws.
            }
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-500/20 rounded-full blur-[100px] animate-pulse delay-700" />

            <GlassCard className="w-full max-w-md p-8 relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        {step === "EMAIL" ? "Secure Login" : "Enter Code"}
                    </h1>
                    <p className="text-muted-foreground">
                        {step === "EMAIL"
                            ? "Access limited to registered users"
                            : `We sent a code to ${email}`
                        }
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === "EMAIL" ? (
                        <motion.div
                            key="email-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <form action={handleSendOtp} className="space-y-4">
                                <div className="flex p-1 bg-white/5 rounded-lg mb-6">
                                    <button
                                        type="button"
                                        onClick={() => setRole("STUDENT")}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'STUDENT' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole("TEACHER")}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'TEACHER' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Teacher
                                    </button>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input name="email" type="email" placeholder="you@college.edu" required className="pl-10 bg-white/5 border-white/10" />
                                    </div>
                                </div>

                                <Button size="lg" className="w-full h-12 text-lg mt-6" type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Code <ArrowRight className="ml-2 w-4 h-4" /></>}
                                </Button>
                            </form>

                            <div className="mt-6 text-center text-xs text-muted-foreground">
                                Invalid email? <span className="text-red-400">Contact your administrator.</span>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="otp-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <form action={handleVerify} className="space-y-4">
                                <input type="hidden" name="email" value={email} />

                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">One-Time Password</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            name="code"
                                            placeholder="123456"
                                            className="pl-10 bg-white/5 border-white/10 text-center text-2xl tracking-[0.5em]"
                                            maxLength={6}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2 text-center">
                                        Code expires in 5 minutes
                                    </p>
                                </div>

                                <Button size="lg" className="w-full h-12 text-lg mt-6" type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Login"}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setStep("EMAIL")}
                                    className="w-full text-sm text-muted-foreground hover:text-foreground mt-4"
                                >
                                    Use a different email
                                </button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </div>
    )
}
