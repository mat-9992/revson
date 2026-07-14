"use client";
import { Card, PageTitle } from "@revson/shared";
import { AdminShell } from "@/components/admin-shell";

export default function SupportPage() {
  return (
    <AdminShell>
      <PageTitle title="Support" desc="Tickets and owner requests." />
      <Card className="p-8 text-sm text-mute">
        Support inbox coming soon. For now, owners reach you at support@revson.services.
      </Card>
    </AdminShell>
  );
}
