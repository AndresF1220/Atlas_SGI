'use client';

import { useState } from 'react';
import { crearIndicador, actualizarIndicador } from '@/lib/indicadores';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
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


function DatePicker({ value, onChange, compact = false }: {
  value: Date | undefined;
  onChange: (date: Date) => void;
  compact?: boolean;
}) {
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
          className={cn(
            'justify-start text-left font-normal',
            compact ? 'h-8 text-sm px-2 w-full' : 'w-full',
            !value && 'text-muted-foreground'
          )}>
          <CalendarIcon className={cn('mr-2', compact ? 'h-3.5 w-3.5' : 'h-4 w-4')} />
          {value ? format(value, 'dd/MM/yyyy') : 'Seleccione fecha'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-3">
        <div className="flex justify-between items-center mb-3">
          {step === 'day'
            ? <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>‹</Button>
            : <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setViewYear(y => y - 1)}>‹</Button>
          }
          <button type="button" className="text-sm font-medium hover:bg-accent px-2 py-1 rounded"
            onClick={() => setStep(step === 'day' ? 'month' : 'day')}>
            {step === 'day' ? `${mesLabel} ${viewYear}` : viewYear}
          </button>
          {step === 'day'
            ? <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth}>›</Button>
            : <Button type="button" variant="outline" size="icon" className="h-7 w-7" onClick={() => setViewYear(y => y + 1)}>›</Button>
          }
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
                  value.getDate() === day && value.getMonth() === viewMonth && value.getFullYear() === viewYear;
                return (
                  <Button key={day} type="button" size="icon" className="h-8 w-8 text-xs"
                    variant={isSelected ? 'default' : 'ghost'}
                    onClick={() => handleDayClick(day)}>{day}</Button>
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

// ─── Celdas del layout compacto ───────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <tr>
      <td colSpan={4} className="px-3 py-1.5 bg-muted/50 border-y">
        <span className="text-xs font-semibold uppercase tracking-wider text-foreground/60">{title}</span>
      </td>
    </tr>
  );
}

function TdLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn(
      'px-3 py-2 text-sm font-medium text-foreground/75 whitespace-nowrap align-middle',
      'w-36 border-r border-border/30',
      className
    )}>
      {children}
    </td>
  );
}

function TdValue({ children, colSpan, className }: {
  children: React.ReactNode; colSpan?: number; className?: string;
}) {
  return (
    <td colSpan={colSpan} className={cn('px-3 py-1.5 align-middle', className)}>
      {children}
    </td>
  );
}

function CInput(props: React.ComponentProps<typeof Input>) {
  return <Input {...props} className={cn('h-8 text-sm px-2', props.className)} />;
}

function CSelect({ value, onValueChange, children }: {
  value: string; onValueChange: (v: string) => void; children: React.ReactNode;
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-8 text-sm px-2"><SelectValue /></SelectTrigger>
      <SelectContent>{children}</SelectContent>
    </Select>
  );
}

function CTextarea(props: React.ComponentProps<typeof Textarea>) {
  return <Textarea {...props} className={cn('text-sm px-2 py-1.5 resize-none', props.className)} rows={props.rows ?? 2} />;
}

// ─── Shared props ─────────────────────────────────────────────────────────────

interface FormSharedProps {
  state: any;
  onChange: (field: string, value: any) => void;
  controlCambios: { fecha: string; descripcion: string }[];
  onAgregarCambio: () => void;
  onEliminarCambio: (i: number) => void;
  nuevoCambioFecha: Date | undefined;
  setNuevoCambioFecha: (d: Date) => void;
  nuevoCambioDesc: string;
  setNuevoCambioDesc: (s: string) => void;
}

// ─── Formulario compacto (modo edición) ──────────────────────────────────────

