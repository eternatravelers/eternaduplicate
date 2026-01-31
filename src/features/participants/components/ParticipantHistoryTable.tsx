import React from 'react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, CreditCard as Edit, Search, Users, UserPlus, Wallet, X } from 'lucide-react';
import { formatCurrency, formatShortDate } from '@/lib/utils';
import { GroupMembersModal } from './GroupMembersModal';
import { PaymentManagementModal } from './PaymentManagementModal';

interface Participant {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  address: string;
  participant_count: number;
  package_price: number;
  dp_amount: number;
  dp_transfer_date: string;
  status: string;
  payment_status?: string;
  total_paid?: number;
  remaining_payment?: number;
  additional_requests?: string;
  trip_id?: string;
  trips?: {
    id: string;
    name: string;
    departure_date: string;
    trip_type?: string;
  };
  sales_id?: string;
  created_at: string;
  updated_at: string;
}

interface ParticipantHistoryTableProps {
  participants: Participant[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  onEdit: (participant: Participant) => void;
  onDelete: (id: string, reason?: string, permanent?: boolean) => Promise<void>;
  deleting: boolean;
  onRefresh: () => void;
  loading?: boolean;
}

export function ParticipantHistoryTable({
  participants,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onEdit,
  onDelete,
  deleting,
  onRefresh,
  loading = false
}: ParticipantHistoryTableProps) {
  const [showGroupMembersModal, setShowGroupMembersModal] = useState(false);
  const [selectedGroupParticipant, setSelectedGroupParticipant] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPaymentParticipant, setSelectedPaymentParticipant] = useState<any>(null);
  const [filterTrip, setFilterTrip] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');

  const handleViewGroupMembers = (participant: any) => {
    setSelectedGroupParticipant(participant);
    setShowGroupMembersModal(true);
  };

  const handleManagePayment = (participant: any) => {
    setSelectedPaymentParticipant(participant);
    setShowPaymentModal(true);
  };

  const isGroupLeader = (participant: any) => {
    return participant.participant_count > 1 && !participant.parent_participant_id;
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'lunas':
        return <Badge className="bg-green-600">Lunas</Badge>;
      case 'cicilan_berjalan':
        return <Badge className="bg-blue-600">Cicilan Berjalan</Badge>;
      case 'dp_dibayar':
        return <Badge className="bg-yellow-600">DP Dibayar</Badge>;
      case 'belum_bayar':
        return <Badge className="bg-red-600">Belum Bayar</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Get unique trips for filter dropdown
  const uniqueTrips = Array.from(
    new Map(
      participants
        .filter(p => p.trips)
        .map(p => [p.trips!.id, p.trips!])
    ).values()
  );

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.phone.includes(searchTerm) ||
                         participant.trips?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = filterStatus === 'all' || participant.status === filterStatus;
    const matchesTrip = filterTrip === 'all' || participant.trip_id === filterTrip;
    const matchesPaymentStatus = filterPaymentStatus === 'all' || participant.payment_status === filterPaymentStatus;

    return matchesSearch && matchesStatus && matchesTrip && matchesPaymentStatus;
  });

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all' || filterTrip !== 'all' || filterPaymentStatus !== 'all';

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterStatus('all');
    setFilterTrip('all');
    setFilterPaymentStatus('all');
  };

  return (
    <>
      <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari nama, email, telepon, atau trip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="shrink-0"
            >
              <X className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterTrip} onValueChange={setFilterTrip}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by trip" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Trip</SelectItem>
              {uniqueTrips.map((trip) => (
                <SelectItem key={trip.id} value={trip.id}>
                  {trip.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPaymentStatus} onValueChange={setFilterPaymentStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Filter by payment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pembayaran</SelectItem>
              <SelectItem value="lunas">Lunas</SelectItem>
              <SelectItem value="cicilan_berjalan">Cicilan Berjalan</SelectItem>
              <SelectItem value="dp_dibayar">DP Dibayar</SelectItem>
              <SelectItem value="belum_bayar">Belum Bayar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Participants Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Trip</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Package Price</TableHead>
              <TableHead>Payment Status</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-gray-500">Memuat data...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  No participants found
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{participant.full_name}</div>
                      {isGroupLeader(participant) && (
                        <Badge variant="outline" className="mt-1 text-blue-600 border-blue-200">
                          <Users className="h-3 w-3 mr-1" />
                          Ketua Grup
                        </Badge>
                      )}
                      {participant.parent_participant_id && (
                        <Badge variant="outline" className="mt-1 text-green-600 border-green-200">
                          <UserPlus className="h-3 w-3 mr-1" />
                          Anggota Grup
                        </Badge>
                      )}
                      <div className="text-sm text-gray-500 truncate max-w-48">
                        {participant.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {participant.trips ? (
                      <div>
                        <div className="font-medium text-sm">{participant.trips.name}</div>
                        <div className="text-xs text-gray-500">
                          {formatShortDate(participant.trips.departure_date)}
                        </div>
                      </div>
                    ) : (
                      <Badge variant="outline" className="text-gray-400">Belum ada trip</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{participant.email}</div>
                      <div className="text-gray-500">{participant.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {participant.participant_count} orang
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{formatCurrency(participant.package_price)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        Bayar: {formatCurrency(participant.total_paid || 0)}
                      </div>
                      <div className="text-xs text-red-600">
                        Sisa: {formatCurrency(participant.remaining_payment || 0)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getPaymentStatusBadge(participant.payment_status || 'belum_bayar')}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(participant.status)}>
                      {participant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatShortDate(participant.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {isGroupLeader(participant) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewGroupMembers(participant)}
                          title="Kelola anggota grup"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleManagePayment(participant)}
                        title="Kelola pembayaran"
                        className="text-green-600 hover:text-green-700"
                      >
                        <Wallet className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(participant)}
                        disabled={deleting}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(participant.id)}
                        disabled={deleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div>
          Menampilkan {filteredParticipants.length} dari {participants.length} peserta
        </div>
        {hasActiveFilters && (
          <div className="text-blue-600">
            Filter aktif
          </div>
        )}
      </div>
      </div>

      <GroupMembersModal
        isOpen={showGroupMembersModal}
        onClose={() => setShowGroupMembersModal(false)}
        groupParticipant={selectedGroupParticipant}
        onRefresh={onRefresh}
      />

      <PaymentManagementModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        participant={selectedPaymentParticipant}
        onRefresh={onRefresh}
      />
    </>
  );
}