# JCI Connect - User Roles & Permissions

## 👥 User Roles (4 Roles)

JCI Connect uses a 4-role system with action-level permissions:
1. **Candidate** - Potential members (leads)
2. **Member** - Active JCI members
3. **Senator** - Enhanced members (40+, approved by JCI International)
4. **Admin** - System administrators

---

### 1. **Candidate** 🌱
**Status:** `pending` or `active`

Potential members who are exploring JCI and being nurtured as leads.

**Permissions:**
- ✅ View public content
- ✅ View their own profile
- ✅ Update their own profile
- ✅ View chapters (public info)
- ✅ View public events
- ❌ Cannot access member directory
- ❌ Cannot join projects
- ❌ Cannot register for member-only events

**Use Cases:**
- Interested individuals who signed up on website
- Event attendees who want to learn more
- Referred prospects
- Application submitted but not yet approved

**Conversion Path:**
```
Candidate → Submit application → Admin approves → Member
```

---

### 2. **Member** 👤
**Status:** `active`, `expired`, or `suspended`

Full JCI members with active membership.

**Permissions:**
- ✅ All Candidate permissions
- ✅ View full member directory
- ✅ Register for all events
- ✅ Join projects as volunteer
- ✅ Access member-only resources
- ✅ View chapter details and members
- ❌ Cannot manage other members
- ❌ Cannot approve applications
- ❌ Cannot access reports/analytics

**Note:** A member can ALSO be a chapter president (via `chapters.president_id`)

**Transition:** Members aged 40+ can apply to become Senators

---

### 3. **Senator** 🏆
**Status:** `active`, `expired`, or `suspended`

Enhanced members with elevated privileges. Senators are members aged 40 or older who have been approved by the JCI International organization.

**Requirements:**
- Must be 40+ years old
- Approved by JCI International
- Maintain active membership
- Pay senator membership fee (tracked via `membership_type = 'senator'`)

**Permissions:**
- ✅ All Member permissions
- ✅ View all member profiles
- ✅ View all senator profiles
- ✅ View all chapters
- ✅ View all membership information
- ✅ Access reports and analytics
- ✅ Advisory and mentorship privileges
- ❌ Cannot create/delete members
- ❌ Cannot manage chapters
- ❌ Cannot change system settings

**Use Cases:**
- Experienced members providing guidance
- Advisory roles at national/regional level
- Mentorship programs
- Access to strategic reports
- Cross-chapter coordination

**Membership Type:**
- Senators have `memberships.membership_type = 'senator'`
- Different fee structure from regular members
- Remains affiliated with local chapter

**Transition Path:**
```
Member (40+) → Submit senator application → 
International approval → Senator
```

---

### 4. **Admin** 🔑
**Status:** `active`

Full system administrators with complete access.

**Permissions:**
- ✅ **Everything** - Full system access
- ✅ Manage all users (create, update, delete)
- ✅ Manage memberships
- ✅ Approve/reject candidate applications
- ✅ Manage chapters
- ✅ Assign chapter presidents
- ✅ View analytics and reports
- ✅ Access audit logs
- ✅ Manage system settings
- ✅ Trigger webhooks manually

**Note:** An admin can ALSO be a member with their own membership record

---

## 🏛️ Special Positions

### **Chapter President**
A **member** who leads a chapter. Stored in `chapters.president_id`.

**How to Set:**
1. User must be a `member` (with active membership)
2. Update chapter record:
   ```sql
   UPDATE chapters 
   SET president_id = 'user-id-here' 
   WHERE id = 'chapter-id-here';
   ```

**Permissions:** Same as member (can be enhanced in future phases)

---

## 🎯 User Status

| Status | Description | Applies To |
|--------|-------------|------------|
| `pending` | Awaiting approval/activation | Candidates |
| `active` | Fully active user | All roles |
| `inactive` | Temporarily deactivated | All roles |
| `suspended` | Suspended for violations | All roles |

---

## 🔄 Role Transitions

### **Candidate → Member**
```sql
-- 1. Update profile role
UPDATE profiles SET role = 'member', status = 'active' WHERE id = 'user-id';

-- 2. Create membership record
INSERT INTO memberships (user_id, chapter_id, membership_type, start_date, expiry_date, member_number, status)
VALUES ('user-id', 'chapter-id', 'local', '2025-01-01', '2026-01-01', 'JCI-XXX-2025-001', 'active');
```

### **Member → Senator**
Requirements: User must be 40+ years old and approved by JCI International

```sql
-- 1. Update profile role
UPDATE profiles SET role = 'senator' WHERE id = 'user-id';

-- 2. Update membership type to reflect senator status and fees
UPDATE memberships 
SET membership_type = 'senator', 
    annual_fee = senator_fee_amount
WHERE user_id = 'user-id';

-- Note: Trigger n8n webhook for senator onboarding workflow
```

**UI Process:**
1. Admin reviews member (checks age 40+)
2. Submits application to JCI International
3. Upon approval, admin updates role to 'senator'
4. System triggers n8n webhook for senator onboarding
5. Senator receives welcome email and materials

### **Member → Admin**
```sql
-- Member keeps their membership, just gets admin role
UPDATE profiles SET role = 'admin' WHERE id = 'user-id';
```

### **Senator → Member** (Rare - if senator status is revoked)
```sql
-- 1. Downgrade role
UPDATE profiles SET role = 'member' WHERE id = 'user-id';

-- 2. Update membership type back to local/national
UPDATE memberships 
SET membership_type = 'local', 
    annual_fee = member_fee_amount
WHERE user_id = 'user-id';
```

---

## 👥 Dual Roles

