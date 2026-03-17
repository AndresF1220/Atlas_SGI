'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerIndicador, registrarMedicion, listarMediciones } from '@/lib/indicadores';
import { Indicador, Medicion } from '@/types/indicadores';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { format, setMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const MESES = [
  { value: 0, label: 'Enero' }, { value: 1, label: 'Febrero' },
  { value: 2, label: 'Marzo' }, { value: 3, label: 'Abril' },
  { value: 4, label: 'Mayo' }, { value: 5, label: 'Junio' },
  { value: 6, label: 'Julio' }, { value: 7, label: 'Agosto' },
  { value: 8, label: 'Septiembre' }, { value: 9, label: 'Octubre' },
  { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' },
];

function MonthYearPicker({
  value,
  onChange,
}: {
  value: Date | undefined;
  onChange: (date: Date) => void;
}) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const handleMonthSelect = (mes: number) => {
    const fecha = setMonth(setYear(new Date(), viewYear), mes);
    onChange(fecha);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'MMMM yyyy', { locale: es }) : 'Seleccione período'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex justify-between items-center mb-3">
          <Button type="button" variant="outline" size="icon" className="h-7 w-7"
            onClick={() => setViewYear(y => y - 1)}>‹</Button>
          <span className="text-sm font-medium">{viewYear}</span>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7"
            onClick={() => setViewYear(y => y + 1)}>›</Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MESES.map((m) => {
            const isSelected = value &&
              value.getMonth() === m.value &&
              value.getFullYear() === viewYear;
            return (
              <Button key={m.value} type="button"
                variant={isSelected ? 'default' : 'ghost'}
                className="w-full text-sm capitalize"
                onClick={() => handleMonthSelect(m.value)}>
                {m.label.slice(0, 3)}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function calcularSemaforo(valor: number, indicador: Indicador): 'verde' | 'amarillo' | 'rojo' {
  const { finalidad, meta, verdeMax, amarilloMax } = indicador;

  // Si tiene rangos configurados, usarlos
  if (verdeMax !== undefined && amarilloMax !== undefined && (verdeMax > 0 || amarilloMax > 0)) {
    if (finalidad === 'maximizar') {
      if (valor >= verdeMax) return 'verde';
      if (valor >= amarilloMax) return 'amarillo';
      return 'rojo';
    } else {
      if (valor <= verdeMax) return 'verde';
      if (valor <= amarilloMax) return 'amarillo';
      return 'rojo';
    }
  }

  // Fallback: calcular basado en meta si no hay rangos configurados
  if (finalidad === 'maximizar') {
    if (valor >= meta) return 'verde';
    if (valor >= meta * 0.8) return 'amarillo';
    return 'rojo';
  } else {
    if (valor <= meta) return 'verde';
    if (valor <= meta * 1.2) return 'amarillo';
    return 'rojo';
  }
}

const SEMAFORO_COLORS = {
  verde: 'bg-green-500',
  amarillo: 'bg-yellow-400',
  rojo: 'bg-red-500',
};

const SEMAFORO_HEX = {
  verde: '#22c55e',
  amarillo: '#facc15',
  rojo: '#ef4444',
};

const SEMAFORO_LABELS = {
  verde: 'Verde',
  amarillo: 'Amarillo',
  rojo: 'Rojo',
};

const periodoLabel = (periodo: string) => {
  const [a, m] = periodo.split('-');
  const mes = MESES.find(x => x.value === parseInt(m) - 1)?.label ?? m;
  return `${mes.slice(0, 3)} ${a}`;
};

const periodoLabelFull = (periodo: string) => {
  const [a, m] = periodo.split('-');
  const mes = MESES.find(x => x.value === parseInt(m) - 1)?.label ?? m;
  return `${mes} ${a}`;
};

export default function IndicadorDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const indicadorId = params.indicadorId as string;

  const [indicador, setIndicador] = useState<Indicador | null>(null);
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMedicion, setIsAddingMedicion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [periodoDate, setPeriodoDate] = useState<Date | undefined>();
  const [valor, setValor] = useState<number | ''>('');
  const [observacion, setObservacion] = useState('');

  useEffect(() => {
    if (!indicadorId) return;
    Promise.all([
      obtenerIndicador(indicadorId),
      listarMediciones(indicadorId),
    ]).then(([ind, meds]) => {
      setIndicador(ind);
      setMediciones(meds);
    }).finally(() => setIsLoading(false));
  }, [indicadorId]);

  const handleGuardarMedicion = async () => {
    if (!indicador || valor === '' || !periodoDate) {
      toast({ title: 'Error', description: 'Complete período y valor.', variant: 'destructive' });
      return;
    }
    const mes = String(periodoDate.getMonth() + 1).padStart(2, '0');
    const anio = periodoDate.getFullYear();
    const periodo = `${anio}-${mes}`;

    setIsSaving(true);
    try {
      const semaforo = calcularSemaforo(Number(valor), indicador);
      await registrarMedicion({
        indicadorId,
        periodo,
        valor: Number(valor),
        variables: {},
        semaforo,
        observacion,
        responsableId: user?.uid ?? '',
        responsableNombre: user?.displayName ?? '',
        responsableCargo: '',
      });
      toast({ title: 'Medición registrada correctamente.' });
      setIsAddingMedicion(false);
      setPeriodoDate(undefined);
      setValor('');
      setObservacion('');
      const meds = await listarMediciones(indicadorId);
      setMediciones(meds);
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar la medición.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!indicador) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <h2 className="text-2xl font-bold font-headline mb-4">Indicador no encontrado</h2>
        <p className="text-muted-foreground mb-6">El indicador no existe o fue eliminado.</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    );
  }

  const datosGrafica = [...mediciones]
    .filter(m => m.periodo?.match(/^\d{4}-\d{2}$/))
    .sort((a, b) => a.periodo.localeCompare(b.periodo))
    .map(m => ({
      periodo: periodoLabel(m.periodo),
      valor: m.valor,
      semaforo: m.semaforo,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <div>
          <p className="text-sm text-muted-foreground font-mono">{indicador.codigo}</p>
          <h1 className="text-2xl font-bold font-headline">{indicador.nombre}</h1>
        </div>
      </div>

      <Tabs defaultValue="seguimiento">
        <TabsList>
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="ficha">Ficha técnica</TabsTrigger>
          <TabsTrigger value="analisis">Análisis</TabsTrigger>
          <TabsTrigger value="mediciones">Mediciones</TabsTrigger>
        </TabsList>

        <TabsContent value="seguimiento" className="mt-4">
          {datosGrafica.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay mediciones para mostrar la gráfica.</p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="w-3 h-1 bg-orange-400 inline-block rounded" />
                  Meta: {indicador.meta}{indicador.unidadMedida}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Verde
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> Amarillo
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Rojo
                </span>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={datosGrafica} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="periodo" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value) => [`${value}${indicador.unidadMedida}`, 'Valor']}
                  />
                  <ReferenceLine
                    y={indicador.meta}
                    stroke="#f97316"
                    strokeDasharray="6 3"
                    strokeWidth={2}
                    label={{ value: `Meta ${indicador.meta}${indicador.unidadMedida}`, position: 'insideTopRight', fontSize: 11, fill: '#f97316' }}
                  />
                  <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                    {datosGrafica.map((entry, index) => (
                      <Cell key={index} fill={SEMAFORO_HEX[entry.semaforo]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </TabsContent>

        <TabsContent value="ficha" className="mt-4">
          <div className="rounded-md border overflow-hidden">
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Código', indicador.codigo],
                  ['Nombre', indicador.nombre],
                  ['Clase', indicador.clase],
                  ['Tipo', indicador.tipo],
                  ['Unidad de medida', indicador.unidadMedida],
                  ['Frecuencia', indicador.frecuencia],
                  ['Finalidad', indicador.finalidad],
                  ['Meta', `${indicador.meta}${indicador.unidadMedida}`],
                  ['Verde máximo', indicador.verdeMax !== undefined ? `${indicador.verdeMax}${indicador.unidadMedida}` : '—'],
                  ['Amarillo máximo', indicador.amarilloMax !== undefined ? `${indicador.amarilloMax}${indicador.unidadMedida}` : '—'],
                  ['Descripción', indicador.descripcion],
                ].map(([label, value]) => (
                  <tr key={label as string} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium bg-muted/50 w-1/3">{label}</td>
                    <td className="px-4 py-3 capitalize">{String(value ?? '—')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="analisis" className="mt-4">
          <div className="flex flex-col gap-4">
            {mediciones.filter(m => m.periodo?.match(/^\d{4}-\d{2}$/)).length === 0 && (
              <p className="text-muted-foreground text-sm">No hay mediciones registradas aún.</p>
            )}
            {[...mediciones]
              .filter(m => m.periodo?.match(/^\d{4}-\d{2}$/))
              .sort((a, b) => b.periodo.localeCompare(a.periodo))
              .map((m) => (
              <div key={m.id} className="border rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${SEMAFORO_COLORS[m.semaforo]}`} />
                    <span className="font-semibold">{periodoLabelFull(m.periodo)}</span>
                    <span className="text-lg font-bold">{m.valor}{indicador.unidadMedida}</span>
                    <span className="text-sm text-muted-foreground">(Meta {indicador.meta}{indicador.unidadMedida})</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{m.responsableNombre}</span>
                </div>
                {m.observacion && (
                  <p className="text-sm text-muted-foreground italic">"{m.observacion}"</p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="mediciones" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-semibold">Registro de mediciones</h3>
              {userRole === 'superadmin' && !isAddingMedicion && (
                <Button size="sm" onClick={() => setIsAddingMedicion(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar medición
                </Button>
              )}
            </div>

            {isAddingMedicion && (
              <div className="border rounded-lg p-4 flex flex-col gap-4">
                <h4 className="font-medium">Nueva medición</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Período</Label>
                    <MonthYearPicker value={periodoDate} onChange={setPeriodoDate} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="valor">Valor ({indicador.unidadMedida})</Label>
                    <Input
                      id="valor"
                      type="number"
                      placeholder="Valor numérico"
                      value={valor}
                      onChange={(e) => setValor(e.target.value === '' ? '' : Number(e.target.value))}
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="observacion">Observación / Análisis</Label>
                    <Textarea
                      id="observacion"
                      placeholder="Describa el comportamiento del indicador en este período..."
                      rows={3}
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsAddingMedicion(false)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button onClick={handleGuardarMedicion} disabled={isSaving}>
                    {isSaving ? 'Guardando...' : 'Guardar medición'}
                  </Button>
                </div>
              </div>
            )}

            {mediciones.length === 0 && !isAddingMedicion && (
              <p className="text-muted-foreground text-sm">No hay mediciones registradas.</p>
            )}

            {mediciones.filter(m => m.periodo?.match(/^\d{4}-\d{2}$/)).length > 0 && (
              <div className="rounded-md border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Período</th>
                      <th className="px-4 py-3 text-left font-medium">Valor</th>
                      <th className="px-4 py-3 text-left font-medium">Semáforo</th>
                      <th className="px-4 py-3 text-left font-medium">Responsable</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...mediciones]
                      .filter(m => m.periodo?.match(/^\d{4}-\d{2}$/))
                      .sort((a, b) => b.periodo.localeCompare(a.periodo))
                      .map((m) => (
                      <tr key={m.id} className="border-b last:border-0">
                        <td className="px-4 py-3 capitalize">{periodoLabelFull(m.periodo)}</td>
                        <td className="px-4 py-3 font-bold">{m.valor}{indicador.unidadMedida}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                            <span className={`w-2.5 h-2.5 rounded-full ${SEMAFORO_COLORS[m.semaforo]}`} />
                            {SEMAFORO_LABELS[m.semaforo]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{m.responsableNombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}