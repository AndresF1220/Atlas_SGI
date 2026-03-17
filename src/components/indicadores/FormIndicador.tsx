'use client';

import { useState } from 'react';
import { crearIndicador } from '@/lib/indicadores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Indicador } from '@/types/indicadores';

interface FormIndicadorProps {
  procesoId: string;
  subprocesoId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FormIndicador({ procesoId, subprocesoId, onSuccess, onCancel }: FormIndicadorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'indicador' | 'variable'>('indicador');
  const [clase, setClase] = useState('Eficacia');
  const [unidadMedida, setUnidadMedida] = useState('%');
  const [descripcion, setDescripcion] = useState('');
  const [frecuencia, setFrecuencia] = useState<'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'>('mensual');
  const [finalidad, setFinalidad] = useState<'minimizar' | 'maximizar'>('maximizar');
  const [meta, setMeta] = useState<number | ''>(0);
  const [verdeMax, setVerdeMax] = useState<number | ''>(0);
  const [amarilloMax, setAmarilloMax] = useState<number | ''>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !codigo || meta === '' || !procesoId) {
      toast({
        title: 'Error de validación',
        description: 'Por favor, complete los campos requeridos (Código, Nombre, Meta).',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);

    const indicadorData: Omit<Indicador, 'id'> = {
      codigo,
      nombre,
      tipo,
      clase,
      unidadMedida,
      finalidad,
      frecuencia,
      meta: Number(meta),
      verdeMax: verdeMax === '' ? 0 : Number(verdeMax),
      amarilloMax: amarilloMax === '' ? 0 : Number(amarilloMax),
      descripcion,
      procesoId: subprocesoId ?? procesoId,
      ...(subprocesoId && { subprocesoId }),
      diaCorte: 'Último día del mes',
      formula: '',
      interpretacion: '',
      fuenteNumerador: '',
      fuenteDenominador: '',
      categorias: [],
      atributosCalidad: [],
      controlCambios: '',
      activo: true,
      permitirPeriodosSinMedicion: false,
    };

    try {
      await crearIndicador(indicadorData);
      toast({
        title: 'Éxito',
        description: 'Indicador creado correctamente.',
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: 'No se pudo crear el indicador. Inténtelo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle className="font-headline">Crear Nuevo Indicador</CardTitle>
          <CardDescription>Complete la información para registrar un nuevo indicador de proceso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Section 1: General Info */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold tracking-tight font-headline">Información General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="codigo">Código</Label>
                <Input id="codigo" value={codigo} onChange={(e) => setCodigo(e.target.value)} placeholder="Ej: IND-001" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre completo del indicador" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
                  <SelectTrigger id="tipo"><SelectValue placeholder="Seleccione tipo" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indicador">Indicador</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="clase">Clase</Label>
                <Select value={clase} onValueChange={(v) => setClase(v)}>
                  <SelectTrigger id="clase"><SelectValue placeholder="Seleccione clase" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Eficacia">Eficacia</SelectItem>
                    <SelectItem value="Eficiencia">Eficiencia</SelectItem>
                    <SelectItem value="Efectividad">Efectividad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="unidadMedida">Unidad de medida</Label>
                <Select value={unidadMedida} onValueChange={(v) => setUnidadMedida(v)}>
                  <SelectTrigger id="unidadMedida"><SelectValue placeholder="Seleccione unidad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="%">%</SelectItem>
                    <SelectItem value="Unidades">Unidades</SelectItem>
                    <SelectItem value="Días">Días</SelectItem>
                    <SelectItem value="Tasa">Tasa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1 col-span-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Breve descripción del propósito del indicador" rows={3} />
              </div>
            </div>
          </div>

          {/* Section 2: Measurement */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold tracking-tight font-headline">Medición</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="frecuencia">Frecuencia</Label>
                <Select value={frecuencia} onValueChange={(v) => setFrecuencia(v as any)}>
                  <SelectTrigger id="frecuencia"><SelectValue placeholder="Seleccione frecuencia" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mensual">Mensual</SelectItem>
                    <SelectItem value="bimestral">Bimestral</SelectItem>
                    <SelectItem value="trimestral">Trimestral</SelectItem>
                    <SelectItem value="semestral">Semestral</SelectItem>
                    <SelectItem value="anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="finalidad">Finalidad</Label>
                <Select value={finalidad} onValueChange={(v) => setFinalidad(v as any)}>
                  <SelectTrigger id="finalidad"><SelectValue placeholder="Seleccione finalidad" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maximizar">Maximizar</SelectItem>
                    <SelectItem value="minimizar">Minimizar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="meta">Meta</Label>
                <Input id="meta" type="number" value={meta} onChange={(e) => setMeta(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Valor numérico" />
              </div>
            </div>
          </div>

          {/* Section 3: Semaphore */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold tracking-tight font-headline">Semáforo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="verdeMax">Verde máximo</Label>
                <Input id="verdeMax" type="number" value={verdeMax} onChange={(e) => setVerdeMax(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Límite para estado Verde" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="amarilloMax">Amarillo máximo</Label>
                <Input id="amarilloMax" type="number" value={amarilloMax} onChange={(e) => setAmarilloMax(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Límite para estado Amarillo" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">El color Rojo se asignará a valores fuera del rango Amarillo.</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Indicador'}</Button>
        </CardFooter>
      </form>
    </Card>
  );
}
export default FormIndicador;