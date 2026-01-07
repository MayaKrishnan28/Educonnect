"use server"

import { db } from "@/lib/db"

export async function logDwellAction(noteId: string, yPosition: number) {
    if (!noteId) return;

    // Normalize yPosition (ensure it's between 0 and 1)
    const y = Math.max(0, Math.min(1, yPosition))

    await db.heatmapPoint.create({
        data: {
            noteId,
            yPosition: y
        }
    })
}

export async function getHeatmapDataAction(noteId: string) {
    if (!noteId) return [];

    // Return raw points for client-side density calculation or simple rendering
    // Limit to last 100-200 points to keep it performant but "live"
    const points = await db.heatmapPoint.findMany({
        where: { noteId },
        select: { yPosition: true },
        orderBy: { createdAt: 'desc' },
        take: 100
    })

    return points.map(p => p.yPosition)
}
