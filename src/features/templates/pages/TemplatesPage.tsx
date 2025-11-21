import React, { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Calculator, ListChecks } from 'lucide-react'
import { CostPlansTab } from '../components/CostPlansTab'
import { ChecklistTemplatesTab } from '../components/ChecklistTemplatesTab'

export function TemplatesPage() {
  const [activeTab, setActiveTab] = useState('cost-plans')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Template Perjalanan</h1>
        <p className="text-gray-600 mt-2">Kelola template biaya dan checklist operasional untuk trip Anda</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="cost-plans" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Rencana Biaya
          </TabsTrigger>
          <TabsTrigger value="checklist-templates" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Checklist Operasional
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cost-plans" className="space-y-6 mt-6">
          <CostPlansTab />
        </TabsContent>

        <TabsContent value="checklist-templates" className="space-y-6 mt-6">
          <ChecklistTemplatesTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
