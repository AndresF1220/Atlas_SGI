'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore } from '@/firebase';
import { doc, setDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle } from 'lucide-react';
import LogoUploader from './LogoUploader';
import { useAuth } from '@/lib/auth';

interface CaracterizacionEditorProps {
  entityId: string;
  entityType: 'area' | 'proceso' | 'subproceso';
  onSaved: () => void;
  initialData: {
    objetivo?: string;
    alcance?: string;
    responsable?: string;
    codigo?: string;
    version?: string;
    tipoProceso?: string;
    logoUrl?: string;
  };
  showAddChildButton?: boolean;
  onAddChildClick?: () => void;
}

const formSchema = z.object({
  objetivo: z.string().optional(),
  alcance: z.string().optional(),
  responsable: z.string().optional(),
  codigo: z.string().optional(),
  version: z.string().optional(),
  tipoProceso: z.string().nullable().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  const { objetivo, alcance } = data;
  if (objetivo && objetivo.length > 0 && objetivo.length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['objetivo'], message: 'El objetivo debe tener al menos 10 caracteres.' });
  }
  if (alcance && alcance.length > 0 && alcance.length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['alcance'], message: 'El alcance debe tener al menos 10 caracteres.' });
  }
});

type CaracterizacionFormValues = z.infer<typeof formSchema>;

const getSafeInitialData = (initialData: CaracterizacionEditorProps['initialData']) => ({
    objetivo: initialData.objetivo || '',
    alcance: initialData.alcance || '',
    responsable: initialData.responsable || '',
    codigo: initialData.codigo || '',
    version: initialData.version || '',
    tipoProceso: initialData.tipoProceso || null,
    logoUrl: initialData.logoUrl || '',
});

export default function CaracterizacionEditor({ entityId, entityType, onSaved, initialData, showAddChildButton, onAddChildClick }: CaracterizacionEditorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { userRole } = useAuth();
  
  let caracterizacionId: string;
  switch (entityType) {
      case 'area': caracterizacionId = `area-${entityId}`; break;
      case 'proceso': caracterizacionId = `process-${entityId}`; break;
      case 'subproceso': caracterizacionId = `subprocess-${entityId}`; break;
      default: throw new Error('Invalid entity type for caracterizacion');
  }

  const form = useForm<CaracterizacionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getSafeInitialData(initialData),
  });

  const { handleSubmit, reset, setValue, formState: { isSubmitting } } = form;

  useEffect(() => {
    reset(getSafeInitialData(initialData));
  }, [initialData, reset]);

  const onSubmit = async (data: CaracterizacionFormValues) => {
    if (!firestore) {
      toast({ variant: 'destructive', title: 'Error de Conexión' });
      return;
    }
    
    const docRef = doc(firestore, 'caracterizaciones', caracterizacionId);
    const allFieldsEmpty = Object.values(data).every(val => !val);

    try {
      if (allFieldsEmpty) {
        await deleteDoc(docRef);
        toast({ title: '¡Caracterización Eliminada!' });
      } else {
        await setDoc(docRef, { ...data, fechaActualizacion: serverTimestamp() }, { merge: true });
        toast({ title: '¡Guardado!' });
      }
      onSaved();
    } catch (error) {
      console.error("Error guardando caracterización:", error);
      toast({ variant: 'destructive', title: 'Error al Guardar' });
    }
  };

  const childEntityName = entityType === 'area' ? 'Proceso' : 'Subproceso';

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {userRole === 'superadmin' && (
            <div className="space-y-2">
                <FormLabel>Logo de la Organización</FormLabel>
                <LogoUploader onUploadComplete={(url) => setValue('logoUrl', url, { shouldValidate: true, shouldDirty: true })} />
                <FormField control={form.control} name="logoUrl" render={({ field }) => (<FormItem>{field.value && <img src={field.value} alt="Logo Preview" className="h-16 mt-2"/>}<FormMessage /></FormItem>)} />
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField control={form.control} name="codigo" render={({ field }) => (<FormItem><FormLabel>Código</FormLabel><FormControl><Input placeholder="Ej: GCA" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="version" render={({ field }) => (<FormItem><FormLabel>Versión</FormLabel><FormControl><Input placeholder="Ej: 01" {...field} /></FormControl><FormMessage /></FormItem>)} />
        </div>
        <FormField
          control={form.control}
          name="tipoProceso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Proceso</FormLabel>
              <Select 
                onValueChange={(value) => field.onChange(value === '__NONE__' ? null : value)}
                value={field.value || ''}
              >
                <FormControl><SelectTrigger><SelectValue placeholder="— Sin tipo —" /></SelectTrigger></FormControl>
                <SelectContent>
                  <SelectItem value="__NONE__">— Sin tipo —</SelectItem>
                  <SelectItem value="Estratégico">Estratégico</SelectItem>
                  <SelectItem value="Misional">Misional</SelectItem>
                  <SelectItem value="Apoyo">Apoyo</SelectItem>
                  <SelectItem value="Evaluación">Evaluación</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField control={form.control} name="objetivo" render={({ field }) => (<FormItem><FormLabel>Objetivo</FormLabel><FormControl><Textarea placeholder="Defina el propósito fundamental..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="alcance" render={({ field }) => (<FormItem><FormLabel>Alcance</FormLabel><FormControl><Textarea placeholder="Describa los límites y el ámbito de aplicación..." {...field} rows={4} /></FormControl><FormMessage /></FormItem>)} />
        <FormField control={form.control} name="responsable" render={({ field }) => (<FormItem><FormLabel>Responsable</FormLabel><FormControl><Input placeholder="Cargo o rol responsable" {...field} /></FormControl><FormMessage /></FormItem>)} />
        
        <div className="flex justify-between items-center pt-6 mt-6 border-t">
            <div>
                {showAddChildButton && (
                    <Button type="button" variant="secondary" onClick={onAddChildClick} disabled={isSubmitting}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        {`Agregar ${childEntityName}`}
                    </Button>
                )}
            </div>
            <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={onSaved} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Guardar Cambios
                </Button>
            </div>
        </div>
      </form>
    </Form>
  );
}
