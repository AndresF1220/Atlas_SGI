'use server';

import { z } from 'zod';
import { getAuth } from 'firebase-admin/auth';
import { slugify } from '@/lib/slug';
import { SEED_AREAS } from '@/data/seed-map';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const iconMap: { [key: string]: string } = {
  "gestión de calidad": "ClipboardCheck",
  "dirección administrativa y financiera": "Landmark",
  "dirección de gestión del riesgo": "ShieldAlert",
  "asesoría jurídica": "Scale",
  "comunicaciones": "Megaphone",
  "sarlaft": "Eye",
  "control interno": "SearchCheck",
  "contratación": "FileSignature",
  "dirección de participación intercultural": "HeartHandshake",
  "default": "Building",
};

const getIconForArea = (areaName: string): string => {
  const normalizedAreaName = areaName.toLowerCase();
  return iconMap[normalizedAreaName] || iconMap["default"];
};

const areaTypeMap: { [key: string]: string } = {
  "Dirección Administrativa y Financiera": "direccion",
  "Dirección de Gestión del Riesgo": "direccion",
  "Dirección de Participación Intercultural": "direccion",
  "Gestión de Calidad": "transversal",
  "Asesoría Jurídica": "transversal",
  "Comunicaciones": "transversal",
  "SARLAFT": "transversal",
  "Control Interno": "transversal",
  "Contratación": "transversal",
};

const createSchema = z.object({
  name: z.string().min(3, 'Debe ingresar un nombre de al menos 3 caracteres.'),
  entityType: z.enum(['area', 'process', 'subprocess']),
  parentId: z.string().optional(),
  grandParentId: z.string().optional(),
});

export async function createEntityAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

    const payload = {
        name: formData.get('name') as string,
        entityType: formData.get('entityType') as 'area' | 'process' | 'subprocess',
        parentId: formData.get('parentId') as string | undefined,
        grandParentId: formData.get('grandParentId') as string | undefined,
    };
    
    const validatedFields = createSchema.safeParse(payload);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const errorMessages = Object.values(errors).map(err => err?.join(', ')).filter(Boolean);
        return { message: 'Validation failed', error: errorMessages.join(' ') || 'Debe ingresar un nombre.' };
    }

    const { name, entityType, parentId, grandParentId } = validatedFields.data;

    try {
        const newId = adminDb.collection('temp').doc().id; // Firestore-compatible ID

        const entityData: any = {
            id: newId,
            nombre: name,
            slug: slugify(name),
            createdAt: new Date(),
        };
        
        let entityRef;

        if (entityType === 'area') {
            entityData.icono = getIconForArea(name);
            entityRef = adminDb.doc(`areas/${newId}`);
        } else if (entityType === 'process' && parentId) {
            entityRef = adminDb.doc(`areas/${parentId}/procesos/${newId}`);
        } else if (entityType === 'subprocess' && parentId && grandParentId) {
            entityRef = adminDb.doc(`areas/${grandParentId}/procesos/${parentId}/subprocesos/${newId}`);
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para la creación.' };
        }
        
        await entityRef.set(entityData);
        
        const typeName = entityType === 'area' ? 'Área' : entityType === 'process' ? 'Proceso' : 'Subproceso';
        return { message: `${typeName} creado correctamente.` };

    } catch (e: any) {
        console.error("Error creating entity:", e);
        return { message: 'Error', error: 'No se pudo crear la entidad: ' + e.message };
    }
}

const renameSchema = z.object({
    entityId: z.string(),
    entityType: z.enum(['process', 'subprocess']),
    parentId: z.string(),
    grandParentId: z.string().optional(),
    name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
});

