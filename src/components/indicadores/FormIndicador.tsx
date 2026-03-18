'use client';

import { useState } from 'react';
import { crearIndicador, actualizarIndicador } from '@/lib/indicadores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Indicador } from '@/types/indicadores';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const MESES = [
  { value: 0, label: 'Enero' }, { value: 1, label: 'Febrero' },
  { value: 2, label: 'Marzo' }, { value: 3, label: 'Abril' },
  { value: 4, label: 'Mayo' }, { value: 5, label: 'Junio' },
  { value: 6, label: 'Julio' }, { value: 7, label: 'Agosto' },
  { value: 8, label: 'Septiembre' }, { value: 9, label: 'Octubre' },
  { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' },
];

function DatePicker({ value, onChange }: { value: Date | undefined; onChange: (date: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [step, setStep] = useState<'day' | 'month'>('day');

  const diasEnMes = new Date(viewYear, viewMonth + 1, 0).getDate();
  const primerDia = new Date(viewYear, viewMonth, 1).getDay();
  const mesLabel = MESES.find(m => m.value === viewMonth)?.label ?? '';

  const handleDayClick = (day: number) => {
    onChange(new Date(viewYear, viewMonth, day));
    setOpen(false);
    setStep('day');
  };

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) setStep('day'); }}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'dd/MM/yyyy') : 'Seleccione fecha'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex justify-between items-center mb-3">
          {step === 'day' ? (
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>‹</Button>
          ) : (
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setViewYear(y => y - 1)}>‹</Button>
          )}
          <button type="button"
            className="text-sm font-medium hover:bg-accent px-2 py-1 rounded"
            onClick={() => setStep(step === 'day' ? 'month' : 'day')}>
            {step === 'day' ? `${mesLabel} ${viewYear}` : viewYear}
          </button>
          {step === 'day' ? (
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth}>›</Button>
          ) : (
            <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setViewYear(y => y + 1)}>›</Button>
          )}
        </div>

        {step === 'day' && (
          <>
            <div className="grid grid-cols-7 mb-1">
              {['Do','Lu','Ma','Mi','Ju','Vi','Sa'].map(d => (
                <div key={d} className="text-center text-xs text-muted-foreground py-1 w-8">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: primerDia }).map((_, i) => <div key={`e-${i}`} className="w-8 h-8" />)}
              {Array.from({ length: diasEnMes }).map((_, i) => {
                const day = i + 1;
                const isSelected = value &&
                  value.getDate() === day &&
                  value.getMonth() === viewMonth &&
                  value.getFullYear() === viewYear;
                return (
                  <Button key={day} type="button" size="icon" className="h-8 w-8 text-xs"
                    variant={isSelected ? 'default' : 'ghost'}
                    onClick={() => handleDayClick(day)}>
                    {day}
                  </Button>
                );
              })}
            </div>
          </>
        )}

        {step === 'month' && (
          <div className="grid grid-cols-3 gap-1">
            {MESES.map((m) => (
              <Button key={m.value} type="button" size="sm"
                variant={viewMonth === m.value ? 'default' : 'ghost'}
                onClick={() => { setViewMonth(m.value); setStep('day'); }}>
                {m.label.slice(0, 3)}
              </Button>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface FormIndicadorProps {
  procesoId: string;
  subprocesoId?: string;
  indicadorExistente?: Indicador;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FormIndicador({ procesoId, subprocesoId, indicadorExistente, onSuccess, onCancel }: FormIndicadorProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!indicadorExistente;

  const [codigo, setCodigo] = useState(indicadorExistente?.codigo ?? '');
  const [nombre, setNombre] = useState(indicadorExistente?.nombre ?? '');
  const [tipo, setTipo] = useState<'indicador' | 'variable'>(indicadorExistente?.tipo ?? 'indicador');
  const [clase, setClase] = useState(indicadorExistente?.clase ?? 'Eficacia');
  const [unidadMedida, setUnidadMedida] = useState(indicadorExistente?.unidadMedida ?? '%');
  const [descripcion, setDescripcion] = useState(indicadorExistente?.descripcion ?? '');
  const [frecuencia, setFrecuencia] = useState<'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'>(indicadorExistente?.frecuencia ?? 'mensual');
  const [finalidad, setFinalidad] = useState<'minimizar' | 'maximizar'>(indicadorExistente?.finalidad ?? 'maximizar');
  const [meta, setMeta] = useState<number | ''>(indicadorExistente?.meta ?? 0);
  const [verdeMax, setVerdeMax] = useState<number | ''>(indicadorExistente?.verdeMax ?? 0);
  const [amarilloMax, setAmarilloMax] = useState<number | ''>(indicadorExistente?.amarilloMax ?? 0);
  const [fuenteInformacion, setFuenteInformacion] = useState(indicadorExistente?.fuenteInformacion ?? '');
  const [controlCambios, setControlCambios] = useState<{ fecha: string; descripcion: string }[]>(
    indicadorExistente?.controlCambios ?? []
  );
  const [nuevoCambioFecha, setNuevoCambioFecha] = useState<Date | undefined>();
  const [nuevoCambioDesc, setNuevoCambioDesc] = useState('');

  const agregarCambio = () => {
    if (!nuevoCambioFecha || !nuevoCambioDesc.trim()) return;
    const fecha = format(nuevoCambioFecha, 'dd/MM/yyyy');
    setControlCambios(prev => [...prev, { fecha, descripcion: nuevoCambioDesc.trim() }]);
    setNuevoCambioFecha(undefined);
    setNuevoCambioDesc('');
  };

  const eliminarCambio = (index: number) => {
    setControlCambios(prev => prev.filter((_, i) => i !== index));
  };

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
      fuenteInformacion,
      controlCambios,
      procesoId: subprocesoId ?? procesoId,
      ...(subprocesoId && { subprocesoId }),
      diaCorte: indicadorExistente?.diaCorte ?? 'Último día del mes',
      formula: indicadorExistente?.formula ?? '',
      interpretacion: indicadorExistente?.interpretacion ?? '',
      categorias: indicadorExistente?.categorias ?? [],
      atributosCalidad: indicadorExistente?.atributosCalidad ?? [],
      activo: indicadorExistente?.activo ?? true,
      permitirPeriodosSinMedicion: indicadorExistente?.permitirPeriodosSinMedicion ?? false,
    };

    try {
      if (isEditing && indicadorExistente.id) {
        await actualizarIndicador(indicadorExistente.id, indicadorData);
        toast({ title: 'Éxito', description: 'Indicador actualizado correctamente.' });
      } else {
        await crearIndicador(indicadorData);
        toast({ title: 'Éxito', description: 'Indicador creado correctamente.' });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast({
        title: 'Error',
        description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} el indicador.`,
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
          <CardTitle className="font-headline">
            {isEditing ? 'Editar Indicador' : 'Crear Nuevo Indicador'}
          </CardTitle>
          <CardDescription>
            {isEditing ? 'Modifique la información del indicador.' : 'Complete la información para registrar un nuevo indicador de proceso.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* Información General */}
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
                  <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indicador">Indicador</SelectItem>
                    <SelectItem value="variable">Variable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="clase">Clase</Label>
                <Select value={clase} onValueChange={(v) => setClase(v)}>
                  <SelectTrigger id="clase"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger id="unidadMedida"><SelectValue /></SelectTrigger>
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
                <Textarea id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Breve descripción del propósito del indicador" rows={3} />
              </div>
            </div>
          </div>

          {/* Información adicional */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold tracking-tight font-headline">Información adicional</h3>
            <div className="space-y-1">
              <Label htmlFor="fuenteInformacion">Fuente de información</Label>
              <Textarea id="fuenteInformacion" value={fuenteInformacion}
                onChange={(e) => setFuenteInformacion(e.target.value)}
                placeholder="Describa la fuente de información del indicador..." rows={2} />
            </div>

            <div className="space-y-2">
              <Label>Control de cambios</Label>
              {controlCambios.length > 0 && (
                <div className="border rounded-md overflow-hidden mb-2">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-muted/50 border-b">
                        <th className="px-3 py-1.5 text-left font-medium w-32">Fecha</th>
                        <th className="px-3 py-1.5 text-left font-medium">Descripción</th>
                        <th className="px-2 py-1.5 w-8"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {controlCambios.map((c, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-3 py-1.5 font-mono">{c.fecha}</td>
                          <td className="px-3 py-1.5">{c.descripcion}</td>
                          <td className="px-2 py-1.5 text-center">
                            <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                              onClick={() => eliminarCambio(i)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex gap-2 items-end">
                <div className="space-y-1 w-44">
                  <Label className="text-xs">Fecha</Label>
                  <DatePicker value={nuevoCambioFecha} onChange={setNuevoCambioFecha} />
                </div>
                <div className="space-y-1 flex-1">
                  <Label className="text-xs">Descripción del cambio</Label>
                  <Input value={nuevoCambioDesc} onChange={(e) => setNuevoCambioDesc(e.target.value)}
                    placeholder="Ej: Creación del indicador" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={agregarCambio}
                  disabled={!nuevoCambioFecha || !nuevoCambioDesc.trim()}>
                  <PlusCircle className="mr-1.5 h-4 w-4" />
                  Agregar
                </Button>
              </div>
            </div>
          </div>

          {/* Medición */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold tracking-tight font-headline">Medición</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <Label htmlFor="frecuencia">Frecuencia</Label>
                <Select value={frecuencia} onValueChange={(v) => setFrecuencia(v as any)}>
                  <SelectTrigger id="frecuencia"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger id="finalidad"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="maximizar">Maximizar</SelectItem>
                    <SelectItem value="minimizar">Minimizar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="meta">Meta</Label>
                <Input id="meta" type="number" value={meta}
                  onChange={(e) => setMeta(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Valor numérico" />
              </div>
            </div>
          </div>

          {/* Semáforo */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-lg font-semibold tracking-tight font-headline">Semáforo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="verdeMax">Verde máximo</Label>
                <Input id="verdeMax" type="number" value={verdeMax}
                  onChange={(e) => setVerdeMax(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Límite para estado Verde" />
              </div>
              <div className="space-y-1">
                <Label htmlFor="amarilloMax">Amarillo máximo</Label>
                <Input id="amarilloMax" type="number" value={amarilloMax}
                  onChange={(e) => setAmarilloMax(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Límite para estado Amarillo" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">El color Rojo se asignará a valores fuera del rango Amarillo.</p>
          </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar Indicador'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
export default FormIndicador;