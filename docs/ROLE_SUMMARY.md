# JCI Connect - Quick Role Reference

## 🎯 3 Simple Roles

### 1️⃣ **CANDIDATE** 🌱
**Default role for new signups**

- Status: `pending` or `active`
- No membership record needed
- Limited access (view profile, public content)
- **Goal:** Convert to Member

**SQL:**
```sql
role = 'candidate'
status = 'pending'
memberships = NULL
```

---

### 2️⃣ **MEMBER** 👤
**Active JCI members with full membership**

- Status: `active` or `suspended`
- **MUST have** membership record
- Full member benefits and directory access
- Can be chapter president
- Can also be admin (dual role)

**SQL:**
```sql
-- Profile
role = 'member'
status = 'active'

-- MUST have membership
INSERT INTO memberships (user_id, chapter_id, ...) VALUES ...;
```

---

### 3️⃣ **ADMIN** 🔑
**System administrators**

- Status: `active`
- No membership required (optional)
- Full system access
- Can also be member (dual role)

**SQL:**
```sql
role = 'admin'
status = 'active'
memberships = NULL or EXISTS  -- optional
```

---

## 🌍 Multi-Country Chapters

**Ukraine** 🇺🇦
- JCI Kyiv, Lviv, Odesa, Kharkiv, Dnipro

**Canada** 🇨🇦
- JCI Toronto, Vancouver, Montreal, Calgary, Ottawa

**Ecuador** 🇪🇨
- JCI Quito, Guayaquil, Cuenca, Manta, Ambato

---

## ✅ Quick Setup Checklist

### **Create Admin**
```sql
-- 1. Create user in Supabase Auth Dashboard
-- 2. Update role:
UPDATE profiles SET role = 'admin', status = 'active' WHERE id = 'user-id';
```

### **Create Member**
```sql
-- 1. Create user in Supabase Auth Dashboard
-- 2. Update role:
UPDATE profiles SET role = 'member', status = 'active' WHERE id = 'user-id';
-- 3. Create membership:
INSERT INTO memberships (
  user_id, chapter_id, membership_type, 
  start_date, expiry_date, member_number, status
) VALUES (
  'user-id', 'chapter-id', 'national',
  '2025-01-01', '2026-01-01', 'JCI-XXX-2025-001', 'active'
);
```

### **Candidate Auto-Created**
```sql
-- Automatically created as 'candidate' when user signs up
-- No additional action needed
role = 'candidate'
status = 'pending'
```

---

## 📊 Common Queries

### **All Active Members**
```sql
SELECT p.*, m.member_number, c.name as chapter
FROM profiles p
JOIN memberships m ON p.id = m.user_id
JOIN chapters c ON m.chapter_id = c.id
WHERE p.role = 'member' AND m.status = 'active';
```

### **All Pending Candidates**
```sql
SELECT * FROM profiles
WHERE role = 'candidate' AND status = 'pending';
```

### **All Admins**
```sql
SELECT * FROM profiles
WHERE role = 'admin';
```

### **Chapter Presidents**
```sql
SELECT p.*, c.name as chapter
FROM profiles p
JOIN chapters c ON c.president_id = p.id
WHERE p.role = 'member';
```

---

## 🚀 Future: Content Editor Role

**Phase 2** will add:
- `content_editor` role for managing content/events
- Currently NOT implemented

---

**Last Updated:** January 4, 2025  
**See:** `docs/USER_ROLES.md` for detailed documentation

