# 3. System Architecture

EduConnect follows a robust **Client-Server Architecture**.

## High-Level Overview
- **Frontend**: Next.js App Router (Client & Server Components).
- **Backend**: Server Actions (Node.js runtime).
- **Database**: Relational Database (SQL) secured via Prisma ORM.
- **AI Services**: External inference via Groq API (Llama 3).
- **Email Services**: SMTP integration for OTP delivery.

## Data Flow
1. **User Request** -> **Middleware** (Auth Check)
2. **Server Action** (Validation & Logic)
3. **Prisma ORM** (Data Persistence)
4. **UI Update** (React Server Components stream data back)

## Directory Structure
```
src/
├── app/                 # Routes & Pages
├── components/          # Reusable UI & Logical Modules
├── lib/                 # Utilities (DB, Mail, AI, Auth)
└── prisma/              # Database Schema & Migrations
```
