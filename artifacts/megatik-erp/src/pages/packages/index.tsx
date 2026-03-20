import React, { useState } from "react";
import { useListPlans, useListExtraQuotaPackages } from "@workspace/api-client-react";
import { PageHeader, DataTable, formatCurrency, StatusBadge } from "@/components/ui-extras";
import { useI18n } from "@/lib/i18n";
import { Check, X } from "lucide-react";

export default function PackagesHub() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('packages')} 
        description="Manage main internet plans and extra gigabyte packages."
      />

      <div className="flex border-b border-border gap-6">
        <button
          onClick={() => setActiveTab('plans')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'plans' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('plans')}
        </button>
        <button
          onClick={() => setActiveTab('extra')}
          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === 'extra' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('extra_quotas')}
        </button>
      </div>

      {activeTab === 'plans' && <PlansList />}
      {activeTab === 'extra' && <ExtraQuotasList />}
    </div>
  );
}

function PlansList() {
  const { data, isLoading } = useListPlans();
  const { t } = useI18n();

  const columns = [
    { header: t('name_ar'), cell: (p: any) => <span className="font-semibold text-foreground">{p.nameAr}</span> },
    { header: t('price'), cell: (p: any) => <span className="font-mono text-primary font-medium">{formatCurrency(p.price)}</span> },
    { header: t('gb'), cell: (p: any) => <span className="font-mono font-medium">{p.gigabytes} GB</span> },
    { header: t('duration'), cell: (p: any) => `${p.durationDays} Days` },
    { header: t('active'), cell: (p: any) => p.isActive ? <Check className="text-emerald-500 h-5 w-5" /> : <X className="text-rose-500 h-5 w-5" /> },
  ];

  return (
    <DataTable 
      data={data || []} 
      columns={columns} 
      isLoading={isLoading} 
      onAdd={() => alert('Open Create Plan Modal')}
    />
  );
}

function ExtraQuotasList() {
  const { data, isLoading } = useListExtraQuotaPackages();
  const { t } = useI18n();

  const columns = [
    { header: t('name_ar'), cell: (p: any) => <span className="font-semibold text-foreground">{p.nameAr}</span> },
    { header: t('gb'), cell: (p: any) => <span className="font-mono font-bold text-amber-600">+{p.gigabytes} GB</span> },
    { header: t('price'), cell: (p: any) => <span className="font-mono font-medium">{formatCurrency(p.price)}</span> },
    { header: "Extends Expiry", cell: (p: any) => p.extendsExpiry ? <span className="text-emerald-600 text-xs font-bold uppercase">Yes</span> : <span className="text-muted-foreground text-xs font-bold uppercase">No</span> },
    { header: t('active'), cell: (p: any) => p.isActive ? <Check className="text-emerald-500 h-5 w-5" /> : <X className="text-rose-500 h-5 w-5" /> },
  ];

  return (
    <DataTable 
      data={data || []} 
      columns={columns} 
      isLoading={isLoading} 
      onAdd={() => alert('Open Create Extra Quota Modal')}
    />
  );
}
