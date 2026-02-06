"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "./status-badge";

interface AuditEntry {
  id: number;
  featureId: string;
  fromStatus: string | null;
  toStatus: string;
  changedBy: string;
  reason: string | null;
  createdAt: string;
  feature: { name: string };
}

export function AuditLog({ featureId }: { featureId?: string }) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const url = featureId ? `/api/audit?featureId=${featureId}` : "/api/audit";
    fetch(url)
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [featureId]);

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading audit log...</div>;
  }

  if (logs.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No audit entries yet.</div>;
  }

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Feature</TableHead>
            {!featureId && <TableHead>Name</TableHead>}
            <TableHead className="w-24">From</TableHead>
            <TableHead className="w-8">→</TableHead>
            <TableHead className="w-24">To</TableHead>
            <TableHead>Changed By</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="w-36">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono">{log.featureId}</TableCell>
              {!featureId && (
                <TableCell>{log.feature?.name || "—"}</TableCell>
              )}
              <TableCell>
                {log.fromStatus ? <StatusBadge status={log.fromStatus} /> : "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">→</TableCell>
              <TableCell>
                <StatusBadge status={log.toStatus} />
              </TableCell>
              <TableCell className="text-sm">{log.changedBy}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {log.reason || "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(log.createdAt).toLocaleString()}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
