"use client"

import { useEffect } from "react"
import { checkSessionAction } from "@/app/actions"
import { useRouter, usePathname } from "next/navigation"

export function SessionGuard({ children }: { children: React.ReactNode }) {
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        const verify = async () => {
            // Skip check on public pages just in case it's used there
            if (!pathname.startsWith('/dashboard')) return;

            const isValid = await checkSessionAction()
            if (!isValid) {
                // Force a hard navigation to clear client state
                window.location.href = "/login"
            }
        }
        verify()

        // Handle Back-Forward Cache (bfcache)
        const handlePageShow = (event: PageTransitionEvent) => {
            if (event.persisted) {
                window.location.reload()
            }
        }

        window.addEventListener('pageshow', handlePageShow)
        return () => window.removeEventListener('pageshow', handlePageShow)
    }, [pathname, router])

    return <>{children}</>
}
