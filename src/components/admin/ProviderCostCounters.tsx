import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Flame, 
  GitBranch, 
  Globe, 
  RefreshCw, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Database, 
  Cpu, 
  Layers, 
  ShieldCheck, 
  Info, 
  TrendingUp, 
  X,
  Server,
  Zap
} from 'lucide-react';

export interface ProviderBillingInfo {
  id: 'studio_ai' | 'firebase' | 'github' | 'vercel';
  name: string;
  serviceType: string;
  icon: string;
  currency: string;
  currentCost: number;
  currentCostFormatted: string;
  currentCostILS: string;
  plan: string;
  tierStatus: string;
  isFreeTier: boolean;
  status: 'online' | 'warning' | 'key_requires_check' | 'not_configured' | 'error';
  errorMessage?: string | null;
  lastQueryTime: string;
  billingCycle?: string;
  cyclePeriod?: string;
  nextResetDate?: string;
  daysUntilReset?: number;
  resetRule?: string;
  metrics: Record<string, any>;
  pricingBreakdown: {
    includedAllowance: string;
    overageRate?: string;
    storageAllowance?: string;
    proPlanBase?: string;
    payAsYouGoRate?: string;
    blazeRates?: string;
    resetFrequency?: string;
    documentationUrl?: string;
  };
}

export interface BillingApiResponse {
  success: boolean;
  lastUpdated: string;
  billingCycle?: string;
  cyclePeriod?: string;
  nextMonthlyReset?: string;
  daysUntilReset?: number;
  resetPolicy?: string;
  totalCostUSD: number;
  totalCostFormatted: string;
  totalCostILS: string;
  allWithinFreeTier: boolean;
  exchangeRate: number;
  providers: ProviderBillingInfo[];
}

