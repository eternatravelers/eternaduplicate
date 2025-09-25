import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link, X, ExternalLink, Image } from 'lucide-react'

interface ProofOfTransferUploaderProps {
  url: string | null
  onUrlChange: (url: string | null) => void
  title?: string
}

export function ProofOfTransferUploader({
  url,
  onUrlChange,
  title = "Bukti Transfer DP"
}: ProofOfTransferUploaderProps) {
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value.trim()
    onUrlChange(inputUrl || null)
  }

  const removeUrl = () => {
    onUrlChange(null)
  }

  const isGoogleDriveUrl = (url: string) => {
    return url.includes('drive.google.com') || url.includes('docs.google.com')
  }

  const isImageUrl = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url) || url.includes('googleusercontent.com')
  }

  const openUrl = () => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
      <Label className="text-base font-semibold flex items-center space-x-2">
        <Link className="h-5 w-5" />
        <span>{title}</span>
      </Label>
      
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="proof_url" className="text-sm font-medium">
            URL Google Drive
          </Label>
          <Input
            id="proof_url"
            type="url"
            value={url || ''}
            onChange={handleUrlChange}
            placeholder="https://drive.google.com/file/d/..."
            className="focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Cara mendapatkan URL Google Drive:</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-2">
            <li>Upload file bukti transfer ke Google Drive</li>
            <li>Klik kanan pada file → "Get link" atau "Dapatkan link"</li>
            <li>Pastikan pengaturan: "Anyone with the link can view"</li>
            <li>Copy URL dan paste di kolom di atas</li>
          </ol>
        </div>
        
        {url && (
          <div className="p-3 bg-white border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 flex-1 min-w-0">
                {isGoogleDriveUrl(url) ? (
                  <Link className="h-4 w-4 text-blue-600 flex-shrink-0" />
                ) : (
                  <Image className="h-4 w-4 text-green-600 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {isGoogleDriveUrl(url) ? 'Google Drive File' : 'External File'}
                  </div>
                  <div className="text-xs text-gray-500 truncate">{url}</div>
                </div>
              </div>
              <div className="flex items-center space-x-1 flex-shrink-0">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={openUrl}
                  className="h-8 px-2"
                >
                  <ExternalLink className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={removeUrl}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Preview for image URLs */}
            {url && isImageUrl(url) && (
              <div className="mt-3">
                <img 
                  src={url} 
                  alt="Preview bukti transfer" 
                  className="w-32 h-32 object-cover rounded-lg border"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}