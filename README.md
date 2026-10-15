# Design Research Studio

A full-stack starter for design-thinking interviews, stakeholder-specific questionnaires, persistent Supabase storage, dashboards, and optional AI-assisted analysis.

## Stack
- Next.js App Router + TypeScript
- Supabase Postgres (persistent records and Row Level Security)
- Optional OpenAI-compatible API route for evidence-grounded synthesis
- CSV export and keyword-based theme fallback

## 1. Run locally
Requirements: Node.js 20+, npm, a Supabase project.

```bash
npm install
cp .env.example .env.local
# Fill in the Supabase URL and anon key
npm run dev
```

Open http://localhost:3000.

## 2. Create the database
In Supabase → SQL Editor, run `supabase/schema.sql`.
The app includes email/password sign-up and sign-in through Supabase Auth. The schema uses Row Level Security so users can access only their own interview records. Configure email confirmation and redirect URLs in Supabase Auth before production use.

For the current client flow, this starter uses the Supabase anon key. **Do not expose a service-role key in the browser.** Before production use, add Supabase Auth and enforce authenticated-user policies.

## 3. Configure optional AI
Set `OPENAI_API_KEY` and optionally `OPENAI_MODEL` on the server only. AI analysis is performed by `/api/analyze`; without a key, the UI uses deterministic keyword matching. Do not send confidential personal data to an AI provider without consent and an appropriate data-processing review.

## 4. Deploy
1. Create a GitHub repository and push this folder.
2. Import the repository into Vercel.
3. Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (optional) `OPENAI_API_KEY`, `OPENAI_MODEL` as environment variables.
4. Deploy, then verify create, refresh, search, delete, dashboard, and AI analysis.

## Important MVP notes
- This is a starter project, not yet production-hardened.
- Add authentication, user/team ownership, audit logging, retention controls, and access review before real workplace research.
- Never store passwords, health data, or unnecessary personal data in interview notes.