export const ProviderCostCounters: React.FC = () => {
  const [data, setData] = useState<BillingApiResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderBillingInfo | null>(null);
  const [secondsSinceLastUpdate, setSecondsSinceLastUpdate] = useState<number>(0);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchBilling = useCallback(async (force = false) => {
    try {
      if (force) setRefreshing(true);
      const url = force ? '/api/billing/providers?refresh=true' : '/api/billing/providers';
      const res = await fetch(url);
      
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        if (text.includes("<title>Starting Server...</title>")) {
          console.warn("Server starting, will retry billing query...");
          return;
        }
        throw new Error("Invalid response format from billing API");
      }

      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }

      const json: BillingApiResponse = await res.json();
      setData(json);
      setSecondsSinceLastUpdate(0);
    } catch (err) {
      console.warn("Notice: could not refresh billing providers (offline or reconnecting):", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBilling(false);
  }, [fetchBilling]);

  // Periodic timer for seconds since last update
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsSinceLastUpdate(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Optional periodic auto-refresh every 60s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchBilling(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchBilling]);

  const getProviderIcon = (id: string) => {
    switch (id) {
      case 'studio_ai':
        return <Sparkles className="text-sky-500" size={26} />;
      case 'firebase':
        return <Flame className="text-amber-500" size={26} />;
      case 'github':
        return <GitBranch className="text-purple-500" size={26} />;
      case 'vercel':
        return <Globe className="text-emerald-500" size={26} />;
      default:
        return <Server className="text-slate-500" size={26} />;
    }
  };

  const getProviderBadge = (p: ProviderBillingInfo) => {
    if (p.isFreeTier) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-xs flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ללא חיוב (Free)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-700 border border-amber-200/60 shadow-xs flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        חיוב פעיל
      </span>
    );
  };

  const getStatusIndicator = (status: ProviderBillingInfo['status']) => {
    switch (status) {
      case 'online':
        return (
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span>תשאול חי הצליח</span>
          </div>
        );
      case 'key_requires_check':
        return (
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-600">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500" />
            <span>מכסה חינמית זמינה</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600">
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
            <span>תשאול חלקי</span>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto" dir="rtl">
      {/* Top Banner / Summary Card */}
      <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-2xl border border-slate-700/50">
        <div className="absolute -left-20 -top-20 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10 text-sky-400 shadow-inner">
                <DollarSign size={24} />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  מוני עלות שימוש בשירותים
                  <span className="text-xs font-extrabold uppercase px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30">
                    LIVE BILLING
                  </span>
                </h3>
                <p className="text-sm text-slate-300 font-medium">
                  תשאול בזמן אמת של 4 הספקים: Google AI Studio, Firebase, GitHub ו-Vercel
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Monthly Calendar Cycle Pill */}
            <div className="px-4 py-3 rounded-2xl bg-indigo-500/15 border border-indigo-400/20 backdrop-blur-md flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-sky-400 animate-pulse" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black text-sky-300 uppercase tracking-wide">
                    מחזור שימוש: {data?.billingCycle || 'ספטמבר 2026'}
                  </span>
                  <span className="text-[10px] text-slate-300 bg-white/10 px-2 py-0.5 rounded-full font-mono">
                    {data?.cyclePeriod || '01/09/2026 - 30/09/2026'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <Clock size={11} className="text-sky-400" />
                  <span>איפוס המונה הבא:</span>
                  <strong className="text-white font-bold">{data?.nextMonthlyReset || '1 באוקטובר 2026'}</strong>
                  <span className="text-sky-300 font-bold">(בעוד {data?.daysUntilReset ?? 22} ימים)</span>
                </p>
              </div>
            </div>

            {/* Aggregate Spend Box */}
            <div className="px-5 py-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  עלות חודש {data?.billingCycle || 'שוטף'}
                </p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-black text-white tabular-nums">
                    {data ? data.totalCostFormatted : '$0.00'}
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    ({data ? data.totalCostILS : '₪0.00'})
                  </span>
                </div>
              </div>
              <div className="h-9 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-400" />
                <span className="text-xs font-black text-emerald-300">
                  {data?.allWithinFreeTier ? 'ללא חריגה ממכסה' : 'חיוב פעיל'}
                </span>
              </div>
            </div>

            {/* Refresh Action */}
            <div className="flex items-center gap-2">
              <button
                id="btn-refresh-all-providers"
                onClick={() => fetchBilling(true)}
                disabled={refreshing || loading}
                className="px-5 py-3 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black text-xs transition-all shadow-lg shadow-sky-500/25 active:scale-95 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                title="תשאל עכשיו את כל 4 הספקים לקבלת עלות ושימוש עדכניים"
              >
                <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                <span>{refreshing ? 'מתשאל ספקים...' : 'תשאל את כל הספקים'}</span>
              </button>

              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-3 rounded-2xl text-xs font-bold transition-all border ${
                  autoRefresh 
                    ? 'bg-white/10 border-white/20 text-white hover:bg-white/20' 
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
                title={autoRefresh ? 'רענון אוטומטי פעיל (כל 60 שניות)' : 'רענון אוטומטי כבוי'}
              >
                <Zap size={16} className={autoRefresh ? 'text-amber-400' : 'text-slate-500'} />
              </button>
            </div>
          </div>
        </div>

        {/* Live sync subtitle status */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-sky-400" />
            <span>
              {secondsSinceLastUpdate === 0 
                ? 'עודכן זה עתה מתשאול חי של הספקים' 
                : `תשאול אחרון בוצע לפני ${secondsSinceLastUpdate} שניות`}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400">
              שער המרה: 1 USD = {data?.exchangeRate || 3.70} ILS
            </span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 size={13} />
              חיבורי API פעילים
            </span>
          </div>
        </div>
      </div>

      {/* 4 Provider Counters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {data?.providers?.map((provider) => (
          <motion.div
            key={provider.id}
            id={`billing-card-${provider.id}`}
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
            className="luxury-card p-6 flex flex-col justify-between relative overflow-hidden group hover:border-sky-300 transition-all shadow-sm"
          >
            {/* Top Accent Line */}
            <div className={`absolute top-0 right-0 left-0 h-1.5 ${
              provider.id === 'studio_ai' ? 'bg-gradient-to-r from-sky-400 to-indigo-500' :
              provider.id === 'firebase' ? 'bg-gradient-to-r from-amber-400 to-orange-500' :
              provider.id === 'github' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
              'bg-gradient-to-r from-emerald-400 to-teal-500'
            }`} />

            <div>
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 group-hover:bg-white shadow-xs transition-colors">
                    {getProviderIcon(provider.id)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-lg leading-tight">
                      {provider.name}
                    </h4>
                    <p className="text-[11px] font-bold text-slate-400">
                      {provider.serviceType}
                    </p>
                  </div>
                </div>
                {getProviderBadge(provider)}
              </div>

              {/* Cost Display (Counter) */}
              <div className="my-5 p-4 bg-slate-50/80 rounded-2xl border border-slate-100/80">
                <div className="flex items-baseline justify-between">
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">
                    עלות חודש {provider.billingCycle || 'שוטף'}
                  </span>
                  <span className="text-xs font-bold text-slate-500">
                    {provider.currentCostILS}
                  </span>
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-slate-800 tracking-tight tabular-nums">
                    {provider.currentCostFormatted}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase">USD</span>
                </div>
                <p className="text-[11px] font-bold text-slate-500 mt-2 flex items-center gap-1.5">
                  <Info size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{provider.tierStatus}</span>
                </p>

                {/* Calendar Reset Indicator */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/70 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-bold flex items-center gap-1">
                    <Clock size={12} className="text-sky-500 shrink-0" />
                    איפוס מונה הבא:
                  </span>
                  <span className="font-extrabold text-sky-700 bg-sky-50/90 px-2 py-0.5 rounded-md border border-sky-200/60 shadow-2xs">
                    {provider.nextResetDate || '1 באוקטובר'}
                  </span>
                </div>
              </div>

              {/* Key Metrics Breakdown */}
              <div className="space-y-2 mb-4">
                {provider.id === 'studio_ai' && (
                  <>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">מודל מרכזי:</span>
                      <span className="text-slate-700 font-black truncate max-w-[140px]">
                        {provider.metrics.activeModel?.split('/')[0]?.trim()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">מכסה לדקה:</span>
                      <span className="text-slate-700 font-bold">{provider.metrics.freeRateLimit}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-400 font-bold">מכסה יומית חינם:</span>
                      <span className="text-slate-700 font-bold">{provider.metrics.dailyQuotaLimit}</span>
                    </div>
                  </>
                )}

                {provider.id === 'firebase' && (
                  <>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">מסמכים פעילים:</span>
                      <span className="text-slate-700 font-black">{provider.metrics.totalDocuments} מסמכים</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">קריאות יומיות:</span>
                      <span className="text-slate-700 font-bold">{provider.metrics.dailyReadQuota}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-400 font-bold">אחסון כלול:</span>
                      <span className="text-slate-700 font-bold">{provider.metrics.storageQuota}</span>
                    </div>
                  </>
                )}

                {provider.id === 'github' && (
                  <>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">דקות Actions החודש:</span>
                      <span className="text-slate-700 font-black">{provider.metrics.usedMinutesThisMonth || '0 דקות'}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">מכסה נותרת לחודש:</span>
                      <span className="text-emerald-600 font-black">{provider.metrics.remainingMinutes}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-400 font-bold">ריצות החודש:</span>
                      <span className="text-slate-700 font-bold">{provider.metrics.currentMonthRuns || '0 ריצות'}</span>
                    </div>
                  </>
                )}

                {provider.id === 'vercel' && (
                  <>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">פרויקט פעיל:</span>
                      <span className="text-slate-700 font-black truncate max-w-[130px]">{provider.metrics.projectName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                      <span className="text-slate-400 font-bold">פריסות אחרונות:</span>
                      <span className="text-slate-700 font-bold">{provider.metrics.deploymentsCount} פריסות</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1">
                      <span className="text-slate-400 font-bold">תעבורה חודשית כלולה:</span>
                      <span className="text-slate-700 font-bold">100 GB Fast Data</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
              <div>{getStatusIndicator(provider.status)}</div>
              <button
                onClick={() => setSelectedProvider(provider)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-sky-50 hover:text-sky-600 text-slate-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <span>פרטי תמחור</span>
                <ExternalLink size={12} />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Pricing & Query Details Modal */}
      <AnimatePresence>
        {selectedProvider && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-200 relative overflow-hidden"
              dir="rtl"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-50 rounded-2xl">
                    {getProviderIcon(selectedProvider.id)}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">
                      תמחור ותשאול: {selectedProvider.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold">{selectedProvider.serviceType}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6 my-6">
                {/* Cost Highlight */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase">
                      עלות חודש {selectedProvider.billingCycle || 'שוטף'}
                    </p>
                    <p className="text-3xl font-black text-slate-800">
                      {selectedProvider.currentCostFormatted}
                      <span className="text-sm font-bold text-slate-400 mr-2">
                        ({selectedProvider.currentCostILS})
                      </span>
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-400">חבילה פעילה</p>
                    <p className="text-sm font-black text-sky-600">{selectedProvider.plan}</p>
                  </div>
                </div>

                {/* Monthly Reset Cycle Box */}
                <div className="p-4 bg-sky-50/70 rounded-2xl border border-sky-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-sky-900 font-black">
                    <Clock size={16} className="text-sky-600 shrink-0" />
                    <span>מחזור חיוב ומועד איפוס קלנדרי</span>
                  </div>
                  <div className="space-y-1.5 text-slate-700 pr-6 font-medium">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">מחזור חודשי:</span>
                      <span className="font-black text-slate-800">
                        {selectedProvider.billingCycle || 'ספטמבר 2026'} ({selectedProvider.cyclePeriod || '01/09 - 30/09'})
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-bold">איפוס המונה הבא:</span>
                      <span className="font-extrabold text-sky-700">
                        {selectedProvider.nextResetDate || '1 באוקטובר 2026'} (בעוד {selectedProvider.daysUntilReset ?? 22} ימים)
                      </span>
                    </div>
                    <div className="pt-1 border-t border-sky-100 text-[11px] text-slate-600">
                      <span>מדיניות: {selectedProvider.resetRule || 'המונה מתאפס אוטומטית ב-1 לכל חודש קלנדרי.'}</span>
                    </div>
                  </div>
                </div>

                {/* Details Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider">
                    מפרט מכסות ותעריפי ספק רשמיים
                  </h4>

                  <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2 text-xs">
                    <div className="flex items-start gap-2 text-emerald-900 font-bold">
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{selectedProvider.pricingBreakdown.includedAllowance}</span>
                    </div>
                    {selectedProvider.pricingBreakdown.overageRate && (
                      <div className="flex items-start gap-2 text-slate-700 font-medium pt-2 border-t border-emerald-100">
                        <TrendingUp size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>תעריף חריגה: {selectedProvider.pricingBreakdown.overageRate}</span>
                      </div>
                    )}
                    {selectedProvider.pricingBreakdown.blazeRates && (
                      <div className="flex items-start gap-2 text-slate-700 font-medium pt-2 border-t border-emerald-100">
                        <TrendingUp size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>תעריפי Blaze מעבר למכסה: {selectedProvider.pricingBreakdown.blazeRates}</span>
                      </div>
                    )}
                    {selectedProvider.pricingBreakdown.payAsYouGoRate && (
                      <div className="flex items-start gap-2 text-slate-700 font-medium pt-2 border-t border-emerald-100">
                        <TrendingUp size={16} className="text-slate-400 shrink-0 mt-0.5" />
                        <span>תעריף Pay-As-You-Go: {selectedProvider.pricingBreakdown.payAsYouGoRate}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Raw Query Output */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Database size={13} />
                    <span>ערכי תשאול חי מהספק</span>
                  </h4>
                  <div className="bg-slate-900 text-slate-200 p-4 rounded-2xl text-xs font-mono overflow-x-auto max-h-40 custom-scrollbar">
                    <pre>{JSON.stringify(selectedProvider.metrics, null, 2)}</pre>
                  </div>
                  <p className="text-[10px] text-slate-400 text-left">
                    זמן תשאול: {new Date(selectedProvider.lastQueryTime).toLocaleString('he-IL')}
                  </p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                {selectedProvider.pricingBreakdown.documentationUrl ? (
                  <a
                    href={selectedProvider.pricingBreakdown.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-black text-sky-600 hover:text-sky-500 flex items-center gap-1"
                  >
                    <span>מחירון רשמי של {selectedProvider.name}</span>
                    <ExternalLink size={13} />
                  </a>
                ) : (
                  <span />
                )}
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="px-5 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
                >
                  סגור
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProviderCostCounters;
