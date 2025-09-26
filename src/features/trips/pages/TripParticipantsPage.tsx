import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Users, MapPin } from 'lucide-react'
import { TripParticipantsTable } from '@/features/operations/components/TripParticipantsTable'

interface TripParticipantsPageProps {
  tripId: string
  tripName: string
  onBack: () => void
}

export function TripParticipantsPage({ tripId, tripName, onBack }: TripParticipantsPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={onBack}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Daftar Trip</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Peserta Trip</h1>
            <p className="text-gray-600 mt-1">Daftar peserta untuk trip: {tripName}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          <span>Detail Trip</span>
        </div>
      </div>

      {/* Trip Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-blue-800">
            <Users className="h-5 w-5" />
            <span>Informasi Trip</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-blue-700">
            <p className="font-medium">{tripName}</p>
            <p className="text-sm">ID Trip: {tripId}</p>
          </div>
        </CardContent>
      </Card>

      {/* Participants Table */}
      <TripParticipantsTable
        tripId={tripId}
        tripName={tripName}
      />
    </div>
  )
}