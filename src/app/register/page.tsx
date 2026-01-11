"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { sendOtpAction, verifyOtpAction, checkEmailAction } from "@/app/actions"
import { GraduationCap, ArrowRight, KeyRound, Mail, Loader2, User, ShieldCheck, Eye, EyeOff } from "lucide-react"
import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import Link from "next/link"

export default function RegisterPage() {
    const [role, setRole] = useState<"STUDENT" | "STAFF">("STUDENT")
    const [step, setStep] = useState<"INFO" | "OTP" | "PASSWORD">("INFO")
    const [email, setEmail] = useState("")
    const [name, setName] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Step 1: Submit Name & Email
    async function handleInfoSubmit(formData: FormData) {
        const emailInput = formData.get("email") as string;
        const nameInput = formData.get("name") as string;

        if (!emailInput || !nameInput) {
            toast.error("Please fill in all fields")
            return
        }

        setEmail(emailInput);
        setName(nameInput);

        startTransition(async () => {
            try {
                // Check if user already exists
                const check = await checkEmailAction(emailInput);
                if (check.exists) {
                    toast.error("Account already exists. Please login instead.");
                    return;
                }

                // Send OTP
                const res = await sendOtpAction(emailInput, role, nameInput);
                if (res.success) {
                    toast.success("Verification code sent to your email!");
                    setStep("OTP");
                } else {
                    toast.error(res.error || "Failed to send code");
                }
            } catch (error) {
                console.error(error);
                toast.error("An unexpected error occurred");
            }
        });
    }

    // Step 2: Verify OTP
    async function handleVerifyOtp(formData: FormData) {
        const codeInput = formData.get("code") as string;
        if (!codeInput || codeInput.length !== 6) {
            toast.error("Please enter the 6-digit code");
            return;
        }

        startTransition(async () => {
            try {
                formData.append("email", email);
                const res = await verifyOtpAction(formData);

                if (res?.success && res.needsPassword) {
                    setOtpCode(codeInput);
                    setStep("PASSWORD");
                    toast.success("Email verified! Now set your password.");
                } else {
                    toast.error(res?.error || "Invalid verification code");
                }
            } catch (error) {
                console.error(error);
                toast.error("Verification failed");
            }
        });
    }

    // Step 3: Setup Password & Complete
    async function handleSetupPassword(formData: FormData) {
        const passwordInput = formData.get("password") as string;
        if (!passwordInput || passwordInput.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        startTransition(async () => {
            try {
                formData.append("email", email);
                formData.append("code", otpCode);
                const res = await verifyOtpAction(formData);

                if (res?.success) {
                    toast.success("Registration complete! Redirecting...");
                    // Redirect is handled by the server action
                } else {
                    toast.error(res?.error || "Registration failed");
                }
            } catch (error: any) {
                if (error.message === "NEXT_REDIRECT") throw error;
                console.error(error);
                toast.error("Something went wrong");
            }
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/20 rounded-full blur-[100px] animate-pulse delay-700" />

            <GlassCard className="w-full max-w-md p-8 relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2 tracking-tight">
                        {step === "INFO" ? "Create Account" : step === "OTP" ? "Verify Code" : "Setup Password"}
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        {step === "INFO"
                            ? "Enter your details to join EduConnect"
                            : step === "OTP"
                                ? `Verification code sent to ${email}`
                                : "Create a secure password for your account"
                        }
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {step === "INFO" ? (
                        <motion.div
                            key="info-step"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <form action={handleInfoSubmit} className="space-y-4">
                                <div className="flex p-1 bg-white/5 rounded-lg mb-6 border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setRole("STUDENT")}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'STUDENT' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole("STAFF")}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'STAFF' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Staff
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Full Name</label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 w-4 h-4 text-primary/50" />
                                            <Input name="name" placeholder="John Doe" required className="pl-10 bg-white/5 border-white/10 focus:border-primary/50" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block">Email Address</label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 w-4 h-4 text-primary/50" />
                                            <Input name="email" type="email" placeholder="you@college.edu" required className="pl-10 bg-white/5 border-white/10 focus:border-primary/50" />
                                        </div>
                                    </div>
                                </div>

                                <Button size="lg" className="w-full h-12 text-md mt-6 font-semibold" type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Send Verification Code <ArrowRight className="ml-2 w-4 h-4" /></>}
                                </Button>
                            </form>

                            <div className="mt-8 text-center text-sm text-muted-foreground">
                                Already registered?{" "}
                                <Link href="/login" className="text-primary hover:text-primary/80 transition-colors font-medium">
                                    Login here
                                </Link>
                            </div>
                        </motion.div>
                    ) : step === "OTP" ? (
                        <motion.div
                            key="otp-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <form action={handleVerifyOtp} className="space-y-6">
                                <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl text-center">
                                    <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-3 opacity-80" />
                                    <p className="text-xs font-medium text-primary/80 uppercase tracking-widest mb-4">Confirm Your Identity</p>
                                    <div className="relative max-w-[200px] mx-auto">
                                        <Input
                                            name="code"
                                            placeholder="••••••"
                                            className="bg-transparent border-b-2 border-t-0 border-l-0 border-r-0 border-primary/30 rounded-none text-center text-3xl font-bold tracking-[0.5em] focus:ring-0 focus:border-primary h-12"
                                            maxLength={6}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <Button size="lg" className="w-full h-12 text-md font-semibold" type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setStep("INFO")}
                                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Used the wrong email? <span className="underline">Change it</span>
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="password-step"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3 }}
                        >
                            <form action={handleSetupPassword} className="space-y-6">
                                <div>
                                    <label className="text-xs font-semibold uppercase text-muted-foreground mb-1.5 block tracking-wider">New Password</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-3 w-4 h-4 text-primary/50" />
                                        <Input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="pl-10 pr-10 bg-white/5 border-white/10 focus:border-primary/50"
                                            required
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-3 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-2 opacity-70">
                                        Password must be at least 6 characters long.
                                    </p>
                                </div>

                                <Button size="lg" className="w-full h-12 text-md font-semibold mt-4 shadow-lg shadow-primary/20" type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Complete Account Setup"}
                                </Button>

                                <div className="text-center pt-2">
                                    <Link href="/login" className="text-xs text-muted-foreground hover:text-primary transition-colors">
                                        Cancel and return to login
                                    </Link>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </div>
    )
}
