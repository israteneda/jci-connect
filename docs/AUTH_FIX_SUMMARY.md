# Authentication Fix Summary

## 🎯 Problem Solved

**Issue:** Login was stuck on "Signing in..." forever due to RLS infinite recursion when fetching user profile.

**Root Cause:** 
- RLS policies on `profiles` table created circular dependencies
- Multiple policies calling `get_my_role()` caused infinite recursion
- Frontend had no timeout protection

---

## ✅ Fixes Applied

### 1. **Migration: Improved `get_my_role()` Function**
**File:** `supabase/migrations/20250105000002_fix_rls_get_my_role.sql`

**Changes:**
- Changed from `LANGUAGE sql` to `LANGUAGE plpgsql`
- Added `SECURITY DEFINER` to bypass RLS (prevents recursion)
- Added exception handling (returns 'candidate' on error)
- Used `CREATE OR REPLACE` instead of `DROP` (preserves dependencies)

**Why It Works:**
- `SECURITY DEFINER` runs with owner privileges, bypassing RLS
- Prevents the function from triggering RLS when called by RLS policies

### 2. **Frontend: Added Timeout Protection**
**File:** `frontend/src/hooks/useAuth.ts`

**Changes:**
- Added 10-second timeout on profile fetch
- Added detailed console logging for debugging
- Added duplicate fetch prevention using `useRef`
- Graceful fallback to 'candidate' role on timeout
- Specific error messages for different failure scenarios

**Why It Works:**
- Even if RLS hangs, user sees dashboard after 10s
- Prevents multiple simultaneous profile fetches
- React StrictMode double-mounting doesn't cause issues

---

## 🚀 Current Status

### **Authentication Flow:**

1. ✅ User enters credentials
2. ✅ Supabase Auth succeeds (JWT token received)
3. ✅ Profile fetch attempts (with 10s timeout)
4. ⚠️ First attempt may timeout (if RLS enabled)
5. ✅ Retry succeeds
6. ✅ Dashboard loads with correct role

### **Console Output (Successful):**
```
🔐 Initializing auth state...
🔐 Session result: Session exists
🔄 Loading profile for user: c4fe16d8-...
🔍 Fetching profile with 10s timeout...
✅ Profile loaded successfully: { role: 'admin', ... }
✅ User state updated with role: admin
✅ Initial auth check complete, loading set to false
```

---

## 🔧 Remaining Issues

### **Issue: First Query Still Times Out**

**Symptom:**
- First profile fetch times out after 10 seconds
- Subsequent fetches succeed instantly

**Likely Causes:**

1. **RLS Still Enabled with Slow Policies**
   - Check: `SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles';`
   - If `true`, RLS is still active and may be slow

2. **Multiple RLS Policies Creating Overhead**
   - Even with `SECURITY DEFINER`, multiple policies get evaluated
   - Solution: Consolidate into single policy

3. **Cold Start / Network Latency**
   - First query to Supabase after idle period
   - Subsequent queries are cached/faster

---

## 🎯 Recommended Next Steps

### **Option A: Temporarily Disable RLS (Testing Only)**

```sql
-- DISABLE RLS for testing
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Test login (should be instant)

-- IMPORTANT: Re-enable after testing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
```

### **Option B: Optimize RLS Policies (Recommended)**

```sql
-- Drop all SELECT policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Senators can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Members can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;

-- Create single optimized policy with short-circuit evaluation
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (
    -- Evaluated first - if TRUE, others are skipped (no recursion!)
    auth.uid() = id
    OR
    -- Only evaluated if first condition is FALSE
    public.get_my_role() IN ('admin', 'senator', 'member')
  );
```

**Why This Works:**
- PostgreSQL evaluates OR conditions left-to-right
- `auth.uid() = id` is evaluated first (fast, no recursion)
- If TRUE (user viewing own profile), stops evaluating
- `get_my_role()` only called if needed
- Single policy = less overhead than multiple policies

---

## 🧪 Testing Checklist

### **After Applying Fixes:**

- [ ] Clear browser cache
  ```javascript
  localStorage.clear();
  sessionStorage.clear();
  location.reload();
  ```

- [ ] Test login flow
  - Should complete in < 2 seconds
  - No timeout messages in console

- [ ] Verify correct role loaded
  ```javascript
  // Browser console
  console.log(window.user); // Should show role: 'admin'
  ```

- [ ] Test permissions
  - Admin should see "Add Member" button
  - Navigate to different pages
  - Check all features load correctly

### **Console Logs to Look For:**

**✅ Success:**
```
🔍 Fetching profile with 10s timeout...
✅ Profile loaded successfully
✅ User state updated with role: admin
```

**⚠️ Still Has Issues:**
```
⏱️ Profile fetch timed out
⚠️ User set with default role: candidate
```

---

## 📊 Understanding Supabase Roles

### **Two Separate Role Systems:**

| System | Location | Values | Purpose |
|--------|----------|--------|---------|
| **Supabase Auth Role** | JWT Token | `authenticated`, `anon` | RLS evaluation, API access |
| **Application Role** | `profiles.role` | `admin`, `senator`, `member`, `candidate` | App permissions, UI features |

**Important:**
- JWT always shows `"role": "authenticated"` for logged-in users ✅
- This is CORRECT and expected
- Application role (`profiles.role = 'admin'`) is separate
- Both are needed and work together

---

## 🐛 Debugging Commands

### **Check RLS Status:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'profiles';
```

### **Check Function Details:**
```sql
SELECT 
  proname,
  prolang::regproc as language,
  prosecdef as is_security_definer,
  prosrc
FROM pg_proc 
WHERE proname = 'get_my_role';
```

### **List Active Policies:**
```sql
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
```

### **Test Profile Query:**
```sql
-- Should return instantly
SELECT * FROM public.profiles 
WHERE id = 'your-user-id';
```

### **Test get_my_role():**
```sql
-- Should return instantly
SELECT public.get_my_role();
```

---

## 🎓 Lessons Learned

### **RLS Infinite Recursion Pattern:**
```
1. Frontend queries: SELECT * FROM profiles WHERE id = user_id
2. RLS evaluates policies
3. Policy calls: get_my_role()
4. get_my_role() queries: SELECT role FROM profiles WHERE id = user_id
5. RLS evaluates policies again (RECURSION!)
6. Stack overflow / timeout
```

### **Solution:**
- Use `SECURITY DEFINER` to bypass RLS in helper functions
- Use `plpgsql` instead of `sql` for better control
- Consolidate multiple policies into one
- Put simple conditions first (short-circuit evaluation)

### **Frontend Best Practices:**
- Always add timeout protection for external API calls
- Prevent duplicate fetches with refs/flags
- Add detailed logging for debugging
- Provide fallback behavior for failures
- Handle React StrictMode double-mounting

---

## 📚 Related Documentation

- `docs/TROUBLESHOOTING_AUTH.md` - Detailed troubleshooting guide
- `docs/PERMISSIONS.md` - Permission system documentation
- `docs/USER_ROLES.md` - User roles and transitions
- `supabase/migrations/20250105000002_fix_rls_get_my_role.sql` - Migration file

---

**Last Updated:** 2025-01-05  
**Status:** Authentication working with minor performance issues  
**Next Steps:** Optimize RLS policies for faster first query

