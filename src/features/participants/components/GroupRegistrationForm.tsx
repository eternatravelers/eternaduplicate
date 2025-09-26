import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { UserPlus, Navigation, MapPin, FileSpreadsheet } from 'lucide-react'
import { ProofOfTransferUploader } from './ProofOfTransferUploader'
import { formatCurrency, formatShortDate } from '@/lib/utils'

interface GroupRegistrationFormProps {
  onSubmit: (data: any, file?: File | null) => Promise<void>
  trips: any[]
  sales: any[]
  creating: boolean
}

export function GroupRegistrationForm({
  onSubmit,
  trips,
  sales,
  creating
}: GroupRegistrationFormProps) {
  const [groupData, setGroupData] = useState({
    groupName: '',
    groupLeader: '',
    groupEmail: '',
    groupPhone: '',
    participantCount: '' as number | '',
    trip_id: '',
    sales_id: '',
    package_price: '' as number | '',
    dp_amount: '' as number | '',
    meeting_point_details: ''
  })

  const [groupProofOfTransferUrl, setGroupProofOfTransferUrl] = useState<string | null>(null)
  const [groupSelectedTripMeetingPoint, setGroupSelectedTripMeetingPoint] = useState<string>('')

  useEffect(() => {
    if (groupData.trip_id) {
      const selectedTrip = trips.find(trip => trip.id === groupData.trip_id)
      if (selectedTrip) {
        setGroupSelectedTripMeetingPoint(selectedTrip.meeting_point)
        setGroupData(prev => ({ 
          ...prev, 
          meeting_point_details: selectedTrip.meeting_point 
        }))
      }
    }
  }, [groupData.trip_id, trips])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const processedGroupData = {
      participantCount: groupData.participantCount === '' ? 1 : Number(groupData.participantCount),
      package_price: groupData.package_price === '' ? 0 : Number(groupData.package_price),
      dp_amount: groupData.dp_amount === '' ? 0 : Number(groupData.dp_amount)
    }
    
    const submitData = {
      trip_id: groupData.trip_id,
      sales_id: groupData.sales_id,
      full_name: `${groupData.groupName} (Group Leader: ${groupData.groupLeader})`,
      email: groupData.groupEmail,
      phone: groupData.groupPhone,
      address: 'Group Registration',
      participant_count: processedGroupData.participantCount,
      package_price: processedGroupData.package_price,
      dp_amount: processedGroupData.dp_amount,
      dp_transfer_date: new Date().toISOString().split('T')[0],
      additional_requests: `Group registration for ${processedGroupData.participantCount} participants`,
      meeting_point_details: groupData.meeting_point_details,
      proof_of_transfer_url: groupProofOfTransferUrl
    }

    await onSubmit(submitData, null)
    
    // Reset form after successful submission
    setGroupData({
      groupName: '',
      groupLeader: '',
      groupEmail: '',
      groupPhone: '',
      participantCount: '',
      trip_id: '',
      sales_id: '',
      package_price: '',
      dp_amount: '',
      meeting_point_details: ''
    })
    setGroupProofOfTransferUrl(null)
    setGroupSelectedTripMeetingPoint('')
  }

  const handleUrlChange = (url: string | null) => {
    setGroupProofOfTransferUrl(url)
  }

  const downloadTemplate = () => {
    const template = [
      'nama_lengkap,email,telepon,alamat,jumlah_peserta,harga_paket,dp_amount,nama_trip,nama_sales,permintaan_tambahan',
      'John Doe,john@example.com,08123456789,"Jl. Sudirman No. 123, Jakarta",2,1500000,500000,"Bali Adventure 3D2N","Ahmad Wijaya","Makanan vegetarian"',
      'Jane Smith,jane@example.com,08198765432,"Jl. Thamrin No. 456, Jakarta",1,1500000,500000,"Yogyakarta Cultural Tour","Siti Nurhaliza",""',
      'Bob Wilson,bob@example.com,08111222333,"Jl. Gatot Subroto No. 789, Jakarta",3,1500000,500000,"Lombok Beach Holiday","Ahmad Wijaya","Kursi roda untuk lansia"'
    ].join('\n')

    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', 'template-import-peserta.csv')
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <UserPlus className="h-5 w-5" />
          <span>Pendaftaran Group</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="groupName">Nama Group</Label>
              <Input
                id="groupName"
                value={groupData.groupName}
                onChange={(e) => setGroupData(prev => ({ ...prev, groupName: e.target.value }))}
                placeholder="Contoh: Keluarga Besar Wijaya"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupLeader">Ketua Group</Label>
              <Input
                id="groupLeader"
                value={groupData.groupLeader}
                onChange={(e) => setGroupData(prev => ({ ...prev, groupLeader: e.target.value }))}
                placeholder="Nama ketua group"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupEmail">Email Group</Label>
              <Input
                id="groupEmail"
                type="email"
                value={groupData.groupEmail}
                onChange={(e) => setGroupData(prev => ({ ...prev, groupEmail: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="groupPhone">Telepon Group</Label>
              <Input
                id="groupPhone"
                value={groupData.groupPhone}
                onChange={(e) => setGroupData(prev => ({ ...prev, groupPhone: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="participantCount">Jumlah Peserta</Label>
              <Input
                id="participantCount"
                type="number"
                min="2"
                value={groupData.participantCount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseInt(e.target.value)
                  setGroupData(prev => ({ ...prev, participantCount: isNaN(val) ? '' : val }))
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_trip_id">Trip</Label>
              <Select 
                value={groupData.trip_id} 
                onValueChange={(value) => setGroupData(prev => ({ ...prev, trip_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih trip" />
                </SelectTrigger>
                <SelectContent>
                  {trips.map(trip => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.name} - {formatShortDate(trip.departure_date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_sales_id">Sales</Label>
              <Select 
                value={groupData.sales_id} 
                onValueChange={(value) => setGroupData(prev => ({ ...prev, sales_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih sales" />
                </SelectTrigger>
                <SelectContent>
                  {sales.map(sale => (
                    <SelectItem key={sale.id} value={sale.id}>
                      {sale.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_package_price">Harga per Orang</Label>
              <Input
                id="group_package_price"
                type="number"
                value={groupData.package_price}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                  setGroupData(prev => ({ ...prev, package_price: isNaN(val) ? '' : val }))
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="group_dp_amount">DP per Orang</Label>
              <Input
                id="group_dp_amount"
                type="number"
                value={groupData.dp_amount}
                onChange={(e) => {
                  const val = e.target.value === '' ? '' : parseFloat(e.target.value)
                  setGroupData(prev => ({ ...prev, dp_amount: isNaN(val) ? '' : val }))
                }}
                required
              />
            </div>
          </div>

          {/* Group Meeting Point Section */}
          <div className="space-y-4 p-4 border rounded-lg bg-green-50">
            <Label className="text-base font-semibold flex items-center space-x-2">
              <Navigation className="h-5 w-5" />
              <span>Titik Kumpul Group</span>
            </Label>
            
            {groupSelectedTripMeetingPoint && (
              <div className="p-3 bg-white border rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-1">Titik Kumpul Default Trip:</div>
                <div className="text-sm text-gray-600 flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{groupSelectedTripMeetingPoint}</span>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="group_meeting_point_details">
                Titik Kumpul Khusus Group (Opsional)
              </Label>
              <Textarea
                id="group_meeting_point_details"
                value={groupData.meeting_point_details}
                onChange={(e) => setGroupData(prev => ({ ...prev, meeting_point_details: e.target.value }))}
                placeholder="Kosongkan jika menggunakan titik kumpul default trip, atau isi dengan lokasi khusus untuk group..."
                rows={3}
              />
              <p className="text-xs text-gray-500">
                Jika diisi, seluruh group akan menggunakan titik kumpul khusus ini. Jika kosong, akan menggunakan titik kumpul default dari trip.
              </p>
            </div>
          </div>

          <ProofOfTransferUploader
            url={groupProofOfTransferUrl}
            onUrlChange={handleUrlChange}
            title="Bukti Transfer DP Group"
          />

          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Ringkasan Group</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>Total Peserta: {groupData.participantCount || 0} orang</div>
              <div>Total Harga: {formatCurrency((Number(groupData.package_price) || 0) * (Number(groupData.participantCount) || 0))}</div>
              <div>Total DP: {formatCurrency((Number(groupData.dp_amount) || 0) * (Number(groupData.participantCount) || 0))}</div>
              <div>Sisa Bayar: {formatCurrency(((Number(groupData.package_price) || 0) - (Number(groupData.dp_amount) || 0)) * (Number(groupData.participantCount) || 0))}</div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button type="submit" disabled={creating}>
              {creating ? 'Menyimpan...' : 'Daftar Group'}
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={downloadTemplate}
            >
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Download Template CSV
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}