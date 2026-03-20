import React, { useState } from "react";
import { useRoute } from "wouter";
import { useGetSubscriber, useDepositToWallet, useRenewSubscription } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { PageHeader, StatusBadge, formatCurrency, DataTable } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { Wallet, Calendar, Plus, RefreshCw, Activity, ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export default function SubscriberDetail() {
  const [, params] = useRoute("/subscribers/:id");
  const id = parseInt(params?.id || "0");
  const { t } = useI18n();
  const { data: sub, isLoading } = useGetSubscriber(id);
  const [activeTab, setActiveTab] = useState('services');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isRenewOpen, setIsRenewOpen] = useState(false);

  if (isLoading || !sub) return <div className="p-8 text-center animate-pulse">Loading profile...</div>;

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-2xl p-6 md:p-8 border border-border shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">{sub.nameAr}</h1>
            <StatusBadge status={sub.status} />
            <span className="uppercase text-xs font-bold bg-muted px-2 py-1 rounded text-muted-foreground">{sub.type}</span>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            {sub.phone} • {sub.areaNameAr || 'No Area'} • {sub.address || 'No Address'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">Edit Profile</Button>
          <Button variant="destructive">Suspend</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <Wallet className="absolute -bottom-4 -end-4 h-32 w-32 text-white/5" />
          <h3 className="font-medium text-slate-300 mb-1">Wallet Balance</h3>
          <p className="text-4xl font-bold font-mono mb-6">{formatCurrency(sub.walletBalance)}</p>
          <Button onClick={() => setIsDepositOpen(true)} className="w-full bg-white/10 hover:bg-white/20 text-white border-none">
            <Plus className="me-2 h-4 w-4" /> Add Funds
          </Button>
        </div>

        {/* Current Plan Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Current Plan</h3>
              <p className="text-xl font-bold">{sub.currentPlanNameAr || 'No Active Plan'}</p>
            </div>
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
          </div>
          <div className="mb-6">
            <p className="text-sm text-muted-foreground">Expires on</p>
            <p className="font-medium">{sub.expiryDate || 'N/A'}</p>
          </div>
          <Button onClick={() => setIsRenewOpen(true)} variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground">
            <RefreshCw className="me-2 h-4 w-4" /> Renew Now
          </Button>
        </div>
        
        {/* Extra Quota Card */}
        <div className="bg-card rounded-2xl p-6 border border-border shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Extra Quotas</h3>
                <p className="text-xl font-bold">0 GB Active</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-500" />
              </div>
            </div>
          </div>
          <Button variant="outline" className="w-full border-amber-500/20 text-amber-600 hover:bg-amber-500 hover:text-white">
            <Plus className="me-2 h-4 w-4" /> Add GB
          </Button>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <div className="flex border-b border-border bg-muted/20 px-2 pt-2 overflow-x-auto">
          {['services', 'renewals', 'wallet', 'debts'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium text-sm rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                activeTab === tab 
                  ? 'bg-background border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
              }`}
            >
              {t(tab)}
            </button>
          ))}
        </div>
        <div className="p-0">
          {activeTab === 'renewals' && (
            <DataTable 
              data={sub.recentRenewals || []}
              columns={[
                { header: 'Date', cell: (r) => r.renewalDate?.substring(0, 10) },
                { header: 'Plan', cell: (r) => <span className="font-medium">{r.planNameAr}</span> },
                { header: 'Amount', cell: (r) => formatCurrency(r.amount) },
                { header: 'Payment', cell: (r) => <span className="capitalize">{r.paymentType.replace('_', ' ')}</span> },
                { header: 'By', cell: (r) => r.userName }
              ]}
            />
          )}
          {activeTab === 'wallet' && (
            <DataTable 
              data={sub.walletTransactions || []}
              columns={[
                { header: 'Date', cell: (t) => t.createdAt?.substring(0, 10) },
                { header: 'Type', cell: (t) => (
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${t.type === 'deposit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {t.type === 'deposit' ? <ArrowDownLeft className="h-3 w-3 me-1" /> : <ArrowUpRight className="h-3 w-3 me-1" />}
                    {t.type}
                  </span>
                )},
                { header: 'Amount', cell: (t) => <span className={`font-mono font-medium ${t.type === 'deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'deposit' ? '+' : '-'}{formatCurrency(t.amount)}</span> },
                { header: 'Balance After', cell: (t) => <span className="font-mono">{formatCurrency(t.balanceAfter)}</span> },
                { header: 'By', cell: (t) => t.userName }
              ]}
            />
          )}
          {activeTab === 'services' && (
            <div className="p-8 text-center text-muted-foreground">Service history mapping would appear here.</div>
          )}
          {activeTab === 'debts' && (
            <div className="p-8 text-center text-muted-foreground">Debt history mapping would appear here.</div>
          )}
        </div>
      </div>

      <DepositDialog open={isDepositOpen} onOpenChange={setIsDepositOpen} subscriberId={id} />
    </div>
  );
}

function DepositDialog({ open, onOpenChange, subscriberId }: any) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");

  const depositMutation = useDepositToWallet({
    mutation: {
      onSuccess: () => {
        toast({ title: "Funds added to wallet." });
        queryClient.invalidateQueries({ queryKey: [`/api/subscribers/${subscriberId}`] });
        onOpenChange(false);
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Deposit to Wallet</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Amount (EGP)</label>
            <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" className="text-xl font-mono h-12" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Payment Method</label>
            <select value={method} onChange={e => setMethod(e.target.value)} className="w-full h-12 px-3 rounded-md border border-input bg-background">
              <option value="cash">Cash</option>
              <option value="vodafone_cash">Vodafone Cash</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>
          </div>
          <Button 
            className="w-full h-12 text-base mt-2" 
            onClick={() => depositMutation.mutate({ id: subscriberId, data: { amount: Number(amount), paymentMethod: method as any } })}
            disabled={!amount || depositMutation.isPending}
          >
            {depositMutation.isPending ? 'Processing...' : 'Confirm Deposit'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
