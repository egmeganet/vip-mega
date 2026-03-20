import React, { useState } from "react";
import { useListRenewals, useListWalletTransactions, useListDebts, useListFinancialEntries } from "@workspace/api-client-react";
import { PageHeader, DataTable, formatCurrency, StatusBadge } from "@/components/ui-extras";
import { useI18n } from "@/lib/i18n";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

export default function FinanceHub() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('renewals');

  const tabs = [
    { id: 'renewals', label: t('renewals') },
    { id: 'wallet', label: t('wallet') },
    { id: 'debts', label: t('debts') },
    { id: 'ledger', label: t('ledger') },
  ];

  return (
    <div className="space-y-6">
      <PageHeader 
        title={t('finance')} 
        description="Comprehensive financial tracking: renewals, wallets, debts, and general ledger."
      />

      <div className="flex border-b border-border gap-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {activeTab === 'renewals' && <RenewalsList />}
        {activeTab === 'wallet' && <WalletList />}
        {activeTab === 'debts' && <DebtsList />}
        {activeTab === 'ledger' && <LedgerList />}
      </div>
    </div>
  );
}

function RenewalsList() {
  const { data, isLoading } = useListRenewals();
  return (
    <DataTable 
      data={data?.data || []} 
      columns={[
        { header: "Date", cell: r => r.renewalDate?.substring(0, 10) },
        { header: "Subscriber", cell: r => <span className="font-semibold text-primary">{r.subscriberNameAr}</span> },
        { header: "Plan", cell: r => r.planNameAr },
        { header: "Amount", cell: r => <span className="font-mono font-medium">{formatCurrency(r.amount)}</span> },
        { header: "Payment", cell: r => <span className="capitalize">{r.paymentType.replace('_', ' ')}</span> },
        { header: "By", cell: r => r.userName },
      ]} 
      isLoading={isLoading} 
    />
  );
}

function WalletList() {
  const { data, isLoading } = useListWalletTransactions();
  return (
    <DataTable 
      data={data?.data || []} 
      columns={[
        { header: "Date", cell: t => t.createdAt?.substring(0, 10) },
        { header: "Subscriber", cell: t => <span className="font-semibold">{t.subscriberNameAr}</span> },
        { header: "Type", cell: t => (
          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${t.type === 'deposit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
            {t.type === 'deposit' ? <ArrowDownLeft className="h-3 w-3 me-1" /> : <ArrowUpRight className="h-3 w-3 me-1" />}
            {t.type}
          </span>
        )},
        { header: "Amount", cell: t => <span className={`font-mono font-bold ${t.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>{formatCurrency(t.amount)}</span> },
        { header: "Balance After", cell: t => <span className="font-mono">{formatCurrency(t.balanceAfter)}</span> },
      ]} 
      isLoading={isLoading} 
    />
  );
}

function DebtsList() {
  const { data, isLoading } = useListDebts();
  return (
    <DataTable 
      data={data?.data || []} 
      columns={[
        { header: "Created", cell: d => d.createdAt?.substring(0, 10) },
        { header: "Subscriber", cell: d => <span className="font-semibold">{d.subscriberNameAr}</span> },
        { header: "Total Debt", cell: d => <span className="font-mono">{formatCurrency(d.amount)}</span> },
        { header: "Remaining", cell: d => <span className="font-mono font-bold text-rose-600">{formatCurrency(d.remainingAmount)}</span> },
        { header: "Status", cell: d => <StatusBadge status={d.status} /> },
      ]} 
      isLoading={isLoading} 
    />
  );
}

function LedgerList() {
  const { data, isLoading } = useListFinancialEntries();
  return (
    <DataTable 
      data={data?.data || []} 
      columns={[
        { header: "Date", cell: f => f.createdAt?.substring(0, 16).replace('T', ' ') },
        { header: "Reference", cell: f => <span className="text-xs uppercase text-muted-foreground">{f.referenceType} #{f.referenceId}</span> },
        { header: "Description", cell: f => f.description },
        { header: "Debit", cell: f => f.direction === 'debit' ? <span className="font-mono font-medium text-emerald-600">{formatCurrency(f.amount)}</span> : '-' },
        { header: "Credit", cell: f => f.direction === 'credit' ? <span className="font-mono font-medium text-rose-600">{formatCurrency(f.amount)}</span> : '-' },
      ]} 
      isLoading={isLoading} 
    />
  );
}
