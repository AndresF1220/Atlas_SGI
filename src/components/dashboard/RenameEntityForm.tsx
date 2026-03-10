'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { renameEntityAction } from '@/app/actions';

interface RenameEntityFormProps {
  entityId: string;
  entityType: 'process' | 'subprocess';
  currentName: string;
  parentId: string;
  grandParentId?: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Renombrar
    </Button>
  );
}

export function RenameEntityForm({
  entityId,
  entityType,
  currentName,
  parentId,
  grandParentId,
  isOpen,
  onOpenChange,
}: RenameEntityFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [state, formAction] = useActionState(renameEntityAction, { message: '', error: undefined });
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!isOpen) {
        formRef.current?.reset();
    }
  }, [isOpen]);

  useEffect(() => {
    if (state.message && !state.error) {
      toast({ title: '¡Éxito!', description: state.message });
      onOpenChange(false);
      router.refresh();
    }
    if (state.error) {
      toast({ variant: 'destructive', title: 'Error al renombrar', description: state.error });
    }
  }, [state, toast, onOpenChange, router]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Renombrar {entityType === 'process' ? 'Proceso' : 'Subproceso'}</DialogTitle>
          <DialogDescription>
            Estás a punto de cambiar el nombre de "{currentName}".
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} ref={formRef}>
            <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                    <Label htmlFor="name">Nuevo nombre</Label>
                    <Input id="name" name="name" defaultValue={currentName} required />
                </div>
                
                <input type="hidden" name="entityId" value={entityId} />
                <input type="hidden" name="entityType" value={entityType} />
                <input type="hidden" name="parentId" value={parentId} />
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
