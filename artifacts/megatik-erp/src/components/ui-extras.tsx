import React, { useState } from "react";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { Loader2, Search, Plus, Filter, AlertTriangle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function PageHeader({ 
  title, 
  description, 
  action 
}: { 
  title: string; 
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useI18n();
  const variants: Record<string, string> = {
    active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200",
    suspended: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200",
    expired: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200",
    cancelled: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400 border-slate-200",
    paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
    partial: "bg-blue-100 text-blue-800 border-blue-200",
    unpaid: "bg-rose-100 text-rose-800 border-rose-200",
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${variants[status] || variants.cancelled}`}>
      {t(status)}
    </span>
  );
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(amount);
}

export function DataTable<T>({ 
  data, 
  columns, 
  isLoading,
  onSearch,
  onAdd
}: { 
  data: T[]; 
  columns: { header: string; cell: (item: T) => React.ReactNode }[];
  isLoading?: boolean;
  onSearch?: (term: string) => void;
  onAdd?: () => void;
}) {
  const { t } = useI18n();
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (onSearch) onSearch(e.target.value);
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
      {(onSearch || onAdd) && (
        <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-muted/20">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t('search')} 
              value={searchTerm}
              onChange={handleSearch}
              className="ps-9 bg-background"
            />
          </div>
          {onAdd && (
            <Button onClick={onAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="me-2 h-4 w-4" /> {t('add_new')}
            </Button>
          )}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-start">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/40 border-b border-border">
            <tr>
              {columns.map((col, i) => (
                <th key={i} className="px-6 py-4 font-medium tracking-wider text-start">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-muted-foreground">
                  No data available
                </td>
              </tr>
            ) : (
              data.map((item, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-muted/30 transition-colors group">
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                      {col.cell(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  isDestructive = false,
  isLoading = false
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isDestructive && <AlertTriangle className="h-5 w-5 text-destructive" />}
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>{t('cancel')}</Button>
          <Button 
            variant={isDestructive ? "destructive" : "default"} 
            onClick={onConfirm} 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
            {t(isDestructive ? 'delete' : 'save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
