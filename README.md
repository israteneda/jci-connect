# JCI Connect - Member Management Platform

A modern member management platform for JCI chapters built with React, TypeScript, and Supabase.

**Note:** This system is designed for single-chapter deployments. Each chapter deploys their own independent instance.

## Features

- Authentication with Supabase Auth
- Member management with full CRUD operations
- Board positions tracking (local, national, international)
- Role-based access control (Admin, Senator, Member, Candidate)
- Templates system for email and WhatsApp communication
- CRM features with member interactions and notes
- Dashboard with real-time statistics
- Responsive design for all devices

## Tech Stack

### Frontend
- Vite, React 18, TypeScript
- TailwindCSS, Shadcn/UI
- React Router, TanStack Query
- React Hook Form, Zod validation

### Backend
- Supabase (PostgreSQL, Auth, RLS, Storage)
- FastAPI (Communication services)
- SMTP (Email)
- Evolution API (WhatsApp)

## Project Structure

```
jci-connect/
├── frontend/          # React application
├── backend/           # FastAPI communication services
├── supabase/          # Database migrations and config
└── docs/             # Documentation
```

## Quick Start

### 1. Database Setup

```bash
# Start Supabase locally
supabase start

# Apply migrations
supabase db reset
```

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
# Configure .env with your Supabase settings
npm run dev
```

### 3. Backend Setup (Optional)

```bash
cd backend
make quick-start
# Edit .env with your configuration
make run
```

## Configuration

### Frontend (.env)
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Backend (.env)
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SECRET_KEY=your_secret_key
SECRET_KEY=your_secret_key
```

**Note:** SMTP and WhatsApp configurations are stored in the `organization_settings` table in Supabase. Backend only needs the secret key for secure database access.

## Development

### Frontend
```bash
cd frontend
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Lint code
```

### Backend
```bash
cd backend
make dev             # Development with hot reload
make logs            # View logs
make shell           # Access container
```

### Database
```bash
supabase db reset    # Reset database
supabase gen types   # Generate TypeScript types
```

## API Endpoints

### Frontend (Port 5173)
- Member management
- Templates system
- Settings and configuration

### Backend (Port 8000)
- `/api/communication/send-message` - Send messages
- `/api/communication/test-email` - Test SMTP
- `/api/communication/test-whatsapp` - Test WhatsApp
- `/docs` - API documentation

## Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting service
```

### Backend
```bash
cd backend
make prod
# Deploy container to your hosting service
```

### Database
```bash
supabase db push
# Deploy to Supabase cloud
```

## Key Features

### Member Management
- Create, edit, delete members
- Role-based permissions
- Board position tracking
- Member timeline and interactions

### Communication
- Email templates with SMTP
- WhatsApp templates with Evolution API
- Message logging and tracking
- Template preview and testing

### CRM Features
- Member activity timeline
- Interaction history
- Notes and tags
- Follow-up management

## Troubleshooting

### Common Issues

1. **Database Connection**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Run `supabase status`

2. **Authentication Issues**
   - Check JWT expiry settings
   - Verify user roles in database
   - Check RLS policies

3. **Communication Services**
   - Test SMTP configuration
   - Verify WhatsApp API settings
   - Check message logs

### Logs
```bash
# Frontend
npm run dev

# Backend
make logs

# Database
supabase logs
```

## Documentation

- [Setup Guide](docs/SETUP.md)
- [Permissions System](docs/PERMISSIONS.md)
- [API Documentation](http://localhost:8000/docs)
- [Database Schema](supabase/migrations/)

## Contributing

1. Follow existing code structure
2. Add proper error handling
3. Include logging for debugging
4. Update documentation
5. Test all functionality

## License

This project is part of JCI Connect and follows the same license terms.