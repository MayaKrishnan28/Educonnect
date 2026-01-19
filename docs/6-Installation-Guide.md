# Installation & Setup Guide

## Prerequisites
- Node.js (v18+)
- Git

## Steps

1.  **Clone the Repository**
    ```bash
    git clone <repository_url>
    cd EduConnect
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    # Note: Includes Next.js 15, React 19, Tailwind v4
    ```

3.  **Environment Variables**
    Create a `.env` file in the root:
    ```env
    DATABASE_URL="file:./dev.db" # Or your Postgres URL
    GROQ_API_KEY="gsk_..."       # Required for AI
    SMTP_USER="your-email"       # For OTP
    SMTP_PASS="your-password"
    ```

4.  **Database Setup**
    ```bash
    npx prisma db push
    ```

5.  **Run Development Server**
    ```bash
    npm run dev
    ```
    Visit `http://localhost:3000`.
