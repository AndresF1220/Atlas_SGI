

import { useState, useEffect } from 'react';
import { useFirestore } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export function useDocument(collectionPath: string, docId: string) {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const firestore = useFirestore();

  useEffect(() => {
    if (!firestore || !docId) {
        setIsLoading(false);
        return;
    }

    const docRef = doc(firestore, collectionPath, docId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData({ id: docSnap.id, ...docSnap.data() });
      } else {
        setData(null);
      }
      setIsLoading(false);
    }, (error) => {
        console.error(`Error fetching document: ${collectionPath}/${docId}`, error);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [firestore, collectionPath, docId]);

  return { data, isLoading };
}
