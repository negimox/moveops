import { Truck, UserCircle, BadgeCheck, XCircle, Phone } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

type VehicleDriverPopoverProps = {
  trip: any
}

export default function VehicleDriverPopover({ trip }: VehicleDriverPopoverProps) {
  return (
    <div className="space-y-4 min-w-[250px]">
      <div className="space-y-2">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <Truck className="w-4 h-4 text-primary" />
          Vehicle Details
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-muted-foreground">Registration</div>
          <div className="font-medium text-right">{trip.vehicle_reg}</div>
          <div className="text-muted-foreground">Type</div>
          <div className="font-medium text-right capitalize">{trip.vehicle_type}</div>
          <div className="text-muted-foreground">Capacity</div>
          <div className="font-medium text-right">{trip.vehicle_capacity} kg</div>
          <div className="text-muted-foreground">Cost per km</div>
          <div className="font-medium text-right">₹{trip.avg_cost_per_km}</div>
        </div>
      </div>
      
      <hr className="border-border" />
      
      <div className="space-y-2">
        <h4 className="font-medium flex items-center gap-2 text-sm">
          <UserCircle className="w-4 h-4 text-amber-500" />
          Driver Details
        </h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="text-muted-foreground">Name</div>
          <div className="font-medium text-right">{trip.driver_name}</div>
          <div className="text-muted-foreground">Phone</div>
          <div className="font-medium text-right flex items-center justify-end gap-1">
            <Phone className="w-3 h-3 text-muted-foreground" />
            {trip.driver_phone || 'N/A'}
          </div>
          <div className="text-muted-foreground">Verification</div>
          <div className="text-right">
            {trip.driver_license_verified ? (
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0">
                <BadgeCheck className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            ) : (
              <Badge variant="outline" className="text-destructive border-destructive/20 bg-destructive/10 px-1.5 py-0">
                <XCircle className="w-3 h-3 mr-1" />
                Unverified
              </Badge>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
