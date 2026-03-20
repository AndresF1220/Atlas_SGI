'use client';

import { Indicador } from '@/types/indicadores';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useState, useEffect } from 'react';

const unidadLabel = (u: string) => {
  const map: Record<string, string> = {
    '%': 'Porcentaje (%)',
    'Número': 'Número',
    'Unidades': 'Unidades',
    'Días': 'Días',
    'Horas': 'Horas',
    'Tasa': 'Tasa',
    'Pesos': 'Pesos ($)',
    'Kilogramos': 'Kilogramos (kg)',
  };
  return map[u] ?? u;
};

function IndicadorRow({ indicador, onVerDetalle }: { indicador: Indicador, onVerDetalle: (id: string) => void }) {
  const firestore = useFirestore();
  const [ultima, setUltima] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    if (!firestore || !indicador.id) return;
    const q = query(
      collection(firestore, 'mediciones'),
      where('indicadorId', '==', indicador.id),
      orderBy('periodo', 'desc'),
      limit(1)
    );
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        setUltima(null);
      } else {
        const doc = snap.docs[0].data();
        setUltima(doc.semaforo);
      }
    });
    return unsub;
  }, [firestore, indicador.id]);

  let estadoBadge = <span className="inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-700 border-gray-300">Sin datos</span>;

  if (ultima !== undefined && ultima !== null) {
    const colorKey = ultima as 'verde' | 'amarillo' | 'rojo';
    const estilos = {
      verde: 'bg-green-100 text-green-700 border-green-300',
      amarillo: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      rojo: 'bg-red-100 text-red-700 border-red-300'
    };
    const labels = { verde: 'Óptimo', amarillo: 'Aceptable', rojo: 'Crítico' };

    estadoBadge = (
      <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estilos[colorKey] ?? estilos.rojo}`}>
        {labels[colorKey] ?? 'Crítico'}
      </span>
    );
  } else if (ultima === undefined) {
    estadoBadge = <span className="inline-flex items-center justify-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-gray-50 text-gray-400 border-gray-200">...</span>;
  }

  return (
    <TableRow className="h-9">
      <TableCell className="py-1.5 px-3 text-sm font-mono">{indicador.codigo}</TableCell>
      <TableCell className="py-1.5 px-3 text-sm font-medium">{indicador.nombre}</TableCell>
      <TableCell className="py-1.5 px-3 text-sm">{indicador.clase}</TableCell>
      <TableCell className="py-1.5 px-3 text-sm capitalize">{indicador.frecuencia}</TableCell>
      <TableCell className="py-1.5 px-3 text-sm">{unidadLabel(indicador.unidadMedida)}</TableCell>
      <TableCell className="py-1.5 px-3 text-sm text-center">{estadoBadge}</TableCell>
      <TableCell className="py-1.5 px-3 text-sm text-right">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs px-2"
          onClick={() => indicador.id && onVerDetalle(indicador.id)}
        >
          Ver
        </Button>
      </TableCell>
    </TableRow>
  );
}

interface TablaIndicadoresProps {
  indicadores: Indicador[];
  onVerDetalle: (id: string) => void;
}

export function TablaIndicadores({ indicadores, onVerDetalle }: TablaIndicadoresProps) {
  if (!indicadores || indicadores.length === 0) {
    return <p className="text-muted-foreground text-sm">No hay indicadores registrados.</p>;
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="py-2 px-3 text-sm text-center font-semibold">Código</TableHead>
            <TableHead className="py-2 px-3 text-sm text-center font-semibold">Nombre</TableHead>
            <TableHead className="py-2 px-3 text-sm text-center font-semibold">Clase</TableHead>
            <TableHead className="py-2 px-3 text-sm text-center font-semibold">Frecuencia</TableHead>
            <TableHead className="py-2 px-3 text-sm text-center font-semibold">Unidad</TableHead>
            <TableHead className="py-2 px-3 text-sm text-center font-semibold">Estado</TableHead>
            <TableHead className="py-2 px-3 text-sm text-center font-semibold">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indicadores.map((indicador) => (
            <IndicadorRow key={indicador.id} indicador={indicador} onVerDetalle={onVerDetalle} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TablaIndicadores;