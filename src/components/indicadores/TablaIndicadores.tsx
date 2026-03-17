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

interface TablaIndicadoresProps {
  indicadores: Indicador[];
  onVerDetalle: (id: string) => void;
}

export function TablaIndicadores({ indicadores, onVerDetalle }: TablaIndicadoresProps) {
  if (!indicadores || indicadores.length === 0) {
    return <p className="text-muted-foreground text-sm">No hay indicadores registrados.</p>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Código</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Clase</TableHead>
            <TableHead>Frecuencia</TableHead>
            <TableHead>Unidad</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {indicadores.map((indicador) => (
            <TableRow key={indicador.id}>
              <TableCell className="font-mono text-sm">{indicador.codigo}</TableCell>
              <TableCell className="font-medium">{indicador.nombre}</TableCell>
              <TableCell>{indicador.clase}</TableCell>
              <TableCell className="capitalize">{indicador.frecuencia}</TableCell>
              <TableCell>{indicador.unidadMedida}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => indicador.id && onVerDetalle(indicador.id)}
                >
                  Ver
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default TablaIndicadores;