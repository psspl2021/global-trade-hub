import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Phone, Mail, Users, FileText, CheckSquare, Plus, Loader2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface LeadActivitiesProps {
  leadId: string;
  supplierId: string;
}

const activityTypes = [
  { value: 'call', label: 'Phone Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'note', label: 'Note', icon: FileText },
  { value: 'task', label: 'Task', icon: CheckSquare },
];

const activityColors: Record<string, string> = {
  call: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  email: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  meeting: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  note: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  task: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
};

export const LeadActivities = ({ leadId, supplierId }: LeadActivitiesProps) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    activity_type: 'call',
    subject: '',
    description: '',
    outcome: '',
    duration_minutes: '',
  });
  const { toast } = useToast();

  const fetchActivities = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('lead_activities')
      .select('*')
      .eq('lead_id', leadId)
      .order('activity_date', { ascending: false });

    if (error) console.error('Error fetching activities:', error);
    setActivities(data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (leadId) fetchActivities();
  }, [leadId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject.trim()) {
      toast({ title: 'Error', description: 'Subject is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from('lead_activities').insert({
      lead_id: leadId,
      supplier_id: supplierId,
      activity_type: formData.activity_type,
      subject: formData.subject,
      description: formData.description || null,
      outcome: formData.outcome || null,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
    });

    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: 'Failed to log activity', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Activity logged' });
      setFormOpen(false);
      setFormData({ activity_type: 'call', subject: '', description: '', outcome: '', duration_minutes: '' });
      fetchActivities();
    }
  };

  const getActivityIcon = (type: string) => {
    const activity = activityTypes.find((a) => a.value === type);
    const Icon = activity?.icon || FileText;
    return <Icon className="h-4 w-4" />;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm">Activity Timeline</h4>
        <Button size="sm" variant="outline" onClick={() => setFormOpen(true)}>
          <Plus className="h-3 w-3 mr-1" /> Log Activity
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : activities.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">No activities logged yet</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {activities.map((activity) => (
            <Card key={activity.id} className="border-l-4" style={{ borderLeftColor: 'hsl(var(--primary))' }}>
              <CardContent className="p-3">
                <div className="flex items-start gap-2">
                  <span className={`p-1.5 rounded ${activityColors[activity.activity_type]}`}>
                    {getActivityIcon(activity.activity_type)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{activity.subject}</p>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {format(new Date(activity.activity_date), 'dd MMM, HH:mm')}
                      </span>
                    </div>
                    {activity.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{activity.description}</p>
                    )}
                    {activity.outcome && (
                      <p className="text-xs mt-1">
                        <span className="font-medium">Outcome:</span> {activity.outcome}
                      </p>
                    )}
                    {activity.duration_minutes && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" /> {activity.duration_minutes} min
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Activity Type</Label>
              <Select
                value={formData.activity_type}
                onValueChange={(value) => setFormData({ ...formData, activity_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {activityTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <type.icon className="h-4 w-4" /> {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Subject *</Label>
              <Input
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief summary of the activity"
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details..."
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Outcome</Label>
                <Input
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  placeholder="Result of activity"
                />
              </div>
              <div>
                <Label>Duration (min)</Label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                  placeholder="15"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Log Activity
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
