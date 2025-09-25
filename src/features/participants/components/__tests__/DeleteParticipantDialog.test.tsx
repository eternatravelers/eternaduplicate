import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteParticipantDialog } from '../DeleteParticipantDialog'
import { useAuth } from '@/hooks/useAuth'

// Mock the useAuth hook
jest.mock('@/hooks/useAuth')
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

// Mock participant data
const mockParticipant = {
  id: '123',
  full_name: 'John Doe',
  email: 'john@example.com',
  phone: '08123456789',
  participant_count: 2,
  package_price: 1500000,
  dp_amount: 500000,
  status: 'confirmed',
  created_at: '2024-01-01T00:00:00Z',
  trips: {
    name: 'Bali Adventure'
  }
}

describe('DeleteParticipantDialog', () => {
  const mockOnDelete = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAuth.mockReturnValue({
      isAdmin: true,
      isSuperAdmin: false,
      user: { id: 'user123', email: 'admin@test.com' },
      userRole: 'admin'
    } as any)
  })

  it('renders delete button trigger', () => {
    render(
      <DeleteParticipantDialog
        participant={mockParticipant}
        onDelete={mockOnDelete}
        deleting={false}
      />
    )

    const deleteButton = screen.getByTitle('Hapus peserta')
    expect(deleteButton).toBeInTheDocument()
  })

  it('opens dialog when delete button is clicked', async () => {
    render(
      <DeleteParticipantDialog
        participant={mockParticipant}
        onDelete={mockOnDelete}
        deleting={false}
      />
    )

    const deleteButton = screen.getByTitle('Hapus peserta')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Hapus Peserta')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })
  })

  it('shows only soft delete option for admin users', async () => {
    render(
      <DeleteParticipantDialog
        participant={mockParticipant}
        onDelete={mockOnDelete}
        deleting={false}
      />
    )

    const deleteButton = screen.getByTitle('Hapus peserta')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Hapus Sementara')).toBeInTheDocument()
      expect(screen.queryByText('Hapus Permanen')).not.toBeInTheDocument()
    })
  })

  it('shows both soft and permanent delete options for super admin', async () => {
    mockUseAuth.mockReturnValue({
      isAdmin: true,
      isSuperAdmin: true,
      user: { id: 'user123', email: 'superadmin@test.com' },
      userRole: 'super_admin'
    } as any)

    render(
      <DeleteParticipantDialog
        participant={mockParticipant}
        onDelete={mockOnDelete}
        deleting={false}
      />
    )

    const deleteButton = screen.getByTitle('Hapus peserta')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Hapus Sementara')).toBeInTheDocument()
      // Note: Permanent delete option is in a select dropdown, so we need to open it
      const selectTrigger = screen.getByRole('combobox')
      fireEvent.click(selectTrigger)
    })

    await waitFor(() => {
      expect(screen.getByText('Hapus Permanen')).toBeInTheDocument()
    })
  })

  it('calls onDelete with correct parameters for soft delete', async () => {
    render(
      <DeleteParticipantDialog
        participant={mockParticipant}
        onDelete={mockOnDelete}
        deleting={false}
      />
    )

    const deleteButton = screen.getByTitle('Hapus peserta')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      const reasonTextarea = screen.getByPlaceholderText('Jelaskan alasan penghapusan peserta ini...')
      fireEvent.change(reasonTextarea, { target: { value: 'Test reason' } })

      const confirmButton = screen.getByText('Hapus Sementara')
      fireEvent.click(confirmButton)
    })

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith('123', 'Test reason', false)
    })
  })

  it('validates confirmation text for permanent delete', async () => {
    mockUseAuth.mockReturnValue({
      isAdmin: true,
      isSuperAdmin: true,
      user: { id: 'user123', email: 'superadmin@test.com' },
      userRole: 'super_admin'
    } as any)

    render(
      <DeleteParticipantDialog
        participant={mockParticipant}
        onDelete={mockOnDelete}
        deleting={false}
      />
    )

    const deleteButton = screen.getByTitle('Hapus peserta')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      // Change to permanent delete
      const selectTrigger = screen.getByRole('combobox')
      fireEvent.click(selectTrigger)
    })

    await waitFor(() => {
      const permanentOption = screen.getByText('Hapus Permanen')
      fireEvent.click(permanentOption)
    })

    await waitFor(() => {
      // Should show confirmation input
      const confirmInput = screen.getByPlaceholderText(`Ketik "John Doe" untuk konfirmasi`)
      expect(confirmInput).toBeInTheDocument()

      // Button should be disabled without correct confirmation
      const confirmButton = screen.getByText('Hapus Permanen')
      expect(confirmButton).toBeDisabled()

      // Enter correct confirmation
      fireEvent.change(confirmInput, { target: { value: 'John Doe' } })
      expect(confirmButton).not.toBeDisabled()
    })
  })

  it('displays participant information correctly', async () => {
    render(
      <DeleteParticipantDialog
        participant={mockParticipant}
        onDelete={mockOnDelete}
        deleting={false}
      />
    )

    const deleteButton = screen.getByTitle('Hapus peserta')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText('08123456789')).toBeInTheDocument()
      expect(screen.getByText('2 orang')).toBeInTheDocument()
      expect(screen.getByText('Bali Adventure')).toBeInTheDocument()
    })
  })
})