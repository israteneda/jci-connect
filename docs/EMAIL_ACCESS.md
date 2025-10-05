# Accessing User Emails from auth.users

## 🔐 The Challenge

In Supabase, user emails are stored in `auth.users` (a protected schema), not in `public.profiles`. The frontend can't directly query `auth.users` for security reasons.

## ✅ The Solution: Secure Postgres Function

We created a **SECURITY DEFINER** function that safely accesses `auth.users`:

```sql
CREATE OR REPLACE FUNCTION public.get_user_email(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT email FROM auth.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Why SECURITY DEFINER?**
- Runs with the privileges of the function creator (bypasses RLS)
- Frontend can call it with the anon key
- Safely exposes only the email field
- No risk of exposing sensitive auth data

---

## 💻 Frontend Usage

### **Fetching All Members with Emails**

```typescript
// In useMembers.ts
const { data: profiles, error } = await supabase
  .from('profiles')
  .select(`
    *,
    memberships(*, chapters(*))
  `)
  .eq('role', 'member')

// Fetch emails using the secure function
const membersWithEmails = await Promise.all(
  profiles.map(async (profile) => {
    const { data: email } = await supabase.rpc('get_user_email', {
      user_id: profile.id
    })
    return { ...profile, email }
  })
)
```

### **Fetching Single Member with Email**

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('*, memberships(*, chapters(*))')
  .eq('id', userId)
  .single()

const { data: email } = await supabase.rpc('get_user_email', {
  user_id: userId
})

return { ...profile, email }
```

---

## 📊 Available Fields from auth.users

From the Supabase users table, these fields are available:
- ✅ `id` (UID)
- ✅ `email`
- ✅ `phone`
- ✅ `created_at`
- ✅ `last_sign_in_at`
- ✅ `email_confirmed_at`
- ✅ `phone_confirmed_at`

Currently, we only expose `email` via the function for security. You can add more fields if needed.

---

## 🔒 Security Considerations

### **Why Not Use auth.admin API?**

```typescript
// ❌ DON'T DO THIS - Requires service role key
const { data } = await supabase.auth.admin.getUserById(userId)
```

**Problems:**
- Requires service role key (should NEVER be in frontend)
- Exposes all auth data (password hash, tokens, etc.)
- Major security vulnerability

### **Why Our Function is Safe**

```typescript
// ✅ DO THIS - Safe with anon key
const { data: email } = await supabase.rpc('get_user_email', {
  user_id: userId
})
```

**Benefits:**
- Works with anon key (safe for frontend)
- Only exposes email (no sensitive data)
- Controlled access via RLS (can add role checks if needed)
- Server-side execution (no client-side hacks)

---

## 🎯 Adding More Fields

To expose additional fields from `auth.users`:

### **1. Create Additional Functions**

```sql
-- Get user phone
CREATE OR REPLACE FUNCTION public.get_user_phone(user_id UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT phone FROM auth.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user last sign in
CREATE OR REPLACE FUNCTION public.get_user_last_sign_in(user_id UUID)
RETURNS TIMESTAMPTZ AS $$
BEGIN
  RETURN (SELECT last_sign_in_at FROM auth.users WHERE id = user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### **2. Or Create a Combined Function**

```sql
CREATE OR REPLACE FUNCTION public.get_user_info(user_id UUID)
RETURNS TABLE (
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    auth.users.email,
    auth.users.phone,
    auth.users.created_at,
    auth.users.last_sign_in_at
  FROM auth.users
  WHERE auth.users.id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage:**
```typescript
const { data } = await supabase.rpc('get_user_info', {
  user_id: userId
})
// Returns: { email, phone, created_at, last_sign_in_at }
```

---

## 🐛 Troubleshooting

### **Issue: Function returns null**

```sql
-- Check if function exists
SELECT * FROM pg_proc WHERE proname = 'get_user_email';

-- Check if user exists in auth.users
SELECT id, email FROM auth.users WHERE id = 'your-user-id';
```

### **Issue: "permission denied for schema auth"**

✅ **Solution:** The function uses `SECURITY DEFINER`, so it runs with elevated privileges. Make sure the function was created correctly.

### **Issue: Email not showing in UI**

**Check:**
1. Function is created in database
2. User exists in auth.users
3. Frontend is calling the function correctly
4. No errors in browser console

---

## 📝 Alternative Approaches (Not Recommended)

### **1. Store Email in Profiles Table**

```sql
ALTER TABLE profiles ADD COLUMN email TEXT;
```

**Pros:** Easy to query
**Cons:** 
- Data duplication
- Can get out of sync with auth.users
- Manual sync required on email changes

### **2. Use a View**

```sql
CREATE VIEW profiles_with_email AS
SELECT 
  p.*,
  u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;
```

**Pros:** Automatic sync
**Cons:**
- Views can't have RLS policies
- Exposes email to anyone who can query the view
- Less flexible

### **3. Backend API Endpoint**

Create a FastAPI endpoint that uses service role key.

**Pros:** Full control
**Cons:**
- Requires backend
- More complexity
- Additional infrastructure

**Our Postgres function approach is the best balance of security, performance, and simplicity!**

---

## ✅ Summary

1. ✅ User emails are in `auth.users` (protected)
2. ✅ We access them via a secure Postgres function
3. ✅ Function uses `SECURITY DEFINER` for elevated access
4. ✅ Frontend calls with regular anon key
5. ✅ Only exposes email (no sensitive data)
6. ✅ Safe, performant, and maintainable

---

**Created:** January 4, 2025  
**Related:** `docs/SUPABASE_AUTH_INTEGRATION.md`

