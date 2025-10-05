# Permission System Documentation

## Overview

JCI Connect implements a flexible, action-level Role-Based Access Control (RBAC) system designed to scale with organizational needs. The system is intentionally simple yet extensible, allowing for easy adaptation to different organizations beyond JCI.

## Architecture

### Core Principles

1. **Resource-Based**: Permissions are organized around resources (members, chapters, etc.)
2. **Action-Level**: Each resource has granular actions (create, read, update, delete)
3. **Role-Based**: Permissions are assigned to roles, not individual users
4. **Code-First**: Permissions are defined in code for version control and easy deployment
5. **Extensible**: New roles and resources can be added without database migrations

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                  Permission System                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐ │
│  │   Roles      │───▶│  Resources   │───▶│ Actions  │ │
│  │              │    │              │    │          │ │
│  │ • admin      │    │ • members    │    │ • create │ │
│  │ • senator    │    │ • chapters   │    │ • read   │ │
│  │ • member     │    │ • senators   │    │ • update │ │
│  │ • candidate  │    │ • settings   │    │ • delete │ │
│  └──────────────┘    └──────────────┘    └──────────┘ │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Roles

### Admin
**Full system access** - Can manage all resources and users

```typescript
{
  members: ['create', 'read', 'update', 'delete'],
  senators: ['create', 'read', 'update', 'delete'],
  chapters: ['create', 'read', 'update', 'delete'],
  memberships: ['create', 'read', 'update', 'delete'],
  settings: ['read', 'update'],
  reports: ['create', 'read'],
  profile: ['read', 'update'],
}
```

**Use Cases:**
- Platform administrators
- System managers
- Support staff with full access

**Dual Roles:** Admins can also have memberships to participate as regular members

---

### Senator
**Enhanced member** with additional privileges

```typescript
{
  members: ['read'],
  senators: ['read'],
  chapters: ['read'],
  memberships: ['read'],
  reports: ['read'],
  profile: ['read', 'update'],
}
```

**Requirements:**
- Member aged 40+ years old
- Approved by international organization
- Remains part of local chapter
- Pays senator membership fee

**Use Cases:**
- Experienced members with elevated status
- Advisory roles
- Access to reports and analytics
- Mentorship and guidance

---

### Member
**Standard chapter member** with community access

```typescript
{
  members: ['read'],
  chapters: ['read'],
  profile: ['read', 'update'],
}
```

**Use Cases:**
- Active chapter participants
- Standard membership benefits
- Community networking

---

### Candidate
**Potential member** with limited access

```typescript
{
  profile: ['read', 'update'],
}
```

**Use Cases:**
- Individuals being evaluated for membership
- Trial period access
- Limited to own profile management

## Resources

### Available Resources

| Resource | Description |
|----------|-------------|
| `members` | Member profiles and data |
| `senators` | Senator-specific information |
| `chapters` | Chapter information and management |
| `memberships` | Membership records and fees |
| `settings` | System configuration |
| `reports` | Analytics and reports |
| `profile` | User's own profile |

### Actions

| Action | Description |
|--------|-------------|
| `create` | Create new records |
| `read` | View/read records |
| `update` | Modify existing records |
| `delete` | Remove records |

## Implementation

### Backend (Database Level)

#### Row Level Security (RLS)

The database enforces permissions through PostgreSQL RLS policies:

```sql
-- Example: Senators can view all profiles
CREATE POLICY "Senators can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'senator'
    )
  );
```

#### Key RLS Policies

1. **Profile Access**
   - Admins: Full access
   - Senators: Read all profiles
   - Members: Read all profiles
   - Users: Read/update own profile

2. **Chapter Access**
   - Admins: Full access
   - Authenticated users: Read active chapters

3. **Membership Access**
   - Admins: Full access
   - Senators: Read all memberships
   - Users: Read own membership

### Frontend (Application Level)

#### Permission Checking

