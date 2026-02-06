import { Badge } from '@/components/ui/badge';

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  pending: 'bg-blue-100 text-blue-800 border-blue-300',
  approved: 'bg-green-100 text-green-800 border-green-300',
  rejected: 'bg-red-100 text-red-800 border-red-300',
  completed: 'bg-purple-100 text-purple-800 border-purple-300',
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-red-50 text-red-700 border-red-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  normal: 'bg-zinc-50 text-zinc-700 border-zinc-200',
  low: 'bg-zinc-50 text-zinc-500 border-zinc-200',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={STATUS_STYLES[status] || ''}>
      {status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string | null }) {
  if (!priority) return null;
  return (
    <Badge variant="outline" className={PRIORITY_STYLES[priority] || ''}>
      {priority}
    </Badge>
  );
}
