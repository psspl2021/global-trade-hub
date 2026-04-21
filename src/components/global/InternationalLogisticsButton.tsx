/**
 * InternationalLogisticsButton — manual handoff to Global Fleet on international POs.
 * Pre-fills shipment details from the PO; buyer reviews + submits.
 */
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Plane, Ship, Truck, Globe2 } from 'lucide-react';
import { toast } from 'sonner';
import { IncotermsPicker } from './IncotermsPicker';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  purchaseOrderId: string;
  defaultOriginCountry?: string;
  defaultDestinationCountry?: string;
  defaultIncoterms?: string;
  defaultHsCodes?: string[];
  cargoDescription?: string;
  className?: string;
}

export function InternationalLogisticsButton({
  purchaseOrderId,
  defaultOriginCountry = '',
  defaultDestinationCountry = '',
  defaultIncoterms = '',
  defaultHsCodes = [],
  cargoDescription = '',
  className,
}: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [originCountry, setOriginCountry] = useState(defaultOriginCountry);
  const [originAddress, setOriginAddress] = useState('');
  const [destCountry, setDestCountry] = useState(defaultDestinationCountry);
  const [destAddress, setDestAddress] = useState('');
  const [incoterms, setIncoterms] = useState(defaultIncoterms);
  const [hsCodes, setHsCodes] = useState(defaultHsCodes.join(', '));
  const [weight, setWeight] = useState('');
  const [volume, setVolume] = useState('');
  const [cargo, setCargo] = useState(cargoDescription);
  const [mode, setMode] = useState('sea');
  const [readyDate, setReadyDate] = useState('');
  const [requiredBy, setRequiredBy] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    if (!user?.id) return;
    if (!originCountry || !destCountry) return toast.error('Origin and destination countries required');

    setSaving(true);
    try {
      const { error } = await supabase
        .from('international_logistics_requests')
        .insert({
          purchase_order_id: purchaseOrderId,
          buyer_id: user.id,
          origin_country: originCountry,
          origin_address: originAddress || null,
          destination_country: destCountry,
          destination_address: destAddress || null,
          incoterms: incoterms || null,
          hs_codes: hsCodes ? hsCodes.split(',').map((s) => s.trim()).filter(Boolean) : null,
          total_weight_kg: weight ? Number(weight) : null,
          total_volume_m3: volume ? Number(volume) : null,
          cargo_description: cargo || null,
          preferred_mode: mode,
          ready_date: readyDate || null,
          required_by: requiredBy || null,
          buyer_notes: notes || null,
          status: 'submitted',
        });
      if (error) throw error;
      toast.success('Logistics request submitted to Global Fleet partners');
      setOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className={className}>
        <Globe2 className="h-4 w-4 mr-2" />
        Request International Freight
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cross-Border Logistics — Global Fleet</DialogTitle>
            <DialogDescription>
              Pre-filled from your PO. Review and submit to receive freight quotes from verified international partners.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Route</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Origin Country *</Label>
                    <Input value={originCountry} onChange={(e) => setOriginCountry(e.target.value.toUpperCase())} placeholder="ISO code, e.g. IN" />
                  </div>
                  <div>
                    <Label>Destination Country *</Label>
                    <Input value={destCountry} onChange={(e) => setDestCountry(e.target.value.toUpperCase())} placeholder="ISO code, e.g. AE" />
                  </div>
                  <div>
                    <Label>Origin Address / Port</Label>
                    <Input value={originAddress} onChange={(e) => setOriginAddress(e.target.value)} />
                  </div>
                  <div>
                    <Label>Destination Address / Port</Label>
                    <Input value={destAddress} onChange={(e) => setDestAddress(e.target.value)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Cargo</h3>
                <Textarea value={cargo} onChange={(e) => setCargo(e.target.value)} rows={2} placeholder="Cargo description" />
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Weight (kg)</Label>
                    <Input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} />
                  </div>
                  <div>
                    <Label>Volume (m³)</Label>
                    <Input type="number" step="0.01" value={volume} onChange={(e) => setVolume(e.target.value)} />
                  </div>
                  <div>
                    <Label>Mode</Label>
                    <Select value={mode} onValueChange={setMode}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sea"><Ship className="h-3.5 w-3.5 inline mr-1" /> Sea</SelectItem>
                        <SelectItem value="air"><Plane className="h-3.5 w-3.5 inline mr-1" /> Air</SelectItem>
                        <SelectItem value="road"><Truck className="h-3.5 w-3.5 inline mr-1" /> Road</SelectItem>
                        <SelectItem value="multimodal">Multimodal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>HS Codes (comma-separated)</Label>
                  <Input value={hsCodes} onChange={(e) => setHsCodes(e.target.value)} placeholder="720839, 854290" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4 space-y-3">
                <h3 className="font-semibold text-sm">Terms & Schedule</h3>
                <IncotermsPicker value={incoterms} onChange={setIncoterms} />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Cargo Ready Date</Label>
                    <Input type="date" value={readyDate} onChange={(e) => setReadyDate(e.target.value)} />
                  </div>
                  <div>
                    <Label>Required By</Label>
                    <Input type="date" value={requiredBy} onChange={(e) => setRequiredBy(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Notes for Fleet Partners</Label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Submit to Global Fleet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
