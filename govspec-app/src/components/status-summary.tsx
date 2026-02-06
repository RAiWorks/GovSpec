import { Card, CardContent } from "@/components/ui/card";

interface Feature {
  status: string;
}

const STATUS_CONFIG = [
  { key: "draft", label: "Draft", color: "text-yellow-600", bg: "bg-yellow-50" },
  { key: "pending", label: "Pending", color: "text-blue-600", bg: "bg-blue-50" },
  { key: "approved", label: "Approved", color: "text-green-600", bg: "bg-green-50" },
  { key: "rejected", label: "Rejected", color: "text-red-600", bg: "bg-red-50" },
  { key: "completed", label: "Completed", color: "text-purple-600", bg: "bg-purple-50" },
];

export function StatusSummary({ features }: { features: Feature[] }) {
  const counts = STATUS_CONFIG.map((s) => ({
    ...s,
    count: features.filter((f) => f.status === s.key).length,
  }));

  return (
    <div className="grid grid-cols-5 gap-3">
      {counts.map((s) => (
        <Card key={s.key} className={`${s.bg} border-0`}>
          <CardContent className="p-4 text-center">
            <div className={`text-2xl font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
