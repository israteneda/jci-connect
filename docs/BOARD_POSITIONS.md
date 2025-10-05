# Board Positions Documentation

## Overview

JCI Connect supports tracking member board positions at multiple organizational levels (chapter, national, international). This feature allows proper recognition of leadership roles and maintains historical records of positions held.

## Database Schema

### Table: `board_positions`

```sql
CREATE TABLE public.board_positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  position_title TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('chapter', 'national', 'international')),
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE SET NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_chapter_position CHECK (
    (level = 'chapter' AND chapter_id IS NOT NULL) OR 
    (level IN ('national', 'international') AND chapter_id IS NULL)
  )
);
```

### Key Features

1. **Normalized Design**: Proper relational structure supporting multiple positions per member
2. **Level-Based**: Three organizational levels (chapter, national, international)
3. **Flexible Titles**: Position titles are free-text to accommodate various chapter structures
4. **Historical Tracking**: `start_date`, `end_date`, and `is_active` flag for history
5. **Chapter Association**: Chapter-level positions must reference a specific chapter
6. **Soft Delete**: Positions are deactivated (not deleted) to maintain history

### Constraints

- **Level Validation**: Must be 'chapter', 'national', or 'international'
- **Chapter Validation**: Chapter positions MUST have a `chapter_id`, national/international MUST NOT
- **User Reference**: All positions must belong to a valid user
- **Cascade Delete**: Positions are deleted if user is deleted

## Position Levels

### Chapter Level
**Description**: Positions within a local JCI chapter

**Examples**:
- President
- Vice President
- Secretary
- Treasurer
- Entrepreneur Director (custom)
- Community Development Director (custom)
- Marketing Director (custom)

**Requirements**:
- Must have `chapter_id`
- Title can be customized per chapter needs

### National Level
**Description**: Positions at the national organization level

**Examples**:
- National President
- National Vice President
- National Secretary
- National Treasurer
- Committee Chair
- Regional Coordinator

**Requirements**:
- `chapter_id` must be NULL
- Typically requires member to be from that country

### International Level
**Description**: Positions at JCI International level

**Examples**:
- International Board Member
- International Committee Chair
- International Vice President
- Regional Director

**Requirements**:
- `chapter_id` must be NULL
- Highest level of leadership

## Use Cases

### Scenario 1: Chapter President
```sql
INSERT INTO board_positions (
  user_id, 
  position_title, 
  level, 
  chapter_id,
  start_date,
  is_active
) VALUES (
  'user-uuid',
  'President',
  'chapter',
  'chapter-uuid',
  '2025-01-01',
  true
);
```

### Scenario 2: Multiple Positions
A member can hold multiple positions simultaneously:

```sql
-- Chapter President
INSERT INTO board_positions (user_id, position_title, level, chapter_id, is_active)
VALUES ('user-uuid', 'President', 'chapter', 'chapter-uuid', true);

-- National Committee Chair
INSERT INTO board_positions (user_id, position_title, level, chapter_id, is_active)
VALUES ('user-uuid', 'Committee Chair', 'national', NULL, true);

-- International Board Member
INSERT INTO board_positions (user_id, position_title, level, chapter_id, is_active)
VALUES ('user-uuid', 'Board Member', 'international', NULL, true);
```

### Scenario 3: Position Transition
When a member's term ends:

```sql
-- End current position
UPDATE board_positions
SET is_active = false, 
    end_date = '2025-12-31'
WHERE id = 'position-uuid';

-- Create new position for successor
INSERT INTO board_positions (user_id, position_title, level, chapter_id, start_date, is_active)
VALUES ('new-user-uuid', 'President', 'chapter', 'chapter-uuid', '2026-01-01', true);
```

## Frontend Implementation

### Hook: `useBoardPositions`

