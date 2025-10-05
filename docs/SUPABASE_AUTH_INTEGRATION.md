# Supabase Auth Integration - Implementation Details

## 🔄 Architecture Change

Following [Supabase Auth best practices](https://supabase.com/docs/guides/auth/users), we use Supabase's built-in `auth.users` table instead of creating our own users table.

---

## 📊 Database Schema

### **Before (Incorrect):**
```
public.users (custom table)
    ↓
public.profiles (references public.users)
    ↓
public.memberships (references public.users)
```

### **After (Correct):**
```
auth.users (managed by Supabase Auth)
    ↓
public.profiles (id references auth.users.id)
    - Contains role, status, and user details
    ↓
public.memberships (user_id references auth.users.id)
```

---

## 🗄️ Table Structure

### **auth.users (Managed by Supabase)**
- ✅ Created automatically by Supabase
- ✅ Handles authentication (email, password, OAuth, etc.)
- ✅ Stores email, phone, email_confirmed_at, etc.
- ✅ We **reference** it, never modify it directly

### **public.profiles (Our Extension)**
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  date_of_birth DATE,
  avatar_url TEXT,
  bio TEXT,
  linkedin_url TEXT,
  city TEXT,
  country TEXT,
  language_preference TEXT DEFAULT 'en',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Key Changes:**
- ✅ `id` is PRIMARY KEY (not `user_id`)
- ✅ `id` directly references `auth.users(id)`
- ✅ Moved `role` and `status` here (was in public.users)
- ✅ No `email` field (use `auth.users` for that)

---

## 🔄 Automatic Profile Creation

When a user signs up via Supabase Auth, a profile is **automatically created** via this trigger:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, role, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'member'),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**How it works:**
1. User signs up → Supabase creates record in `auth.users`
2. Trigger fires automatically
3. Profile is created in `public.profiles` with data from `raw_user_meta_data`
4. If metadata has `first_name`, `last_name`, `role`, they're used; otherwise defaults

---

## 🔐 Row Level Security (RLS)

All RLS policies now check `public.profiles` for role validation:

```sql
-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
  );
```

**Key Points:**
- ✅ `auth.uid()` returns the current authenticated user's ID
- ✅ Role is checked in `public.profiles`, not JWT
- ✅ No need for `auth.jwt() ->> 'role'` anymore

---

## 💻 Frontend Integration

### **Creating a New Member**

```typescript
// useMembers.ts
const createMember = useMutation({
  mutationFn: async (memberData: CreateMemberData) => {
    // 1. Create auth user (profile auto-created by trigger)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: memberData.email,
      password: memberData.password,
      options: {
        data: {
          first_name: memberData.first_name,
          last_name: memberData.last_name,
          role: 'member',
        },
      },
    })

    if (authError) throw authError
    const userId = authData.user.id

    // 2. Update profile with additional data
    await supabase
      .from('profiles')
      .update({
        phone: memberData.phone,
        city: memberData.city,
        country: memberData.country,
      })
      .eq('id', userId)

    // 3. Create membership
    await supabase
      .from('memberships')
      .insert({
        user_id: userId,
        chapter_id: memberData.chapter_id,
        membership_type: memberData.membership_type,
        start_date: memberData.start_date,
        expiry_date: memberData.expiry_date,
        member_number: memberNumber,
        status: 'active',
      })

    // 4. Trigger n8n webhook
    await triggerN8nWebhook('member.created', { ... })
  }
})
```

### **Fetching Members**

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select(`
    *,
    memberships(
      *,
      chapters(*)
    )
  `)
  .eq('role', 'member')
  .order('created_at', { ascending: false })