export async function renameEntityAction(
    prevState: any,
    formData: FormData,
): Promise<{ message: string; error?: string }> {
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

    const payload = {
        entityId: formData.get('entityId') as string,
        entityType: formData.get('entityType') as 'process' | 'subprocess',
        parentId: formData.get('parentId') as string,
        grandParentId: formData.get('grandParentId') as string | undefined,
        name: formData.get('name') as string,
    };

    const validatedFields = renameSchema.safeParse(payload);

    if (!validatedFields.success) {
        const errors = validatedFields.error.flatten().fieldErrors;
        const errorMessage = Object.values(errors).map(e => e?.join(', ')).join(' ');
        return { message: 'Error de validación', error: errorMessage };
    }

    const { entityId, entityType, parentId, grandParentId, name } = validatedFields.data;

    try {
        let entityRef;

        if (entityType === 'process') {
            entityRef = adminDb.doc(`areas/${parentId}/procesos/${entityId}`);
        } else if (entityType === 'subprocess' && grandParentId) {
            entityRef = adminDb.doc(`areas/${grandParentId}/procesos/${parentId}/subprocesos/${entityId}`);
        } else {
            return { message: 'Error', error: 'Parámetros inválidos para renombrar.' };
        }

        await entityRef.update({
            nombre: name,
            slug: slugify(name),
        });

        const typeName = entityType === 'process' ? 'Proceso' : 'Subproceso';
        return { message: `${typeName} renombrado con éxito.` };

    } catch (e: any) {
        console.error("Error renaming entity:", e);
        return { message: 'Error', error: 'No se pudo renombrar la entidad: ' + e.message };
    }
}

export async function deleteEntityAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

  const entityId = formData.get('entityId') as string;
  const entityType = formData.get('entityType') as 'area' | 'process' | 'subprocess';
  const parentId = formData.get('parentId') as string | undefined;
  const grandParentId = formData.get('grandParentId') as string | undefined;

  try {
    const batch = adminDb.batch();

    switch (entityType) {
        case 'area':
            if (!entityId) throw new Error("Parámetros de eliminación inválidos (falta entityId).");
            
            const areaRef = adminDb.doc('areas/' + entityId);
            const procesosQuery = adminDb.collection('areas/' + entityId + '/procesos');
            const procesosSnap = await procesosQuery.get();

            for (const procesoDoc of procesosSnap.docs) {
                const subprocesosQuery = procesoDoc.ref.collection('subprocesos');
                const subprocesosSnap = await subprocesosQuery.get();
                for (const subDoc of subprocesosSnap.docs) {
                    const caracterizacionSubRef = adminDb.doc('caracterizaciones/subprocess-' + subDoc.id);
                    batch.delete(caracterizacionSubRef);
                    batch.delete(subDoc.ref);
                }
                const caracterizacionProcRef = adminDb.doc('caracterizaciones/process-' + procesoDoc.id);
                batch.delete(caracterizacionProcRef);
                batch.delete(procesoDoc.ref);
            }
            const caracterizacionAreaRef = adminDb.doc('caracterizaciones/area-' + entityId);
            batch.delete(caracterizacionAreaRef);
            batch.delete(areaRef);
            break;

        case 'process':
            if (!entityId || !parentId) throw new Error("Parámetros de eliminación inválidos (falta entityId o parentId).");

            const processRef = adminDb.doc('areas/' + parentId + '/procesos/' + entityId);
            const subprocesosProcQuery = processRef.collection('subprocesos');
            const subprocesosProcSnap = await subprocesosProcQuery.get();

            for (const subDoc of subprocesosProcSnap.docs) {
                const caracterizacionSubRef = adminDb.doc('caracterizaciones/subprocess-' + subDoc.id);
                batch.delete(caracterizacionSubRef);
                batch.delete(subDoc.ref);
            }
            const caracterizacionProcRef = adminDb.doc('caracterizaciones/process-' + entityId);
            batch.delete(caracterizacionProcRef);
            batch.delete(processRef);
            break;

        case 'subprocess':
            if (!entityId || !parentId || !grandParentId) throw new Error("Parámetros de eliminación inválidos (falta entityId, parentId o grandParentId).");
            
            const subProcessRef = adminDb.doc('areas/' + grandParentId + '/procesos/' + parentId + '/subprocesos/' + entityId);
            const caracterizacionSubRef = adminDb.doc('caracterizaciones/subprocess-' + entityId);
            batch.delete(caracterizacionSubRef);
            batch.delete(subProcessRef);
            break;
        
        default:
            throw new Error("Tipo de entidad no reconocido.");
    }

    await batch.commit();
    return { message: 'Elemento eliminado correctamente.' };

  } catch (e: any) {
    const errorMessage = 'No se pudo eliminar el elemento: ' + e.message;
    console.error('Error deleting entity:', e);
    return { message: 'Error', error: errorMessage };
  }
}

