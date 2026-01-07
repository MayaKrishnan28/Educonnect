# EduConnect: End-to-End Documentation

> **Vision**: Mentoring the future of education. A unified platform connecting students and teachers with AI-powered insights, real-time collaboration, and a premium glassmorphism user experience.

---

## 📚 Table of Contents
1. [Project Overview](#-project-overview)
2. [Technology Stack](#-technology-stack)
3. [System Architecture](#-system-architecture)
4. [Features & Modules](#-features--modules)
   - [Authentication](#authentication)
   - [LMS (Learning Management)](#lms-learning-management)
   - [AI Integration (Max)](#ai-integration-max)
   - [Student & Teacher Roles](#student--teacher-roles)
5. [Installation & Setup](#-installation--setup)
6. [Developer Reference](#-developer-reference)

---

## 🌟 Project Overview

**EduConnect** solves the fragmentation in educational tools by combining learning management (LMS) with advanced AI assistance in a single, beautiful interface.

- **Unified Dashboard**: One place for notes, quizzes, timelines, and class management.
- **AI-First**: "Max", the global AI companion, is integrated into every aspect of the app—from answering questions to generating quizzes and summarizing notes.
- **Role-Based**: Distinct yet connected experiences for Teachers (Content Creators) and Students (Learners).

---

## 🛠 Technology Stack

### Frontend & UI
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4 + **Shadcn/ui**
- **Design System**: "Glassmorphism" (Blur effects, gradients, transparency)
- **Animations**: Framer Motion (Page transitions, micro-interactions)

### Backend & Database
- **Runtime**: Node.js
- **Database**: SQLite (Development) / PostgreSQL (Production ready)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Auth**: Custom Session-based Auth with JWT (JOSE) & OTP Email Verification.

### AI Infrastructure
- **Provider**: **Groq** (Running Llama 3 models) - Chosen for high speed and free tier access.
- **Capabilities**: Conversational Chat, Contextual Explanations, JSON Quiz Generation, Summarization.

---

## 🏗 System Architecture

### Directory Structure
```
src/
├── app/                 # Next.js App Router
│   ├── dashboard/       # Main User Interface (Protected)
│   ├── login/           # Authentication Flow
│   ├── about/           # Public About Page
│   ├── api/             # (Minimal use, mostly Actions)
│   └── globals.css      # Design tokens & Glassmorphism
├── components/
│   ├── ai/              # AI Overlay & Logic (Max)
│   ├── lms/             # Class, Quiz, Assignment Components
│   ├── notes/           # Note Rendering & Editors
│   └── ui/              # Reusable Primitives
├── lib/                 # Core Logic
│   ├── ai.ts            # AI Client & Prompt Engineering
│   ├── auth.ts          # Session Management
│   ├── db.ts            # Prisma Client Singleton
│   └── mail.ts          # SMTP Emailer
```

### Core Concepts
- **Server Actions**: `src/app/actions.ts` handles all backend logic (DB writes, Auth) without creating separate API endpoints.
- **Secure Middleware**: `middleware.ts` ensures only authenticated users access `/dashboard`.
- **Global AI**: The `<GlobalMax />` component persists across the dashboard but hides on public pages.

---

## � Features & Modules

### Authentication
- **Secure 2-Step Login**: Users enter email -> Receive 6-digit OTP -> Verify.
- **Session Management**: Secure HTTP-only cookies storing encrypted JWTs.
- **Role Detection**: Automatically routes users based on their role (Student/Teacher).

### LMS (Learning Management)
- **Classes**: Teachers create classes; Students join via 6-character codes.
- **Stream**: Real-time announcement feed for each class.
- **Notes & Resources**: Support for rich text, PDFs, and **YouTube Video Embeds**.
- **Assignments**: Teachers post tasks; Students will be able to submit work (WIP).
- **Quizzes**: 
    - AI-Generated Quizzes based on topics.
    - Manual Quiz Creation by Teachers.
    - Automated Grading & Result PDF Export.

### AI Integration (Max)
**Powered by Groq (Llama 3)**
- **Global Chat**: accessible explicitly via the floating button.
- **Context Awareness**: Max knows *where* you are (e.g., Reading a Physics note) and answers questions relevant to that content.
- **Smart Fallback**: If the API fails, the system switches to a robust "Offline Demo Mode" to ensure no interruptions.

### Student & Teacher Roles
| Feature | Student | Teacher |
| :--- | :--- | :--- |
| **Dashboard** | View Timeline, Join Classes, Take Quizzes | Create Classes, Monitor Insights |
| **Notes** | Read, Bookmark, AI Summary | Create, Edit, Delete, Upload Files |
| **Classes** | Join via Code, participate in Stream | Manage Members, Post Assignments, Delete Class |
| **Quizzes** | Attempt & View Results | Create & View Class Analytics |

---

## � Installation & Setup

1.  **Clone & Install**:
    ```bash
    git clone <repo>
    cd EduConnect
    npm install
    ```

2.  **Environment Setup** (`.env`):
    ```env
    DATABASE_URL="file:./dev.db"
    GROQ_API_KEY="gsk_..."      # For AI Features
    SMTP_USER="..."             # For OTP Emails
    SMTP_PASS="..."
    ```

3.  **Database Init**:
    ```bash
    npx prisma db push
    ```

4.  **Run**:
    ```bash
    npm run dev
    ```
    Access at `http://localhost:3000`.

---

## 👨‍💻 Developer Reference

### Key Database Models (Prisma)
- **User**: The central entity.
- **Course**: Represents a "Class".
- **Enrollment**: Many-to-Many link between User and Course.
- **Note**: Educational content (File, Video, Text).
- **Quiz / Question / Result**: Assessment engine.

### AI Configuration (`src/lib/ai.ts`)
The AI logic is abstracted into `safeGenerate`. It handles:
- **Rate Limiting**: Retries or intuitive error messages.
- **Prompt Engineering**: System prompts are pre-defined for specialized tasks (Quiz Gen, Summarization).

---
> **EduConnect** - Built with ❤️ for the future of learning.
