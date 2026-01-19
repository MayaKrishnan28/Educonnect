# 4. Technologies Used

## Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Shadcn/ui & Radix Primitives
- **Animations**: Framer Motion

## Backend
- **Runtime**: Node.js
- **Database Logic**: Prisma ORM
- **Authentication**: 
    - Custom OTP (One-Time Password) via Email.
    - JOSE (JWT Operations) for stateless, encrypted sessions.
    - HTTP-Only Cookies for security.

## AI Infrastructure
- **Model**: Llama-3.1-8b-instant
- **Provider**: Groq API (Chosen for low latency)
- **Integration**: `src/lib/ai.ts` custom wrapper.

## DevOps & Tools
- **Version Control**: Git
- **Package Manager**: npm
