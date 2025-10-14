import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Login } from '@/pages/auth/Login'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { Members } from '@/pages/dashboard/Members'
import { MemberDetail } from '@/pages/dashboard/MemberDetail'
import { BoardMembers } from '@/pages/dashboard/BoardMembers'
import { BoardPositionForm } from '@/pages/dashboard/BoardPositionForm'
import { Templates } from '@/pages/dashboard/Templates'
import TemplateEditor from '@/pages/dashboard/TemplateEditor'
import { AdminData } from '@/pages/dashboard/AdminData'
import { NotFound } from '@/pages/NotFound'

export function AppRouter() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="members" element={<Members />} />
        <Route path="members/:id" element={<MemberDetail />} />
        <Route path="board-members" element={<BoardMembers />} />
        <Route path="board-positions/new" element={<BoardPositionForm />} />
        <Route path="board-positions/:id/edit" element={<BoardPositionForm isEditing />} />
        <Route path="templates" element={<Templates />} />
        <Route path="templates/:templateId/edit" element={<TemplateEditor />} />
        <Route path="admin-data" element={<AdminData />} />
      </Route>

      {/* Redirects */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

