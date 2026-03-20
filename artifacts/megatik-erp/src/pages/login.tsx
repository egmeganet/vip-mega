import React from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Zap, Loader2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

export default function Login() {
  const { t, locale, setLocale } = useI18n();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // If already authenticated, redirect
  const { data: user } = useGetMe({ query: { retry: false } });
  React.useEffect(() => {
    if (user) setLocation("/");
  }, [user, setLocation]);

  const loginMutation = useLogin({
    mutation: {
      onSuccess: (data) => {
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }
        toast({ title: "Welcome back!", description: "Login successful." });
        setLocation("/");
      },
      onError: () => {
        toast({ 
          variant: "destructive", 
          title: "Login failed", 
          description: "Please check your credentials and try again." 
        });
      }
    }
  });

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data });
  };

  return (
    <div className="min-h-screen flex">
      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24 bg-background relative z-10">
        <div className="absolute top-6 end-6">
          <Button variant="ghost" size="sm" onClick={() => setLocale(locale === 'ar' ? 'en' : 'ar')} className="rounded-full">
            <Globe className="h-4 w-4 me-2" />
            {locale === 'ar' ? 'English' : 'العربية'}
          </Button>
        </div>
        
        <div className="max-w-sm w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <Zap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">MEGA-TIK</span>
          </div>
          
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('login')}</h1>
            <p className="text-muted-foreground mt-2 text-sm">Enter your credentials to access the ERP system.</p>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('email')}</label>
              <Input 
                {...form.register("email")} 
                type="email" 
                placeholder="admin@megatik.com"
                className="h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all" 
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{t('password')}</label>
              <Input 
                {...form.register("password")} 
                type="password" 
                placeholder="••••••••"
                className="h-12 bg-muted/50 border-transparent focus:bg-background focus:border-primary transition-all" 
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-base font-semibold shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-0.5" 
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? <Loader2 className="animate-spin h-5 w-5" /> : t('sign_in')}
            </Button>
          </form>
        </div>
      </div>

      {/* Image Side */}
      <div className="hidden lg:block w-1/2 relative bg-slate-900 overflow-hidden">
        <img 
          src={`${import.meta.env.BASE_URL}images/login-bg.png`}
          alt="Abstract Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-overlay"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent" />
        <div className="absolute bottom-16 start-16 max-w-lg">
          <h2 className="text-4xl font-bold text-white mb-4 leading-tight">Advanced ISP Management.</h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            Complete control over subscribers, billing, quotas, and financial reporting in one unified enterprise platform.
          </p>
        </div>
      </div>
    </div>
  );
}
