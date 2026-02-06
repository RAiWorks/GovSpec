"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { StatusBadge, PriorityBadge } from "@/components/status-badge";
import { AuditLog } from "@/components/audit-log";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, CheckCircle, XCircle, Clock, RotateCcw, FileText } from "lucide-react";
import { toast } from "sonner";
import { MarkdownPreview } from "@/components/markdown-preview";

interface Feature {
  id: string;
  name: string;
  status: string;
  priority: string | null;
  dependsOn: string | null;
  requestedBy: string;
  requestedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  completedAt: string | null;
  notes: string | null;
}

interface FeatureDocument {
  filename: string;
  featureId: string;
  featureName: string;
  status: string;
  implementation: string;
  content: string;
}

const TRANSITION_ACTIONS: Record<string, Array<{ to: string; label: string; icon: React.ReactNode; variant: "default" | "destructive" | "outline" }>> = {
  draft: [
    { to: "pending", label: "Move to Pending", icon: <Clock className="h-4 w-4 mr-2" />, variant: "outline" },
    { to: "rejected", label: "Reject", icon: <XCircle className="h-4 w-4 mr-2" />, variant: "destructive" },
  ],
  pending: [
    { to: "approved", label: "Approve", icon: <CheckCircle className="h-4 w-4 mr-2" />, variant: "default" },
    { to: "draft", label: "Send Back to Draft", icon: <RotateCcw className="h-4 w-4 mr-2" />, variant: "outline" },
    { to: "rejected", label: "Reject", icon: <XCircle className="h-4 w-4 mr-2" />, variant: "destructive" },
  ],
  approved: [
    { to: "completed", label: "Mark Complete", icon: <CheckCircle className="h-4 w-4 mr-2" />, variant: "default" },
    { to: "rejected", label: "Revoke (Reject)", icon: <XCircle className="h-4 w-4 mr-2" />, variant: "destructive" },
  ],
  rejected: [
    { to: "draft", label: "Reopen as Draft", icon: <RotateCcw className="h-4 w-4 mr-2" />, variant: "outline" },
  ],
  completed: [],
};

export default function FeatureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [feature, setFeature] = useState<Feature | null>(null);
  const [document, setDocument] = useState<FeatureDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const fetchFeature = useCallback(async () => {
    try {
      const res = await fetch(`/api/features/${id}`);
      if (!res.ok) {
        router.push("/");
        return;
      }
      const data = await res.json();
      setFeature(data.feature);
      setDocument(data.document);
    } catch {
      router.push("/");
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchFeature();
  }, [fetchFeature]);

  const handleStatusChange = async (newStatus: string, reason?: string) => {
    if (newStatus === "rejected" && !reason) {
      setPendingAction(newStatus);
      setRejectDialogOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/features/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newStatus, reason }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to update status");
        return;
      }

      toast.success(`Feature ${id} moved to ${newStatus}`);
      fetchFeature();
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setRejectDialogOpen(false);
    handleStatusChange(pendingAction || "rejected", rejectReason);
    setRejectReason("");
    setPendingAction(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!feature) return null;

  const actions = TRANSITION_ACTIONS[feature.status] || [];

  return (
    <div className="min-h-screen">
      <Header onSync={fetchFeature} />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <Button variant="ghost" onClick={() => router.push("/")} className="mb-2">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        {/* Feature Header */}
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

          {/* Action Buttons */}
          {actions.length > 0 && (
            <div className="flex gap-2">
              {actions.map((action) => (
                <Button
                  key={action.to}
                  variant={action.variant}
                  onClick={() => handleStatusChange(action.to)}
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {/* Feature Info Cards */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Requested By</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{feature.requestedBy}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Requested At</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {new Date(feature.requestedAt).toLocaleDateString()}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Approved At</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              {feature.approvedAt ? new Date(feature.approvedAt).toLocaleDateString() : "—"}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Dependencies</CardTitle>
            </CardHeader>
            <CardContent className="text-sm font-mono">
              {feature.dependsOn || "None"}
            </CardContent>
          </Card>
        </div>

        {/* Tabs: Document & Audit */}
        <Tabs defaultValue="document">
          <TabsList>
            <TabsTrigger value="document">
              <FileText className="h-4 w-4 mr-2" />
              Document
            </TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="document" className="mt-4">
            {document ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-mono">{document.filename}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[600px]">
                    <MarkdownPreview content={document.content} />
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No feature document found.
              </div>
            )}
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <AuditLog featureId={id} />
          </TabsContent>
        </Tabs>
      </main>

      {/* Reject Reason Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejection Reason</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for rejecting this feature. This will be recorded in the audit log and feature document.
            </p>
            <Textarea
              placeholder="Why is this feature being rejected?"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleRejectConfirm}>
                Confirm Rejection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
