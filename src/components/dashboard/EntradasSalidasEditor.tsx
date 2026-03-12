'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { saveFilaEntradasSalidasAction, deleteFilaEntradasSalidasAction } from '@/app/actions';
import type { FilaESC } from './EntradasSalidasPanel';
import { Loader2, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  entidadId: string;
  tipoEntidad: 'area' | 'proceso' | 'subproceso';
  filaExistente: FilaESC | null;
  ordenSiguiente: number;
}

const FASES = ['Planear', 'Hacer', 'Verificar', 'Actuar'] as const;

export default function EntradasSalidasEditor({
  open,
  onClose,
  entidadId,
  tipoEntidad,
  filaExistente,
  ordenSiguiente,
}: Props) {
  const isEditing = !!filaExistente;
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fase, setFase] = useState<string>(filaExistente?.fase || 'Planear');
  const [proveedor, setProveedor] = useState(filaExistente?.proveedor || '');
  const [entrada, setEntrada] = useState(filaExistente?.entrada || '');
  const [actividades, setActividades] = useState(filaExistente?.actividades || '');
  const [responsable, setResponsable] = useState(filaExistente?.responsable || '');
  const [salida, setSalida] = useState(filaExistente?.salida || '');
  const [cliente, setCliente] = useState(filaExistente?.cliente || '');

  const handleGuardar = () => {
    if (!fase || !proveedor || !entrada || !actividades || !responsable || !salida || !cliente) {
      setError('Todos los campos son obligatorios.');
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await saveFilaEntradasSalidasAction({
        id: filaExistente?.id || null,
        entidadId,
        tipoEntidad,
        fase: fase as FilaESC['fase'],
        proveedor,
        entrada,
        actividades,
        responsable,
        salida,
        cliente,
        orden: filaExistente?.orden ?? ordenSiguiente,
      });

      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  };

  const handleEliminar = async () => {
    if (!filaExistente?.id) return;
    setIsDeleting(true);
    const result = await deleteFilaEntradasSalidasAction(filaExistente.id);
    setIsDeleting(false);
    if (result.error) {
      setError(result.error);
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[640px] overflow-y-auto max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Editar fila' : 'Agregar fila'} — Entradas y Salidas</DialogTitle>
          <DialogDescription>
            Complete todos los campos para la estructura del proceso.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Fase PHVA */}
          <div className="space-y-1">
            <Label>Fase PHVA</Label>
            <Select value={fase} onValueChange={setFase}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione una fase" />
              </SelectTrigger>
              <SelectContent>
                {FASES.map(f => (
                  <SelectItem key={f} value={f}>{f}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Proveedor y Cliente en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Proveedor</Label>
              <Input value={proveedor} onChange={e => setProveedor(e.target.value)} placeholder="Quién suministra la entrada" />
            </div>
            <div className="space-y-1">
              <Label>Cliente</Label>
              <Input value={cliente} onChange={e => setCliente(e.target.value)} placeholder="Quién recibe la salida" />
            </div>
          </div>

          {/* Entrada */}
          <div className="space-y-1">
            <Label>Entrada</Label>
            <Textarea
              value={entrada}
              onChange={e => setEntrada(e.target.value)}
              placeholder="Insumos, información o recursos que ingresan al proceso"
              rows={2}
            />
          </div>

          {/* Actividades */}
          <div className="space-y-1">
            <Label>Actividades / Procedimiento</Label>
            <Textarea
              value={actividades}
              onChange={e => setActividades(e.target.value)}
              placeholder="Descripción de las actividades realizadas"
              rows={3}
            />
          </div>

          {/* Responsable y Salida en fila */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Responsable</Label>
              <Input value={responsable} onChange={e => setResponsable(e.target.value)} placeholder="Cargo o persona responsable" />
            </div>
            <div className="space-y-1">
              <Label>Salida</Label>
              <Input value={salida} onChange={e => setSalida(e.target.value)} placeholder="Producto o resultado generado" />
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-md">{error}</p>
          )}

          {/* Botones */}
          <div className="flex items-center justify-between pt-2">
            {isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={handleEliminar}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
                Eliminar fila
              </Button>
            ) : <div />}

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} disabled={isPending}>
                Cancelar
              </Button>
              <Button size="sm" onClick={handleGuardar} disabled={isPending}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                {isEditing ? 'Guardar cambios' : 'Agregar fila'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