```typescript
import { usePermissions } from '@/hooks/usePermissions';

function MyComponent() {
  const { can, canAccess, isAdmin } = usePermissions();
  
  return (
    <div>
      {can('members', 'create') && <AddMemberButton />}
      {can('members', 'delete') && <DeleteButton />}
      {canAccess('reports') && <ReportsSection />}
      {isAdmin() && <AdminPanel />}
    </div>
  );
}
```

#### Available Hook Methods

```typescript
const {
  can,           // Check specific permission
  canAccess,     // Check resource access
  getActions,    // Get all allowed actions
  canManageUser, // Check user-specific permission
  isAdmin,       // Check if admin
  isSenator,     // Check if senator
  isMember,      // Check if member
  role,          // Current user role
} = usePermissions();
```

### Permission Functions

#### `can(resource, action)`

Check if user has permission for specific action on resource.

```typescript
if (can('members', 'delete')) {
  // Show delete button
}
```

#### `canAccess(resource)`

Check if user has any permission on resource.

```typescript
if (canAccess('chapters')) {
  // Show chapters section
}
```

#### `canManageUser(targetUserId)`

Check if user can manage specific user.

```typescript
if (canManageUser(memberId)) {
  // Show edit/delete options
}
```

## Extending the System

### Adding a New Role

1. **Define Role Type**
   ```typescript
   // lib/permissions.ts
   export type Role = 'admin' | 'senator' | 'member' | 'candidate' | 'moderator';
   ```

2. **Add Permissions**
   ```typescript
   export const PERMISSIONS: Permissions = {
     // ... existing roles
     moderator: {
       members: ['read', 'update'],
       reports: ['read'],
       profile: ['read', 'update'],
     },
   };
   ```

3. **Update Database**
   ```sql
   -- Update role constraint
   ALTER TABLE public.profiles 
   DROP CONSTRAINT profiles_role_check;
   
   ALTER TABLE public.profiles 
   ADD CONSTRAINT profiles_role_check 
   CHECK (role IN ('admin', 'senator', 'member', 'candidate', 'moderator'));
   ```

4. **Add RLS Policies** (if needed)
   ```sql
   CREATE POLICY "Moderators can update members"
     ON public.profiles FOR UPDATE
     USING (
       EXISTS (
         SELECT 1 FROM public.profiles
         WHERE id = auth.uid() AND role = 'moderator'
       )
     );
   ```

### Adding a New Resource

1. **Define Resource Type**
   ```typescript
   export type Resource = 
     | 'members' 
     | 'chapters'
     | 'events'  // New resource
     | ...;
   ```

2. **Add to Role Permissions**
   ```typescript
   admin: {
     // ... existing permissions
     events: ['create', 'read', 'update', 'delete'],
   },
   member: {
     // ... existing permissions
     events: ['read'],
   },
   ```

3. **Implement in Components**
   ```typescript
   function EventsPage() {
     const { can } = usePermissions();
     
     return (
       <div>
         {can('events', 'create') && <CreateEventButton />}
       </div>
     );
   }
   ```

### Adding a New Action

1. **Define Action Type**
   ```typescript
   export type Action = 'create' | 'read' | 'update' | 'delete' | 'approve';
   ```

2. **Add to Permissions**
   ```typescript
   admin: {
     senators: ['create', 'read', 'update', 'delete', 'approve'],
   },
   ```

3. **Use in Components**
   ```typescript
   {can('senators', 'approve') && <ApproveButton />}
   ```

## Use Cases for Other Organizations

### Example: Educational Institution

