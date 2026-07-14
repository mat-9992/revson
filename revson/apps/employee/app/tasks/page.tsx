"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser, Card, EmptyState, Skeleton, PageTitle, toast, type Task } from "@revson/shared";
import { CheckSquare } from "lucide-react";
import { EmployeeShell } from "@/components/employee-shell";
import { useEmployee } from "@/components/employee-provider";

function TasksInner() {
  const { employee, business } = useEmployee();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    if (!employee || !business) return;
    (async () => {
      const { data } = await supabaseBrowser()
        .from("tasks")
        .select("*")
        .eq("business_id", business.id)
        .or(`assigned_to.eq.${employee.id},assigned_to.is.null`)
        .order("completed", { ascending: true })
        .order("created_at", { ascending: true });
      setTasks((data as Task[]) ?? []);
      setLoading(false);
    })();
  }, [employee, business]);

  if (!employee) return null;

  async function toggle(task: Task) {
    const next = !task.completed;
    setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, completed: next } : x)));
    const { error } = await supabaseBrowser().from("tasks").update({ completed: next }).eq("id", task.id);
    if (error) {
      setTasks((t) => t.map((x) => (x.id === task.id ? { ...x, completed: !next } : x)));
      return toast.error(error.message);
    }
    toast.success(next ? "Task done." : "Marked not done.");
  }

  const open = tasks.filter((t) => !t.completed).length;

  return (
    <>
      <PageTitle title="Tasks" desc={tasks.length ? `${open} open · ${tasks.length - open} done` : "Your to-dos at the shop."} />

      {loading ? (
        <Skeleton className="h-64" />
      ) : tasks.length === 0 ? (
        <EmptyState icon={CheckSquare} title="No tasks right now" desc="Tasks your manager assigns to you or the whole team will appear here." />
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Card key={t.id} className="flex items-center gap-3 p-4">
              <input
                type="checkbox"
                checked={t.completed}
                onChange={() => toggle(t)}
                className="h-5 w-5 rounded border-line text-accent"
              />
              <div className="flex-1">
                <div className={`text-sm ${t.completed ? "text-mute line-through" : "font-medium text-ink"}`}>{t.title}</div>
                {t.assigned_to == null && <div className="text-xs text-mute">Everyone</div>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

export default function TasksPage() {
  return (
    <EmployeeShell>
      <TasksInner />
    </EmployeeShell>
  );
}
