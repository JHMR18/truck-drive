import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-status-available text-white';
      case 'deployed':
      case 'in_progress':
        return 'bg-status-deployed text-white';
      case 'maintenance':
        return 'bg-status-maintenance text-white';
      case 'critical':
        return 'bg-status-critical text-white';
      case 'reported':
        return 'bg-warning text-white';
      case 'resolved':
        return 'bg-status-available text-white';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Badge className={cn(getStatusVariant(status), className)}>
      {status.replace('_', ' ').toUpperCase()}
    </Badge>
  );
};
