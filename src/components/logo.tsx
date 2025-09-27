import { BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center size-8 bg-primary rounded-lg text-primary-foreground', className)}>
      <BrainCircuit className="size-5" />
    </div>
  );
}