```

**Note:** Email is NOT fetched from profiles. To get email:
- Use `supabase.auth.getUser()` for current user
- Use `supabase.auth.admin.getUserById(id)` for admin queries
- We display User ID instead in the UI

### **Updating Login Timestamp**

```typescript
// useAuth.ts
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  // Update last_login in profiles
  if (data.user) {
    await supabase
      .from('profiles')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)
  }

  return data
}
```

### **Deleting a Member**

```typescript
const deleteMember = useMutation({
  mutationFn: async (userId: string) => {
    // 1. Delete profile (cascades handled by DB)
    await supabase
      .from('profiles')
      .delete()
      .eq('id', userId)

    // 2. Delete auth user (admin only - requires service role)
    await supabase.auth.admin.deleteUser(userId)
  }
})
```

---

## 🎯 TypeScript Types

```typescript
// database.types.ts
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'content_editor' | 'member'
          status: 'active' | 'inactive' | 'suspended'
          first_name: string
          last_name: string
          phone: string | null
          // ... other fields
        }
        // ... Insert and Update types
      }
      // ... other tables
    }
  }
}

// Member type
type Member = Database['public']['Tables']['profiles']['Row'] & {
  memberships: Database['public']['Tables']['memberships']['Row'] & {
    chapters: Database['public']['Tables']['chapters']['Row']
  }
}
```

---

## 🚀 Setup Instructions

### **1. Run Migration**
```sql
-- Execute: supabase/migrations/20250104000000_initial_schema.sql
-- This creates profiles, chapters, memberships tables
-- And sets up the automatic profile creation trigger
```

### **2. Create First Admin User**

**Option A: Via Supabase Dashboard**
1. Go to Authentication → Users
2. Click "Add user"
3. Enter email + password
4. User is created in `auth.users`
5. Profile is auto-created in `public.profiles` with role='member'
6. Update role manually:
   ```sql
   UPDATE public.profiles 
   SET role = 'admin' 
   WHERE id = 'user-id-here';
   ```

**Option B: Via SQL**
1. Create auth user first (via Dashboard or API)
2. Then update profile:
   ```sql
   UPDATE public.profiles 
   SET role = 'admin', status = 'active'
   WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@jci.ua');
   ```

### **3. Test Login**
```bash
cd frontend
npm run dev
# Navigate to http://localhost:5173/login
# Login with admin credentials
```

---

## 📝 Key Differences from Old Approach

| Aspect | Old (Incorrect) | New (Correct) |
|--------|----------------|---------------|
| Users table | `public.users` (custom) | `auth.users` (Supabase managed) |
| Profile ID | `user_id` (FK) | `id` (PK) |
| Email storage | `public.users.email` | `auth.users.email` |
| Role storage | `public.users.role` | `public.profiles.role` |
| User creation | Manual insert to users + profiles | `auth.signUp()` + auto trigger |
| Fetching users | Query `public.users` | Query `public.profiles` |
| RLS role check | `auth.jwt() ->> 'role'` | Check `public.profiles` |
| Email in UI | From `users.email` | From `auth.users` or show User ID |

---

## ✅ Benefits

1. **Follows Supabase best practices** ([docs](https://supabase.com/docs/guides/auth/users))
2. **Automatic profile creation** via trigger
3. **Proper auth separation** (auth.users for auth, profiles for app data)
4. **Built-in auth features**: email verification, password reset, OAuth, MFA
5. **Better security**: Supabase handles auth, we handle business logic
6. **Scalable**: Leverages Supabase's authentication system

---

## 🐛 Troubleshooting

### **Issue: "relation public.users does not exist"**
✅ **Solution:** Migration updated to remove `public.users` table. Run the latest migration.

### **Issue: "Cannot find user email in profiles table"**
✅ **Solution:** Email is in `auth.users`, not `profiles`. Use:
```typescript
// Get current user email
const { data: { user } } = await supabase.auth.getUser()
console.log(user?.email)

// Get another user's email (admin only)
const { data } = await supabase.auth.admin.getUserById(userId)
console.log(data.user?.email)
```

### **Issue: "Profile not created after signup"**
✅ **Solution:** Check that the trigger is installed:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```
If missing, run the trigger creation SQL from the migration.

### **Issue: "RLS policy blocking access"**
✅ **Solution:** Ensure user has correct role in profiles:
```sql
SELECT id, role, status FROM public.profiles WHERE id = auth.uid();
```

---

## 📚 References

- [Supabase Auth Users Documentation](https://supabase.com/docs/guides/auth/users)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Triggers Tutorial](https://supabase.com/docs/guides/database/postgres/triggers)

---

**Last Updated:** January 4, 2025
**Migration:** `20250104000000_initial_schema.sql`

