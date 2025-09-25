import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type EmergencyContact = Database['public']['Tables']['emergency_contacts']['Row']

export function useEmergencyContacts() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContacts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('emergency_contacts')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true })
        .order('name', { ascending: true })

      if (error) throw error

      setContacts(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  return { contacts, loading, error, refetch: fetchContacts }
}

export function useCreateEmergencyContact() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createContact = async (contactData: Database['public']['Tables']['emergency_contacts']['Insert']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert([{
          ...contactData,
          is_active: true
        }])
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createContact, loading, error }
}

export function useUpdateEmergencyContact() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateContact = async (id: string, contactData: Database['public']['Tables']['emergency_contacts']['Update']) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('emergency_contacts')
        .update(contactData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { updateContact, loading, error }
}

export function useDeleteEmergencyContact() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteContact = async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      // Soft delete by setting is_active to false
      const { error } = await supabase
        .from('emergency_contacts')
        .update({ is_active: false })
        .eq('id', id)

      if (error) throw error

      return { error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { deleteContact, loading, error }
}

// Hook to get contacts by category
export function useEmergencyContactsByCategory() {
  const { contacts, loading, error, refetch } = useEmergencyContacts()

  const contactsByCategory = {
    medical: contacts.filter(c => c.category === 'medical'),
    police: contacts.filter(c => c.category === 'police'),
    company: contacts.filter(c => c.category === 'company'),
    local: contacts.filter(c => c.category === 'local')
  }

  return { contactsByCategory, loading, error, refetch }
}

// Hook to initialize default emergency contacts
export function useInitializeDefaultEmergencyContacts() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeDefaultContacts = async () => {
    try {
      setLoading(true)
      setError(null)

      const defaultContacts: Database['public']['Tables']['emergency_contacts']['Insert'][] = [
        {
          name: 'RS Umum Daerah',
          role: 'Rumah Sakit',
          phone: '119',
          category: 'medical',
          location: 'Jakarta',
          notes: 'Rumah sakit terdekat dengan fasilitas lengkap'
        },
        {
          name: 'Polres Jakarta Pusat',
          role: 'Kepolisian',
          phone: '110',
          category: 'police',
          location: 'Jakarta Pusat',
          notes: 'Untuk keadaan darurat dan bantuan keamanan'
        },
        {
          name: 'Manager Operasional',
          role: 'Manager Operasional',
          phone: '08123456789',
          category: 'company',
          notes: 'Kontak utama untuk koordinasi operasional'
        },
        {
          name: 'Tour Leader Senior',
          role: 'Tour Leader Senior',
          phone: '08198765432',
          category: 'company',
          notes: 'Backup tour leader untuk situasi darurat'
        }
      ]

      const { data, error } = await supabase
        .from('emergency_contacts')
        .insert(defaultContacts)
        .select()

      if (error) throw error

      return { data, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { initializeDefaultContacts, loading, error }
}