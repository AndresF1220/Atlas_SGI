'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { TableProperties, PlusCircle } from 'lucide-react';
import EntradasSalidasEditor from './EntradasSalidasEditor';

export interface FilaESC {
  id: string;
  fase: 'Planear' | 'Hacer' | 'Verificar' | 'Actuar';
  proveedor: string;
  entrada: string;
  actividades: string;
  responsable: string;
  salida: string;
  cliente: string;
  orden: number;
  entidadId: string;
  tipoEntidad: 'area' | 'proceso' | 'subproceso';
}

const FASES = ['Planear', 'Hacer', 'Verificar', 'Actuar'] as const;

const faseColors: Record<string, string> = {
  Planear:   'bg-blue-50 text-blue-800 border-blue-200',
  Hacer:     'bg-green-50 text-green-800 border-green-200',
  Verificar: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  Actuar:    'bg-purple-50 text-purple-800 border-purple-200',
};

interface Props {
  entidadId: string;
  tipoEntidad: 'area' | 'proceso' | 'subproceso';
}

export default function EntradasSalidasPanel({ entidadId, tipoEntidad }: Props) {
  const firestore = useFirestore();
  const { userRole } = useAuth();
  const [filas, setFilas] = useState<FilaESC[]>([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [filaEditar, setFilaEditar] = useState<FilaESC | null>(null);

  const canEdit = userRole === 'superadmin' || userRole === 'admin';

  useEffect(() => {
    if (!firestore || !entidadId) return;

    const q = query(
      collection(firestore, 'entradas_salidas'),
      where('entidadId', '==', entidadId),
      orderBy('orden', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as FilaESC));
      setFilas(data);
      setLoading(false);
    });

    return () => unsub();
  }, [firestore, entidadId]);

  const handleNuevaFila = () => {
    setFilaEditar(null);
    setEditorOpen(true);
  };

  const handleEditarFila = (fila: FilaESC) => {
    setFilaEditar(fila);
    setEditorOpen(true);
  };

  const filasPorFase = (fase: string) => filas.filter(f => f.fase === fase);
  const hayFilas = filas.length > 0;

  return (
    <div className="rounded-lg border bg-white shadow-sm mt-4">
      {/* Header de sección */}
      <div className="flex items-center justify-between px-6 py-3 border-b">
        <div className="flex items-center gap-2">
          <TableProperties className="h-4 w-4 text-gray-500" />
          <span className="font-semibold text-gray-800 text-sm">Entradas y Salidas</span>
        </div>
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
            onClick={handleNuevaFila}
          >
            <PlusCircle className="h-3.5 w-3.5 mr-1" />
            Agregar fila
          </Button>
        )}
      </div>

      {/* Contenido */}
      <div className="px-4 py-3">
        {loading ? (
          <div className="h-16 flex items-center justify-center text-gray-400 text-sm">
            Cargando...
          </div>
        ) : !hayFilas ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-400">
            <TableProperties className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">Sin entradas y salidas registradas</p>
            {canEdit && (
              <p className="text-xs mt-1">Haga clic en "Agregar fila" para comenzar.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">Proveedor</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">Entrada</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">Actividades</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">Responsable</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">Salida</th>
                  <th className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-700">Cliente</th>
                  {canEdit && <th className="border border-gray-200 px-2 py-2 w-8"></th>}
                </tr>
              </thead>
              <tbody>
                {FASES.map(fase => {
                  const filasFase = filasPorFase(fase);
                  if (filasFase.length === 0) return null;
                  return (
                    <React.Fragment key={fase}>
                      <tr>
                        <td
                          colSpan={canEdit ? 7 : 6}
                          className={'border border-gray-200 px-3 py-1.5 font-bold text-xs text-center ' + faseColors[fase]}
                        >
                          {fase.toUpperCase()}
                        </td>
                      </tr>
                      {filasFase.map(fila => (
                        <tr
                          key={fila.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => canEdit && handleEditarFila(fila)}
                        >
                          <td className="border border-gray-200 px-3 py-2 align-top text-gray-700">{fila.proveedor}</td>
                          <td className="border border-gray-200 px-3 py-2 align-top text-gray-700">{fila.entrada}</td>
                          <td className="border border-gray-200 px-3 py-2 align-top text-gray-700">{fila.actividades}</td>
                          <td className="border border-gray-200 px-3 py-2 align-top text-gray-700">{fila.responsable}</td>
                          <td className="border border-gray-200 px-3 py-2 align-top text-gray-700">{fila.salida}</td>
                          <td className="border border-gray-200 px-3 py-2 align-top text-gray-700">{fila.cliente}</td>
                          {canEdit && (
                            <td className="border border-gray-200 px-2 py-2 text-center align-top">
                              <span className="text-gray-300 hover:text-gray-600 text-xs">✎</span>
                            </td>
                          )}
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal editor */}
      {editorOpen && (
        <EntradasSalidasEditor
          open={editorOpen}
          onClose={() => setEditorOpen(false)}
          entidadId={entidadId}
          tipoEntidad={tipoEntidad}
          filaExistente={filaEditar}
          ordenSiguiente={filas.length}
        />
      )}
    </div>
  );
}