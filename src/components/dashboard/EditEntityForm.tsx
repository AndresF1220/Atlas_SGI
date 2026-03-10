'use client';

import { useActionState, useEffect, useRef, startTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { renameEntityAction } from '@/app/actions';
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

interface EditEntityFormProps {
  entityType: 'area' | 'process' | 'subprocess';
  entityId: string;
  parentId?: string;
  grandParentId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  initialData: {
    name: string;
  };
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Guardar
    </Button>
  );
}

export function EditEntityForm({
  entityType,
  entityId,
  parentId,
  grandParentId,
  isOpen,
  onOpenChange,
  children,
  initialData,
}: EditEntityFormProps) {
  const { toast } = useToast();
  const [state, formAction] = useActionState(renameEntityAction, { message: '', error: undefined });
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const typeLabels = {
    area: 'Área',
    process: 'Proceso',
    subprocess: 'Subproceso',
  };

  useEffect(() => {
    if (state.message && !state.error) {
      toast({ title: '¡Éxito!', description: state.message });
      onOpenChange(false);
    }
    if (state.error) {
      toast({ variant: 'destructive', title: 'Error', description: state.error });
    }
  }, [state, toast, onOpenChange]);

  useEffect(() => {
    if (isOpen && nameRef.current) {
      nameRef.current.value = initialData.name;
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.set('name', nameRef.current?.value || '');
    formData.set('entityType', entityType);
    formData.set('entityId', entityId);
    if (parentId) formData.set('parentId', parentId);
    if (grandParentId) formData.set('grandParentId', grandParentId);
    startTransition(() => (formAction as any)(formData));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renombrar {typeLabels[entityType]}</DialogTitle>
          <DialogDescription>
            Cambie el nombre de este elemento.
          </DialogDescription>
        </DialogHeader>
        <form ref={formRef} onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                ref={nameRef}
                defaultValue={initialData.name}
                minLength={3}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
