import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Phone, Plus, Edit, Trash2, AlertTriangle, Guitar as Hospital, Shield } from 'lucide-react'

interface EmergencyContact {
  id: string
  name: string
  role: string
  phone: string
  category: 'medical' | 'police' | 'company' | 'local'
  location?: string
  notes?: string
}

export function EmergencyContactsManager() {
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      id: '1',
      name: 'RS Umum Daerah',
      role: 'Rumah Sakit',
      phone: '119',
      category: 'medical',
      location: 'Jakarta',
      notes: 'Rumah sakit terdekat dengan fasilitas lengkap'
    },
    {
      id: '2',
      name: 'Polres Jakarta Pusat',
      role: 'Kepolisian',
      phone: '110',
      category: 'police',
      location: 'Jakarta Pusat',
      notes: 'Untuk keadaan darurat dan bantuan keamanan'
    },
    {
      id: '3',
      name: 'Ahmad Supardi',
      role: 'Manager Operasional',
      phone: '08123456789',
      category: 'company',
      notes: 'Kontak utama untuk koordinasi operasional'
    },
    {
      id: '4',
      name: 'Budi Santoso',
      role: 'Tour Leader Senior',
      phone: '08198765432',
      category: 'company',
      notes: 'Backup tour leader untuk situasi darurat'
    }
  ])

  const [showAddForm, setShowAddForm] = useState(false)
  const [editingContact, setEditingContact] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    phone: '',
    category: 'company' as EmergencyContact['category'],
    location: '',
    notes: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingContact) {
      setContacts(prev => prev.map(contact => 
        contact.id === editingContact 
          ? { ...contact, ...formData }
          : contact
      ))
    } else {
      const newContact: EmergencyContact = {
        id: Date.now().toString(),
        ...formData
      }
      setContacts(prev => [...prev, newContact])
    }

    // Reset form
    setFormData({
      name: '',
      role: '',
      phone: '',
      category: 'company',
      location: '',
      notes: ''
    })
    setShowAddForm(false)
    setEditingContact(null)
  }

  const handleEdit = (contact: EmergencyContact) => {
    setFormData({
      name: contact.name,
      role: contact.role,
      phone: contact.phone,
      category: contact.category,
      location: contact.location || '',
      notes: contact.notes || ''
    })
    setEditingContact(contact.id)
    setShowAddForm(true)
  }

  const handleDelete = (id: string) => {
    setContacts(prev => prev.filter(contact => contact.id !== id))
  }

  const getCategoryBadge = (category: EmergencyContact['category']) => {
    switch (category) {
      case 'medical':
        return <Badge className="bg-red-100 text-red-800">Medis</Badge>
      case 'police':
        return <Badge className="bg-blue-100 text-blue-800">Kepolisian</Badge>
      case 'company':
        return <Badge className="bg-green-100 text-green-800">Perusahaan</Badge>
      case 'local':
        return <Badge className="bg-purple-100 text-purple-800">Lokal</Badge>
      default:
        return <Badge variant="outline">{category}</Badge>
    }
  }

  const getCategoryIcon = (category: EmergencyContact['category']) => {
    switch (category) {
      case 'medical':
        return <Hospital className="h-4 w-4 text-red-600" />
      case 'police':
        return <Shield className="h-4 w-4 text-blue-600" />
      case 'company':
        return <Phone className="h-4 w-4 text-green-600" />
      case 'local':
        return <AlertTriangle className="h-4 w-4 text-purple-600" />
      default:
        return <Phone className="h-4 w-4" />
    }
  }

  const contactsByCategory = {
    medical: contacts.filter(c => c.category === 'medical'),
    police: contacts.filter(c => c.category === 'police'),
    company: contacts.filter(c => c.category === 'company'),
    local: contacts.filter(c => c.category === 'local')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kontak Darurat</h2>
          <p className="text-gray-600">Kelola kontak darurat untuk situasi emergency</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kontak
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingContact ? 'Edit Kontak Darurat' : 'Tambah Kontak Darurat'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nama/Instansi</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Peran/Jabatan</Label>
                  <Input
                    id="role"
                    value={formData.role}
                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as EmergencyContact['category'] }))}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="medical">Medis</option>
                    <option value="police">Kepolisian</option>
                    <option value="company">Perusahaan</option>
                    <option value="local">Lokal</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="location">Lokasi</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Catatan</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button type="submit">
                  {editingContact ? 'Update Kontak' : 'Simpan Kontak'}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowAddForm(false)
                    setEditingContact(null)
                    setFormData({
                      name: '',
                      role: '',
                      phone: '',
                      category: 'company',
                      location: '',
                      notes: ''
                    })
                  }}
                >
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Quick Access Emergency Numbers */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Hospital className="h-8 w-8 text-red-600" />
              <div>
                <div className="font-bold text-red-800">Ambulans</div>
                <div className="text-red-600">119</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <div className="font-bold text-blue-800">Polisi</div>
                <div className="text-blue-600">110</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div>
                <div className="font-bold text-orange-800">Pemadam</div>
                <div className="text-orange-600">113</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 hover:shadow-lg transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-8 w-8 text-purple-600" />
              <div>
                <div className="font-bold text-purple-800">SAR</div>
                <div className="text-purple-600">115</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts by Category */}
      <Tabs defaultValue="company" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="company">Perusahaan ({contactsByCategory.company.length})</TabsTrigger>
          <TabsTrigger value="medical">Medis ({contactsByCategory.medical.length})</TabsTrigger>
          <TabsTrigger value="police">Kepolisian ({contactsByCategory.police.length})</TabsTrigger>
          <TabsTrigger value="local">Lokal ({contactsByCategory.local.length})</TabsTrigger>
        </TabsList>

        {Object.entries(contactsByCategory).map(([category, categoryContacts]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {getCategoryIcon(category as EmergencyContact['category'])}
                  <span>Kontak {category === 'company' ? 'Perusahaan' : category === 'medical' ? 'Medis' : category === 'police' ? 'Kepolisian' : 'Lokal'}</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryContacts.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Phone className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Belum ada kontak untuk kategori ini</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2">
                    {categoryContacts.map((contact) => (
                      <Card key={contact.id} className="border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{contact.name}</h3>
                              <p className="text-sm text-gray-600">{contact.role}</p>
                              {contact.location && (
                                <p className="text-xs text-gray-500">{contact.location}</p>
                              )}
                            </div>
                            {getCategoryBadge(contact.category)}
                          </div>
                          
                          <div className="flex items-center space-x-2 mb-3">
                            <Phone className="h-4 w-4 text-green-600" />
                            <a 
                              href={`tel:${contact.phone}`}
                              className="font-mono text-green-600 hover:text-green-700"
                            >
                              {contact.phone}
                            </a>
                          </div>

                          {contact.notes && (
                            <p className="text-sm text-gray-600 mb-3">{contact.notes}</p>
                          )}

                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(contact)}
                              className="flex-1"
                            >
                              <Edit className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(contact.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}