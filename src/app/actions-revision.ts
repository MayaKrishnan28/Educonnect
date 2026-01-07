"use server"

import { generateFlashcards } from "@/lib/ai"

export async function createFlashcardsAction(noteContent: string) {
    if (!noteContent) return { error: "No content provided" };

    try {
        const jsonString = await generateFlashcards(noteContent);
        const flashcards = JSON.parse(jsonString);
        return { success: true, data: flashcards };
    } catch (e) {
        console.error("Flashcard Gen Error:", e);
        return { error: "Failed to generate flashcards. AI might be busy." };
    }
}
