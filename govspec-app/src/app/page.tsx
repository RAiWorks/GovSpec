"use client";

import { useEffect, useState, useCallback } from "react";
import { Header } from "@/components/header";
import { FeatureTable } from "@/components/feature-table";
import { StatusSummary } from "@/components/status-summary";
import { CreateFeatureDialog } from "@/components/create-feature-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuditLog } from "@/components/audit-log";

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
}

export default function Dashboard() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFeatures = useCallback(async () => {
    try {
      const res = await fetch("/api/features");
      const data = await res.json();
      setFeatures(data);
    } catch {
      console.error("Failed to fetch features");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeatures();
  }, [fetchFeatures]);

  return (
    <div className="min-h-screen">
      <Header onSync={fetchFeatures} />

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground text-sm">
              Manage your GovSpec features
            </p>
          </div>
          <CreateFeatureDialog onCreated={fetchFeatures} />
        </div>

        <StatusSummary features={features} />

        <Tabs defaultValue="features">
          <TabsList>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="audit">Audit Log</TabsTrigger>
          </TabsList>

          <TabsContent value="features" className="mt-4">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading...</div>
            ) : (
              <FeatureTable features={features} />
            )}
          </TabsContent>

          <TabsContent value="audit" className="mt-4">
            <AuditLog />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
