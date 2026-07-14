"use client";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { supabaseBrowser, type Business, type Employee, type Profile } from "@revson/shared";

interface Ctx {
  loading: boolean;
  profile: Profile | null;
  employee: Employee | null;
  business: Business | null;
  refresh: () => Promise<void>;
}

const EmployeeContext = createContext<Ctx>({
  loading: true, profile: null, employee: null, business: null, refresh: async () => {}
});

export const useEmployee = () => useContext(EmployeeContext);

export function EmployeeProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);

  const load = useCallback(async () => {
    const sb = supabaseBrowser();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: prof } = await sb.from("profiles").select("*").eq("id", user.id).single();
    if (!prof) { setLoading(false); return; }
    setProfile(prof as Profile);

    if (prof.employee_id) {
      const { data: emp } = await sb.from("employees").select("*").eq("id", prof.employee_id).single();
      if (emp) setEmployee(emp as Employee);
    }
    if (prof.business_id) {
      const { data: biz } = await sb.from("businesses").select("*").eq("id", prof.business_id).single();
      if (biz) setBusiness(biz as Business);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <EmployeeContext.Provider value={{ loading, profile, employee, business, refresh: load }}>
      {children}
    </EmployeeContext.Provider>
  );
}
