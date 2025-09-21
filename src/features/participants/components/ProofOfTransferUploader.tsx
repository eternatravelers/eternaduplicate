import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Image, X } from 'lucide-react'

interface ProofOfTransferUploaderProps {
  file: File | null
  previewUrl: string | null
  onFileChange: (file: File | null, preview: string | null) => void
  title?: string
}

export function ProofOfTransferUploader({
  file,
  previewUrl,
  onFileChange,
  title = "Bukti Transfer DP"
}: ProofOfTransferUploaderProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('image/')) {
        alert('Hanya file gambar yang diperbolehkan')
        return
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB')
        return
      }

      const url = URL.createObjectURL(selectedFile)
      onFileChange(selectedFile, url)
    }
  }

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    onFileChange(null, null)
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <Label className="text-base font-semibold flex items-center space-x-2">
        <Image className="h-5 w-5" />
        <span>{title}</span>
      </Label>
      
      <div className="space-y-3">
        <Input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <p className="text-xs text-gray-500">
          Format yang didukung: JPG, PNG, GIF. Maksimal 5MB.
        </p>
        
        {previewUrl && (
          <div className="relative inline-block">
            <img 
              src={previewUrl} 
              alt="Preview bukti transfer" 
              className="w-32 h-32 object-cover rounded-lg border"
            />
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
              onClick={removeFile}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}