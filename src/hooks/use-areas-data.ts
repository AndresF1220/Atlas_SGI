'use client';

import { collection, doc, query } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useMemoFirebase } from '@/firebase';

export type Subproceso = {
    id: string;
    nombre: string;
    slug: string;
}

export type Proceso = {
    id: string;
    nombre: string;
    slug: string;
}

export type Area = {
    id: string;
    nombre: string;
    slug: string;
    icono: string;
    tipo?: string;
}

export interface CaracterizacionData {
  objetivo: string;
  alcance: string;
  responsable: string;
  editable?: boolean;
}

export function useAreas() {
    const firestore = useFirestore();
    const areasQuery = useMemoFirebase(() => firestore ? query(collection(firestore, 'areas')) : null, [firestore]);
    const { data, isLoading, error } = useCollection(areasQuery);
    const areas = data as Area[] | null;
    return { areas, isLoading, error };
}

export function useArea(areaId: string | null) {
    const firestore = useFirestore();
    const areaRef = useMemoFirebase(() => (areaId && firestore) ? doc(firestore, 'areas', areaId) : null, [firestore, areaId]);
    const { data, isLoading, error } = useDoc(areaRef);
    const area = data as Area | null;
    return { area, isLoading, error };
}

export function useProcesos(areaId: string | null) {
    const firestore = useFirestore();
    const procesosQuery = useMemoFirebase(() => (areaId && firestore) ? query(collection(firestore, 'areas', areaId, 'procesos')) : null, [firestore, areaId]);
    const { data, isLoading, error } = useCollection(procesosQuery);
    const procesos = data as Proceso[] | null;
    return { procesos, isLoading, error };
}

export function useProceso(areaId: string | null, procesoId: string | null) {
    const firestore = useFirestore();
    const procesoRef = useMemoFirebase(() => (areaId && procesoId && firestore) ? doc(firestore, 'areas', areaId, 'procesos', procesoId) : null, [firestore, areaId, procesoId]);
    const { data, isLoading, error } = useDoc(procesoRef);
    const proceso = data as Proceso | null;
    return { proceso, isLoading, error };
}

export function useSubprocesos(areaId: string | null, procesoId: string | null) {
    const firestore = useFirestore();
    const subprocesosQuery = useMemoFirebase(() => (areaId && procesoId && firestore) ? query(collection(firestore, 'areas', areaId, 'procesos', procesoId, 'subprocesos')) : null, [firestore, areaId, procesoId]);
    const { data, isLoading, error } = useCollection(subprocesosQuery);
    const subprocesos = data as Subproceso[] | null;
    return { subprocesos, isLoading, error };
}

export function useSubproceso(areaId: string | null, procesoId: string | null, subprocesoId: string | null) {
    const firestore = useFirestore();
    const subprocesoRef = useMemoFirebase(() => (areaId && procesoId && subprocesoId && firestore) ? doc(firestore, 'areas', areaId, 'procesos', procesoId, 'subprocesos', subprocesoId) : null, [firestore, areaId, procesoId, subprocesoId]);
    const { data, isLoading, error } = useDoc(subprocesoRef);
    const subproceso = data as Subproceso | null;
    return { subproceso, isLoading, error };
}

export function useCaracterizacion(caracterizacionId: string | null) {
    const firestore = useFirestore();
    const caracterizacionRef = useMemoFirebase(() => (caracterizacionId && firestore) ? doc(firestore, 'caracterizaciones', caracterizacionId) : null, [firestore, caracterizacionId]);
    const { data, isLoading, error } = useDoc(caracterizacionRef);
    const caracterizacion = data as CaracterizacionData | null;
    return { caracterizacion, isLoading, error };
}