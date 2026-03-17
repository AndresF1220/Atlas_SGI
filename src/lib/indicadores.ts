import { db } from '@/firebase/client-config';
import { collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { Indicador, Medicion, Categoria } from '@/types/indicadores';

// Helper to convert Firestore doc to a typed object with ID
const fromFirestore = <T>(doc: any): T & { id: string } => {
  const data = doc.data();
  return {
    id: doc.id,
    ...data,
    // Convert Timestamps to Dates if necessary
    creadoEn: data.creadoEn?.toDate(),
    fecha: data.fecha?.toDate(),
  } as T & { id: string };
};

// Indicadores
export async function crearIndicador(data: Omit<Indicador, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'indicadores'), {
            ...data,
            creadoEn: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating indicador: ", error);
        throw new Error("Failed to create indicador.");
    }
}

export async function obtenerIndicador(id: string): Promise<Indicador | null> {
    try {
        const docRef = doc(db, 'indicadores', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return fromFirestore<Indicador>(docSnap);
        }
        return null;
    } catch (error) {
        console.error("Error getting indicador: ", error);
        throw new Error("Failed to get indicador.");
    }
}

export async function listarIndicadoresPorProceso(procesoId: string): Promise<Indicador[]> {
    try {
        const q = query(
            collection(db, 'indicadores'),
            where('procesoId', '==', procesoId),
            orderBy('creadoEn', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => fromFirestore<Indicador>(doc));
    } catch (error) {
        console.error("Error listing indicadores by proceso: ", error);
        throw new Error("Failed to list indicadores.");
    }
}

export async function actualizarIndicador(id: string, data: Partial<Indicador>): Promise<void> {
    try {
        const docRef = doc(db, 'indicadores', id);
        await updateDoc(docRef, data);
    } catch (error) {
        console.error("Error updating indicador: ", error);
        throw new Error("Failed to update indicador.");
    }
}

export async function eliminarIndicador(id: string): Promise<void> {
    try {
        const docRef = doc(db, 'indicadores', id);
        await deleteDoc(docRef);
    } catch (error) {
        console.error("Error deleting indicador: ", error);
        throw new Error("Failed to delete indicador.");
    }
}

// Mediciones
export async function registrarMedicion(data: Omit<Medicion, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'mediciones'), {
            ...data,
            creadoEn: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error registering medicion: ", error);
        throw new Error("Failed to register medicion.");
    }
}

export async function listarMediciones(indicadorId: string): Promise<Medicion[]> {
    try {
        const q = query(
            collection(db, 'mediciones'),
            where('indicadorId', '==', indicadorId),
            orderBy('creadoEn', 'desc')
        );
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => fromFirestore<Medicion>(doc));
    } catch (error) {
        console.error("Error listing mediciones: ", error);
        throw new Error("Failed to list mediciones.");
    }
}

// Categorias
export async function listarCategorias(): Promise<Categoria[]> {
    try {
        const q = query(collection(db, 'categorias'), orderBy('nombre', 'asc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => fromFirestore<Categoria>(doc));
    } catch (error) {
        console.error("Error listing categorias: ", error);
        throw new Error("Failed to list categorias.");
    }
}

export async function crearCategoria(data: Omit<Categoria, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'categorias'), {
            ...data,
            creadoEn: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error("Error creating categoria: ", error);
        throw new Error("Failed to create categoria.");
    }
}
