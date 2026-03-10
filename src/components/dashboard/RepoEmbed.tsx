

'use client';

import { useState, useMemo, useEffect, useTransition } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  doc,
  deleteDoc,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { deleteObject, ref as storageRef } from 'firebase/storage';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Upload,
  Folder as FolderIcon,
  FileText,
  Trash2,
  Loader2,
  FolderPlus,
  MoreVertical,
  Edit,
  Circle,
} from 'lucide-react';
import { CreateFolderForm } from './CreateFolderForm';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '../ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { RenameFolderForm } from './RenameFolderForm';
import { UploadFileForm } from './UploadFileForm';
import { useAuth } from '@/lib/auth';


interface RepoEmbedProps {
  areaId: string;
  procesoId?: string;
  subprocesoId?: string;
}

type File = {
  id: string;
  name: string;
  modifiedAt: any;
  size: number;
  url: string;
  path: string; // Storage path
  code: string;
  version: string;
  validityDate: any;
};

type Folder = {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: any;
};


const FolderList = ({
  folders,
  onSelectFolder,
  selectedFolder,
  onAction,
}: {
  folders: Folder[];
  onSelectFolder: (folder: Folder) => void;
  selectedFolder: Folder | null;
  onAction: (action: 'rename' | 'delete', folder: Folder, event: React.MouseEvent) => void;
}) => {
  const { userRole } = useAuth();
  if (!folders || folders.length === 0) return null;

  return (
    <div>
      {folders.map(folder => (
        <div key={folder.id} className="group/folder-item">
          <div
            className={`flex items-center gap-2 cursor-pointer py-1.5 rounded-md px-2 ${
              selectedFolder?.id === folder.id ? 'bg-muted' : 'hover:bg-muted/50'
            }`}
            onClick={() => onSelectFolder(folder)}
          >
            <div className="relative">
                 <FolderIcon className="h-5 w-5 text-amber-500" />
                 {selectedFolder?.id === folder.id && (
                    <Circle className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 fill-blue-500 text-blue-500" />
                 )}
            </div>

            <span className="text-sm font-medium select-none flex-1 truncate">
              {folder.name}
            </span>
             {userRole === 'superadmin' && (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover/folder-item:opacity-100 focus:opacity-100" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAction('rename', folder, e as any); }}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Renombrar</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAction('delete', folder, e as any); }} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Eliminar</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};


export default function RepoEmbed({
  areaId,
  procesoId,
  subprocesoId,
}: RepoEmbedProps) {
  const { firestore, storage } = useFirebase();
  const { userRole } = useAuth();
  const { toast } = useToast();
  
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [isRenamingFolder, setIsRenamingFolder] = useState(false);
  const [isDeletingFolder, setIsDeletingFolder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<Folder | null>(null);

  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  
  const [isDeletePending, startDeleteTransition] = useTransition();

  const norm = (v:string|null|undefined) => v === "" || v === undefined || v === "null" ? null : v;

  const foldersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'folders'),
      where('areaId', '==', norm(areaId)),
      where('procesoId', '==', norm(procesoId)),
      where('subprocesoId', '==', norm(subprocesoId))
    );
  }, [firestore, areaId, procesoId, subprocesoId]);

  const { data: allFoldersData, isLoading: isLoadingFolders } = useCollection(foldersQuery);
  const allFolders = allFoldersData as Folder[] | null;

  const filesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedFolder) return null;
    return query(
        collection(firestore, 'documents'),
        where('folderId', '==', selectedFolder.id)
    );
  }, [firestore, selectedFolder]);

  const { data: filesData, isLoading: isLoadingFiles } = useCollection(filesQuery);
  const files = filesData as File[] | null;


  const rootFolders = useMemo(() => {
    if (!allFolders) return [];
    return allFolders.filter(f => f.parentId === null).sort((a, b) => a.name.localeCompare(b.name));
  }, [allFolders]);


  useEffect(() => {
     if (selectedFolder && !allFolders?.find(f => f.id === selectedFolder.id)) {
        setSelectedFolder(null);
     }
  }, [allFolders, selectedFolder]);


  const handleFolderAction = (action: 'rename' | 'delete', folder: Folder, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setFolderToEdit(folder);
    if (action === 'rename') {
        setIsRenamingFolder(true);
    } else if (action === 'delete') {
        setIsDeletingFolder(true);
    }
  }

  const handleConfirmDelete = () => {
    if (!folderToEdit || !firestore || !storage) return;

    startDeleteTransition(async () => {
      try {
        const batch = writeBatch(firestore);

        // 1. Find and delete all files within the folder
        const filesQuery = query(collection(firestore, 'documents'), where('folderId', '==', folderToEdit.id));
        const filesSnap = await getDocs(filesQuery);
        
        for (const fileDoc of filesSnap.docs) {
          const fileData = fileDoc.data() as File;
          if (fileData.path) {
            const fileStorageRef = storageRef(storage, fileData.path);
            try {
              await deleteObject(fileStorageRef);
            } catch (storageError: any) {
              // If file doesn't exist in storage, we can still delete the firestore doc
              if (storageError.code !== 'storage/object-not-found') {
                throw storageError; 
              }
            }
          }
          batch.delete(fileDoc.ref);
        }
        
        // 2. Delete the folder document itself
        const folderRef = doc(firestore, 'folders', folderToEdit.id);
        batch.delete(folderRef);
        
        await batch.commit();

        toast({ title: '¡Éxito!', description: 'Carpeta eliminada con éxito.' });
        if (selectedFolder?.id === folderToEdit.id) {
          setSelectedFolder(null);
        }
      } catch (e: any) {
        console.error("Error deleting folder:", e);
        toast({
          variant: 'destructive',
          title: 'Error al Eliminar',
          description: `No se pudo eliminar la carpeta: ${e.message}`,
        });
      } finally {
        setIsDeletingFolder(false);
        setFolderToEdit(null);
      }
    });
  };

  const handleFileDelete = async (fileToDelete: File) => {
    if (!firestore || !storage) return;

    if (!confirm(`¿Está seguro de que desea eliminar el archivo "${fileToDelete.name}"?`)) {
        return;
    }

    try {
        
        // Delete file from Storage
        if(fileToDelete.path) {
            const fileStorageRef = storageRef(storage, fileToDelete.path);
            await deleteObject(fileStorageRef);
        }
        
        // Delete doc from Firestore
        const fileDocRef = doc(firestore, 'documents', fileToDelete.id);
        await deleteDoc(fileDocRef);

        toast({
            title: "Archivo Eliminado",
            description: `Se eliminó "${fileToDelete.name}".`
        });

    } catch (error: any) {
        console.error("Error deleting file:", error);
        toast({
            variant: "destructive",
            title: "Error al Eliminar",
            description: error.code === 'storage/object-not-found' 
                ? "El archivo ya no existía en Storage, pero el registro fue eliminado."
                : "No se pudo eliminar el archivo.",
        });
    }
  };


  const ViewFileButton = ({ url }: { url: string }) => {
    if (!url || url === '#') {
        return (
            <Button variant="ghost" size="icon" disabled title="Ver Documento">
                <FileText className="h-4 w-4" />
                <span className="sr-only">Ver Documento</span>
            </Button>
        )
    }
    return (
        <Button asChild variant="ghost" size="icon" title="Ver Documento">
            <a href={url} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                <span className="sr-only">Ver Documento</span>
            </a>
        </Button>
    )
  }
  
  const canUpload = userRole === 'superadmin' || userRole === 'admin';

  return (
    <>
      <div className="border-b pb-2 -mb-2">
          <h2 className="text-2xl font-bold font-headline">
            Documentos
          </h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <Card className="lg:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="font-headline text-lg">Carpetas</CardTitle>
             {userRole === 'superadmin' && (
                <div className="flex items-center gap-1">
                    <CreateFolderForm
                        isOpen={isAddingFolder}
                        onOpenChange={setIsAddingFolder}
                        parentId={null}
                        scope={{ areaId, procesoId, subprocesoId }}
                    >
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <FolderPlus className="h-4 w-4" />
                            <span className="sr-only">Crear Carpeta</span>
                        </Button>
                    </CreateFolderForm>
                </div>
            )}
          </CardHeader>
          <CardContent>
            {isLoadingFolders ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Cargando carpetas...</span>
                </div>
            ) : rootFolders.length > 0 ? (
              <FolderList
                folders={rootFolders}
                onSelectFolder={setSelectedFolder}
                selectedFolder={selectedFolder}
                onAction={handleFolderAction}
              />
            ) : (
              <div className="text-center text-sm text-muted-foreground p-4">
                  {userRole === 'superadmin' ? 'No hay carpetas. Cree una para comenzar.' : 'No hay carpetas disponibles.'}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-headline text-lg">
                {selectedFolder
                  ? selectedFolder.name
                  : 'Seleccione una carpeta'}
              </CardTitle>
              <CardDescription>
                Documentos en esta carpeta.
              </CardDescription>
            </div>
             {canUpload && (
                 <UploadFileForm 
                    isOpen={isUploading} 
                    onOpenChange={setIsUploading}
                    disabled={!selectedFolder}
                    folderId={selectedFolder?.id || null}
                    scope={{ areaId, procesoId, subprocesoId }}
                 >
                    <Button variant="outline" disabled={!selectedFolder}>
                        <Upload className="mr-2 h-4 w-4" />
                        Subir Archivo
                    </Button>
                </UploadFileForm>
             )}
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre del documento</TableHead>
                  <TableHead>Versión</TableHead>
                  <TableHead>Vigencia</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingFiles ? (
                    <TableRow>
                        <TableCell colSpan={5} className="h-24 text-center">
                            <div className="flex justify-center items-center gap-2 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Cargando documentos...</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ) : files && files.length > 0 ? (
                  files.map((file) => (
                    <TableRow key={file.id}>
                        <TableCell className="font-mono text-xs">{file.code}</TableCell>
                        <TableCell className="font-medium">{file.name}</TableCell>
                        <TableCell className="text-center">{file.version}</TableCell>
                        <TableCell>{file.validityDate ? new Date(file.validityDate.seconds * 1000).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric'}) : 'N/A'}</TableCell>
                        <TableCell className="text-right">
                             <ViewFileButton url={file.url} />
                             {userRole === 'superadmin' && (
                                <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleFileDelete(file)}
                                title="Eliminar"
                                >
                                <Trash2 className="h-4 w-4 text-destructive" />
                                <span className="sr-only">Eliminar</span>
                                </Button>
                            )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="h-24 text-center text-muted-foreground"
                    >
                       {selectedFolder ? (canUpload ? "Esta carpeta está vacía. Use ‘Subir Archivo’ para agregar documentos." : "Esta carpeta está vacía.") : "Seleccione una carpeta para ver sus archivos."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {folderToEdit && userRole === 'superadmin' && (
        <RenameFolderForm
            isOpen={isRenamingFolder}
            onOpenChange={setIsRenamingFolder}
            folderId={folderToEdit.id}
            initialName={folderToEdit.name}
        >
            <div />
        </RenameFolderForm>
      )}


       <AlertDialog open={isDeletingFolder} onOpenChange={setIsDeletingFolder}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Está seguro de eliminar esta carpeta?</AlertDialogTitle>
            <AlertDialogDescription>
              Va a eliminar la carpeta "
              <span className="font-semibold">{folderToEdit?.name}</span>". 
              Todos los archivos dentro de esta carpeta serán eliminados permanentemente. 
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isDeletePending}
            >
             {isDeletePending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
