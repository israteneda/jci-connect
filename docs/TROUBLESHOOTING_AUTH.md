# Authentication Troubleshooting Guide

## Common Issue: "Signing in..." Forever

### Symptoms
- UI shows "Signing in..." message indefinitely
- Console logs show:
  ```
  🔐 Getting initial session...
  ⏱️ Session fetch timeout after 5 seconds!
  🔔 Auth state changed: SIGNED_IN Session exists
  🔄 loadUserProfile called with authUser: [user-id]
  🔍 Fetching profile for user: [user-id]
  ```
- Profile fetch never completes

### Root Causes

#### 1. **Missing Profile Record**
**Problem:** User exists in `auth.users` but not in `public.profiles`

**How to Check:**
```sql
-- In Supabase SQL Editor
SELECT * FROM auth.users WHERE id = 'your-user-id';
SELECT * FROM public.profiles WHERE id = 'your-user-id';
```

**Solution:**
```sql
-- Manually create profile
INSERT INTO public.profiles (id, first_name, last_name, role, status)
VALUES (
  'your-user-id',
  'First',
  'Last',
  'admin',
  'active'
);
```

**Prevention:** Ensure the `handle_new_user()` trigger is active:
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

#### 2. **RLS Recursion (Infinite Loop)**
**Problem:** Row Level Security policies query themselves, creating infinite recursion

**Console Error:**
```
⏱️ Profile fetch timed out - possible RLS recursion or network issue
💡 Check: 1) RLS policies applied? 2) Profile exists? 3) Network connectivity?
```

**Solution:** Run the RLS fix migration:
```sql
-- supabase/migrations/20250105000001_fix_rls_recursion.sql
-- This creates the get_my_role() function and updates all policies
```

**Verify Fix:**
```sql
-- Check if function exists
SELECT proname FROM pg_proc WHERE proname = 'get_my_role';

-- Test the function
SELECT public.get_my_role();
```

---

#### 3. **Incorrect Role Assignment**
**Problem:** User role is not set to 'admin' in profiles table

**How to Check:**
```sql
SELECT id, first_name, last_name, role, status 
FROM public.profiles 
WHERE id = 'your-user-id';
```

**Solution:**
```sql
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = 'your-user-id';
```

---

#### 4. **Network/Supabase Connection Issues**
**Problem:** Supabase project is paused, network timeout, or wrong credentials

**Console Error:**
```
❌ Missing environment variables!
VITE_SUPABASE_URL: undefined
```

**Solution:**
1. Check `.env` file exists in `frontend/` directory
2. Verify credentials:
   ```env
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```
3. Check Supabase project is not paused (Dashboard → Settings)
4. Test connection:
   ```javascript
   // In browser console
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

---

## How the Fix Works

### 1. **Profile Fetch Timeout**
```typescript
// frontend/src/hooks/useAuth.ts
const timeoutPromise = new Promise((_, reject) => {
  setTimeout(() => reject(new Error('Profile fetch timeout after 10 seconds')), 10000)
})

const { data: profile, error } = await Promise.race([
  profilePromise,
  timeoutPromise
])
```

**Result:** If profile fetch takes >10 seconds, it times out and sets default role 'candidate'

### 2. **Better Error Logging**
```typescript
if (error.code === 'PGRST116') {
  console.error('❌ Profile does not exist for user:', authUser.id)
  console.log('💡 Tip: Create profile in Supabase or wait for trigger to create it')
}

if (error?.message?.includes('timeout')) {
  console.error('⏱️ Profile fetch timed out - possible RLS recursion or network issue')
}
```

**Result:** Specific error messages guide you to the exact problem

### 3. **Graceful Fallback**
```typescript
// Always set user, even if profile fetch fails
setUser({
  ...authUser,
  role: 'candidate',  // Default role
  profile: undefined,
})
```

**Result:** User can at least see the UI, even if profile is missing

---

## Verification Steps

After implementing the fix:

1. **Clear browser storage:**
   ```javascript
   localStorage.clear()
   sessionStorage.clear()
   location.reload()
   ```

2. **Check console logs:**
   ```
   ✅ Expected:
   🔐 Getting initial session...
   🔐 Session result: Session exists
   🔄 loadUserProfile called with authUser: [user-id]
   🔍 Fetching profile for user: [user-id]
   ✅ Profile loaded successfully: { role: 'admin', ... }
   ✅ User state updated with role: admin
   ✅ Setting loading to false
   ```

3. **Verify UI loads:**
   - Login page should redirect to dashboard
   - "Add Member" button should appear (if admin)
   - No "Signing in..." message

4. **Test permissions:**
   ```javascript
   // In browser console
   console.log(window.localStorage.getItem('supabase.auth.token'))
   ```

---

## Quick Fixes

### Force Profile Creation
```sql
-- Run in Supabase SQL Editor
INSERT INTO public.profiles (id, first_name, last_name, role, status)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'first_name', 'Admin'),
  COALESCE(raw_user_meta_data->>'last_name', 'User'),
  'admin',
  'active'
FROM auth.users
WHERE id = 'your-user-id'
ON CONFLICT (id) DO NOTHING;
```

### Reset Auth State
```javascript
// Browser console
localStorage.clear()
sessionStorage.clear()
await supabase.auth.signOut()
location.reload()
```

### Check All Migrations Applied
```sql
-- Verify all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Expected: profiles, chapters, memberships, board_positions

-- Verify RLS function exists
SELECT proname FROM pg_proc WHERE proname = 'get_my_role';

-- Expected: get_my_role
```

---

## Prevention Checklist

✅ Run **all 3 migrations** in order when setting up Supabase:
  1. `20250104000000_initial_schema.sql`
  2. `20250105000000_add_board_positions.sql`
  3. `20250105000001_fix_rls_recursion.sql` ⚠️ CRITICAL

✅ Create admin user **through Supabase Auth UI** (not SQL)

✅ Set role in `profiles` table **after** user is created

✅ Verify `.env` file has correct credentials

✅ Test login immediately after setup

---

## Advanced Debugging

### Enable Supabase Debug Logs
```typescript
// frontend/src/lib/supabase.ts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    debug: true, // Add this
  },
})
```

### Check RLS Policies
```sql
-- List all policies on profiles table
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';
```

### Test Profile Query Directly
```sql
-- Set your user ID
SET LOCAL jwt.claims.sub = 'your-user-id';

-- Try to fetch profile
SELECT * FROM public.profiles WHERE id = 'your-user-id';
```

---

## Contact & Support

If none of these solutions work:

1. Check the [SETUP.md](./SETUP.md) guide
2. Review Supabase dashboard logs (Dashboard → Logs)
3. Verify Supabase project is not paused
4. Check browser network tab for failed requests
5. Contact the development team with:
   - Console logs
   - User ID
   - Supabase project URL (without sensitive data)

---

**Last Updated:** 2025-01-05  
**Related Files:**
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/lib/supabase.ts`
- `supabase/migrations/20250105000001_fix_rls_recursion.sql`

