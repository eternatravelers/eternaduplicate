import React, { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { LoginForm } from './LoginForm'
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading, error } = useAuth()
  const [showTimeout, setShowTimeout] = useState(false)

  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => {
        setShowTimeout(true)
      }, 8000)

      return () => clearTimeout(timer)
    } else {
      setShowTimeout(false)
    }
  }, [loading])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-900 font-medium mb-2">Memuat aplikasi...</p>
          <p className="text-sm text-gray-500">Mohon tunggu sebentar</p>

          {showTimeout && (
            <div className="mt-6 space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Koneksi membutuhkan waktu lebih lama dari biasanya. Periksa koneksi internet Anda.
                </AlertDescription>
              </Alert>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Muat Ulang Halaman
              </Button>
            </div>
          )}

          {error && (
            <Alert className="mt-4" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  return <>{children}</>
}