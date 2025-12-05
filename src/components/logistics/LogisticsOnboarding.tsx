import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Truck, Warehouse, ArrowRight } from 'lucide-react';
import { VehicleForm } from './VehicleForm';
import { WarehouseForm } from './WarehouseForm';

interface LogisticsOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  onComplete: () => void;
}

export const LogisticsOnboarding = ({ open, onOpenChange, userId, onComplete }: LogisticsOnboardingProps) => {
  const [activeTab, setActiveTab] = useState<'vehicle' | 'warehouse'>('vehicle');
  const [vehicleAdded, setVehicleAdded] = useState(false);
  const [warehouseAdded, setWarehouseAdded] = useState(false);

  const handleVehicleSuccess = () => {
    setVehicleAdded(true);
  };

  const handleWarehouseSuccess = () => {
    setWarehouseAdded(true);
  };

  const handleContinue = () => {
    onComplete();
    onOpenChange(false);
  };

  const canContinue = vehicleAdded || warehouseAdded;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Complete Your Registration</DialogTitle>
          <DialogDescription>
            Add at least one vehicle or warehouse to start receiving transport and storage requests
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="vehicle" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Add Vehicle
              {vehicleAdded && <span className="ml-1 text-green-600">✓</span>}
            </TabsTrigger>
            <TabsTrigger value="warehouse" className="flex items-center gap-2">
              <Warehouse className="h-4 w-4" />
              Add Warehouse
              {warehouseAdded && <span className="ml-1 text-green-600">✓</span>}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="vehicle" className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-1">Register Your Vehicles</h4>
              <p className="text-sm text-muted-foreground">
                Add trucks, trailers, or other vehicles you operate for freight transport
              </p>
            </div>
            <VehicleForm
              userId={userId}
              onSuccess={handleVehicleSuccess}
            />
          </TabsContent>

          <TabsContent value="warehouse" className="mt-4">
            <div className="bg-muted/50 rounded-lg p-4 mb-4">
              <h4 className="font-medium mb-1">Register Your Warehouse</h4>
              <p className="text-sm text-muted-foreground">
                Add warehouses or storage spaces available for rent
              </p>
            </div>
            <WarehouseForm
              userId={userId}
              onSuccess={handleWarehouseSuccess}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-4 border-t mt-4">
          <p className="text-sm text-muted-foreground">
            {canContinue 
              ? 'You can add more assets later from your dashboard'
              : 'Add at least one vehicle or warehouse to continue'
            }
          </p>
          <Button 
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue to Dashboard
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
