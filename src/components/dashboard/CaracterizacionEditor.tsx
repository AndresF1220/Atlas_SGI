
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
import { Loader2 } from 'lucide-react';
import LogoUploader from './LogoUploader';
import { useAuth } from '@/lib/auth';


interface CaracterizacionEditorProps {
  entityId: string;
  entityType: 'area' | 'process' | 'subprocess' | 'proceso' | 'subproceso';
  onSaved: () => void;
  initialData: {
    objetivo?: string;
    alcance?: string;
    responsable?: string;
    codigo?: string;
    version?: string;
    tipoProceso?: string;
    logoUrl?: string;
  }
}

// Validation schema with conditional rules
const formSchema = z.object({
  objetivo: z.string().optional(),
  alcance: z.string().optional(),
  responsable: z.string().optional(),
  codigo: z.string().optional(),
  version: z.string().optional(),
  tipoProceso: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
}).superRefine((data, ctx) => {
  const { objetivo, alcance, responsable, codigo, version, tipoProceso } = data;
  const someFieldFilled = objetivo || alcance || responsable || codigo || version || tipoProceso;

  // If any field is filled, some must meet the requirements.
  if (someFieldFilled) {
    if (objetivo && objetivo.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['objetivo'],
        message: 'El objetivo debe tener al menos 10 caracteres.',
      });
    }
    if (alcance && alcance.length < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['alcance'],
        message: 'El alcance debe tener al menos 10 caracteres.',
      });
    }
  }
});


type CaracterizacionFormValues = z.infer<typeof formSchema>;

export default function CaracterizacionEditor({ entityId, entityType, onSaved, initialData }: CaracterizacionEditorProps) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { userRole } = useAuth();
  
  let caracterizacionId: string;
    switch (entityType) {
        case 'area':
            caracterizacionId = `area-${entityId}`;
            break;
        case 'process':
        case 'proceso':
            caracterizacionId = `process-${entityId}`;
            break;
        case 'subprocess':
        case 'subproceso':
            caracterizacionId = `subprocess-${entityId}`;
            break;
        default:
            throw new Error('Invalid entity type for caracterizacion');
    }

  const form = useForm<CaracterizacionFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ...initialData,
      objetivo: initialData.objetivo || '',
      alcance: initialData.alcance || '',
      responsable: initialData.responsable || '',
      codigo: initialData.codigo || '',
      version: initialData.version || '',
      tipoProceso: initialData.tipoProceso || '',
      logoUrl: initialData.logoUrl || '',
    },
  });

  const {
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting },
  } = form;
  

  useEffect(() => {
    reset({
      ...initialData,
      objetivo: initialData.objetivo || '',
      alcance: initialData.alcance || '',
      responsable: initialData.responsable || '',
      codigo: initialData.codigo || '',
      version: initialData.version || '',
      tipoProceso: initialData.tipoProceso || '',
      logoUrl: initialData.logoUrl || '',
    });
  }, [initialData, reset]);

  const onSubmit = async (data: CaracterizacionFormValues) => {
    if (!firestore) {
      toast({
        variant: 'destructive',
        title: 'Error de Conexión',
        description: 'No se pudo conectar a la base de datos.',
      });
      return;
    }
    
    const docRef = doc(firestore, 'caracterizaciones', caracterizacionId);

    const cleanData = Object.fromEntries(
      Object.entries(data).filter(([_, v]) => v !== undefined)
    );

    const allFieldsEmpty = Object.values(cleanData).every(value => !value);

    try {
      if (allFieldsEmpty) {
        await deleteDoc(docRef);
        toast({
          title: '¡Caracterización Eliminada!',
          description: `Se ha eliminado la caracterización del ${entityType}.`,
        });
      } else {
        await setDoc(docRef, {
          ...cleanData,
          fechaActualizacion: serverTimestamp(),
        }, { merge: true });

        toast({
          title: '¡Guardado!',
          description: `La caracterización del ${entityType} ha sido actualizada.`,
        });
      }
      onSaved();

    } catch (error) {
      console.error("Error guardando caracterización:", error);
      toast({
        variant: 'destructive',
        title: 'Error al Guardar',
        description: 'No se pudo guardar la caracterización. Por favor, inténtelo de nuevo.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {userRole === 'superadmin' && (
            <div className="space-y-2">
                <FormLabel>Logo de la Organización</FormLabel>
                <LogoUploader onUploadComplete={(url) => setValue('logoUrl', url, { shouldValidate: true, shouldDirty: true })} />
                <FormField
                    control={form.control}
                    name="logoUrl"
                    render={({ field }) => (
                        <FormItem>
                            {field.value && <img src={field.value} alt="Logo Preview" className="h-16 mt-2"/>}
                            <FormMessage />
                        </FormItem>
                    )}
                 />
            </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="codigo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: GCA" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="version"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Versión</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>
        <FormField
          control={form.control}
          name="tipoProceso"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipo de Proceso</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccione un tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
        <FormField
          control={form.control}
          name="objetivo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objetivo</FormLabel>
              <FormControl>
                <Textarea placeholder="Defina el propósito fundamental..." {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="alcance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Alcance</FormLabel>
              <FormControl>
                <Textarea placeholder="Describa los límites y el ámbito de aplicación..." {...field} rows={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="responsable"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Responsable</FormLabel>
              <FormControl>
                <Input placeholder="Cargo o rol responsable" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onSaved} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cambios
            </Button>
        </div>
      </form>
    </Form>
  );
}
