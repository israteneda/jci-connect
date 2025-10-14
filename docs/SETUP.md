# JCI Connect - Setup Guide

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Setup Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (~2 minutes)
3. Go to **SQL Editor** and run all migration files **IN ORDER**:
   
   **Migration 1 - Initial Schema:**
   ```sql
   -- Copy and paste content from:
   -- supabase/migrations/20250104000000_initial_schema.sql
   ```
   
   **Migration 2 - Board Positions:**
   ```sql
   -- Copy and paste content from:
   -- supabase/migrations/20250105000000_add_board_positions.sql
   ```
   
   **Migration 3 - Fix RLS Recursion (CRITICAL):**
   ```sql
   -- Copy and paste content from:
   -- supabase/migrations/20250105000001_fix_rls_recursion.sql
   ```
   ⚠️ **Important:** This migration fixes infinite loops in permission checks. Without it, authentication will hang!

4. Run the seed data (optional, for development):
   ```sql
   -- Copy and paste content from:
   -- supabase/seed.sql
   ```

### 3. Create Admin User

1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Enter:
   - Email: `admin@jci.ua` (or your email)
   - Password: Choose a strong password
   - Click **"Create user"**
4. Go to **Table Editor** → **users** table
5. Find your user and set `role` = `admin`

### 4. Configure Environment Variables

Create `frontend/.env` file:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BACKEND_URL=http://localhost:8001
```

To get Supabase credentials:
- **URL**: Project Settings → API → Project URL
- **Anon Key**: Project Settings → API → Project API keys → anon public

### 5. Start Development Server

```bash
npm run dev
```

Visit: `http://localhost:5173`

Login with your admin credentials!

---

## Detailed Setup

### Database Tables

After running the migration, you'll have these tables:

1. **auth.users** - Managed by Supabase (email, phone, auth data)
2. **public.profiles** - User profiles (name, role, status, etc.)
3. **public.memberships** - Membership details
4. **public.chapters** - Organization chapters

### Seed Data

Run `supabase/seed.sql` to add sample chapters:
- JCI Ambato
- JCI Ottawa

You can modify or add more in the seed file.

### Adding More Chapters

1. Go to **Table Editor** → **chapters**
2. Click **"Insert row"**
3. Fill in:
   - name: "JCI Ambato"
   - city: "Ambato"
   - country: "Ecuador"
   - status: "active"
4. Click **"Save"**

### Testing Member Creation

1. Login as admin
2. Go to **Members** page
3. Click **"Add Member"**
4. Fill in the form
5. Submit

The app will:
- Create user in Supabase Auth
- Create profile record
- Create membership record
- Send welcome email via backend API
- Show success message

### Backend Email Setup

The system now uses the backend API for sending emails:

1. Configure your backend email service (SMTP, SendGrid, etc.)
2. Set `VITE_BACKEND_URL` in your `.env` file
3. The backend handles all email notifications:
   - Welcome emails for new users
   - Update notifications for profile changes
   - Admin notifications for user deletions

### Troubleshooting

#### Can't login?
- Check that user exists in Authentication → Users
- Check that `role` is set to `admin` in users table
- Check that email/password are correct

#### Supabase connection error?
- Verify `.env` file exists and has correct values
- Check Supabase project is not paused
- Verify API keys are copied correctly (full key, no spaces)

#### Members not showing?
- Check RLS policies are created (run migration)
- Verify you're logged in as admin
- Check browser console for errors

#### Webhook not triggering?
- Verify `VITE_BACKEND_URL` is set
- Check backend email service is configured
- Look at browser network tab for API requests
- Email sending errors don't block member creation

### Next Steps

1. ✅ Add more chapters
2. ✅ Create test members
3. ✅ Explore the dashboard
4. ✅ Configure backend email service
5. ✅ Customize the UI colors/branding

Need help? Check the main README.md or contact the team!

