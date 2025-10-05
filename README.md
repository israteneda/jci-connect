# JCI Connect - Member Management Platform

A modern member management platform for JCI Ukraine built with React, TypeScript, and Supabase.

## 🚀 Features

- **Authentication**: Secure login with Supabase Auth
- **Member Management**: Full CRUD operations for members
- **Chapter Management**: Organize members by chapters
- **Role-Based Access**: Admin, Member, and Candidate roles
- **n8n Integration**: Automatic webhook triggers for workflows
- **Dashboard**: Real-time statistics and insights
- **Responsive Design**: Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

### Frontend
- **Vite** - Lightning-fast build tool
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **Shadcn/UI** - Beautiful UI components
- **React Router** - Client-side routing
- **TanStack Query** - Data fetching and caching
- **React Hook Form** - Form management
- **Zod** - Schema validation

### Backend
- **Supabase** - Backend-as-a-Service
  - PostgreSQL database
  - Authentication
  - Row Level Security
  - Storage
  - Real-time subscriptions

### Integrations
- **n8n** - Workflow automation (webhooks)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- n8n instance (optional for development)

### Setup Steps

1. **Clone the repository**
```bash
cd jci-connect/frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Supabase**

   a. Create a new project at [supabase.com](https://supabase.com)
   
   b. Run the migration:
   - Go to Supabase Dashboard → SQL Editor
   - Copy the content from `supabase/migrations/20250104000000_initial_schema.sql`
   - Paste and execute

   c. Create your first admin user:
   - Go to Authentication → Users
   - Click "Add user"
   - Enter email and password
   - After creation, go to Table Editor → users
   - Find the user and set `role` to `'admin'`

4. **Configure environment variables**

Create a `.env` file in the `frontend` directory:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/jci-connect
```

Get your Supabase credentials from:
- Project Settings → API → Project URL
- Project Settings → API → Project API keys → anon public

5. **Start the development server**
```bash
npm run dev
```

The app will open at `http://localhost:5173`

## 🗄️ Database Schema

### Tables
- **users** - User accounts (extends Supabase Auth)
- **profiles** - User profile information
- **memberships** - Member-specific data
- **chapters** - Organization chapters

See the ERD diagram in docs for visual representation.

## 🔐 Row Level Security (RLS)

The database uses Supabase RLS policies to ensure data security:

- **Admins**: Full access to all data
- **Content Editors**: Read access to members, manage content (future)
- **Members**: Read own profile, read other members

## 🔄 n8n Webhook Integration

When a member is created, updated, or deleted, the app sends a webhook to n8n:

### Webhook Events
- `member.created`
- `member.updated`
- `member.deleted`

### Payload Example
```json
{
  "event": "member.created",
  "timestamp": "2025-10-04T10:30:00Z",
  "data": {
    "user_id": "uuid",
    "email": "john@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+380123456789",
    "member_number": "JCI-KYI-2025-001",
    "chapter_id": "uuid",
    "membership_type": "national"
  }
}
```

You can configure n8n workflows to:
- Send welcome emails (via Resend)
- Send WhatsApp messages (via Evolution API)
- Update external CRMs
- Generate reports

## 🎨 Design System

### Colors (JCI Brand)
- **Navy** - `#3A67B1` (Primary buttons, links)
- **Aqua** - `#0097D7` (Accent, highlights)
- **Off Black** - `#0A0F29` (Text, sidebar)
- **Special Gray** - `#D3D9E3` (Borders, secondary)

### Fonts
- **Arial** - Body text
- **Namu 1990** - Accent font (Ukrainian designers)

## 📱 Pages

### Public
- `/login` - Login page

### Protected (Admin)
- `/dashboard` - Dashboard with statistics
- `/dashboard/members` - Member list and management
- `/dashboard/members/:id` - Member details
- `/dashboard/chapters` - Chapter list
- `/dashboard/chapters/:id` - Chapter details with members

## 🚢 Deployment

### Frontend (Vercel/Netlify)

1. **Build the app**
```bash
npm run build
```

2. **Deploy to Vercel**
```bash
npx vercel
```

or

3. **Deploy to Netlify**
```bash
npx netlify deploy --prod
```

### Environment Variables
Don't forget to set environment variables in your hosting provider:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_N8N_WEBHOOK_URL`

## 🧪 Development

### File Structure
```
frontend/
├── src/
│   ├── app/              # App initialization and routing
│   ├── components/       # Reusable components
│   ├── hooks/            # Custom React hooks (Supabase queries)
│   ├── lib/              # Utilities and Supabase client
│   ├── pages/            # Page components
│   ├── styles/           # Global styles
│   └── types/            # TypeScript types
├── public/               # Static assets
└── supabase/             # Database migrations
```

### Key Files
- `src/lib/supabase.ts` - Supabase client initialization
- `src/lib/webhooks.ts` - n8n webhook trigger function
- `src/hooks/useMembers.ts` - Member CRUD with Supabase client
- `src/hooks/useChapters.ts` - Chapter CRUD with Supabase client
- `src/hooks/useAuth.ts` - Authentication logic

## 🔧 Supabase Client Usage

All database operations use the Supabase JavaScript client:

### Fetching Data
```typescript
const { data, error } = await supabase
  .from('users')
  .select(`*, profiles(*), memberships(*, chapters(*))`)
  .eq('role', 'member')
```

### Inserting Data
```typescript
const { data, error } = await supabase
  .from('profiles')
  .insert({
    user_id: userId,
    first_name: 'John',
    last_name: 'Doe'
  })
```

### Updating Data
```typescript
const { data, error } = await supabase
  .from('profiles')
  .update({ first_name: 'Jane' })
  .eq('user_id', userId)
```

### Deleting Data
```typescript
const { error } = await supabase
  .from('users')
  .delete()
  .eq('id', userId)
```

## 📝 Next Steps

### Phase 2 Features
- [ ] Projects management
- [ ] Events management
- [ ] Content management (news, articles)
- [ ] Multi-language support (EN/ES)
- [ ] File uploads
- [ ] Advanced search and filters

### Phase 3 Features
- [ ] WhatsApp messaging integration (Evolution API)
- [ ] Email campaigns (Resend integration)
- [ ] Analytics and reporting
- [ ] Member portal with self-service
- [ ] Mobile app (React Native)

## 🤝 Contributing

This is a private project for JCI Ukraine. For questions or issues, contact the development team.

## 📄 License

Copyright © 2025 JCI Ukraine. All rights reserved.

## 🆘 Support

For support, email the tech team or create an issue in the repository.

---

**Built with ❤️ for JCI Ukraine**