```typescript
import { useBoardPositions } from '@/hooks/useBoardPositions';

function MemberProfile({ userId }) {
  const { 
    positions,        // Active positions only
    allPositions,     // All positions (including inactive)
    isLoading,
    createPosition,
    updatePosition,
    deletePosition,   // Soft delete (sets is_active=false)
    hardDeletePosition, // Hard delete (removes from DB)
    reactivatePosition
  } = useBoardPositions(userId);

  return (
    <div>
      {positions?.map(position => (
        <div key={position.id}>
          {position.position_title} ({position.level})
        </div>
      ))}
    </div>
  );
}
```

### Helper Functions

```typescript
// Get badge color for position level
getPositionLevelColor('chapter')      // 'bg-blue-100 text-blue-800'
getPositionLevelColor('national')     // 'bg-green-100 text-green-800'
getPositionLevelColor('international') // 'bg-purple-100 text-purple-800'

// Format position for display
formatPositionDisplay(position)
// Returns: "President - Toronto Chapter" (chapter level)
// Returns: "Committee Chair (National)" (national level)
```

### Creating a Position

```typescript
const { createPosition } = useBoardPositions(userId);

await createPosition.mutateAsync({
  user_id: userId,
  position_title: 'President',
  level: 'chapter',
  chapter_id: chapterId,
  start_date: '2025-01-01',
  is_active: true
});
```

### Updating a Position

```typescript
const { updatePosition } = useBoardPositions(userId);

await updatePosition.mutateAsync({
  id: positionId,
  updates: {
    position_title: 'Vice President',
    end_date: '2025-12-31'
  }
});
```

### Soft Delete (Recommended)

```typescript
const { deletePosition } = useBoardPositions(userId);

// Sets is_active=false and end_date=today
await deletePosition.mutateAsync(positionId);
```

## Permissions

### View Permissions

| Role | Can View |
|------|----------|
| **Admin** | All board positions |
| **Senator** | All board positions |
| **Member** | All board positions |
| **Candidate** | None |
| **User** | Own board positions only |

### Manage Permissions

| Role | Can Manage |
|------|----------|
| **Admin** | All board positions (create, update, delete) |
| **Others** | None |

### RLS Policies

```sql
-- Admins can manage all positions
CREATE POLICY "Admins can manage board positions"
  ON public.board_positions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Senators can view all positions
CREATE POLICY "Senators can view all board positions"
  ON public.board_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'senator'
    )
  );

-- Members can view all positions
CREATE POLICY "Members can view all board positions"
  ON public.board_positions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('member', 'senator', 'admin')
    )
  );

-- Users can view their own positions
CREATE POLICY "Users can view their own board positions"
  ON public.board_positions FOR SELECT
  USING (
    auth.uid() = user_id
  );
```

## Common Queries

### Get All Active Positions for a User

```sql
SELECT bp.*, c.name as chapter_name
FROM board_positions bp
LEFT JOIN chapters c ON bp.chapter_id = c.id
WHERE bp.user_id = 'user-uuid'
  AND bp.is_active = true
ORDER BY bp.level, bp.created_at DESC;
```

### Get All Chapter Presidents

```sql
SELECT bp.user_id, p.first_name, p.last_name, c.name as chapter_name
FROM board_positions bp
JOIN profiles p ON bp.user_id = p.id
JOIN chapters c ON bp.chapter_id = c.id
WHERE bp.position_title = 'President'
  AND bp.level = 'chapter'
  AND bp.is_active = true;
```

### Get Position History for a User

```sql
SELECT *
FROM board_positions
WHERE user_id = 'user-uuid'
ORDER BY start_date DESC, created_at DESC;
```

### Count Active Board Members by Level

```sql
SELECT level, COUNT(DISTINCT user_id) as member_count
FROM board_positions
WHERE is_active = true
GROUP BY level;
```

## Best Practices

### 1. Use Soft Deletes
Always use soft delete (set `is_active = false`) instead of hard delete to maintain historical records.

