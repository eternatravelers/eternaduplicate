import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

export type Database = {
  public: {
    Tables: {
      destinations: {
        Row: {
          id: string
          name: string
          location: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          location?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          location?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      sales: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tour_leaders: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          certification: string | null
          specialization: string | null
          experience_years: number
          status: string
          bio: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          certification?: string | null
          specialization?: string | null
          experience_years?: number
          status?: string
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          certification?: string | null
          specialization?: string | null
          experience_years?: number
          status?: string
          bio?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      buses: {
        Row: {
          id: string
          plate_number: string
          model: string | null
          capacity: number | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          plate_number: string
          model?: string | null
          capacity?: number | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          plate_number?: string
          model?: string | null
          capacity?: number | null
          status?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
      drivers: {
        Row: {
          id: string
          name: string
          phone: string | null
          license_number: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          phone?: string | null
          license_number?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          phone?: string | null
          license_number?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      trips: {
        Row: {
          id: string
          name: string
          trip_type: string
          departure_date: string
          return_date: string
          meeting_point: string
          quota: number
          price: number
          pricing_type: string
          additional_facilities: string | null
          cost_plan_id: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          trip_type: string
          departure_date: string
          return_date: string
          meeting_point: string
          quota?: number
          price?: number
          pricing_type?: string
          additional_facilities?: string | null
          cost_plan_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          trip_type?: string
          departure_date?: string
          return_date?: string
          meeting_point?: string
          quota?: number
          price?: number
          pricing_type?: string
          additional_facilities?: string | null
          cost_plan_id?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      trip_tour_leaders: {
        Row: {
          trip_id: string
          tour_leader_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          trip_id: string
          tour_leader_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          trip_id?: string
          tour_leader_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      trip_buses: {
        Row: {
          trip_id: string
          bus_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          trip_id: string
          bus_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          trip_id?: string
          bus_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      trip_drivers: {
        Row: {
          trip_id: string
          driver_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          trip_id: string
          driver_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          trip_id?: string
          driver_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      trip_destinations: {
        Row: {
          id: string
          trip_id: string
          destination_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          destination_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          destination_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          trip_id: string | null
          sales_id: string | null
          full_name: string
          email: string
          phone: string
          address: string
          participant_count: number
          package_price: number
          dp_amount: number
          dp_transfer_date: string
          status: string
          additional_requests: string | null
          proof_of_transfer_url: string | null
          meeting_point_details: string | null
          created_at: string
          updated_at: string
          parent_participant_id: string | null
        }
        Insert: {
          id?: string
          trip_id?: string | null
          sales_id?: string | null
          full_name: string
          email: string
          phone: string
          address: string
          participant_count?: number
          package_price: number
          dp_amount: number
          dp_transfer_date: string
          status?: string
          additional_requests?: string | null
          proof_of_transfer_url?: string | null
          meeting_point_details?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          deleted_by_user_name?: string | null
          deletion_reason?: string | null
          parent_participant_id?: string | null
        }
        Update: {
          id?: string
          trip_id?: string | null
          sales_id?: string | null
          full_name?: string
          email?: string
          phone?: string
          address?: string
          participant_count?: number
          package_price?: number
          dp_amount?: number
          dp_transfer_date?: string
          status?: string
          additional_requests?: string | null
          proof_of_transfer_url?: string | null
          meeting_point_details?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          deleted_by_user_id?: string | null
          deleted_by_user_name?: string | null
          deletion_reason?: string | null
          parent_participant_id?: string | null
        }
      }
      transactions: {
        Row: {
          id: string
          transaction_date: string
          transaction_type: string
          category: string
          amount: number
          description: string | null
          trip_id: string | null
          destination_id: string | null
          trip_type: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transaction_date: string
          transaction_type: string
          category: string
          amount?: number
          description?: string | null
          trip_id?: string | null
          destination_id?: string | null
          trip_type?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transaction_date?: string
          transaction_type?: string
          category?: string
          amount?: number
          description?: string | null
          trip_id?: string | null
          destination_id?: string | null
          trip_type?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      cost_plans: {
        Row: {
          id: string
          name: string
          estimated_participants: number
          categories: any
          total_cost: number | null
          cost_per_person: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          estimated_participants?: number
          categories?: any
          total_cost?: number | null
          cost_per_person?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          estimated_participants?: number
          categories?: any
          total_cost?: number | null
          cost_per_person?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          type: 'itinerary' | 'participant_list' | 'emergency_contact' | 'insurance' | 'permit' | 'other'
          file_url: string
          file_type: string
          file_size: number
          uploaded_by: string
          uploaded_at: string
          trip_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'itinerary' | 'participant_list' | 'emergency_contact' | 'insurance' | 'permit' | 'other'
          file_url: string
          file_type: string
          file_size: number
          uploaded_by: string
          uploaded_at?: string
          trip_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'itinerary' | 'participant_list' | 'emergency_contact' | 'insurance' | 'permit' | 'other'
          file_url?: string
          file_type?: string
          file_size?: number
          uploaded_by?: string
          uploaded_at?: string
          trip_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      checklists: {
        Row: {
          id: string
          trip_id: string
          title: string
          description: string
          completed: boolean
          priority: 'high' | 'medium' | 'low'
          category: 'pre-departure' | 'during-trip' | 'post-trip'
          completed_by: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          title: string
          description: string
          completed?: boolean
          priority?: 'high' | 'medium' | 'low'
          category: 'pre-departure' | 'during-trip' | 'post-trip'
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          title?: string
          description?: string
          completed?: boolean
          priority?: 'high' | 'medium' | 'low'
          category?: 'pre-departure' | 'during-trip' | 'post-trip'
          completed_by?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      emergency_contacts: {
        Row: {
          id: string
          name: string
          role: string
          phone: string
          category: 'medical' | 'police' | 'company' | 'local'
          location: string | null
          notes: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: string
          phone: string
          category: 'medical' | 'police' | 'company' | 'local'
          location?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: string
          phone?: string
          category?: 'medical' | 'police' | 'company' | 'local'
          location?: string | null
          notes?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper function to upload file to Supabase Storage
export const uploadProofOfTransfer = async (file: File, participantId: string): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = `${participantId}-${Date.now()}.${fileExt}`
    const filePath = `proofs/${fileName}`

    const { data, error } = await supabase.storage
      .from('proofs-of-transfer')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('proofs-of-transfer')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading proof of transfer:', error)
    return null
  }
}

// Helper function to delete file from Supabase Storage
export const deleteProofOfTransfer = async (url: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = url.split('/proofs-of-transfer/')
    if (urlParts.length < 2) return false
    
    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from('proofs-of-transfer')
      .remove([filePath])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting proof of transfer:', error)
    return false
  }
}

// Helper function to upload file to Supabase Storage (generic)
export const uploadFile = async (
  file: File, 
  bucket: string, 
  folder: string, 
  fileName?: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop()
    const finalFileName = fileName || `${Date.now()}.${fileExt}`
    const filePath = `${folder}/${finalFileName}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading file:', error)
    return null
  }
}

// Helper function to delete file from Supabase Storage (generic)
export const deleteFile = async (url: string, bucket: string): Promise<boolean> => {
  try {
    // Extract file path from URL
    const urlParts = url.split(`/${bucket}/`)
    if (urlParts.length < 2) return false
    
    const filePath = urlParts[1]

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

// Helper function to upload document to Supabase Storage
export const uploadDocument = async (file: File, documentId: string): Promise<string | null> => {
  return uploadFile(file, 'documents', 'trip-documents', `${documentId}-${Date.now()}.${file.name.split('.').pop()}`)
}

// Helper function to delete document from Supabase Storage
export const deleteDocument = async (url: string): Promise<boolean> => {
  return deleteFile(url, 'documents')
}