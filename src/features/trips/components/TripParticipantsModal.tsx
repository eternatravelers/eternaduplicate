import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TripParticipantsTable } from '@/features/operations/components/TripParticipantsTable'
import { Users } from 'lucide-react'

interface TripParticipantsModalProps {
  isOpen: boolean
  onClose: () => void
  trip: any
}

export function TripParticipantsModal({ isOpen, onClose, trip }: TripParticipantsModalProps) {
  if (!trip) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Users className="h-5 w-5 text-blue-600" />
            <span>Peserta Trip - {trip.name}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <TripParticipantsTable
            tripId={trip.id}
            tripName={trip.name}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}