```typescript
// ✅ Good: Soft delete
await deletePosition.mutateAsync(positionId);

// ❌ Avoid: Hard delete (unless absolutely necessary)
await hardDeletePosition.mutateAsync(positionId);
```

### 2. Set Start Dates
Always set `start_date` when creating a position for better historical tracking.

```typescript
// ✅ Good
createPosition.mutateAsync({
  user_id: userId,
  position_title: 'President',
  level: 'chapter',
  chapter_id: chapterId,
  start_date: '2025-01-01',  // Always include
  is_active: true
});
```

### 3. Handle Position Transitions Properly
When transitioning positions, update the old position's `end_date` before creating the new one.

```typescript
// 1. End old position
await updatePosition.mutateAsync({
  id: oldPositionId,
  updates: { end_date: '2025-12-31', is_active: false }
});

// 2. Create new position
await createPosition.mutateAsync({
  user_id: newUserId,
  position_title: 'President',
  level: 'chapter',
  chapter_id: chapterId,
  start_date: '2026-01-01',
  is_active: true
});
```

### 4. Validate Chapter Association
Always ensure chapter-level positions have a `chapter_id` and national/international don't.

```typescript
// ✅ Chapter position with chapter_id
{ level: 'chapter', chapter_id: 'uuid' }

// ✅ National position without chapter_id
{ level: 'national', chapter_id: null }

// ❌ Invalid: Chapter position without chapter_id
{ level: 'chapter', chapter_id: null }  // Will fail constraint
```

## UI Components

### Position Badge
```tsx
<span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionLevelColor(position.level)}`}>
  {position.level}
</span>
```

### Position Card
```tsx
<div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
  <div className="flex items-start justify-between mb-2">
    <h3 className="font-semibold text-gray-900">{position.position_title}</h3>
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPositionLevelColor(position.level)}`}>
      {position.level}
    </span>
  </div>
  {position.level === 'chapter' && position.chapters && (
    <p className="text-sm text-gray-600 mb-2">
      {position.chapters.name}, {position.chapters.city}
    </p>
  )}
  {position.start_date && (
    <p className="text-xs text-gray-500">
      Since {formatDate(position.start_date)}
    </p>
  )}
</div>
```

## Future Enhancements

### Phase 2+
- [ ] Board position management UI in member form dialog
- [ ] Position transition workflow (auto-end old position when new one starts)
- [ ] Position approval workflow (require admin approval for national/international)
- [ ] Term length tracking (e.g., 1-year presidential terms)
- [ ] Position responsibilities and descriptions
- [ ] Board member directory/grid view
- [ ] Position badges/indicators in member list
- [ ] Email notifications for position changes
- [ ] Position reports and analytics
- [ ] Export board member list

### Phase 3+
- [ ] Committee structure (sub-positions under board members)
- [ ] Position application system
- [ ] Voting/election integration
- [ ] Meeting attendance tracking for board members
- [ ] Board member onboarding workflow
- [ ] Position-specific permissions (e.g., chapter president can manage their chapter)

## Troubleshooting

### Issue: Can't create chapter position
**Error**: `violates check constraint "valid_chapter_position"`

**Solution**: Ensure `chapter_id` is provided for chapter-level positions
```typescript
// ❌ Wrong
{ level: 'chapter', chapter_id: null }

// ✅ Correct
{ level: 'chapter', chapter_id: 'chapter-uuid' }
```

### Issue: Can't see board positions
**Solution**: Check RLS policies and user role. Candidates cannot view board positions.

### Issue: Position not showing in member detail
**Solution**: Ensure position is active (`is_active = true`) and user_id matches

## Support

For questions or issues with board positions:
1. Check this documentation
2. Review `hooks/useBoardPositions.ts` for implementation details
3. Check RLS policies in migration file
4. Verify data in Supabase dashboard

---

**Last Updated**: January 4, 2025  
**Related**: `docs/USER_ROLES.md`, `docs/PERMISSIONS.md`, `docs/SETUP.md`

