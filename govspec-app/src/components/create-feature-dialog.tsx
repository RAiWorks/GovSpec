"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateFeatureDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    purpose: "",
    motivation: "",
    priority: "normal",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.purpose.trim()) {
      toast.error("Name and purpose are required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/features", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create feature");
        return;
      }

      const feature = await res.json();
      toast.success(`Feature ${feature.id} "${feature.name}" created as draft`);
      setForm({ name: "", purpose: "", motivation: "", priority: "normal", notes: "" });
      setOpen(false);
      onCreated();
    } catch {
      toast.error("Failed to create feature");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Feature
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New Feature</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="feature-name" className="text-sm font-medium">
              Feature Name
            </label>
            <Input
              id="feature-name"
              placeholder="e.g. User Authentication"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="feature-purpose" className="text-sm font-medium">
              Purpose
            </label>
            <Textarea
              id="feature-purpose"
              placeholder="What problem does this feature solve?"
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="feature-motivation" className="text-sm font-medium">
              Motivation (optional)
            </label>
            <Textarea
              id="feature-motivation"
              placeholder="Why is this feature needed?"
              value={form.motivation}
              onChange={(e) => setForm({ ...form, motivation: e.target.value })}
              rows={2}
            />
          </div>
          <div>
            <label htmlFor="feature-priority" className="text-sm font-medium">
              Priority
            </label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger id="feature-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="feature-notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <Input
              id="feature-notes"
              placeholder="Any additional notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Draft"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
