import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Settings, Trash2 } from 'lucide-react'

interface TripTypeManagerModalProps {
  isOpen: boolean
  onClose: () => void
  tripTypes: any[]
  onAddTripType: (name: string) => Promise<void>
  onDeleteTripType: (id: string, name: string) => Promise<void>
  creatingTripType: boolean
  deletingTripType: boolean
}

export function TripTypeManagerModal({
  isOpen,
  onClose,
  tripTypes,
  onAddTripType,
  onDeleteTripType,
  creatingTripType,
  deletingTripType
}: TripTypeManagerModalProps) {
  const [newTripTypeName, setNewTripTypeName] = useState('')

  const handleAddTripType = async () => {
    if (!newTripTypeName.trim()) return
    
    await onAddTripType(newTripTypeName.trim())
    setNewTripTypeName('')
  }

  if (!isOpen) return null

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Kelola Tipe Trip</span>
          </AlertDialogTitle>
          <AlertDialogDescription>
            Tambahkan tipe trip baru atau kelola tipe trip yang sudah ada.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4 space-y-6">
          {/* Add New Trip Type Section */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Tambah Tipe Trip Baru</Label>
            <div className="flex space-x-2">
              <Input
                value={newTripTypeName}
                onChange={(e) => setNewTripTypeName(e.target.value)}
                placeholder="Contoh: Family Trip, Adventure Trip"
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTripType()
                  }
                }}
              />
              <Button 
                onClick={handleAddTripType}
                disabled={!newTripTypeName.trim() || creatingTripType}
                size="sm"
              >
                {creatingTripType ? 'Menambahkan...' : 'Tambah'}
              </Button>
            </div>
          </div>

          {/* Existing Trip Types Section */}
          {tripTypes.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-semibold">Tipe Trip Yang Ada</Label>
              <div className="max-h-48 overflow-y-auto border rounded-lg">
                {tripTypes.map((type) => (
                  <div key={type.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
                    <span className="font-medium">{type.name}</span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingTripType}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Tipe Trip</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus tipe trip "{type.name}"? 
                            Tindakan ini tidak dapat dibatalkan dan akan mempengaruhi trip yang menggunakan tipe ini.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => onDeleteTripType(type.id, type.name)}
                            disabled={deletingTripType}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {deletingTripType ? 'Menghapus...' : 'Hapus'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel 
            onClick={() => {
              setNewTripTypeName('')
              onClose()
            }}
          >
            Tutup
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}