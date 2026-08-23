# SS TECH SERVICES LMS — Setup

## What is implemented
- Supabase Auth with Student / Trainer / Admin roles
- Student registration and login
- Course catalog and enrollment
- Course/module/lesson data model
- Persistent lesson progress
- Secure server-side quiz scoring
- Quiz attempts
- Course completion certificates with verification token
- Private LMS material storage bucket
- Trainer-to-course assignment
- Admin LMS role and trainer assignment panel at `/#/admin/lms`

## Apply the database migration
1. Open the Supabase project connected to the website.
2. Apply `supabase/migrations/20260818080000_lms_backend.sql` using the Supabase CLI or SQL migration workflow.
3. Verify the migration completed without errors.
4. Confirm Email Authentication settings match your desired registration flow.

## First admin
The existing staff signup flow keeps the first authenticated account as `admin` based on the existing project migration. Use that account to open:
`/#/admin/lms`

## Create trainers
1. Register a normal account.
2. Sign in as Admin.
3. Open LMS Admin.
4. Change the account role to Trainer.
5. Assign the trainer to courses.

## Student flow
1. Student registers from the LMS Student tab.
2. After email verification (if enabled), student signs in.
3. The server-side `ensure_student_role()` RPC assigns the student role only when no staff role exists.
4. Student enrolls in published courses.
5. Lesson completion is persisted in `lms_lesson_progress`.
6. Certificate is available only after all course lessons are completed.

## Required environment variables
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Never put a Supabase service-role key in the browser application.
