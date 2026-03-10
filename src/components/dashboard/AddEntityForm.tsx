
'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { createEntityAction } from '@/app/actions';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AddEntityFormProps {
  entityType: 'area' | 'process' | 'subprocess';
  parentId?: string;
  grandParentId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Crear
    </Button>
  );
}

export function AddEntityForm({
  entityType,
  parentId,
  grandParentId,
  isOpen,
  onOpenChange,
  children,
}: AddEntityFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(createEntityAction, { message: '', error: undefined });
  const formRef = useRef<HTMLFormElement>(null);
  
  const typeLabels = {
    area: { title: 'Área', description: 'un nuevo macroproceso en el mapa.' },
    process: { title: 'Proceso', description: 'un proceso al área actual.' },
    subprocess: { title: 'Subproceso', description: 'un subproceso al proceso actual.' },
  };

  const labels = typeLabels[entityType];
  const title = `Crear ${labels.title}`;
  const description = `Escriba un nombre para crear ${labels.description} La caracterización se podrá añadir más tarde.`;

  useEffect(() => {
    if (state.message && !state.error) {
        toast({
            title: '¡Éxito!',
            description: state.message,
        });
        onOpenChange(false);
        formRef.current?.reset();
    }
    if (state.error) {
        toast({
            variant: 'destructive',
            title: `Error al crear`,
            description: state.error,
        });
    }
  }, [state, toast, onOpenChange]);

  useEffect(() => {
    if (!isOpen) {
      formRef.current?.reset();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" name="name" placeholder={`Nombre del ${labels.title}`} required />
                </div>
                
                <input type="hidden" name="entityType" value={entityType} />
                {parentId && <input type="hidden" name="parentId" value={parentId} />}
                {grandParentId && <input type="hidden" name="grandParentId" value={grandParentId} />}
            </div>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