export async function renameFolderAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string }> {
  const { db: adminDb } = await import('@/firebase/server-config');
  if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };
  
  const newName = formData.get('newName') as string;
  const folderId = formData.get('folderId') as string;

  if (!newName || newName.length < 3) {
    return { message: 'Error', error: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (!folderId) {
    return { message: 'Error', error: 'No se encontró el ID de la carpeta.' };
  }

  try {
    const folderRef = adminDb.doc('folders/' + folderId);
    await folderRef.update({ name: newName });
    return { message: 'Carpeta renombrada con éxito.' };
  } catch (e: any) {
    console.error("Error renaming folder:", e);
    return { message: 'Error', error: 'No se pudo renombrar la carpeta: ' + e.message };
  }
}

export async function seedProcessMapAction(): Promise<{ message: string; error?: string }> {
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

    try {
        const batch = adminDb.batch();
        const areasCollection = adminDb.collection('areas');

        for (const area of SEED_AREAS) {
            const newAreaRef = areasCollection.doc();
            batch.set(newAreaRef, { 
                nombre: area.titulo, 
                slug: slugify(area.titulo),
                id: newAreaRef.id,
                icono: getIconForArea(area.titulo),
                createdAt: new Date()
            });

            const procesosCollection = newAreaRef.collection('procesos');
            for (const proceso of area.procesos) {
                const newProcesoRef = procesosCollection.doc();
                batch.set(newProcesoRef, { 
                    nombre: proceso.nombre,
                    slug: slugify(proceso.nombre),
                    id: newProcesoRef.id,
                    createdAt: new Date()
                });

                const subprocesosCollection = newProcesoRef.collection('subprocesos');
                for (const subproceso of proceso.subprocesos) {
                    const newSubprocesoRef = subprocesosCollection.doc();
                    batch.set(newSubprocesoRef, { 
                        nombre: subproceso.nombre,
                        slug: slugify(subproceso.nombre),
                        id: newSubprocesoRef.id,
                        createdAt: new Date()
                    });
                }
            }
        }

        await batch.commit();
        return { message: 'Mapa de procesos restaurado con éxito.' };
    } catch (e: any) {
        console.error("Error seeding process map:", e);
        return { message: 'Error', error: 'No se pudo restaurar el mapa de procesos: ' + e.message };
    }
}

export async function createFolderAction(prevState: any, formData: FormData): Promise<{ message: string; error?: string }> {
  const { db: adminDb } = await import('@/firebase/server-config');
  if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

  const name = formData.get('name') as string;
  const areaId = formData.get('areaId') as string | null;

  const getOrNull = (key: string) => {
    const value = formData.get(key);
    return value === '' ? null : value as string | null;
  };

  const parentId = getOrNull('parentId');
  const procesoId = getOrNull('procesoId');
  const subprocesoId = getOrNull('subprocesoId');

  if (!name || name.length < 3) {
    return { message: 'Error', error: 'El nombre debe tener al menos 3 caracteres.' };
  }
  if (!areaId) {
    return { message: 'Error', error: 'El ID del área es requerido.' };
  }

  try {
    const docData = {
      name,
      parentId,
      areaId,
      procesoId,
      subprocesoId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await adminDb.collection('folders').add(docData);
    return { message: 'Carpeta creada con éxito.' };
  } catch (e: any) {
    console.error("Error creating folder:", e);
    return { message: 'Error', error: 'No se pudo crear la carpeta: ' + e.message };
  }
}

export async function deleteFolderAction(folderId: string): Promise<{ success: boolean; error?: string }> {
  const { db: adminDb } = await import('@/firebase/server-config');
  if (!adminDb) {
    return { success: false, error: 'Firebase Admin no está inicializado.' };
  }

  try {
    const batch = adminDb.batch();

    const filesQuery = adminDb.collection('documents').where('folderId', '==', folderId);
    const filesSnap = await filesQuery.get();
    
    for (const fileDoc of filesSnap.docs) {
      batch.delete(fileDoc.ref);
    }
    
    const folderRef = adminDb.collection('folders').doc(folderId);
    batch.delete(folderRef);
    
    await batch.commit();

    return { success: true };
  } catch (e: any) {
    console.error("Error deleting folder and its contents:", e);
    return { success: false, error: e.message };
  }
}

export async function uploadFileAndCreateDocument(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const { db: adminDb } = await import('@/firebase/server-config');
  const { storage } = await import('@/firebase/client-config');
  if (!storage || !adminDb) {
    return { success: false, error: 'Firebase no está inicializado.' };
  }

  const selectedFile = formData.get('file') as File;
  const folderId = formData.get('folderId') as string;
  const areaId = formData.get('areaId') as string;
  const procesoId = formData.get('procesoId') as string | null;
  const subprocesoId = formData.get('subprocesoId') as string | null;

  if (!selectedFile || !folderId || !areaId) {
      return { success: false, error: "Faltan datos requeridos (archivo, folderId, areaId)." };
  }

  try {
    const pathParts = ['documentos', areaId, procesoId, subprocesoId, folderId, selectedFile.name].filter(Boolean);
    const fullPath = pathParts.join('/');
    const fileStorageRef = ref(storage, fullPath);

    const uploadResult = await uploadBytes(fileStorageRef, selectedFile);
    const url = await getDownloadURL(uploadResult.ref);

    const validityDateStr = formData.get('validityDate') as string;

    const docData = {
      code: formData.get('code') as string,
      name: formData.get('name') as string,
      version: formData.get('version') as string,
      validityDate: validityDateStr ? new Date(validityDateStr) : null,
      folderId: folderId,
      areaId: areaId,
      procesoId: procesoId || null,
      subprocesoId: subprocesoId || null,
      path: fullPath,
      url: url,
      size: selectedFile.size,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await adminDb.collection('documents').add(docData);

    return { success: true };
  } catch (e: any) {
    console.error('Error uploading file and creating document:', e);
    return { success: false, error: e.message };
  }
}

const userFormSchema = z.object({
  fullName: z.string().min(1, 'El nombre completo es requerido.'),
  cedula: z.string().min(1, 'La cédula es requerida.'),
  email: z.string().email('El correo electrónico no es válido.'),
  role: z.enum(['superadmin', 'admin', 'viewer'], { required_error: 'Debe seleccionar un rol.'}),
  status: z.enum(['active', 'inactive']),
  tempPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres.'),
  areaId: z.string().min(1, 'Debe seleccionar una asignación jerárquica.'),
  areaNombre: z.string().min(1, 'El nombre del área es requerido.'),
  procesoId: z.string().nullable().optional(),
  procesoNombre: z.string().nullable().optional(),
  subprocesoId: z.string().nullable().optional(),
  subprocesoNombre: z.string().nullable().optional(),
});

const createUserSchema = userFormSchema;

export async function createUserAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string, errors?: { [key: string]: string[] } }> {
  
  try {
    const { db: adminDb, adminApp } = await import('@/firebase/server-config');
    const validatedFields = createUserSchema.safeParse({
      fullName: formData.get('fullName'),
      cedula: formData.get('cedula'),
      email: formData.get('email'),
      role: formData.get('role'),
      status: formData.get('status'),
      tempPassword: formData.get('tempPassword'),
      areaId: formData.get('areaId'),
      areaNombre: formData.get('areaNombre'),
      procesoId: formData.get('procesoId') || null,
      procesoNombre: formData.get('procesoNombre') || null,
      subprocesoId: formData.get('subprocesoId') || null,
      subprocesoNombre: formData.get('subprocesoNombre') || null,
    });

    if (!validatedFields.success) {
      const fieldErrors = validatedFields.error.flatten().fieldErrors;
      return {
          message: 'Error de validación',
          error: "Por favor corrija los errores en el formulario.",
          errors: fieldErrors,
      };
    }

    const { fullName, email, role, status, cedula, tempPassword, areaId, areaNombre, procesoId, procesoNombre, subprocesoId, subprocesoNombre } = validatedFields.data;
    
    const auth = getAuth(adminApp);
    
    const userRecord = await auth.createUser({
      email: email,
      password: tempPassword,
      displayName: fullName,
    });
    
    const userDocRef = adminDb.collection('users').doc(userRecord.uid);
    await userDocRef.set({
      fullName,
      email,
      cedula,
      role,
      status,
      tempPassword,
      areaId,
      areaNombre,
      procesoId: procesoId || null,
      procesoNombre: procesoNombre || null,
      subprocesoId: subprocesoId || null,
      subprocesoNombre: subprocesoNombre || null,
      createdAt: new Date(),
    });

    return { message: 'Usuario creado con éxito en Auth y Firestore.' };
  } catch (e: any) {
    console.error('Error creando usuario:', e);
    
    let errorMessage = 'No se pudo crear el usuario: ' + e.message;
    if (e.code === 'auth/email-already-exists') {
        errorMessage = 'El correo electrónico ya está en uso por otro usuario.';
    } else if (e.code === 'auth/invalid-password') {
        errorMessage = 'La contraseña no es válida. Debe tener al menos 6 caracteres.';
    }

    return { message: 'Error', error: errorMessage };
  }
}

const updateUserSchema = userFormSchema.extend({
  userId: z.string().min(1, 'ID de usuario es requerido.'),
});

export async function updateUserAction(
  prevState: any,
  formData: FormData
): Promise<{ message: string; error?: string, errors?: { [key: string]: string[] } }> {

  try {
    const { db: adminDb, adminApp } = await import('@/firebase/server-config');
    const userId = formData.get('userId') as string;
    const userRef = adminDb.collection('users').doc(userId);
    const currentUserSnap = await userRef.get();
    
    if (!currentUserSnap.exists) {
        return { message: 'Error', error: 'El usuario que intenta actualizar no existe.' };
    }
    const currentUserData = currentUserSnap.data();

    const roleFromForm = formData.get('role');
    const role = roleFromForm || currentUserData?.role;

    const payload = {
      userId: userId,
      fullName: formData.get('fullName'),
      cedula: formData.get('cedula'),
      email: formData.get('email'),
      role: role,
      status: formData.get('status'),
      tempPassword: formData.get('tempPassword'),
      areaId: formData.get('areaId'),
      areaNombre: formData.get('areaNombre'),
      procesoId: formData.get('procesoId') || null,
      procesoNombre: formData.get('procesoNombre') || null,
      subprocesoId: formData.get('subprocesoId') || null,
      subprocesoNombre: formData.get('subprocesoNombre') || null,
    };
    
    const validatedFields = updateUserSchema.safeParse(payload);
    
    if (!validatedFields.success) {
      const fieldErrors = validatedFields.error.flatten().fieldErrors;
      return {
        message: 'Error de validación',
        errors: fieldErrors,
        error: "Por favor corrija los errores en el formulario.",
      };
    }

    const { userId: validatedUserId, ...userData } = validatedFields.data;
    const auth = getAuth(adminApp);
    
    await userRef.update({
        ...userData,
        updatedAt: new Date(),
    });
    
    const authUpdates: { email?: string; password?: string, displayName?:string } = {};

    if (currentUserData?.email !== userData.email) {
        authUpdates.email = userData.email;
    }
    if (userData.tempPassword && currentUserData?.tempPassword !== userData.tempPassword) {
        authUpdates.password = userData.tempPassword;
    }
    if(currentUserData?.fullName !== userData.fullName){
        authUpdates.displayName = userData.fullName;
    }

    if (Object.keys(authUpdates).length > 0) {
        await auth.updateUser(validatedUserId, authUpdates);
    }

    return { message: 'Usuario actualizado con éxito.' };
  } catch (e: any) {
    console.error('Error actualizando usuario:', e);
    let errorMessage = 'No se pudo actualizar el usuario: ' + e.message;
    if (e.code === 'auth/email-already-exists') {
        errorMessage = 'El correo electrónico ya está en uso por otro usuario.';
    }
    return { message: 'Error', error: errorMessage };
  }
}

export async function deleteUserAction(
  currentUserId: string | null,
  userIdToDelete: string
): Promise<{ success: boolean; error?: string }> {
  const { db: adminDb, adminApp } = await import('@/firebase/server-config');
  if (!adminDb) {
    return { success: false, error: 'Firestore Admin no está inicializado.' };
  }
  if (!currentUserId) {
    return { success: false, error: 'No se pudo identificar al usuario actual.' };
  }
  if (currentUserId === userIdToDelete) {
    return { success: false, error: 'No se puede eliminar a sí mismo.' };
  }

  try {
    const auth = getAuth(adminApp);
    const userToDeleteDocRef = adminDb.collection('users').doc(userIdToDelete);
    const userToDeleteDocSnap = await userToDeleteDocRef.get();

    if (userToDeleteDocSnap.exists && userToDeleteDocSnap.data()?.role === 'superadmin') {
      const usersRef = adminDb.collection('users');
      const superAdminQuery = usersRef.where('role', '==', 'superadmin');
      const superAdminSnapshot = await superAdminQuery.get();

      if (superAdminSnapshot.size <= 1) {
        return { success: false, error: 'No se puede eliminar al último superadministrador.' };
      }
    }

    try {
      await auth.deleteUser(userIdToDelete);
    } catch (authError: any) {
      if (authError.code !== 'auth/user-not-found') {
        console.warn("Error deleting user from Auth, but will proceed to delete from Firestore:", authError.message);
      }
    }

    await userToDeleteDocRef.delete();

    return { success: true };
  } catch (e: any) {
    console.error('Error eliminando usuario:', e);
    return { success: false, error: 'No se pudo eliminar el usuario: ' + e.message };
  }
}

export async function resetPasswordAction(userId: string): Promise<{ success: boolean; error?: string; newPassword?: string }> {
  const { db: adminDb, adminApp } = await import('@/firebase/server-config');
  if (!adminDb) {
    return { success: false, error: 'Firestore Admin no está inicializado.' };
  }

  try {
    const auth = getAuth(adminApp);
    const newPassword = Math.random().toString(36).slice(-8);
    
    await auth.updateUser(userId, {
      password: newPassword,
    });
    
    const userDocRef = adminDb.collection('users').doc(userId);
    await userDocRef.update({
      tempPassword: newPassword,
    });
    
    return { success: true, newPassword };
  } catch (e: any) {
    console.error('Error al restablecer la contraseña:', e);
    return { success: false, error: 'No se pudo restablecer la contraseña: ' + e.message };
  }
}

const loginSchema = z.object({
  cedula: z.string().min(1, "La cédula es requerida."),
  password: z.string().min(1, "La contraseña es requerida."),
});

type LoginState = {
  status: "idle" | "success" | "error";
  error?: string;
  data?: {
    email: string;
    tempPassword?: any;
  };
};

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const { db: adminDb } = await import('@/firebase/server-config');
    const validatedFields = loginSchema.safeParse({
      cedula: formData.get("cedula"),
      password: formData.get("password"),
    });

    if (!validatedFields.success) {
      return { status: "error", error: "Cédula y contraseña son requeridos." };
    }

    const { cedula, password } = validatedFields.data;

    const usersRef = adminDb.collection("users");
    const q = usersRef.where("cedula", "==", cedula);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      return { status: "error", error: "Cédula o contraseña incorrectos, o el usuario está inactivo." };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    if (userData.status !== "active") {
      return { status: "error", error: "El usuario está inactivo." };
    }

    if (userData.tempPassword !== password) {
       return {
        status: "error", 
        error: "Cédula o contraseña incorrectos, o el usuario está inactivo.",
        data: {
          email: userData.email,
        }
      };
    }

    return {
      status: "success",
      data: {
        email: userData.email,
        tempPassword: userData.tempPassword,
      },
    };
  } catch (e: any) {
    console.error("Error en loginAction:", e);
    return {
      status: "error",
      error: "Ocurrió un error en el servidor. Por favor, inténtelo de nuevo.",
    };
  }
}

