/**
 * Validation utilities for participant deletion operations
 */

export interface ParticipantDeletionValidation {
  canDelete: boolean
  warnings: string[]
  errors: string[]
  impactAnalysis: {
    affectedTrips: string[]
    financialImpact: number
    participantCount: number
  }
}

export function validateParticipantDeletion(
  participant: any,
  userRole: string
): ParticipantDeletionValidation {
  const warnings: string[] = []
  const errors: string[] = []
  let canDelete = true

  // Check user permissions
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    errors.push('Anda tidak memiliki izin untuk menghapus peserta')
    canDelete = false
  }

  // Check if participant has confirmed status
  if (participant.status === 'confirmed') {
    warnings.push('Peserta sudah dikonfirmasi - penghapusan dapat mempengaruhi trip')
  }

  // Check if trip is upcoming (within 7 days)
  if (participant.trips?.departure_date) {
    const departureDate = new Date(participant.trips.departure_date)
    const today = new Date()
    const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntilDeparture <= 7 && daysUntilDeparture > 0) {
      warnings.push(`Trip akan berangkat dalam ${daysUntilDeparture} hari - pertimbangkan dampak penghapusan`)
    } else if (daysUntilDeparture <= 0 && daysUntilDeparture > -7) {
      warnings.push('Trip sedang berlangsung atau baru selesai - hati-hati menghapus peserta')
    }
  }

  // Check if participant has paid DP
  if (participant.dp_amount > 0) {
    warnings.push(`Peserta sudah membayar DP sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(participant.dp_amount)}`)
  }

  // Check if participant has proof of transfer
  if (participant.proof_of_transfer_url) {
    warnings.push('Peserta memiliki bukti transfer yang akan ikut terhapus')
  }

  const impactAnalysis = {
    affectedTrips: participant.trips ? [participant.trips.name] : [],
    financialImpact: participant.package_price || 0,
    participantCount: participant.participant_count || 1
  }

  return {
    canDelete,
    warnings,
    errors,
    impactAnalysis
  }
}

export function validateBulkParticipantDeletion(
  participants: any[],
  userRole: string
): ParticipantDeletionValidation {
  const warnings: string[] = []
  const errors: string[] = []
  let canDelete = true

  // Check user permissions
  if (userRole !== 'admin' && userRole !== 'super_admin') {
    errors.push('Anda tidak memiliki izin untuk menghapus peserta')
    canDelete = false
  }

  // Analyze bulk impact
  const confirmedCount = participants.filter(p => p.status === 'confirmed').length
  const totalFinancialImpact = participants.reduce((sum, p) => sum + (p.package_price || 0), 0)
  const totalParticipantCount = participants.reduce((sum, p) => sum + (p.participant_count || 1), 0)
  const affectedTrips = [...new Set(participants.map(p => p.trips?.name).filter(Boolean))]
  const upcomingTrips = participants.filter(p => {
    if (!p.trips?.departure_date) return false
    const departureDate = new Date(p.trips.departure_date)
    const today = new Date()
    const daysUntilDeparture = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilDeparture <= 7 && daysUntilDeparture > 0
  }).length

  if (confirmedCount > 0) {
    warnings.push(`${confirmedCount} peserta sudah dikonfirmasi`)
  }

  if (upcomingTrips > 0) {
    warnings.push(`${upcomingTrips} peserta memiliki trip yang akan berangkat dalam 7 hari`)
  }

  if (totalFinancialImpact > 10000000) { // 10 million IDR
    warnings.push(`Dampak finansial besar: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(totalFinancialImpact)}`)
  }

  if (participants.length > 10) {
    warnings.push(`Penghapusan dalam jumlah besar: ${participants.length} registrasi`)
  }

  return {
    canDelete,
    warnings,
    errors,
    impactAnalysis: {
      affectedTrips,
      financialImpact: totalFinancialImpact,
      participantCount: totalParticipantCount
    }
  }
}

export function getParticipantDeletionReason(participant: any): string[] {
  const suggestedReasons = []

  if (participant.status === 'cancelled') {
    suggestedReasons.push('Peserta membatalkan pendaftaran')
  }

  if (!participant.proof_of_transfer_url) {
    suggestedReasons.push('Tidak ada bukti pembayaran')
  }

  if (participant.dp_amount === 0) {
    suggestedReasons.push('Belum melakukan pembayaran DP')
  }

  // Check if trip is past
  if (participant.trips?.return_date) {
    const returnDate = new Date(participant.trips.return_date)
    const today = new Date()
    if (returnDate < today) {
      suggestedReasons.push('Trip sudah selesai')
    }
  }

  if (suggestedReasons.length === 0) {
    suggestedReasons.push('Pembersihan data')
    suggestedReasons.push('Duplikasi data')
    suggestedReasons.push('Data tidak valid')
    suggestedReasons.push('Permintaan peserta')
  }

  return suggestedReasons
}