import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/header';
import { StatusBadge, PriorityBadge } from '@/components/status-badge';
import { AuditLog } from '@/components/audit-log';
import { MarkdownPreview } from '@/components/markdown-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, CheckCircle, XCircle, Clock, RotateCcw, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import type { Feature, FeatureDocument } from '@/lib/api';

const TRANSITION_ACTIONS: Record<string, Array<{ to: string; label: string; icon: React.ReactNode; variant: 'default' | 'destructive' | 'outline' }>> = {
  draft: [
    { to: 'pending', label: 'Move to Pending', icon: <Clock className="h-4 w-4 mr-2" />, variant: 'outline' },
    { to: 'rejected', label: 'Reject', icon: <XCircle className="h-4 w-4 mr-2" />, variant: 'destructive' },
  ],
  pending: [
    { to: 'approved', label: 'Approve', icon: <CheckCircle className="h-4 w-4 mr-2" />, variant: 'default' },
    { to: 'draft', label: 'Send Back to Draft', icon: <RotateCcw className="h-4 w-4 mr-2" />, variant: 'outline' },
    { to: 'rejected', label: 'Reject', icon: <XCircle className="h-4 w-4 mr-2" />, variant: 'destructive' },
  ],
  approved: [
    { to: 'completed', label: 'Mark Complete', icon: <CheckCircle className="h-4 w-4 mr-2" />, variant: 'default' },
    { to: 'rejected', label: 'Revoke (Reject)', icon: <XCircle className="h-4 w-4 mr-2" />, variant: 'destructive' },
  ],
  rejected: [
    { to: 'draft', label: 'Reopen as Draft', icon: <RotateCcw className="h-4 w-4 mr-2" />, variant: 'outline' },
  ],
  completed: [],
};

export default function FeatureDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [document, setDocument] = useState<FeatureDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const fetchFeature = useCallback(async () => {
    if (!id) return;
    try {
      const data = await api.features.get(id);
      setFeature(data.feature);
      setDocument(data.document);
    } catch {
      navigate('/');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchFeature(); }, [fetchFeature]);

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    if (!id) return;
    if (newStatus === 'rejected' && !reason) {
      setPendingAction(newStatus);
      setRejectDialogOpen(true);
      return;
    }
    try {
      await api.features.updateStatus(id, newStatus, reason);
      toast.success(`Feature ${id} moved to ${newStatus}`);
      fetchFeature();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; }
    setRejectDialogOpen(false);
    handleStatusChange(pendingAction || 'rejected', rejectReason);
    setRejectReason('');
    setPendingAction(null);
  };

  if (loading) {
    return <div className="min-h-screen"><Header /><div className="text-center py-12 text-muted-foreground">Loading...</div></div>;
  }
  if (!feature) return null;

  const actions = TRANSITION_ACTIONS[feature.status] || [];

  return (
    <div className="min-h-screen">
      <Header onSync={fetchFeature} />
      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />Back to Dashboard
        </Button>

        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="font-mono text-lg text-muted-foreground">#{feature.id}</span>
              <h2 className="text-2xl font-bold">{feature.name}</h2>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={feature.status} />
              <PriorityBadge priority={feature.priority} />
            </div>
          </div>
          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action) => (
                <Button key={action.to} variant={action.variant} onClick={() => handleStatusChange(action.to)}>
                  {action.icon}{action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Requested By', value: feature.requestedBy },
            { label: 'Requested At', value: feature.requestedAt ? new Date(feature.requestedAt).toLocaleDateString() : '—' },
            { label: 'Approved At', value: feature.approvedAt ? new Date(feature.approvedAt).toLocaleDateString() : '—' },
            { label: 'Dependencies', value: feature.dependsOn || 'None' },
          ].map((item) => (
            <Card key={item.label}>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">{item.label}</CardTitle></CardHeader>
              <CardContent className="text-sm">{item.value}</CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="document">
          <TabsList>
            <TabsTrigger value="document"><FileText className="h-4 w-4 mr-2" />Document</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>
          <TabsContent value="document" className="mt-4">
            {document ? (
              <Card>
                <CardHeader><CardTitle className="text-sm font-mono">{document.filename}</CardTitle></CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <MarkdownPreview content={document.content} />
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">No feature document found.</div>
            )}
          </TabsContent>
          <TabsContent value="audit" className="mt-4">
            <AuditLog featureId={id} />
          </TabsContent>
        </Tabs>
      </main>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Rejection Reason</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Please provide a reason for rejecting this feature.</p>
            <Textarea placeholder="Why is this feature being rejected?" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
              <Button variant="destructive" onClick={handleRejectConfirm}>Confirm Rejection</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
