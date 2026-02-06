"use client";

import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, PriorityBadge } from "./status-badge";

interface Feature {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dependsOn: string | null;
  requestedBy: string;
  requestedAt: string;
  approvedAt: string | null;
  completedAt: string | null;
}

export function FeatureTable({ features }: { features: Feature[] }) {
  if (features.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg">No features yet</p>
        <p className="text-sm mt-1">Create your first feature to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white dark:bg-zinc-900">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead className="w-24">Status</TableHead>
            <TableHead className="w-24">Priority</TableHead>
            <TableHead className="w-28">Depends On</TableHead>
            <TableHead className="w-28">Requested</TableHead>
            <TableHead className="w-28">Approved</TableHead>
            <TableHead className="w-28">Completed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {features.map((feature) => (
            <TableRow key={feature.id}>
              <TableCell className="font-mono font-medium">
                <Link
                  href={`/features/${feature.id}`}
                  className="text-blue-600 hover:underline"
                >
                  {feature.id}
                </Link>
              </TableCell>
              <TableCell>
                <Link
                  href={`/features/${feature.id}`}
                  className="hover:underline"
                >
                  {feature.name}
                </Link>
              </TableCell>
              <TableCell>
                <StatusBadge status={feature.status} />
              </TableCell>
              <TableCell>
                <PriorityBadge priority={feature.priority} />
              </TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">
                {feature.dependsOn || "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {feature.requestedAt ? new Date(feature.requestedAt).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {feature.approvedAt ? new Date(feature.approvedAt).toLocaleDateString() : "—"}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {feature.completedAt ? new Date(feature.completedAt).toLocaleDateString() : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
