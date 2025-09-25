import { useState, useEffect } from 'react'
import { supabase, uploadDocument, deleteDocument } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Document = Database['public']['Tables']['documents']['Row']

export function useDocuments(tripId?: string) {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      let query = supabase
        .from('documents')
        .select('*')
        .order('uploaded_at', { ascending: false })

      // Filter by trip if tripId is provided
      if (tripId) {
        query = query.eq('trip_id', tripId)
      }

      const { data, error } = await query

      if (error) throw error

      setDocuments(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocuments()
  }, [tripId])

  return { documents, loading, error, refetch: fetchDocuments }
}

export function useCreateDocument() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createDocument = async (
    documentData: Database['public']['Tables']['documents']['Insert'],
    file: File
  ) => {
    try {
      setLoading(true)
      setError(null)

      // First create the document record
      const { data: newDocument, error: documentError } = await supabase
        .from('documents')
        .insert([{
          ...documentData,
          file_url: '', // Will be updated after upload
          file_type: file.type,
          file_size: file.size,
          uploaded_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (documentError) throw documentError

      // Upload the file
      const fileUrl = await uploadDocument(file, newDocument.id)
      
      if (!fileUrl) {
        throw new Error('Failed to upload file')
      }

      // Update the document record with the file URL
      const { data: updatedDocument, error: updateError } = await supabase
        .from('documents')
        .update({ file_url: fileUrl })
        .eq('id', newDocument.id)
        .select()
        .single()

      if (updateError) throw updateError

      return { data: updatedDocument, error: null }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      return { data: null, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  return { createDocument, loading, error }
}

export function useUpdateDocument() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const updateDocument = async (
    id: string, 
    documentData: Database['public']['Tables']['documents']['Update'],
    file?: File
  ) => {
    try {
      setLoading(true)
      setError(null)

      let updateData = { ...documentData }

      // If there's a new file, upload it
      if (file) {
        const fileUrl = await uploadDocument(file, id)
        if (fileUrl) {
          updateData.file_url = fileUrl
          updateData.file_type = file.type
          updateData.file_size = file.size
        }
      }

      const { data, error } = await supabase
        .from('documents')
        .update(updateData)
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

  return { updateDocument, loading, error }
}

export function useDeleteDocument() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteDocumentRecord = async (id: string, fileUrl: string) => {
    try {
      setLoading(true)
      setError(null)

      // Delete the file from storage first
      await deleteDocument(fileUrl)

      // Then delete the database record
      const { error } = await supabase
        .from('documents')
        .delete()
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

  return { deleteDocument: deleteDocumentRecord, loading, error }
}