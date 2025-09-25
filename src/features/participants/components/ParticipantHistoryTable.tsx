import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, Search } from 'lucide-react';
import { ParticipantPermissionsGuard } from './ParticipantPermissionsGuard';

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
  onDelete: (participant: Participant) => void;
  deleting: string[];
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

  return (
    <div className="space-y-4">
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
            <SelectItem value="confirmed">Confirmed</SelectItem>
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
                    <Badge variant="outline">
                      {participant.participant_count} person{participant.participant_count > 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatCurrency(participant.package_price)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div>{formatCurrency(participant.dp_amount)}</div>
                      <div className="text-xs text-gray-500">
                        {formatDate(participant.dp_transfer_date)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(participant.status)}>
                      {participant.status}
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
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <ParticipantPermissionsGuard requiredRole="admin">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDelete(participant)}
                          disabled={deleting.includes(participant.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
        Showing {filteredParticipants.length} of {participants.length} participants
      </div>
    </div>
  );
}