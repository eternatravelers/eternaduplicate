import React from 'react'
import { render, screen } from '@testing-library/react'
import { ParticipantPermissionsGuard } from '../ParticipantPermissionsGuard'
import { useAuth } from '@/hooks/useAuth'

// Mock the useAuth hook
jest.mock('@/hooks/useAuth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

describe('ParticipantPermissionsGuard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders children when user has admin permission', () => {
    mockUseAuth.mockReturnValue({
      isAdmin: true,
      isSuperAdmin: false,
      userRole: 'admin'
    } as any)

    render(
      <ParticipantPermissionsGuard requiredRole="admin">
        <div>Protected Content</div>
      </ParticipantPermissionsGuard>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('renders children when user has super admin permission', () => {
    mockUseAuth.mockReturnValue({
      isAdmin: true,
      isSuperAdmin: true,
      userRole: 'super_admin'
    } as any)

    render(
      <ParticipantPermissionsGuard requiredRole="super_admin">
        <div>Super Admin Content</div>
      </ParticipantPermissionsGuard>
    )

    expect(screen.getByText('Super Admin Content')).toBeInTheDocument()
  })

  it('shows access denied when user lacks permission', () => {
    mockUseAuth.mockReturnValue({
      isAdmin: false,
      isSuperAdmin: false,
      userRole: 'user'
    } as any)

    render(
      <ParticipantPermissionsGuard requiredRole="admin">
        <div>Protected Content</div>
      </ParticipantPermissionsGuard>
    )

    expect(screen.getByText('Akses Terbatas')).toBeInTheDocument()
    expect(screen.getByText('Diperlukan peran: Admin')).toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows custom fallback when provided', () => {
    mockUseAuth.mockReturnValue({
      isAdmin: false,
      isSuperAdmin: false,
      userRole: 'user'
    } as any)

    render(
      <ParticipantPermissionsGuard 
        requiredRole="admin"
        fallback={<div>Custom Fallback</div>}
      >
        <div>Protected Content</div>
      </ParticipantPermissionsGuard>
    )

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument()
    expect(screen.queryByText('Akses Terbatas')).not.toBeInTheDocument()
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('shows correct required role in error message', () => {
    mockUseAuth.mockReturnValue({
      isAdmin: true,
      isSuperAdmin: false,
      userRole: 'admin'
    } as any)

    render(
      <ParticipantPermissionsGuard requiredRole="super_admin">
        <div>Super Admin Content</div>
      </ParticipantPermissionsGuard>
    )

    expect(screen.getByText('Diperlukan peran: Super Admin')).toBeInTheDocument()
  })
})