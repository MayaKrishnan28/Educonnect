import { AppShell } from "@/components/layout/shell";
import { SessionGuard } from "@/components/auth/session-guard";
import { getSession } from "@/lib/auth";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    return (
        <SessionGuard>
            <AppShell userRole={session?.role}>{children}</AppShell>
        </SessionGuard>
    )
}
