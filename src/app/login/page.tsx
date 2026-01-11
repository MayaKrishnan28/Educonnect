"use client"

import { GlassCard } from "@/components/ui/glass-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { checkEmailAction, loginWithPasswordAction, sendOtpAction, verifyOtpAction } from "@/app/actions"
import { GraduationCap, ArrowRight, KeyRound, Mail, Loader2, Eye, EyeOff } from "lucide-react"
import { useState, useTransition } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"
import Link from "next/link"

export default function LoginPage() {
    const [role, setRole] = useState<"STUDENT" | "STAFF">("STUDENT")
    const [step, setStep] = useState<"EMAIL" | "PASSWORD" | "FORGOT_OTP" | "RESET_PASSWORD">("EMAIL")
    const [email, setEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isPending, startTransition] = useTransition()

    // Handle Email Check
    async function handleEmailNext(formData: FormData) {
        const emailInput = formData.get("email") as string;
        if (!emailInput) {
            toast.error("Please enter your email")
            return
        }

        setEmail(emailInput);

        startTransition(async () => {
            try {
                const check = await checkEmailAction(emailInput);
                if (!check.success) {
                    toast.error(check.error || "System error. Try again.");
                    return;
                }

                if (check.exists) {
                    setStep("PASSWORD");
                    toast.info("Welcome back!");
                } else {
                    toast.error("Account not found. Please sign up first.");
                }
            } catch (error) {
                console.error(error);
                toast.error("An unexpected error occurred");
            }
        });
    }

    // Handle Password Login
    async function handleLogin(formData: FormData) {
        startTransition(async () => {
            try {
                formData.append("role", role);
                const res = await loginWithPasswordAction(formData);
                if (!res?.success) {
                    toast.error(res?.error || "Login failed. Check your password.");
                }
            } catch (error: any) {
                if (error.message === "NEXT_REDIRECT") throw error;
                toast.error("Invalid credentials");
            }
        });
    }

    async function handleForgotPassword() {
        if (!email) return;
        startTransition(async () => {
            try {
                const res = await sendOtpAction(email, role);
                if (res.success) {
                    toast.success("Reset code sent to your email!");
                    setStep("FORGOT_OTP");
                } else {
                    toast.error(res.error || "Failed to send reset code");
                }
            } catch (error) {
                toast.error("An error occurred. Please try again.");
            }
        });
    }

    async function handleResetVerify(formData: FormData) {
        const codeInput = formData.get("code") as string;
        if (!codeInput || codeInput.length !== 6) {
            toast.error("Enter the 6-digit code");
            return;
        }

        startTransition(async () => {
            try {
                formData.append("email", email);
                const res = await verifyOtpAction(formData);
                if (res?.success && res.needsPassword) {
                    setOtpCode(codeInput);
                    setStep("RESET_PASSWORD");
                    toast.success("Code verified! Set your new password.");
                } else {
                    toast.error(res?.error || "Invalid code");
                }
            } catch (error) {
                toast.error("Verification failed");
            }
        });
    }

    async function handleResetComplete(formData: FormData) {
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
                    toast.success("Password reset successful! Logging you in...");
                } else {
                    toast.error(res?.error || "Reset failed");
                }
            } catch (error: any) {
                if (error.message === "NEXT_REDIRECT") throw error;
                toast.error("Something went wrong");
            }
        });
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
            {/* Background Blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] animate-pulse delay-700" />

            <GlassCard className="w-full max-w-md p-8 relative z-10">
                <div className="flex justify-center mb-6">
                    <div className="h-16 w-16 bg-primary/20 rounded-full flex items-center justify-center border border-primary/30">
                        <GraduationCap className="h-8 w-8 text-primary" />
                    </div>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold mb-2">
                        {step === "EMAIL" ? "Welcome Back" : step === "PASSWORD" ? "Enter Password" : step === "FORGOT_OTP" ? "Reset Access" : "Create New Password"}
                    </h1>
                    <p className="text-muted-foreground">
                        {step === "EMAIL"
                            ? "Login to your EduConnect portal"
                            : step === "PASSWORD"
                                ? `Password for ${email}`
                                : step === "FORGOT_OTP"
                                    ? "Verify your account with the reset code"
                                    : "Set a new secure password"
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
                            <form action={handleEmailNext} className="space-y-4">
                                <div className="flex p-1 bg-white/5 rounded-lg mb-6 border border-white/10">
                                    <button
                                        type="button"
                                        onClick={() => setRole("STUDENT")}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'STUDENT' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Student
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setRole("STAFF")}
                                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === 'STAFF' ? 'bg-primary text-primary-foreground shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
                                    >
                                        Staff
                                    </button>
                                </div>

                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input name="email" type="email" placeholder="you@example.com" required className="pl-10 bg-white/5 border-white/10 focus:ring-primary" />
                                    </div>
                                </div>

                                <Button size="lg" className="w-full h-12 text-lg mt-6 group" type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Login <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" /></>}
                                </Button>
                            </form>

                            <div className="mt-8 text-center text-sm text-muted-foreground">
                                Don't have an account?{" "}
                                <Link href="/register" className="text-primary hover:underline font-medium">
                                    Sign Up
                                </Link>
                            </div>
                        </motion.div>
                    ) : step === "PASSWORD" ? (
                        <motion.div
                            key="password-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <form action={handleLogin} className="space-y-4">
                                <input type="hidden" name="email" value={email} />

                                <div>
                                    <label className="text-sm font-medium mb-1.5 block">Security Password</label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                                        <Input
                                            name="password"
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            className="pl-10 pr-10 bg-white/5 border-white/10 focus:ring-primary"
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
                                </div>

                                <Button size="lg" className="w-full h-12 text-lg mt-6" type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sign In"}
                                </Button>

                                <div className="flex flex-col gap-3 mt-4">
                                    <button
                                        type="button"
                                        onClick={handleForgotPassword}
                                        className="text-xs text-primary hover:underline transition-colors"
                                    >
                                        Forgot Password?
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setStep("EMAIL")}
                                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        Use a different email
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    ) : step === "FORGOT_OTP" ? (
                        <motion.div
                            key="forgot-otp-step"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <form action={handleResetVerify} className="space-y-6">
                                <div className="p-5 bg-primary/5 border border-primary/20 rounded-2xl text-center">
                                    <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4 font-mono">Current Session Only</p>
                                    <div className="relative">
                                        <Input
                                            name="code"
                                            placeholder="RESET CODE"
                                            className="bg-transparent border-b-2 border-t-0 border-l-0 border-r-0 border-primary/30 rounded-none text-center text-2xl font-black tracking-[0.4em] focus:ring-0 focus:border-primary h-12"
                                            maxLength={6}
                                            required
                                            autoFocus
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground mt-4 italic">
                                        Code sent to {email}
                                    </p>
                                </div>

                                <Button size="lg" className="w-full h-12 text-md font-semibold" type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify Code"}
                                </Button>

                                <button
                                    type="button"
                                    onClick={() => setStep("PASSWORD")}
                                    className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                            </form>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="reset-password-step"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                        >
                            <form action={handleResetComplete} className="space-y-6">
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
                                </div>

                                <Button size="lg" className="w-full h-12 text-md font-semibold" type="submit" disabled={isPending}>
                                    {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reset & Login"}
                                </Button>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>
            </GlassCard>
        </div>
    )
}
