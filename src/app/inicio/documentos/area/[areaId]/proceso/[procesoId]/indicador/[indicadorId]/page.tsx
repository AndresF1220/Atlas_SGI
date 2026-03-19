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
import { ArrowLeft, CalendarIcon, PlusCircle, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import { format, setMonth, setYear } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ResponsiveContainer, Cell,
} from 'recharts';
import FormIndicador from '@/components/indicadores/FormIndicador';
import { doc } from 'firebase/firestore';
import { useFirestore, useMemoFirebase, useDoc } from '@/firebase';

const MESES = [
  { value: 0, label: 'Enero' }, { value: 1, label: 'Febrero' },
  { value: 2, label: 'Marzo' }, { value: 3, label: 'Abril' },
  { value: 4, label: 'Mayo' }, { value: 5, label: 'Junio' },
  { value: 6, label: 'Julio' }, { value: 7, label: 'Agosto' },
  { value: 8, label: 'Septiembre' }, { value: 9, label: 'Octubre' },
  { value: 10, label: 'Noviembre' }, { value: 11, label: 'Diciembre' },
];

function MonthYearPicker({ value, onChange }: { value: Date | undefined; onChange: (date: Date) => void }) {
  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());

  const handleMonthSelect = (mes: number) => {
    onChange(setMonth(setYear(new Date(), viewYear), mes));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline"
          className={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, 'MMMM yyyy', { locale: es }) : 'Seleccione período'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex justify-between items-center mb-3">
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setViewYear(y => y - 1)}>‹</Button>
          <span className="text-sm font-medium">{viewYear}</span>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setViewYear(y => y + 1)}>›</Button>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {MESES.map((m) => (
            <Button key={m.value} type="button"
              variant={value && value.getMonth() === m.value && value.getFullYear() === viewYear ? 'default' : 'ghost'}
              className="w-full text-sm capitalize"
              onClick={() => handleMonthSelect(m.value)}>
              {m.label.slice(0, 3)}
            </Button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function calcularSemaforo(valor: number, indicador: Indicador): 'verde' | 'amarillo' | 'rojo' {
  const { finalidad, meta, verdeMax, amarilloMax } = indicador;
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

const SEMAFORO_COLORS = { verde: 'bg-green-500', amarillo: 'bg-yellow-400', rojo: 'bg-red-500' };
const SEMAFORO_HEX = { verde: '#22c55e', amarillo: '#facc15', rojo: '#ef4444' };
const SEMAFORO_LABELS = { verde: 'Verde', amarillo: 'Amarillo', rojo: 'Rojo' };

const periodoLabel = (periodo: string) => {
  const [a, m] = periodo.split('-');
  return `${MESES.find(x => x.value === parseInt(m) - 1)?.label.slice(0, 3) ?? m} ${a}`;
};

const periodoLabelFull = (periodo: string) => {
  const [a, m] = periodo.split('-');
  return `${MESES.find(x => x.value === parseInt(m) - 1)?.label ?? m} ${a}`;
};

// Tooltip personalizado para las barras
const CustomBarTooltip = ({ active, payload, label, unidadMedida }: any) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0]?.payload;
  if (!data) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm flex flex-col gap-1.5 pointer-events-none">
      <p className="font-semibold text-gray-900 border-b pb-1 mb-0.5">{label}</p>
      <p className="flex items-center gap-2">
        <span className="text-gray-500">Valor:</span>
        <span className="font-bold text-gray-900">{data.valor}{unidadMedida}</span>
      </p>
      {data.observacion && (
        <div className="mt-0.5 text-xs max-w-[260px] leading-relaxed">
          <span className="font-medium text-gray-700">Análisis: </span>
          <span className="text-gray-500 italic">{data.observacion}</span>
        </div>
      )}
    </div>
  );
};

// Tooltip personalizado para la línea de meta
const MetaTooltipLabel = ({ viewBox, meta, unidadMedida }: any) => {
  if (!viewBox) return null;
  const { x, y, width } = viewBox;
  return (
    <g>
      <text
        x={x + width - 4}
        y={y - 6}
        textAnchor="end"
        fill="#f97316"
        fontSize={11}
        fontWeight="500"
      >
        Meta {meta}{unidadMedida}
      </text>
    </g>
  );
};

export default function IndicadorDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user, userRole } = useAuth();
  const indicadorId = params.indicadorId as string;
  const firestore = useFirestore();

  const [indicador, setIndicador] = useState<Indicador | null>(null);
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingMedicion, setIsAddingMedicion] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [tabActiva, setTabActiva] = useState('seguimiento');

  // Estado para tooltip de la meta
  const [metaTooltip, setMetaTooltip] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0, y: 0, visible: false,
  });

  // Tooltip manual para barras
  const [barTooltip, setBarTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    data: { periodo: string; valor: number; observacion?: string; semaforo: string } | null;
  }>({ visible: false, x: 0, y: 0, data: null });

  // Índice de barra hover (para efecto visual)
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Modal de medición al hacer clic
  const [modalMedicion, setModalMedicion] = useState<{
    visible: boolean;
    data: { periodo: string; valor: number; observacion?: string; semaforo: 'verde' | 'amarillo' | 'rojo'; responsableNombre?: string; creadoEn?: any } | null;
  }>({ visible: false, data: null });

  const [periodoDate, setPeriodoDate] = useState<Date | undefined>();
  const [valor, setValor] = useState<number | ''>('');
  const [observacion, setObservacion] = useState('');

  const companyRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'settings', 'company') : null),
    [firestore]
  );
  const { data: company } = useDoc(companyRef);
  const companyName = (company as any)?.name || 'Dusakawi EPSI';
  const logoUrl = (company as any)?.logoUrl;

  useEffect(() => {
    if (!indicadorId) return;
    Promise.all([obtenerIndicador(indicadorId), listarMediciones(indicadorId)])
      .then(([ind, meds]) => { setIndicador(ind); setMediciones(meds); })
      .finally(() => setIsLoading(false));
  }, [indicadorId]);

  const handleGuardarMedicion = async () => {
    if (!indicador || valor === '' || !periodoDate) {
      toast({ title: 'Error', description: 'Complete período y valor.', variant: 'destructive' });
      return;
    }
    const mes = String(periodoDate.getMonth() + 1).padStart(2, '0');
    const periodo = `${periodoDate.getFullYear()}-${mes}`;
    setIsSaving(true);
    try {
      const semaforo = calcularSemaforo(Number(valor), indicador);
      await registrarMedicion({
        indicadorId, periodo, valor: Number(valor), variables: {}, semaforo,
        observacion, responsableId: user?.uid ?? '',
        responsableNombre: user?.displayName ?? '', responsableCargo: '',
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
        <Skeleton className="h-32 w-full" />
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
      observacion: m.observacion,
      responsableNombre: m.responsableNombre,
      creadoEn: m.creadoEn,
    }));

  const axisLabel = indicador.unidadMedida === '%' ? 'Porcentaje'
    : (indicador.unidadMedida.toLowerCase().startsWith('und') ? 'Unidades'
      : indicador.unidadMedida);

  return (
    <div className="flex flex-col gap-4">

      <div className="flex flex-col gap-1 -mb-3">
        <Button variant="ghost" size="sm" className="w-fit h-8 px-2" onClick={() => router.back()}>
          <ArrowLeft className="mr-1 h-3.5 w-3.5" />
          Volver
        </Button>
        <h1 className="text-lg font-bold font-headline px-2">{indicador.nombre}</h1>
      </div>

      <Tabs value={tabActiva} onValueChange={setTabActiva}>
        <TabsList className="mt-1">
          <TabsTrigger value="seguimiento">Seguimiento</TabsTrigger>
          <TabsTrigger value="ficha">Ficha técnica</TabsTrigger>
          <TabsTrigger value="analisis">Análisis</TabsTrigger>
          <TabsTrigger value="mediciones">Mediciones</TabsTrigger>
        </TabsList>

        {/* ── SEGUIMIENTO ── */}
        <TabsContent value="seguimiento" className="mt-4">
          {datosGrafica.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay mediciones para mostrar la gráfica.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Título centrado */}
              <div className="text-center mb-1">
                <h3 className="text-base sm:text-lg font-bold uppercase tracking-wide">{indicador.nombre}</h3>
                <p className="text-sm text-muted-foreground">{indicador.procesoId}</p>
              </div>

              {/* Contenedor con posición relativa para el tooltip manual */}
              <div
                className="relative"
                onMouseLeave={() => setBarTooltip(prev => ({ ...prev, visible: false }))}
              >
                <div className="h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={datosGrafica}
                      margin={{ top: 16, right: 24, left: 8, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="periodo" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickLine={false}
                        axisLine={false}
                        label={{
                          value: axisLabel,
                          angle: -90,
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: '#9ca3af', fontSize: 11 },
                        }}
                      />
                      {/* Tooltip de Recharts desactivado — usamos tooltip manual */}
                      <Tooltip content={() => null} cursor={false} />

                      {/* Barras */}
                      <Bar
                        dataKey="valor"
                        radius={[3, 3, 0, 0]}
                        onMouseEnter={(data: any, index: number, event: React.MouseEvent) => {
                          setHoveredBar(index);
                          const containerRect = (event.currentTarget as SVGElement)
                            .closest('.relative')
                            ?.getBoundingClientRect();
                          if (!containerRect) return;
                          const ex = (event as any).clientX - containerRect.left;
                          const ey = (event as any).clientY - containerRect.top;
                          setBarTooltip({
                            visible: true,
                            x: ex,
                            y: ey,
                            data: {
                              periodo: data.periodo,
                              valor: data.valor,
                              observacion: data.observacion,
                              semaforo: data.semaforo,
                            },
                          });
                        }}
                        onMouseMove={(_data: any, _index: number, event: React.MouseEvent) => {
                          const containerRect = (event.currentTarget as SVGElement)
                            .closest('.relative')
                            ?.getBoundingClientRect();
                          if (!containerRect) return;
                          const ex = (event as any).clientX - containerRect.left;
                          const ey = (event as any).clientY - containerRect.top;
                          setBarTooltip(prev => ({ ...prev, x: ex, y: ey }));
                        }}
                        onMouseLeave={() => {
                          setHoveredBar(null);
                          setBarTooltip(prev => ({ ...prev, visible: false }));
                        }}
                        onClick={(data: any) => {
                          setModalMedicion({
                            visible: true,
                            data: {
                              periodo: data.periodo,
                              valor: data.valor,
                              observacion: data.observacion,
                              semaforo: data.semaforo as 'verde' | 'amarillo' | 'rojo',
                              responsableNombre: data.responsableNombre,
                              creadoEn: data.creadoEn,
                            },
                          });
                        }}
                      >
                        {datosGrafica.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={SEMAFORO_HEX[entry.semaforo]}
                            style={{
                              cursor: 'pointer',
                              filter: hoveredBar === index ? 'brightness(0.85)' : 'none',
                              transition: 'filter 0.15s ease',
                            }}
                          />
                        ))}
                      </Bar>

                      {/* ReferenceLine de la meta DESPUÉS de las barras → queda al frente */}
                      <ReferenceLine
                        y={indicador.meta}
                        stroke="#f97316"
                        strokeDasharray="6 3"
                        strokeWidth={2}
                        label={
                          <MetaTooltipLabel
                            meta={indicador.meta}
                            unidadMedida={indicador.unidadMedida}
                          />
                        }
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Tooltip manual — solo aparece al estar sobre la barra */}
                {barTooltip.visible && barTooltip.data && (
                  <div
                    className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm flex flex-col gap-1.5 pointer-events-none"
                    style={{
                      left: barTooltip.x + 12,
                      top: barTooltip.y - 10,
                      transform: barTooltip.x > 600 ? 'translateX(-110%)' : undefined,
                    }}
                  >
                    <p className="font-semibold text-gray-900 border-b pb-1 mb-0.5">
                      {barTooltip.data.periodo}
                    </p>
                    <p className="flex items-center gap-2">
                      <span className="text-gray-500">Valor:</span>
                      <span className="font-bold text-gray-900">
                        {barTooltip.data.valor}{indicador.unidadMedida}
                      </span>
                    </p>
                    {barTooltip.data.observacion && (
                      <div className="mt-0.5 text-xs max-w-[260px] leading-relaxed">
                        <span className="font-medium text-gray-700">Análisis: </span>
                        <span className="text-gray-500 italic">{barTooltip.data.observacion}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Leyenda centrada debajo */}
              <div className="flex items-center justify-center gap-5 text-sm text-muted-foreground flex-wrap pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-green-500 inline-block" /> Verde
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-yellow-400 inline-block" /> Amarillo
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm bg-red-500 inline-block" /> Rojo
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-5 h-0 border-t-2 border-dashed border-orange-400" />
                  Meta: {indicador.meta}{indicador.unidadMedida}
                </span>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ── MODAL MEDICIÓN ── */}
        {modalMedicion.visible && modalMedicion.data && indicador && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setModalMedicion({ visible: false, data: null })}
          >
            <div
              className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/30">
                <span className="font-semibold text-base">Medición</span>
                <button
                  className="text-gray-400 hover:text-gray-700 text-xl leading-none"
                  onClick={() => setModalMedicion({ visible: false, data: null })}
                >✕</button>
              </div>

              {/* Período + Valor + Meta */}
              <div className="grid grid-cols-3 divide-x border-b">
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Período</p>
                  <p className="text-lg font-bold">{modalMedicion.data.periodo}</p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Valor</p>
                  <p className="text-lg font-bold" style={{ color: SEMAFORO_HEX[modalMedicion.data.semaforo] }}>
                    {modalMedicion.data.valor}{indicador.unidadMedida}
                  </p>
                </div>
                <div className="px-4 py-3">
                  <p className="text-xs text-muted-foreground font-medium mb-0.5">Meta</p>
                  <p className="text-lg font-bold">{indicador.meta}{indicador.unidadMedida}</p>
                </div>
              </div>

              {/* Rangos semáforo */}
              {indicador.verdeMax !== undefined && indicador.amarilloMax !== undefined && (
                <div className="flex gap-2 px-5 py-3 border-b">
                  {indicador.finalidad === 'maximizar' ? (
                    <>
                      <span className="flex-1 text-center py-1.5 rounded text-xs font-bold text-white bg-green-500">
                        &gt;= {indicador.verdeMax}{indicador.unidadMedida}
                      </span>
                      <span className="flex-1 text-center py-1.5 rounded text-xs font-bold text-white bg-yellow-400">
                        &gt;= {indicador.amarilloMax} &lt; {indicador.verdeMax}{indicador.unidadMedida}
                      </span>
                      <span className="flex-1 text-center py-1.5 rounded text-xs font-bold text-white bg-red-500">
                        &lt; {indicador.amarilloMax}{indicador.unidadMedida}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-center py-1.5 rounded text-xs font-bold text-white bg-green-500">
                        &lt;= {indicador.verdeMax}{indicador.unidadMedida}
                      </span>
                      <span className="flex-1 text-center py-1.5 rounded text-xs font-bold text-white bg-yellow-400">
                        &gt; {indicador.verdeMax} &lt;= {indicador.amarilloMax}{indicador.unidadMedida}
                      </span>
                      <span className="flex-1 text-center py-1.5 rounded text-xs font-bold text-white bg-red-500">
                        &gt; {indicador.amarilloMax}{indicador.unidadMedida}
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Análisis */}
              <div className="px-5 pt-3 pb-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Análisis</p>
                {modalMedicion.data.observacion ? (
                  <p className="text-sm text-gray-700 leading-relaxed">{modalMedicion.data.observacion}</p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Sin análisis registrado para este período.</p>
                )}
                {modalMedicion.data.responsableNombre && (
                  <p className="text-xs text-muted-foreground text-right mt-3">
                    {modalMedicion.data.responsableNombre}
                    {modalMedicion.data.creadoEn && (
                      <span className="ml-1">
                        — {modalMedicion.data.creadoEn instanceof Date
                          ? modalMedicion.data.creadoEn.toLocaleDateString('es-CO', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : ''}
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── FICHA TÉCNICA ── */}
        <TabsContent value="ficha" className="mt-4">
          {isEditing ? (
            <FormIndicador
              procesoId={indicador.procesoId}
              subprocesoId={indicador.subprocesoId}
              indicadorExistente={indicador}
              onSuccess={() => {
                setIsEditing(false);
                obtenerIndicador(indicadorId).then(setIndicador);
              }}
              onCancel={() => setIsEditing(false)}
            />
          ) : (
            <div className="flex flex-col gap-2 text-xs">

              <div className="rounded-lg border bg-white shadow-sm mb-2">
                <div className="flex justify-end px-4 py-1 border-b">
                  {userRole === 'superadmin' && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 text-gray-400 hover:text-gray-700"
                      title="Editar indicador"
                      onClick={() => setIsEditing(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex-shrink-0">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded" />
                    ) : (
                      <div className="h-16 w-16 rounded bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xl">
                        DE
                      </div>
                    )}
                  </div>
                  <div className="flex-1 text-center px-4">
                    <p className="font-bold text-lg text-gray-900">{companyName}</p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">
                        {indicador.subprocesoId ? 'Subproceso' : 'Proceso / Área'}:
                      </span>{' '}
                      <span className="text-gray-900">{indicador.procesoId}</span>
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-semibold">Indicador:</span>{' '}
                      <span className="text-gray-900 font-medium">{indicador.nombre}</span>
                    </p>
                  </div>
                  <div className="flex-shrink-0 text-right text-sm min-w-[130px]">
                    <p><span className="font-semibold">Código:</span> {indicador.codigo}</p>
                  </div>
                </div>
              </div>

              {/* Resumen semáforo */}
              <div className="border rounded flex flex-col items-center gap-1.5 py-2 px-4 bg-muted/20">
                <div className="flex items-center gap-5 flex-wrap justify-center">
                  <span><strong>Meta:</strong> {indicador.meta}{indicador.unidadMedida}</span>
                  <span><strong>Semáforo:</strong> Lineal</span>
                  <span><strong>Finalidad:</strong> {indicador.finalidad === 'maximizar' ? 'Maximizar' : 'Minimizar'}</span>
                </div>
                {indicador.verdeMax !== undefined && indicador.amarilloMax !== undefined && (
                  <div className="flex items-center gap-1.5 flex-wrap justify-center">
                    {indicador.finalidad === 'maximizar' ? (
                      <>
                        <span className="px-2.5 py-0.5 rounded font-bold text-white text-xs bg-green-500">&gt;= {indicador.verdeMax}{indicador.unidadMedida}</span>
                        <span className="px-2.5 py-0.5 rounded font-bold text-white text-xs bg-yellow-400">&gt;= {indicador.amarilloMax}{indicador.unidadMedida} &lt; {indicador.verdeMax}{indicador.unidadMedida}</span>
                        <span className="px-2.5 py-0.5 rounded font-bold text-white text-xs bg-red-500">&lt; {indicador.amarilloMax}{indicador.unidadMedida}</span>
                      </>
                    ) : (
                      <>
                        <span className="px-2.5 py-0.5 rounded font-bold text-white text-xs bg-green-500">&lt;= {indicador.verdeMax}{indicador.unidadMedida}</span>
                        <span className="px-2.5 py-0.5 rounded font-bold text-white text-xs bg-yellow-400">&gt; {indicador.verdeMax}{indicador.unidadMedida} &lt;= {indicador.amarilloMax}{indicador.unidadMedida}</span>
                        <span className="px-2.5 py-0.5 rounded font-bold text-white text-xs bg-red-500">&gt; {indicador.amarilloMax}{indicador.unidadMedida}</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Información General */}
              <div className="border rounded overflow-hidden">
                <div className="px-3 py-1 bg-muted font-semibold text-xs uppercase tracking-wide border-b text-center">Información General</div>
                <div className="px-3 py-0.5 bg-muted/30 text-xs font-medium border-b text-center">Definición</div>
                <table className="w-full text-xs border-collapse bg-white">
                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 w-1/4 border-r">Clase</td>
                      <td className="px-3 py-1.5 w-1/4 border-r">{indicador.clase}</td>
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 w-1/4 border-r">Tipo</td>
                      <td className="px-3 py-1.5 capitalize">{indicador.tipo}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 border-r">Código</td>
                      <td className="px-3 py-1.5 border-r">{indicador.codigo}</td>
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 border-r">Nombre</td>
                      <td className="px-3 py-1.5">{indicador.nombre}</td>
                    </tr>
                    {indicador.descripcion && (
                      <tr className="border-b">
                        <td className="px-3 py-1.5 font-semibold bg-muted/20 border-r">Descripción</td>
                        <td className="px-3 py-1.5" colSpan={3}>{indicador.descripcion}</td>
                      </tr>
                    )}
                    <tr>
                      <td colSpan={4} className="px-3 py-0.5 bg-muted/30 font-medium text-center border-y">Información adicional</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 border-r">Fuente de información</td>
                      <td className="px-3 py-1.5" colSpan={3}>{indicador.fuenteInformacion || '—'}</td>
                    </tr>
                    {indicador.controlCambios && indicador.controlCambios.length > 0 && (
                      <tr>
                        <td className="px-3 py-1.5 font-semibold bg-muted/20 border-r align-top">Control de cambios</td>
                        <td className="px-3 py-1.5" colSpan={3}>
                          <ul className="space-y-0.5">
                            {indicador.controlCambios.map((c, i) => (
                              <li key={i}>— {c.fecha} — {c.descripcion}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Asociado a */}
              <div className="border rounded overflow-hidden">
                <div className="px-3 py-1 bg-muted font-semibold text-xs uppercase tracking-wide border-b text-center">Asociado a</div>
                <table className="w-full text-xs border-collapse bg-white">
                  <tbody>
                    <tr>
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 w-1/4 border-r">Proceso / Área</td>
                      <td className="px-3 py-1.5 text-muted-foreground font-mono border-r">{indicador.procesoId}</td>
                      {indicador.subprocesoId ? (
                        <>
                          <td className="px-3 py-1.5 font-semibold bg-muted/20 w-1/4 border-r">Subproceso</td>
                          <td className="px-3 py-1.5 text-muted-foreground font-mono">{indicador.subprocesoId}</td>
                        </>
                      ) : <td colSpan={2} />}
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Medición */}
              <div className="border rounded overflow-hidden">
                <div className="px-3 py-1 bg-muted font-semibold text-xs uppercase tracking-wide border-b text-center">Medición</div>
                <table className="w-full text-xs border-collapse bg-white">
                  <tbody>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 w-1/4 border-r">Unidad de medida</td>
                      <td className="px-3 py-1.5 border-r">{indicador.unidadMedida}</td>
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 w-1/4 border-r">Frecuencia</td>
                      <td className="px-3 py-1.5 capitalize">{indicador.frecuencia}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 border-r">Meta</td>
                      <td className="px-3 py-1.5 border-r">{indicador.meta}{indicador.unidadMedida}</td>
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 border-r">Día de corte</td>
                      <td className="px-3 py-1.5">{indicador.diaCorte || '—'}</td>
                    </tr>
                    <tr>
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 border-r">Finalidad</td>
                      <td className="px-3 py-1.5 capitalize border-r">{indicador.finalidad}</td>
                      <td className="px-3 py-1.5 font-semibold bg-muted/20 border-r">Activo</td>
                      <td className="px-3 py-1.5">{indicador.activo ? 'Sí' : 'No'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Composición */}
              {indicador.formula && (
                <div className="border rounded overflow-hidden">
                  <div className="px-3 py-1 bg-muted font-semibold text-xs uppercase tracking-wide border-b text-center">Composición</div>
                  <table className="w-full text-xs border-collapse bg-white">
                    <tbody>
                      <tr>
                        <td className="px-3 py-1.5 font-semibold bg-muted/20 w-1/4 border-r">Fórmula</td>
                        <td className="px-3 py-1.5 font-mono">{indicador.formula}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── ANÁLISIS ── */}
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

        {/* ── MEDICIONES ── */}
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
                    <Input id="valor" type="number" placeholder="Valor numérico" value={valor}
                      onChange={(e) => setValor(e.target.value === '' ? '' : Number(e.target.value))} />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <Label htmlFor="observacion">Análisis</Label>
                    <Textarea id="observacion" placeholder="Describa el comportamiento del indicador en este período..."
                      rows={3} value={observacion} onChange={(e) => setObservacion(e.target.value)} />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setIsAddingMedicion(false)} disabled={isSaving}>Cancelar</Button>
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
