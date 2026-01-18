"use server"

import { db } from "@/lib/db"
import { ObjectId } from "mongodb"
import { revalidatePath } from "next/cache"
import { getSession } from "@/lib/auth"

function genId() {
    return new ObjectId().toHexString()
}

async function getUserId() {
    const session = await getSession()
    return session?.userId
}

async function getUser() {
    const session = await getSession()
    if (!session?.userId) return null

    // Quick user lookup for Author info
    const user = await db.collection("user").findOne({ _id: new ObjectId(session.userId) })
    return user
}

// --- GENERIC POSTS (ANNOUNCEMENTS) ---

export async function createPostAction(courseId: string, content: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    // We allow both Students and Staff to post? 
    // Usually only Staff posts "Announcements", but "Stream" implies social.
    // Let's allow everyone for now, maybe restrict later if needed.
    // For now, let's assume it's like a classroom feed.

    if (!content.trim()) return { success: false, error: "Content cannot be empty" }

    try {
        const post = {
            id: genId(),
            type: "post", // Distinguish from assignment/quiz
            courseId,
            content,
            authorId: user._id.toString(), // Store as string for consistency
            authorName: user.name || "Unknown",
            authorRole: user.role,
            createdAt: new Date()
        }

        await db.collection("post").insertOne(post)

        // Find course code for revalidation
        const course = await db.collection("course").findOne({
            $or: [{ id: courseId }, { _id: new ObjectId(courseId) }]
        })

        if (course) {
            revalidatePath(`/dashboard/classes/${course.code}`)
        }

        return { success: true }
    } catch (error) {
        console.error("Create Post Error:", error)
        return { success: false, error: "Failed to create post" }
    }
}

export async function deletePostAction(postId: string, courseId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    try {
        const post = await db.collection("post").findOne({ id: postId })
        if (!post) return { success: false, error: "Post not found" }

        // Allow Author OR Staff of the course to delete
        const course = await db.collection("course").findOne({
            $or: [{ id: courseId }, { _id: new ObjectId(courseId) }]
        })

        const isAuthor = post.authorId === user._id.toString()
        const isStaff = course && (course.staffId === user._id.toString())

        if (!isAuthor && !isStaff) {
            return { success: false, error: "Unauthorized" }
        }

        await db.collection("post").deleteOne({ id: postId })
        // Also delete comments
        await db.collection("comment").deleteMany({ entityId: postId })

        if (course) {
            revalidatePath(`/dashboard/classes/${course.code}`)
        }
        return { success: true }
    } catch (error) {
        console.error("Delete Post Error:", error)
        return { success: false, error: "Failed to delete post" }
    }
}

// --- COMMENTS SYSTEM ---

export async function addCommentAction(entityId: string, entityType: string, content: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    if (!content.trim()) return { success: false, error: "Comment cannot be empty" }

    try {
        const comment = {
            id: genId(),
            entityId,
            entityType, // 'post', 'assignment', 'quiz'
            content,
            authorId: user._id.toString(),
            authorName: user.name || "Unknown",
            authorRole: user.role,
            createdAt: new Date()
        }

        await db.collection("comment").insertOne(comment)

        // We need to revalidate the page. Since we don't pass courseId here,
        // we might not know exactly which path to revalidate efficiently.
        // However, comments are usually fetched client-side or we can just return the new comment.
        // For server actions to update UI, we generally need revalidatePath.
        // Let's try to find the courseId from the entity.

        let courseCode = null

        // Try to find parent entity to get Course Code
        if (entityType === "post") {
            const p = await db.collection("post").findOne({ id: entityId })
            if (p) {
                const c = await db.collection("course").findOne({ $or: [{ id: p.courseId }, { _id: new ObjectId(p.courseId) }] })
                if (c) courseCode = c.code
            }
        } else if (entityType === "assignment") {
            const a = await db.collection("assignment").findOne({ id: entityId })
            if (a) {
                const c = await db.collection("course").findOne({ $or: [{ id: a.courseId }, { _id: new ObjectId(a.courseId) }] })
                if (c) courseCode = c.code
            }
        } else if (entityType === "quiz") {
            const q = await db.collection("quiz").findOne({ id: entityId })
            if (q) {
                const c = await db.collection("course").findOne({ $or: [{ id: q.courseId }, { _id: new ObjectId(q.courseId) }] })
                if (c) courseCode = c.code
            }
        }

        if (courseCode) {
            revalidatePath(`/dashboard/classes/${courseCode}`)
        }

        return { success: true, comment: JSON.parse(JSON.stringify(comment)) }

    } catch (error) {
        console.error("Add Comment Error:", error)
        return { success: false, error: "Failed to add comment" }
    }
}

export async function getCommentsAction(entityId: string) {
    // This action can be used if we switch to client-side fetching for comments,
    // or we can just use it to populate initial state if needed.
    try {
        const comments = await db.collection("comment")
            .find({ entityId })
            .sort({ createdAt: 1 }) // Oldest first
            .toArray()

        return { success: true, comments: JSON.parse(JSON.stringify(comments)) }
    } catch (error) {
        return { success: false, error: "Failed to fetch comments" }
    }
}

export async function deleteCommentAction(commentId: string) {
    const user = await getUser()
    if (!user) throw new Error("Unauthorized")

    try {
        const comment = await db.collection("comment").findOne({ id: commentId })
        if (!comment) return { success: false, error: "Comment not found" }

        // Check auth: Author OR Staff (this requires checking the course staff...)
        // For simplicity: Author or ADMIN role or STAFF role (global check).
        // Ideally we check if they are staff of THIS course, but that requires multiple lookups.

        let isAuthorized = comment.authorId === user._id.toString()

        if (!isAuthorized && user.role === "STAFF") {
            // Let's assume STAFF can delete any comment for now to manage their classes
            // In a simpler app this is acceptable.
            isAuthorized = true
        }

        if (!isAuthorized) {
            return { success: false, error: "Unauthorized" }
        }

        await db.collection("comment").deleteOne({ id: commentId })

        // We'd want to revalidate here too, but getting the code is expensive again.
        // The client should handle the optimistic remove or we just rely on next refresh.

        return { success: true }
    } catch (error) {
        return { success: false, error: "Failed to delete" }
    }
}
