"use client";
import { useEffect, useState } from "react";
import {
  supabaseBrowser, fmtDate, RiskBadge, Card, EmptyState, Skeleton, PageTitle, type DocumentRow
} from "@revson/shared";
import { FileText, ExternalLink } from "lucide-react";
import { EmployeeShell } from "@/components/employee-shell";
import { useEmployee } from "@/components/employee-provider";

function DocumentsInner() {
  const { business } = useEmployee();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<DocumentRow[]>([]);

  useEffect(() => {
    if (!business) return;
    (async () => {
      const { data } = await supabaseBrowser()
        .from("documents").select("*").eq("business_id", business.id).order("created_at", { ascending: false });
      setDocs((data as DocumentRow[]) ?? []);
      setLoading(false);
    })();
  }, [business]);

  return (
    <>
      <PageTitle title="My Documents" desc="Shared documents from your workplace." />

      {loading ? (
        <Skeleton className="h-64" />
      ) : docs.length === 0 ? (
        <EmptyState icon={FileText} title="No documents yet" desc="Documents your manager shares with the shop will show up here." />
      ) : (
        <div className="space-y-2">
          {docs.map((d) => (
            <Card key={d.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cream text-accent"><FileText size={18} /></span>
                <div>
                  <div className="text-sm font-medium text-ink">{d.file_name ?? "Document"}</div>
                  <div className="text-xs text-mute">Added {fmtDate(d.created_at)}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {d.risk_score != null && <RiskBadge score={d.risk_score} />}
                {d.file_url && (
                  <a href={d.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-accent hover:underline">
                    Open <ExternalLink size={14} />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function DocumentsPage() {
  return (
    <EmployeeShell>
      <DocumentsInner />
    </EmployeeShell>
  );
}
