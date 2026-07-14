"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabaseBrowser, type Business, type Profile } from "@revson/shared";

interface Ctx {
  loading: boolean;
  profile: Profile | null;
  business: Business | null;
  businesses: Business[];
  impersonating: boolean;
  switchBusiness: (id: string) => void;
  refresh: () => Promise<void>;
}

const BusinessContext = createContext<Ctx>({
  loading: true, profile: null, business: null, businesses: [],
  impersonating: false, switchBusiness: () => {}, refresh: async () => {}
});

export const useBusiness = () => useContext(BusinessContext);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [impersonating, setImpersonating] = useState(false);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: prof } = await sb.from("profiles").select("*").eq("id", user.id).single();
    if (!prof) { setLoading(false); return; }
    setProfile(prof as Profile);

    if (prof.role === "super_admin") {
      // Impersonation: ?impersonate=<businessId> wins, then sticks via localStorage.
      const url = new URL(window.location.href);
      const fromQuery = url.searchParams.get("impersonate");
      if (fromQuery) {
        localStorage.setItem("rv_impersonate", fromQuery);
        url.searchParams.delete("impersonate");
        window.history.replaceState({}, "", url.toString());
      }
      const bizId = fromQuery ?? localStorage.getItem("rv_impersonate");
      if (bizId) {
        const { data: biz } = await sb.from("businesses").select("*").eq("id", bizId).single();
        if (biz) {
          setBusiness(biz as Business);
          setBusinesses([biz as Business]);
          setImpersonating(true);
        }
      }
      setLoading(false);
      return;
    }

    const { data: owned } = await sb
      .from("businesses")
      .select("*")
      .eq("owner_user_id", user.id)
      .order("created_at", { ascending: true });
    const list = (owned as Business[]) ?? [];
    setBusinesses(list);
    const savedId = localStorage.getItem("rv_business");
    setBusiness(list.find((b) => b.id === savedId) ?? list[0] ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const switchBusiness = (id: string) => {
    const next = businesses.find((b) => b.id === id);
    if (!next) return;
    localStorage.setItem("rv_business", id);
    setBusiness(next);
  };

  return (
    <BusinessContext.Provider value={{ loading, profile, business, businesses, impersonating, switchBusiness, refresh: load }}>
      {children}
    </BusinessContext.Provider>
  );
}
