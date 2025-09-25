import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, CreditCard as Edit, Search, Users, Crown } from 'lucide-react';
import { ParticipantPermissionsGuard } from './ParticipantPermissionsGuard';
import { DeleteParticipantDialog } from './DeleteParticipantDialog';

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
  additional_requests?: string;
  trip_id?: string;
  sales_id?: string;
  parent_participant_id?: string | null;
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
}

export function ParticipantHistoryTable({
  participants,
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  onEdit,
  onDelete,
  deleting
}: ParticipantHistoryTableProps) {
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': // Backward compatibility
      case 'dp_paid':
        return 'secondary';
      case 'paid_in_full':
        return 'default';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  const filteredParticipants = participants.filter(participant => {
    const matchesSearch = participant.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participant.phone.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || participant.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getFilterTitle = () => {
    switch (historyFilter) {
      case 'individual':
        return 'Pendaftaran Individual'
      case 'group_leader':
        return 'Ketua Grup'
      case 'group_member':
        return 'Anggota Grup'
      default:
        return 'Semua Peserta'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Users className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-semibold">{getFilterTitle()}</h3>
        <Badge variant="outline">{filteredParticipants.length} peserta</Badge>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search participants..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="dp_paid">DP Paid</SelectItem>
            <SelectItem value="paid_in_full">Paid in Full</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Participants Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Group Info</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Package Price</TableHead>
              <TableHead>DP Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registration Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredParticipants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                  No participants found
                </TableCell>
              </TableRow>
            ) : (
              filteredParticipants.map((participant) => (
                <TableRow key={participant.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{participant.full_name}</div>
                      {participant.parent_participant_id && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Users className="h-3 w-3 text-blue-600" />
                          <span className="text-xs text-blue-600">Anggota Grup</span>
                        </div>
                      )}
                      {!participant.parent_participant_id && participant.additional_requests?.includes('Group Leader') && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Crown className="h-3 w-3 text-yellow-600" />
                          <span className="text-xs text-yellow-600">Ketua Grup</span>
                        </div>
                      )}
                      <div className="text-sm text-gray-500 truncate max-w-48">
                        {participant.address}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{participant.email}</div>
                      <div className="text-gray-500">{participant.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {participant.parent_participant_id ? (
                      <Badge variant="outline" className="text-blue-600 border-blue-200">
                        <Users className="h-3 w-3 mr-1" />
                        Anggota
                      </Badge>
                    ) : participant.additional_requests?.includes('Group Leader') ? (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-200">
                        <Crown className="h-3 w-3 mr-1" />
                        Ketua
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-600">
                        Individual
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-center">
                      <Badge variant="outline">
                        {participant.participant_count} orang
                      </Badge>
                      {participant.parent_participant_id && (
                        <div className="text-xs text-blue-600 mt-1">
                          (Anggota grup)
                        </div>
                      )}
                      {!participant.parent_participant_id && participant.additional_requests?.includes('Group Leader') && (
                        <div className="text-xs text-yellow-600 mt-1">
                          (Total grup)
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className={`font-medium ${participant.parent_participant_id ? 'text-gray-400' : 'text-green-600'}`}>
                        {formatCurrency(participant.package_price)}
                      </div>
                      {participant.parent_participant_id && (
                        <div className="text-xs text-gray-500">
                          Termasuk grup
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className={`font-medium ${participant.parent_participant_id ? 'text-gray-400' : 'text-purple-600'}`}>
                        {formatCurrency(participant.dp_amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {participant.parent_participant_id ? 'Termasuk grup' : formatDate(participant.dp_transfer_date)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(participant.status)}>
                      {participant.status === 'dp_paid' ? 'DP Paid' :
                       participant.status === 'paid_in_full' ? 'Paid in Full' :
                       participant.status === 'pending' ? 'Pending' :
                       participant.status === 'cancelled' ? 'Cancelled' :
                       participant.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(participant.created_at)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(participant)}
                        disabled={deleting}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ParticipantPermissionsGuard requiredRole="admin">
                        <DeleteParticipantDialog
                          participant={participant}
                          onDelete={onDelete}
                          deleting={deleting}
                        />
                      </ParticipantPermissionsGuard>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-500">
        Showing {participants.length} participants
      </div>
    </div>
  );
}