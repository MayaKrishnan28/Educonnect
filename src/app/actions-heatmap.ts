"use server"

import { db } from "@/lib/db"

// Log a dwell (y‑position) for a note
export async function logDwellAction(noteId: string, yPosition: number) {
    if (!noteId) return

    // Clamp yPosition between 0 and 1
    const y = Math.max(0, Math.min(1, yPosition))

    // Insert a new point into the heatmapPoint collection
    await db.collection("heatmapPoint").insertOne({
        noteId,
        yPosition: y,
        createdAt: new Date()
    })
}

// Retrieve recent heat‑map points for a note
export async function getHeatmapDataAction(noteId: string) {
    if (!noteId) return []

    // Fetch the latest 100 points for the given note
    const points = await db
        .collection("heatmapPoint")
        .find({ noteId })
        .project({ yPosition: 1, _id: 0 })
        .sort({ createdAt: -1 })
        .limit(100)
        .toArray()

    // Return only the y‑positions for client‑side rendering
    return points.map(p => p.yPosition)
}