### **Admin + Member**
An admin can also be a member with their own membership:

```sql
-- User profile
role: 'admin'
status: 'active'

-- User also has a membership record
memberships.user_id: same-user-id
memberships.status: 'active'
```

**Use Case:** National coordinator who is also a local chapter member

### **Senator + Member**
A senator IS a member with enhanced privileges:

```sql
-- User profile
role: 'senator'
status: 'active'

-- User has membership with senator type
memberships.user_id: user-id
memberships.membership_type: 'senator'
memberships.status: 'active'
```

**Use Case:** Experienced member (40+) with advisory role

### **Member + Chapter President**
A member (or senator) who also leads a chapter:

```sql
-- User profile
role: 'member' OR 'senator'

-- User has membership
memberships.user_id: user-id

-- Chapter references user
chapters.president_id: user-id
```

**Note:** Senators can also be chapter presidents

---

## 📊 Member Statistics

### By Role
```sql
SELECT role, COUNT(*) 
FROM profiles 
GROUP BY role;
```

### Active Members Only (including Senators)
```sql
SELECT COUNT(*) 
FROM profiles p
JOIN memberships m ON p.id = m.user_id
WHERE p.role IN ('member', 'senator') 
  AND m.status = 'active';
```

### Senators
```sql
SELECT COUNT(*) 
FROM profiles 
WHERE role = 'senator' 
  AND status = 'active';
```

### Candidates (Leads)
```sql
SELECT COUNT(*) 
FROM profiles 
WHERE role = 'candidate' 
  AND status = 'pending';
```

### Members by Membership Type
```sql
SELECT membership_type, COUNT(*) 
FROM memberships 
WHERE status = 'active'
GROUP BY membership_type;
```

---

## 🌍 Multi-Country Support

JCI Connect supports chapters in multiple countries:
- 🇺🇦 Ukraine
- 🇨🇦 Canada
- 🇪🇨 Ecuador

Each user can belong to any chapter regardless of role.

---

## 🔐 Row Level Security (RLS)

### Candidates
```sql
-- Can view their own profile
CREATE POLICY "Candidates can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id AND role = 'candidate');
```

### Members
```sql
-- Can view all member profiles
CREATE POLICY "Members can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('member', 'senator', 'admin')
    )
  );
```

### Senators
```sql
-- Can view all profiles and memberships
CREATE POLICY "Senators can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'senator'
    )
  );

CREATE POLICY "Senators can view all memberships"
  ON memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'senator'
    )
  );
```

### Admins
```sql
-- Can do everything
CREATE POLICY "Admins can manage all profiles"
  ON profiles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

---

## 📝 Creating Users via Supabase Dashboard

### **Step 1: Create Auth User**
1. Go to **Authentication** → **Users**
2. Click **"Add user"**
3. Enter email and password
4. User is created in `auth.users`

### **Step 2: Set Role (Auto-created as Candidate)**
Profile is auto-created with role=`candidate` and status=`pending` by trigger.

To change role:
```sql
-- Make them a member
UPDATE profiles SET role = 'member', status = 'active' WHERE id = 'user-id';

-- Make them a senator (must be 40+)
UPDATE profiles SET role = 'senator', status = 'active' WHERE id = 'user-id';

-- Make them an admin
UPDATE profiles SET role = 'admin', status = 'active' WHERE id = 'user-id';
```

### **Step 3: Create Membership (if member or senator)**
```sql
-- For regular member
INSERT INTO memberships (
  user_id, chapter_id, membership_type, 
  start_date, expiry_date, member_number, 
  status, payment_status, annual_fee
) VALUES (
  'user-id',
  'chapter-id',
  'local',  -- or 'national'
  '2025-01-01',
  '2026-01-01',
  'JCI-XXX-2025-001',
  'active',
  'paid',
  150.00
);

-- For senator
INSERT INTO memberships (
  user_id, chapter_id, membership_type, 
  start_date, expiry_date, member_number, 
  status, payment_status, annual_fee
) VALUES (
  'user-id',
  'chapter-id',
  'senator',
  '2025-01-01',
  '2026-01-01',
  'JCI-XXX-2025-001',
  'active',
  'paid',
  250.00  -- Higher fee for senators
);
```

---

## 🎯 Permission System

JCI Connect now uses an **action-level RBAC** system. See `docs/PERMISSIONS.md` for complete details.

### Quick Reference

| Resource | Admin | Senator | Member | Candidate |
|----------|-------|---------|--------|-----------|
| Members | CRUD | R | R | - |
| Senators | CRUD | R | R | - |
| Chapters | CRUD | R | R | R |
| Memberships | CRUD | R | - | - |
| Reports | CR | R | - | - |
| Settings | RU | - | - | - |
| Own Profile | RU | RU | RU | RU |

**Legend:** C=Create, R=Read, U=Update, D=Delete

---

## 🚀 Future Enhancements (Phase 2+)

When content management is added:
- [ ] **Content Editor** role (create/edit content, manage events)
- [ ] **Chapter Admin** role (manage their chapter only)
- [ ] **Project Lead** permissions
- [ ] **Event Organizer** role
- [ ] **National Board Member** role
- [ ] Automatic senator promotion workflow (age check + approval)
- [ ] Senator-specific resources and privileges

Advanced features:
- [ ] Custom role builder
- [ ] Database-stored permissions (vs code-defined)
- [ ] Role expiration dates
- [ ] Automatic role transitions based on membership status
- [ ] Permission inheritance system

---

**Last Updated:** January 4, 2025  
**Related:** `docs/PERMISSIONS.md`, `docs/SUPABASE_AUTH_INTEGRATION.md`, `docs/SETUP.md`

