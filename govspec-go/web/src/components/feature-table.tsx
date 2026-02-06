import { Link } from 'react-router-dom';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge, PriorityBadge } from './status-badge';
import type { Feature } from '@/lib/api';

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
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
          {features.map((f) => (
            <TableRow key={f.id}>
              <TableCell className="font-mono font-medium">
                <Link to={`/features/${f.id}`} className="text-blue-600 hover:underline">{f.id}</Link>
              </TableCell>
              <TableCell>
                <Link to={`/features/${f.id}`} className="hover:underline">{f.name}</Link>
              </TableCell>
              <TableCell><StatusBadge status={f.status} /></TableCell>
              <TableCell><PriorityBadge priority={f.priority} /></TableCell>
              <TableCell className="font-mono text-sm text-muted-foreground">{f.dependsOn || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{fmtDate(f.requestedAt)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{fmtDate(f.approvedAt)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">{fmtDate(f.completedAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
