import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';

export function CreateFeatureDialog({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', purpose: '', motivation: '', priority: 'normal', notes: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.purpose.trim()) {
      toast.error('Name and purpose are required');
      return;
    }
    setLoading(true);
    try {
      const feature = await api.features.create(form);
      toast.success(`Feature ${feature.id} "${feature.name}" created as draft`);
      setForm({ name: '', purpose: '', motivation: '', priority: 'normal', notes: '' });
      setOpen(false);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create feature');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-2" />New Feature</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>Create New Feature</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="text-sm font-medium">Feature Name</label>
            <Input id="name" placeholder="e.g. User Authentication" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label htmlFor="purpose" className="text-sm font-medium">Purpose</label>
            <Textarea id="purpose" placeholder="What problem does this feature solve?" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} rows={3} />
          </div>
          <div>
            <label htmlFor="motivation" className="text-sm font-medium">Motivation (optional)</label>
            <Textarea id="motivation" placeholder="Why is this feature needed?" value={form.motivation} onChange={(e) => setForm({ ...form, motivation: e.target.value })} rows={2} />
          </div>
          <div>
            <label htmlFor="priority" className="text-sm font-medium">Priority</label>
            <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
              <SelectTrigger id="priority"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="notes" className="text-sm font-medium">Notes (optional)</label>
            <Input id="notes" placeholder="Any additional notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Draft'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
