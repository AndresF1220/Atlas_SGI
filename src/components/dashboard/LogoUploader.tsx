
'use client';

import { useState } from 'react';
import { useStorage } from '@/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload } from 'lucide-react';

interface LogoUploaderProps {
  onUploadComplete: (url: string) => void;
}

export default function LogoUploader({ onUploadComplete }: LogoUploaderProps) {
  const storage = useStorage();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !storage) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, seleccione un archivo para cargar.',
      });
      return;
    }

    setIsUploading(true);
    const storageRef = ref(storage, 'settings/logo');

    try {
      const snapshot = await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      toast({
        title: '¡Éxito!',
        description: 'El logo se ha cargado y guardado correctamente.',
      });
      onUploadComplete(downloadURL);
      setSelectedFile(null);
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast({
        variant: 'destructive',
        title: 'Error al Cargar',
        description: 'No se pudo cargar el logo. Por favor, inténtelo de nuevo.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
        <div className="flex items-center gap-2">
            <Input type="file" onChange={handleFileChange} accept="image/*" disabled={isUploading} />
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4"/>}
                Cargar Logo
            </Button>
        </div>
        {selectedFile && <p className="text-sm text-muted-foreground">Archivo seleccionado: {selectedFile.name}</p>}
    </div>
  );
}