export async function migrateAreaIconsAction(): Promise<{ message: string; error?: string }> {
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

    try {
        const areasRef = adminDb.collection('areas');
        const snapshot = await areasRef.get();

        if (snapshot.empty) {
            return { message: 'No hay áreas para migrar.' };
        }

        const batch = adminDb.batch();
        let updatedCount = 0;

        snapshot.docs.forEach(doc => {
            const areaData = doc.data();
            const icon = getIconForArea(areaData.nombre);
            batch.update(doc.ref, { icono: icon });
            updatedCount++;
        });

        await batch.commit();
        return { message: 'Se migraron ' + updatedCount + ' iconos de área con éxito.' };

    } catch (e: any) {
        console.error("Error migrating area icons:", e);
        return { message: 'Error', error: 'No se pudo migrar los iconos: ' + e.message };
    }
}

export async function migrateAreaTypesAction(): Promise<{ message: string; error?: string }> {
    const { db: adminDb } = await import('@/firebase/server-config');
    if (!adminDb) return { message: 'Error', error: 'Firestore Admin no está inicializado.' };

    try {
        const areasRef = adminDb.collection('areas');
        const snapshot = await areasRef.get();

        if (snapshot.empty) {
            return { message: 'No hay áreas para migrar.' };
        }

        const batch = adminDb.batch();
        let updatedCount = 0;

        snapshot.docs.forEach(doc => {
            const areaData = doc.data();
            const tipo = areaTypeMap[areaData.nombre];
            if (tipo) {
                batch.update(doc.ref, { tipo });
                updatedCount++;
            }
        });

        await batch.commit();
        return { message: 'Se migraron ' + updatedCount + ' tipos de área con éxito.' };

    } catch (e: any) {
        console.error("Error migrating area types:", e);
        return { message: 'Error', error: 'No se pudo migrar los tipos: ' + e.message };
    }
}