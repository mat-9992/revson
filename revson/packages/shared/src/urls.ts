export const APP_URLS = {
  marketing: process.env.NEXT_PUBLIC_MARKETING_URL || "http://localhost:3000",
  superAdmin: process.env.NEXT_PUBLIC_SUPER_ADMIN_URL || "http://localhost:3001",
  owner: process.env.NEXT_PUBLIC_OWNER_URL || "http://localhost:3002",
  employee: process.env.NEXT_PUBLIC_EMPLOYEE_URL || "http://localhost:3003"
};

export function portalForRole(role: string) {
  if (role === "super_admin") return APP_URLS.superAdmin;
  if (role === "owner") return APP_URLS.owner;
  if (role === "employee") return APP_URLS.employee;
  return APP_URLS.marketing;
}
