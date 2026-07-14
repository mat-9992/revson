export type Role = "super_admin" | "owner" | "employee";
export type Subscription = "trial" | "starter" | "pro" | "business";
export type PayStatus = "pending" | "approved" | "paid";
export type EmployeeStatus = "active" | "invited" | "inactive";

export interface Business {
  id: string;
  name: string;
  type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  owner_name: string | null;
  ein: string | null;
  owner_user_id: string | null;
  brand_color: string;
  subscription: Subscription;
  mrr: number;
  created_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  business_id: string | null;
  employee_id: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  business_id: string;
  user_id: string | null;
  name: string;
  role: string | null;
  rate: number;
  phone: string | null;
  status: EmployeeStatus;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  business_id: string;
  file_name: string | null;
  file_url: string | null;
  uploaded_by: string | null;
  risk_score: number | null;
  summary: string | null;
  money: Record<string, string> | null;
  traps: Array<{ clause: string; where: string; why: string; severity: "high" | "medium" | "low" }> | null;
  dates: Record<string, string> | null;
  created_at: string;
}

export interface PayPeriod {
  id: string;
  business_id: string;
  employee_id: string;
  week_start: string;
  hours: Record<string, number> | null;
  total_hours: number;
  ot_hours: number;
  total_pay: number;
  status: PayStatus;
  created_at: string;
  employees?: { name: string } | null;
}

export interface Shift {
  id: string;
  business_id: string;
  employee_id: string;
  date: string;
  start_time: string | null;
  end_time: string | null;
  role: string | null;
  created_at: string;
  employees?: { name: string } | null;
}

export interface JobPost {
  id: string;
  business_id: string;
  title: string | null;
  pay_range: string | null;
  content: string | null;
  interview_questions: string[] | null;
  status: "draft" | "live";
  created_at: string;
}

export interface Review {
  id: string;
  business_id: string;
  original_text: string | null;
  stars: number | null;
  customer_name: string | null;
  response_text: string | null;
  short_response: string | null;
  internal_note: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  business_id: string;
  title: string;
  assigned_to: string | null;
  completed: boolean;
  created_at: string;
}

export const PLAN_MRR: Record<Subscription, number> = { trial: 0, starter: 49, pro: 149, business: 299 };
export const BUSINESS_TYPES = ["Barbershop", "Salon", "Auto Repair", "Cafe", "Restaurant", "Retail", "Other"];
export const EMPLOYEE_ROLES = ["Barber", "Stylist", "Front Desk", "Mechanic", "Barista", "Other"];
export const BRAND_COLORS = ["#4F46E5", "#0EA5E9", "#059669", "#D97706", "#DC2626", "#0F172A"];
