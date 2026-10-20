import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type ProjectStatus } from "@/types/project";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<ProjectStatus, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  processing: "bg-blue-100 text-blue-800 hover:bg-blue-100",
  completed: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <Badge className={cn("font-medium", STATUS_STYLES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
