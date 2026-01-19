# 5. Methodology

## Authentication Flow
1. **Entry**: User enters Email.
2. **Verification**: System sends a 6-digit OTP via Nodemailer.
3. **Session**: Upon validation, a JWT is signed and stored in cookies.
4. **Routing**: Middleware checks role (`STUDENT` or `TEACHER`) and redirects to the appropriate dashboard.

## Role-Based Dashboards
- **Teacher**: 
    - Create Classes.
    - Post Assignments & Quizzes.
    - View Analytics.
- **Student**: 
    - Join Classes via Code.
    - Access Learning Stream.
    - Chat with "Max" (AI Tutor).

## AI Modules
- **Quiz Generation**: AI parses notes and generates 5-question MCQs in JSON format.
- **Summarization**: Condenses long notes into 4 key bullet points.
- **Contextual Chat**: The AI is aware of the specific note the student is reading.
