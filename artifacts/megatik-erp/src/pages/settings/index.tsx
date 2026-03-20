import React, { useState } from "react";
import { useListUsers, useListAreas, useListPriceTiers } from "@workspace/api-client-react";
import { PageHeader, DataTable, formatCurrency } from "@/components/ui-extras";
import { useI18n } from "@/lib/i18n";
import { Check, X } from "lucide-react";

export default function SettingsHub() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('areas');

  const tabs = [
    { id: 'areas', label: t('areas') },
    { id: 'tiers', label: t('price_tiers') },
    { id: 'users', label: t('users') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('settings')} 
        description="System configuration, users, areas, and pricing rules."
      />

      <div className="flex border-b border-border gap-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'areas' && <AreasList />}
        {activeTab === 'tiers' && <TiersList />}
        {activeTab === 'users' && <UsersList />}
      </div>
    </div>
  );
}

function AreasList() {
  const { data, isLoading } = useListAreas();
  return (
    <DataTable 
      data={data || []} 
      columns={[
        { header: "ID", cell: a => <span className="text-muted-foreground">#{a.id}</span> },
        { header: "Name (AR)", cell: a => <span className="font-medium">{a.nameAr}</span> },
        { header: "Name (EN)", cell: a => a.nameEn },
        { header: "Subscribers", cell: a => <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-bold">{a.subscriberCount || 0}</span> },
      ]} 
      isLoading={isLoading} 
      onAdd={() => alert('Add Area')}
    />
  );
}

function TiersList() {
  const { data, isLoading } = useListPriceTiers();
  return (
    <DataTable 
      data={data || []} 
      columns={[
        { header: "Range", cell: t => <span className="font-mono bg-muted px-2 py-1 rounded text-sm">{t.minQuantity} GB - {t.maxQuantity} GB</span> },
        { header: "Price Per GB", cell: t => <span className="font-mono font-bold text-primary">{formatCurrency(t.pricePerGb)}</span> },
        { header: "Active", cell: t => t.isActive ? <Check className="text-emerald-500 h-5 w-5" /> : <X className="text-rose-500 h-5 w-5" /> },
      ]} 
      isLoading={isLoading}
      onAdd={() => alert('Add Tier')}
    />
  );
}

function UsersList() {
  const { data, isLoading } = useListUsers();
  return (
    <DataTable 
      data={data || []} 
      columns={[
        { header: "Name", cell: u => <span className="font-semibold">{u.name}</span> },
        { header: "Email", cell: u => u.email },
        { header: "Role", cell: u => <span className="capitalize text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded">{u.role}</span> },
        { header: "Created", cell: u => u.createdAt?.substring(0, 10) },
      ]} 
      isLoading={isLoading} 
      onAdd={() => alert('Add User')}
    />
  );
}
