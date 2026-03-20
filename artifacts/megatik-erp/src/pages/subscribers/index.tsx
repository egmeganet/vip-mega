import React, { useState } from "react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useListSubscribers, useCreateSubscriber, useListAreas, useListPlans } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";
import { PageHeader, DataTable, StatusBadge, formatCurrency } from "@/components/ui-extras";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Eye, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const subscriberSchema = z.object({
  nameAr: z.string().min(2),
  nameEn: z.string().min(2),
  phone: z.string().min(10),
  type: z.enum(["pppoe", "hotspot"]),
  areaId: z.coerce.number().optional(),
  initialPlanId: z.coerce.number().optional(),
});

export default function SubscribersPage() {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const { data, isLoading } = useListSubscribers({ search: searchTerm });

  const columns = [
    { header: t('name_ar'), cell: (s: any) => <div className="font-semibold">{s.nameAr}</div> },
    { header: t('phone'), cell: (s: any) => s.phone },
    { header: t('type'), cell: (s: any) => <span className="uppercase text-xs font-bold text-muted-foreground">{s.type}</span> },
    { header: t('status'), cell: (s: any) => <StatusBadge status={s.status} /> },
    { header: t('balance'), cell: (s: any) => <span className="font-mono">{formatCurrency(s.walletBalance)}</span> },
    { header: t('actions'), cell: (s: any) => (
      <Link href={`/subscribers/${s.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 w-9 hover:bg-primary/10 text-primary transition-colors">
        <Eye className="h-4 w-4" />
      </Link>
    )}
  ];

  return (
    <div>
      <PageHeader 
        title={t('subscribers')} 
        description="Manage your PPPoE and Hotspot network users."
      />

      <DataTable 
        data={data?.data || []}
        columns={columns}
        isLoading={isLoading}
        onSearch={setSearchTerm}
        onAdd={() => setIsCreateOpen(true)}
      />

      <CreateSubscriberDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function CreateSubscriberDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (o: boolean) => void }) {
  const { t } = useI18n();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: areas } = useListAreas();
  const { data: plans } = useListPlans({ active: true });

  const form = useForm<z.infer<typeof subscriberSchema>>({
    resolver: zodResolver(subscriberSchema),
    defaultValues: { type: "pppoe" }
  });

  const createMutation = useCreateSubscriber({
    mutation: {
      onSuccess: () => {
        toast({ title: "Success", description: "Subscriber created successfully." });
        queryClient.invalidateQueries({ queryKey: ["/api/subscribers"] });
        onOpenChange(false);
        form.reset();
      },
      onError: (err: any) => {
        toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create." });
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" /> Create New Subscriber
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit((data) => createMutation.mutate({ data }))} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('name_ar')}</label>
              <Input {...form.register("nameAr")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('name_en')}</label>
              <Input {...form.register("nameEn")} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('phone')}</label>
              <Input {...form.register("phone")} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('type')}</label>
              <select {...form.register("type")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="pppoe">PPPoE</option>
                <option value="hotspot">Hotspot</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">{t('area')}</label>
              <select {...form.register("areaId")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Select Area...</option>
                {areas?.map(a => <option key={a.id} value={a.id}>{a.nameAr}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Initial Plan</label>
              <select {...form.register("initialPlanId")} className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                <option value="">Select Plan...</option>
                {plans?.map(p => <option key={p.id} value={p.id}>{p.nameAr} ({formatCurrency(p.price)})</option>)}
              </select>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
              {t('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
