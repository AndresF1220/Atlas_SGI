
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FileText,
  User,
  Target,
  GitBranch,
  Edit,
  Loader,
} from 'lucide-react';
import CaracterizacionEditor from './CaracterizacionEditor';
import { useAuth } from '@/lib/auth';
import { useCaracterizacion, useEntityName } from '@/hooks/use-areas-data';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';

interface CaracterizacionPanelProps {
  idEntidad: string;
  tipo: 'area' | 'proceso' | 'subproceso';
  areaId?: string;
  procesoId?: string;
}

export default function CaracterizacionPanel({
  idEntidad,
  tipo,
  areaId,
  procesoId
}: CaracterizacionPanelProps) {
  const { userRole } = useAuth();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const firestore = useFirestore();
  
  let docId: string | null = null;
  if (tipo === 'area') {
    docId = `area-${idEntidad}`;
  } else if (tipo === 'proceso') {
    docId = `process-${idEntidad}`;
  } else if (tipo === 'subproceso') {
    docId = `subprocess-${idEntidad}`;
  }

  const { caracterizacion, isLoading: loading } = useCaracterizacion(docId);
  const { entityName, isLoading: isEntityNameLoading } = useEntityName(idEntidad, tipo, areaId, procesoId);
  
  const settingsRef = useMemoFirebase(() => (firestore) ? doc(firestore, 'settings', 'organizational') : null, [firestore]);
  const { data: settings, isLoading: isSettingsLoading } = useDoc(settingsRef);

  const isDataEmpty = !caracterizacion || Object.values(caracterizacion).every(value => !value);

  const getTitleForType = (type: string) => {
    if (type === 'area') return 'Área';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
        case 'Estratégico': return 'bg-blue-500 hover:bg-blue-600';
        case 'Misional': return 'bg-green-500 hover:bg-green-600';
        case 'Apoyo': return 'bg-yellow-500 hover:bg-yellow-600';
        case 'Evaluación': return 'bg-indigo-500 hover:bg-indigo-600';
        default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const logoUrl = settings?.logoUrl;

  return (
    <Card>
        <CardHeader className="flex flex-row items-center justify-end space-y-0 pb-2">
             {userRole === 'superadmin' && (
                <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
                    <DialogTrigger asChild>
                    <Button variant="outline" size="sm" disabled={loading}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar Caracterización
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[625px] overflow-y-auto max-h-[80vh]">
                        <DialogHeader>
                            <DialogTitle>Editar Caracterización</DialogTitle>
                            <DialogDescription>
                                Ajuste los detalles para est{tipo === 'area' ? 'a' : 'e'} {tipo === 'area' ? 'área' : tipo}.
                            </DialogDescription>
                        </DialogHeader>
                        <CaracterizacionEditor 
                            entityId={idEntidad}
                            entityType={tipo}
                            onSaved={() => setIsEditorOpen(false)}
                            initialData={{...(caracterizacion || {}), logoUrl: logoUrl}}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </CardHeader>
      <CardContent>
        {loading || isSettingsLoading ? (
           <div className="flex justify-center items-center h-60">
                <Loader className="h-8 w-8 animate-spin text-primary" />
           </div>
        ) : (
            <div>
                {/* Header Section */}
                <div className="flex justify-between items-center pb-4 border-b">
                    {/* Left: Logo */}
                    <div>
                        {logoUrl ? (
                            <img src={logoUrl} alt="Logo" className="h-16"/>
                        ) : (
                            <div className="h-16 w-16 bg-gray-200 flex items-center justify-center rounded-md">
                                <span className="font-bold text-xl text-gray-500">DE</span>
                            </div>
                        )}
                    </div>
                    {/* Center: Titles */}
                    <div className="flex-grow">
                        <h3 className="font-bold text-lg text-center">Dusakawi EPSI</h3>
                        <p className="text-md text-muted-foreground text-center">{isEntityNameLoading ? 'Cargando...' : `${getTitleForType(tipo)}: ${entityName}`}</p>
                    </div>
                    {/* Right: Metadata */}
                    <div>
                        <table className="text-sm">
                            <tbody>
                                <tr>
                                    <td className="font-semibold pr-2">Código:</td>
                                    <td>{caracterizacion?.codigo || 'N/A'}</td>
                                </tr>
                                <tr>
                                    <td className="font-semibold pr-2">Versión:</td>
                                    <td>{caracterizacion?.version || 'N/A'}</td>
                                </tr>
                                {caracterizacion?.tipoProceso && (
                                    <tr>
                                        <td className="font-semibold pr-2">Tipo:</td>
                                        <td>
                                            <Badge className={`${getTypeColor(caracterizacion.tipoProceso)} text-white`}>
                                            {caracterizacion.tipoProceso}
                                            </Badge>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Main Content */}
                {isDataEmpty ? (
                    <div className="text-center py-10">
                        <FileText className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900">Sin Caracterización</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {userRole === 'superadmin' 
                                ? "Haga clic en 'Editar Caracterización' para comenzar."
                                : "Aún no se ha agregado información de caracterización."
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6 pt-6">
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <Target className="h-5 w-5 text-primary" />
                                Objetivo
                            </h3>
                            <p className="text-muted-foreground whitespace-pre-wrap pl-7">
                                {caracterizacion?.objetivo || <em>No definido.</em>}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <User className="h-5 w-5 text-primary" />
                                Responsable
                            </h3>
                            <p className="text-muted-foreground pl-7">
                                {caracterizacion?.responsable || <em>No definido.</em>}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-semibold flex items-center gap-2 text-lg">
                                <GitBranch className="h-5 w-5 text-primary" />
                                Alcance
                            </h3>
                            <p className="text-muted-foreground whitespace-pre-wrap pl-7">
                                {caracterizacion?.alcance || <em>No definido.</em>}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        )}
      </CardContent>
    </Card>
  );
}