```typescript
export type Role = 'admin' | 'teacher' | 'student' | 'parent';

export const PERMISSIONS: Permissions = {
  admin: {
    courses: ['create', 'read', 'update', 'delete'],
    students: ['create', 'read', 'update', 'delete'],
    teachers: ['create', 'read', 'update', 'delete'],
    grades: ['create', 'read', 'update', 'delete'],
  },
  teacher: {
    courses: ['read', 'update'],
    students: ['read'],
    grades: ['create', 'read', 'update'],
    profile: ['read', 'update'],
  },
  student: {
    courses: ['read'],
    grades: ['read'],
    profile: ['read', 'update'],
  },
  parent: {
    students: ['read'],  // Only own children
    grades: ['read'],    // Only own children's grades
  },
};
```

### Example: Non-Profit Organization

```typescript
export type Role = 'admin' | 'volunteer' | 'donor' | 'beneficiary';

export const PERMISSIONS: Permissions = {
  admin: {
    projects: ['create', 'read', 'update', 'delete'],
    volunteers: ['create', 'read', 'update', 'delete'],
    donations: ['create', 'read', 'update', 'delete'],
    reports: ['create', 'read'],
  },
  volunteer: {
    projects: ['read'],
    volunteers: ['read'],
    profile: ['read', 'update'],
  },
  donor: {
    projects: ['read'],
    donations: ['read'],  // Own donations only
    reports: ['read'],
    profile: ['read', 'update'],
  },
  beneficiary: {
    projects: ['read'],
    profile: ['read', 'update'],
  },
};
```

## Best Practices

### 1. Principle of Least Privilege
Always grant the minimum permissions necessary for a role to function.

### 2. Defense in Depth
Implement permissions at multiple levels:
- Database (RLS policies)
- API/Backend (middleware)
- Frontend (UI visibility)

### 3. Consistent Naming
Use consistent resource and action names across the system.

### 4. Documentation
Keep this documentation updated when adding new roles or resources.

### 5. Testing
Test permission checks thoroughly, especially after adding new roles.

### 6. Audit Trail
Consider logging permission-based actions for security audits.

## Security Considerations

### Database Security

1. **RLS Policies**: Always enable Row Level Security on tables
2. **Service Role**: Never expose service role key to frontend
3. **Secure Functions**: Use `SECURITY DEFINER` carefully for privilege escalation

### Frontend Security

1. **UI Hiding ≠ Security**: Frontend permission checks are for UX, not security
2. **Validate Backend**: Always validate permissions on the backend
3. **Sensitive Data**: Use backend API calls for sensitive operations

### Common Pitfalls

1. ❌ Relying only on frontend permission checks
2. ❌ Exposing admin endpoints without proper checks
3. ❌ Granting excessive permissions "just in case"
4. ❌ Not testing permission boundaries

## Migration Path

### From Current System to Database-Stored Permissions

If you need more dynamic permission management:

1. **Create permissions table**
   ```sql
   CREATE TABLE public.role_permissions (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     role TEXT NOT NULL,
     resource TEXT NOT NULL,
     actions TEXT[] NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     UNIQUE(role, resource)
   );
   ```

2. **Seed with current permissions**
   ```sql
   INSERT INTO public.role_permissions (role, resource, actions)
   VALUES 
     ('admin', 'members', ARRAY['create', 'read', 'update', 'delete']),
     ('senator', 'members', ARRAY['read']),
     ...;
   ```

3. **Update frontend to fetch from API**
   ```typescript
   const { data: permissions } = useQuery('permissions', fetchPermissions);
   ```

4. **Build admin UI for permission management**

## Support

For questions or issues with the permission system:
1. Check this documentation
2. Review `lib/permissions.ts` for current configuration
3. Examine `hooks/usePermissions.ts` for usage examples
4. Check RLS policies in migration files

## Changelog

### Version 1.0 (Initial Release)
- Action-level RBAC system
- Four roles: admin, senator, member, candidate
- Seven resources: members, senators, chapters, memberships, settings, reports, profile
- Frontend permission hooks
- Database RLS policies
- Senator role with enhanced permissions

---

**Last Updated**: January 4, 2025  
**Maintained By**: JCI Connect Development Team

