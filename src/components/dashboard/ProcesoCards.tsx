'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import React from 'react';
import { EntityOptionsDropdown } from './EntityOptionsDropdown';
import { useAuth } from '@/lib/auth';

type Proceso = { id: string; nombre: string; };
type Subproceso = { id: string; nombre: string; };

interface ProcesoCardsProps {
    areaId: string;
    procesoId?: string;
    procesos?: readonly Proceso[];
    subprocesos?: readonly Subproceso[];
}

const ItemCard = ({ item, linkHref, entityType, parentId, grandParentId }: { item: any, linkHref: string, entityType: 'process' | 'subprocess', parentId: string, grandParentId?: string }) => {
    const { toast } = useToast();
    const { userRole } = useAuth();

    const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if ((e.target as HTMLElement).closest('[data-radix-dropdown-menu-trigger]')) {
             e.preventDefault();
             e.stopPropagation();
             return;
        }

        if (!item || !item.id) {
            e.preventDefault();
            toast({
                variant: 'destructive',
                title: 'Elemento no encontrado',
                description: 'El elemento que intenta abrir ya no existe o no se pudo cargar.',
            });
        } else {
             window.location.href = linkHref;
        }
    };
    
    return (
        <div className="relative group">
            <Card 
                className="h-full flex flex-col items-center justify-center text-center p-6 transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                onClick={handleClick}
            >
                <Folder className="h-16 w-16 text-primary mb-4" />
                <CardHeader className="p-0">
                    <CardTitle className="font-headline text-lg">{item?.nombre || 'Elemento inválido'}</CardTitle>
                </CardHeader>
            </Card>
             {userRole === 'superadmin' && item.id && (
                 <div 
                    className="absolute top-2 right-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity"
                 >
                    <EntityOptionsDropdown
                        entityId={item.id}
                        entityType={entityType}
                        entityName={item.nombre}
                        parentId={parentId}
                        grandParentId={grandParentId}
                        redirectOnDelete={entityType === 'process' ? `/inicio/documentos/area/${parentId}` : `/inicio/documentos/area/${grandParentId}/proceso/${parentId}`}
                    />
                </div>
            )}
        </div>
    );
};


export default function ProcesoCards({ areaId, procesoId, procesos, subprocesos }: ProcesoCardsProps) {
    if (procesoId && subprocesos) {
        // Logic to display sub-processes
        return (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {subprocesos.map((sub) => (
                    <ItemCard 
                        key={sub.id}
                        item={sub}
                        linkHref={`/inicio/documentos/area/${areaId}/proceso/${procesoId}/subproceso/${sub.id}`}
                        entityType="subprocess"
                        parentId={procesoId}
                        grandParentId={areaId}
                    />
                ))}
             </div>
        );
    }

    if (!procesoId && procesos) {
        // Logic to display processes
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {procesos.map((proceso) => (
                     <ItemCard 
                        key={proceso.id}
                        item={proceso}
                        linkHref={`/inicio/documentos/area/${areaId}/proceso/${proceso.id}`}
                        entityType="process"
                        parentId={areaId}
                    />
                ))}
            </div>
        );
    }
    
    return null;
}
