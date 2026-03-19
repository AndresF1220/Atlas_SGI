
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { MoreVertical, Edit, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { deleteEntityAction } from '@/app/actions';
import { RenameEntityForm } from './RenameEntityForm';

interface EntityOptionsDropdownProps {
  entityId: string;
  entityName: string;
  entityType: 'area' | 'process' | 'subprocess';
  parentId?: string;
  grandParentId?: string;
  redirectOnDelete?: string;
}

export function EntityOptionsDropdown({
  entityId,
  entityName,
  entityType,
  parentId,
  grandParentId,
  redirectOnDelete,
}: EntityOptionsDropdownProps) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const router = useRouter();

  const getDeleteMessage = () => {
    switch (entityType) {
      case 'process':
        return `Vas a eliminar "${entityName}". Esta acción no se puede deshacer. Todos los subprocesos y documentos asociados también serán eliminados.`;
      case 'subprocess':
        return `Vas a eliminar "${entityName}". Esta acción no se puede deshacer.`;
      default:
        return `Vas a eliminar "${entityName}". Esta acción no se puede deshacer.`;
    }
  };
  
  const handleRenameClick = (e: Event) => {
    e.preventDefault();
    setIsRenaming(true);
  }
  
  const handleDeleteClick = (e: Event) => {
    e.preventDefault();
    setIsDeleting(true);
  }

  const handleDeleteConfirm = async () => {
    startTransition(async () => {
      
      const formData = new FormData();
      formData.append('entityId', entityId);
      formData.append('entityType', entityType);
      if (parentId) formData.append('parentId', parentId);
      if (grandParentId) formData.append('grandParentId', grandParentId);

      const result = await deleteEntityAction(null, formData);

      if (result.error) {
        toast({
          variant: 'destructive',
          title: 'Error al Eliminar',
          description: result.error,
        });
      } else {
        toast({
          title: '¡Éxito!',
          description: result.message,
        });
        if (redirectOnDelete) {
          router.push(redirectOnDelete);
        } else {
          router.refresh(); 
        }
      }
      setIsDeleting(false);
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); }}>
            <MoreVertical className="h-4 w-4" />
            <span className="sr-only">Abrir menú</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => { e.stopPropagation(); }}>
          <DropdownMenuLabel>Opciones</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleRenameClick}>
            <Edit className="mr-2 h-4 w-4" />
            <span>Renombrar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleDeleteClick} className="text-destructive focus:text-destructive focus:bg-destructive/10">
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Eliminar</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameEntityForm
        entityType={entityType}
        entityId={entityId}
        currentName={entityName}
        parentId={parentId}
        grandParentId={grandParentId}
        isOpen={isRenaming}
        onOpenChange={setIsRenaming}
      />
      
      <AlertDialog open={isDeleting} onOpenChange={setIsDeleting}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro de eliminar este elemento?</AlertDialogTitle>
            <AlertDialogDescription>
              {getDeleteMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
                 <Button type="button" variant="ghost" disabled={isPending} onClick={() => setIsDeleting(false)}>Cancelar</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button onClick={handleDeleteConfirm} variant="destructive" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Continuar
                </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