function FormCompacto(p: FormSharedProps) {
  const { state, onChange, controlCambios, onAgregarCambio, onEliminarCambio,
    nuevoCambioFecha, setNuevoCambioFecha, nuevoCambioDesc, setNuevoCambioDesc } = p;

  return (
    <div className="border rounded-md overflow-hidden">
      <table className="w-full border-collapse">
        <tbody>

          {/* ── INFORMACIÓN GENERAL ── */}
          <SectionHeader title="Información General" />

          {/* Código + Nombre */}
          <tr className="border-b">
            <TdLabel>Código</TdLabel>
            <TdValue>
              <CInput value={state.codigo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('codigo', e.target.value)}
                placeholder="Ej: IND-001" className="max-w-[150px]" />
            </TdValue>
            <TdLabel>Nombre</TdLabel>
            <TdValue>
              <CInput value={state.nombre} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('nombre', e.target.value)}
                placeholder="Nombre del indicador" />
            </TdValue>
          </tr>

          {/* Tipo + Unidad de medida */}
          <tr className="border-b">
            <TdLabel>Tipo</TdLabel>
            <TdValue>
              <CSelect value={state.tipo} onValueChange={v => onChange('tipo', v)}>
                <SelectItem value="indicador">Indicador</SelectItem>
                <SelectItem value="variable">Variable</SelectItem>
              </CSelect>
            </TdValue>
            <TdLabel>Unidad de medida</TdLabel>
            <TdValue>
              <CSelect value={state.unidadMedida} onValueChange={v => onChange('unidadMedida', v)}>
                <SelectItem value="%">Porcentaje (%)</SelectItem>
                <SelectItem value="Número">Número</SelectItem>
                <SelectItem value="Unidades">Unidades</SelectItem>
                <SelectItem value="Días">Días</SelectItem>
                <SelectItem value="Horas">Horas</SelectItem>
                <SelectItem value="Tasa">Tasa</SelectItem>
                <SelectItem value="Pesos">Pesos</SelectItem>
                <SelectItem value="Kilogramos">Kilogramos</SelectItem>
              </CSelect>
            </TdValue>
          </tr>

          {/* Clase + Períodos sin medición */}
          <tr className="border-b">
            <TdLabel>Clase</TdLabel>
            <TdValue>
              <CSelect value={state.clase} onValueChange={v => onChange('clase', v)}>
                <SelectItem value="Eficacia">Eficacia</SelectItem>
                <SelectItem value="Eficiencia">Eficiencia</SelectItem>
                <SelectItem value="Efectividad">Efectividad</SelectItem>
              </CSelect>
            </TdValue>
            <TdLabel>Períodos sin medición</TdLabel>
            <TdValue>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="permitirPeriodos"
                  checked={state.permitirPeriodosSinMedicion}
                  onCheckedChange={(v: boolean) => onChange('permitirPeriodosSinMedicion', v)}
                />
                <label htmlFor="permitirPeriodos" className="text-sm text-foreground/80 cursor-pointer select-none">
                  ¿Permitir períodos sin medición?
                </label>
              </div>
            </TdValue>
          </tr>

          {/* Descripción */}
          <tr className="border-b">
            <TdLabel className="align-top pt-2.5">Descripción</TdLabel>
            <TdValue colSpan={3}>
              <CTextarea value={state.descripcion}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('descripcion', e.target.value)}
                placeholder="Breve descripción del propósito del indicador" rows={3} />
            </TdValue>
          </tr>

          {/* ── INFORMACIÓN ADICIONAL ── */}
          <SectionHeader title="Información Adicional" />

          {/* Fuente de información */}
          <tr className="border-b">
            <TdLabel className="align-top pt-2.5">Fuente de información</TdLabel>
            <TdValue colSpan={3}>
              <CTextarea value={state.fuenteInformacion}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('fuenteInformacion', e.target.value)}
                placeholder="Describa la fuente de información..." rows={2} />
            </TdValue>
          </tr>

          {/* Control de cambios */}
          <tr className="border-b">
            <TdLabel className="align-top pt-2.5">Control de cambios</TdLabel>
            <TdValue colSpan={3}>
              {controlCambios.length > 0 && (
                <table className="w-full text-sm border rounded mb-2 overflow-hidden">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="px-3 py-1.5 text-left font-medium w-32 text-foreground/70">Fecha</th>
                      <th className="px-3 py-1.5 text-left font-medium text-foreground/70">Descripción</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {controlCambios.map((c, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="px-3 py-1.5 font-mono text-sm">{c.fecha}</td>
                        <td className="px-3 py-1.5 text-sm">{c.descripcion}</td>
                        <td className="text-center pr-1">
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6"
                            onClick={() => onEliminarCambio(i)}>
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <div className="flex gap-2 items-end">
                <div className="w-36 shrink-0">
                  <div className="text-xs text-foreground/60 mb-1">Fecha</div>
                  <DatePicker compact value={nuevoCambioFecha} onChange={setNuevoCambioFecha} />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-foreground/60 mb-1">Descripción del cambio</div>
                  <CInput value={nuevoCambioDesc}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNuevoCambioDesc(e.target.value)}
                    placeholder="Ej: Creación del indicador" />
                </div>
                <Button type="button" variant="outline" size="sm" className="h-8 text-sm shrink-0"
                  onClick={onAgregarCambio}
                  disabled={!nuevoCambioFecha || !nuevoCambioDesc.trim()}>
                  <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Agregar
                </Button>
              </div>
            </TdValue>
          </tr>

          {/* ── MEDICIÓN ── */}
          <SectionHeader title="Medición" />

          {/* Frecuencia + Finalidad */}
          <tr className="border-b">
            <TdLabel>Frecuencia</TdLabel>
            <TdValue>
              <CSelect value={state.frecuencia} onValueChange={v => onChange('frecuencia', v)}>
                <SelectItem value="mensual">Mensual</SelectItem>
                <SelectItem value="bimestral">Bimestral</SelectItem>
                <SelectItem value="trimestral">Trimestral</SelectItem>
                <SelectItem value="semestral">Semestral</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </CSelect>
            </TdValue>
            <TdLabel>Finalidad</TdLabel>
            <TdValue>
              <CSelect value={state.finalidad} onValueChange={v => onChange('finalidad', v)}>
                <SelectItem value="maximizar">Maximizar</SelectItem>
                <SelectItem value="minimizar">Minimizar</SelectItem>
              </CSelect>
            </TdValue>
          </tr>

          {/* Meta */}
          <tr className="border-b">
            <TdLabel>Meta</TdLabel>
            <TdValue colSpan={3}>
              <CInput type="number" value={state.meta}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('meta', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Valor numérico" className="max-w-[160px]" />
            </TdValue>
          </tr>

          {/* ── SEMÁFORO ── */}
          <SectionHeader title="Semáforo" />

          {/* Verde + Amarillo en la misma fila */}
          <tr className="border-b">
            <TdLabel>Verde máximo</TdLabel>
            <TdValue>
              <CInput type="number" value={state.verdeMax}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('verdeMax', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Límite verde" />
            </TdValue>
            <TdLabel>Amarillo máximo</TdLabel>
            <TdValue>
              <CInput type="number" value={state.amarilloMax}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('amarilloMax', e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="Límite amarillo" />
            </TdValue>
          </tr>

          <tr>
            <td colSpan={4} className="px-3 py-2">
              <p className="text-sm text-muted-foreground">
                El color <span className="font-medium text-red-500">Rojo</span> se asignará a valores fuera del rango Amarillo.
              </p>
            </td>
          </tr>

        </tbody>
      </table>
    </div>
  );
}

// ─── Formulario normal (modo creación) ───────────────────────────────────────

function FormNormal(p: FormSharedProps) {
  const { state, onChange, controlCambios, onAgregarCambio, onEliminarCambio,
    nuevoCambioFecha, setNuevoCambioFecha, nuevoCambioDesc, setNuevoCambioDesc } = p;

  return (
    <div className="space-y-6">
      {/* Información General */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold tracking-tight font-headline">Información General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="codigo">Código</Label>
            <Input id="codigo" value={state.codigo} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('codigo', e.target.value)} placeholder="Ej: IND-001" />
          </div>
          <div className="space-y-1">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" value={state.nombre} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('nombre', e.target.value)} placeholder="Nombre completo del indicador" />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={state.tipo} onValueChange={v => onChange('tipo', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="indicador">Indicador</SelectItem>
                <SelectItem value="variable">Variable</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Clase</Label>
            <Select value={state.clase} onValueChange={v => onChange('clase', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Eficacia">Eficacia</SelectItem>
                <SelectItem value="Eficiencia">Eficiencia</SelectItem>
                <SelectItem value="Efectividad">Efectividad</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Unidad de medida</Label>
            <Select value={state.unidadMedida} onValueChange={v => onChange('unidadMedida', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="%">Porcentaje (%)</SelectItem>
                <SelectItem value="Número">Número</SelectItem>
                <SelectItem value="Unidades">Unidades</SelectItem>
                <SelectItem value="Días">Días</SelectItem>
                <SelectItem value="Horas">Horas</SelectItem>
                <SelectItem value="Tasa">Tasa</SelectItem>
                <SelectItem value="Pesos">Pesos</SelectItem>
                <SelectItem value="Kilogramos">Kilogramos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1 col-span-2">
            <Label>Descripción</Label>
            <Textarea value={state.descripcion} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('descripcion', e.target.value)}
              placeholder="Breve descripción del propósito del indicador" rows={3} />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <Checkbox
              id="permitirPeriodosCreate"
              checked={state.permitirPeriodosSinMedicion}
              onCheckedChange={(v: boolean) => onChange('permitirPeriodosSinMedicion', v)}
            />
            <label htmlFor="permitirPeriodosCreate" className="text-sm cursor-pointer select-none">
              ¿Permitir períodos sin medición?
            </label>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold tracking-tight font-headline">Información adicional</h3>
        <div className="space-y-1">
          <Label>Fuente de información</Label>
          <Textarea value={state.fuenteInformacion}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange('fuenteInformacion', e.target.value)}
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
                          onClick={() => onEliminarCambio(i)}>
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
              <Input value={nuevoCambioDesc} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNuevoCambioDesc(e.target.value)}
                placeholder="Ej: Creación del indicador" />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={onAgregarCambio}
              disabled={!nuevoCambioFecha || !nuevoCambioDesc.trim()}>
              <PlusCircle className="mr-1.5 h-4 w-4" /> Agregar
            </Button>
          </div>
        </div>
      </div>

      {/* Medición */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold tracking-tight font-headline">Medición</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <Label>Frecuencia</Label>
            <Select value={state.frecuencia} onValueChange={v => onChange('frecuencia', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
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
            <Label>Finalidad</Label>
            <Select value={state.finalidad} onValueChange={v => onChange('finalidad', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="maximizar">Maximizar</SelectItem>
                <SelectItem value="minimizar">Minimizar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Meta</Label>
            <Input type="number" value={state.meta}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('meta', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Valor numérico" />
          </div>
        </div>
      </div>

      {/* Semáforo */}
      <div className="space-y-4 border-t pt-4">
        <h3 className="text-lg font-semibold tracking-tight font-headline">Semáforo</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Verde máximo</Label>
            <Input type="number" value={state.verdeMax}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('verdeMax', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Límite para estado Verde" />
          </div>
          <div className="space-y-1">
            <Label>Amarillo máximo</Label>
            <Input type="number" value={state.amarilloMax}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange('amarilloMax', e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="Límite para estado Amarillo" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">El color Rojo se asignará a valores fuera del rango Amarillo.</p>
      </div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

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

  const [state, setState] = useState({
    codigo: indicadorExistente?.codigo ?? '',
    nombre: indicadorExistente?.nombre ?? '',
    tipo: indicadorExistente?.tipo ?? 'indicador' as 'indicador' | 'variable',
    clase: indicadorExistente?.clase ?? 'Eficacia',
    unidadMedida: indicadorExistente?.unidadMedida ?? '%',
    descripcion: indicadorExistente?.descripcion ?? '',
    frecuencia: indicadorExistente?.frecuencia ?? 'mensual' as 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual',
    finalidad: indicadorExistente?.finalidad ?? 'maximizar' as 'minimizar' | 'maximizar',
    meta: indicadorExistente?.meta ?? 0 as number | '',
    verdeMax: indicadorExistente?.verdeMax ?? 0 as number | '',
    amarilloMax: indicadorExistente?.amarilloMax ?? 0 as number | '',
    fuenteInformacion: indicadorExistente?.fuenteInformacion ?? '',
    permitirPeriodosSinMedicion: indicadorExistente?.permitirPeriodosSinMedicion ?? false,
  });

  const onChange = (field: string, value: any) => setState(prev => ({ ...prev, [field]: value }));

  const [controlCambios, setControlCambios] = useState<{ fecha: string; descripcion: string }[]>(
    indicadorExistente?.controlCambios ?? []
  );
  const [nuevoCambioFecha, setNuevoCambioFecha] = useState<Date | undefined>();
  const [nuevoCambioDesc, setNuevoCambioDesc] = useState('');

  const onAgregarCambio = () => {
    if (!nuevoCambioFecha || !nuevoCambioDesc.trim()) return;
    setControlCambios(prev => [...prev, { fecha: format(nuevoCambioFecha, 'dd/MM/yyyy'), descripcion: nuevoCambioDesc.trim() }]);
    setNuevoCambioFecha(undefined);
    setNuevoCambioDesc('');
  };
  const onEliminarCambio = (index: number) => setControlCambios(prev => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.nombre || !state.codigo || state.meta === '' || !procesoId) {
      toast({ title: 'Error de validación', description: 'Complete los campos requeridos (Código, Nombre, Meta).', variant: 'destructive' });
      return;
    }
    setIsLoading(true);

    const indicadorData: Omit<Indicador, 'id'> = {
      codigo: state.codigo,
      nombre: state.nombre,
      tipo: state.tipo,
      clase: state.clase,
      unidadMedida: state.unidadMedida,
      finalidad: state.finalidad,
      frecuencia: state.frecuencia,
      meta: Number(state.meta),
      verdeMax: state.verdeMax === '' ? 0 : Number(state.verdeMax),
      amarilloMax: state.amarilloMax === '' ? 0 : Number(state.amarilloMax),
      descripcion: state.descripcion,
      fuenteInformacion: state.fuenteInformacion,
      controlCambios,
      procesoId: subprocesoId ?? procesoId,
      ...(subprocesoId && { subprocesoId }),
      diaCorte: indicadorExistente?.diaCorte ?? 'Último día del mes',
      formula: indicadorExistente?.formula ?? '',
      interpretacion: indicadorExistente?.interpretacion ?? '',
      categorias: indicadorExistente?.categorias ?? [],
      atributosCalidad: indicadorExistente?.atributosCalidad ?? [],
      activo: indicadorExistente?.activo ?? true,
      permitirPeriodosSinMedicion: state.permitirPeriodosSinMedicion,
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
      toast({ title: 'Error', description: `No se pudo ${isEditing ? 'actualizar' : 'crear'} el indicador.`, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const formProps: FormSharedProps = {
    state, onChange, controlCambios, onAgregarCambio, onEliminarCambio,
    nuevoCambioFecha, setNuevoCambioFecha, nuevoCambioDesc, setNuevoCambioDesc,
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader className={cn('border-b', isEditing && 'py-3 px-4')}>
          <CardTitle className={cn('font-headline', isEditing && 'text-base')}>
            {isEditing ? 'Editar Indicador' : 'Crear Nuevo Indicador'}
          </CardTitle>
          {!isEditing && (
            <p className="text-sm text-muted-foreground">
              Complete la información para registrar un nuevo indicador de proceso.
            </p>
          )}
        </CardHeader>

        <CardContent className={isEditing ? 'p-4' : 'space-y-6 pt-4'}>
          {isEditing ? <FormCompacto {...formProps} /> : <FormNormal {...formProps} />}
        </CardContent>

        <CardFooter className={cn('flex justify-end gap-2 border-t', isEditing && 'py-3 px-4')}>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}
            className={isEditing ? 'h-8 text-sm' : undefined}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}
            className={isEditing ? 'h-8 text-sm' : undefined}>
            {isLoading ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Guardar Indicador'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default FormIndicador;