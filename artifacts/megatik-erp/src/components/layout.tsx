import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { useI18n } from "@/lib/i18n";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { 
  LayoutDashboard, Users, Zap, Database, Wallet, 
  CreditCard, BookOpen, Map, Tags, UserCog, Settings,
  LogOut, Menu, Globe, ChevronRight, X, User as UserIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { locale, setLocale, t } = useI18n();
  const [, setLocation] = useLocation();
  const { data: user, isLoading, isError } = useGetMe({ query: { retry: false } });
  const logoutMutation = useLogout({
    mutation: {
      onSuccess: () => {
        localStorage.removeItem("auth_token");
        setLocation("/login");
      }
    }
  });
  
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  // Auth protection
  React.useEffect(() => {
    if (isError) {
      setLocation("/login");
    }
  }, [isError, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <p className="text-muted-foreground font-medium">Loading ERP...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const toggleLocale = () => setLocale(locale === "ar" ? "en" : "ar");

  const navItems = [
    { icon: LayoutDashboard, label: t('dashboard'), href: "/" },
    { icon: Users, label: t('subscribers'), href: "/subscribers" },
    { icon: Database, label: t('packages'), href: "/packages" },
    { icon: Wallet, label: t('finance'), href: "/finance" },
    { icon: Settings, label: t('settings'), href: "/settings" },
  ];

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 start-0 z-50
        w-72 bg-sidebar border-e border-sidebar-border
        transform transition-transform duration-300 ease-in-out
        flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
              <Zap className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground tracking-tight">MEGA-TIK</span>
          </div>
          <button className="lg:hidden text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <a className={`
                  flex items-center gap-3 px-3 py-2.5 rounded-lg
                  text-sm font-medium transition-all duration-200
                  text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
                `}>
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </a>
              </Link>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-sidebar-border/50">
          <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-accent/50 border border-sidebar-border/50 mb-4">
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</span>
              <span className="text-xs text-sidebar-foreground/50 truncate capitalize">{user.role}</span>
            </div>
          </div>
          
          <button 
            onClick={() => logoutMutation.mutate({ data: undefined })}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-400/10 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            {t('logout')}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center justify-between px-4 sm:px-6 lg:px-8 sticky top-0 z-30 shadow-sm">
          <button 
            className="lg:hidden p-2 -ms-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={toggleLocale} className="hidden sm:flex rounded-full px-4 border-border">
              <Globe className="h-4 w-4 me-2 text-muted-foreground" />
              {locale === 'ar' ? 'English' : 'العربية'}
            </Button>
            <button onClick={toggleLocale} className="sm:hidden p-2 text-muted-foreground">
              <Globe className="h-5 w-5" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
