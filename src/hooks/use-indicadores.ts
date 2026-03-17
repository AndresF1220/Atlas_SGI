'use client';

import { collection, query, where } from 'firebase/firestore';
import { useFirestore, useMemoFirebase } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { Indicador } from '@/types/indicadores';
import { useAuth } from '@/lib/auth';

export function useIndicadoresPorEntidad(entidadId: string | null | undefined) {
    const firestore = useFirestore();
    const { user, isRoleLoading } = useAuth();
    
    const indicadoresQuery = useMemoFirebase(() => {
        if (!entidadId || !firestore || !user || isRoleLoading) return null;
        return query(
            collection(firestore, 'indicadores'),
            where('procesoId', '==', entidadId)
        );
    }, [firestore, entidadId, user, isRoleLoading]);

    const { data, isLoading } = useCollection(indicadoresQuery ?? null);
    const indicadores = data as Indicador[] | null;
    return { indicadores, isLoading, error: null };
}