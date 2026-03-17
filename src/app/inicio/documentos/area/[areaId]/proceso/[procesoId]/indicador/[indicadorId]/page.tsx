'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { obtenerIndicador } from '@/lib/indicadores';
import { Indicador } from '@/types/indicadores';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft } from 'lucide-react';

export default function IndicadorDetallePage() {
  const params = useParams();
  const router = useRouter();
  const indicadorId = params.indicadorId as string;

  const [indicador, setIndicador] = useState<Indicador | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!indicadorId) return;
    obtenerIndicador(indicadorId)
      .then(setIndicador)
      .finally(() => setIsLoading(false));
  }, [indicadorId]);

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
          <p className="text-muted-foreground text-sm">Gráfica de seguimiento próximamente.</p>
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
                  ['Meta', indicador.meta],
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
          <p className="text-muted-foreground text-sm">Historial de análisis próximamente.</p>
        </TabsContent>

        <TabsContent value="mediciones" className="mt-4">
          <p className="text-muted-foreground text-sm">Registro de mediciones próximamente.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}