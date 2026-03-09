
export type Subproceso = {
    id: string;
    nombre: string;
}

export type Proceso = {
    id: string;
    nombre: string;
    subprocesos: Subproceso[];
}

export type Area = {
    id: string;
    nombre: string;
    icono: string;
    procesos: Proceso[];
}

// THIS FILE IS NOW DEPRECATED AND DATA IS FETCHED FROM FIRESTORE
// It is kept for type definitions and historical reference.

export const AREAS_DEPRECATED = [
  {
    id: "financiera",
    titulo: "Dirección Administrativa y Financiera",
    procesos: [
      { id: "auditoria-cuentas-conciliaciones", nombre: "Auditoría de Cuentas y Conciliaciones (Cuentas Médicas)", subprocesos: [] },
      { id: "contabilidad", nombre: "Contabilidad", subprocesos: ["Presupuesto", "Tesorería", "Facturación y Recobro"] },
      { id: "cartera", nombre: "Cartera", subprocesos: [] },
      { id: "sistemas-informacion", nombre: "Sistemas de Información", subprocesos: [] },
      { id: "gestion-documental", nombre: "Gestión Documental (Archivo)", subprocesos: [] },
      { id: "compras-servicios-suministros", nombre: "Compras de Servicios y Suministros (Almacén)", subprocesos: [] },
      { id: "radicacion-cuentas", nombre: "Radicación de Cuentas", subprocesos: [] },
      { id: "afiliacion-registro", nombre: "Afiliación y Registro (Aseguramiento)", subprocesos: [] },
      { id: "talento-humano", nombre: "Talento Humano", subprocesos: ["Selección y Desarrollo", "Seguridad y Salud en el Trabajo", "Bienestar Laboral", "Compensación y Beneficios"] },
    ],
  },
  {
    id: "gestion-riesgo",
    titulo: "Dirección de Gestión del Riesgo",
    procesos: [
      { id: "alto-costo", nombre: "Atención Complementaria y Alto Costo", subprocesos: ["Alto Costo", "Auditoría Ambulatoria y Pertinencia Médica", "Auditoría Concurrente", "MIPRES"] },
      { id: "baja-complejidad", nombre: "Baja Complejidad", subprocesos: ["Auditoría a la Atención Primaria"] },
      { id: "autorizaciones", nombre: "Autorizaciones", subprocesos: ["Referencia y Contrarreferencia"] },
      { id: "promocion-mantenimiento-salud", nombre: "Promoción y Mantenimiento de la Salud", subprocesos: ["Salud Pública", "Epidemiología"] },
      { id: "guias-bilingue-pacientes", nombre: "Gestión de Guías Bilingüe de Pacientes", subprocesos: [] },
    ],
  },
  {
    id: "intercultural",
    titulo: "Dirección de Participación Intercultural",
    procesos: [
      { id: "medicina-tradicional", nombre: "Medicina tradicional", subprocesos: [] },
      { id: "concertacion-participacion", nombre: "Concertación y Participación Comunitaria de la Prestación de Servicios", subprocesos: [] },
      { id: "defensoria-usuarios", nombre: "Defensoría y Representación de Miembro de la Comunidad (Defensoría de Usuarios)", subprocesos: [] },
      { id: "modelo-institucional", nombre: "Modelo Institucional", subprocesos: [] },
    ],
  },
    {
    id: "contratacion",
    titulo: "Contratación",
    procesos: [],
  },
  {
    id: "control-interno",
    titulo: "Control Interno",
    procesos: [],
  },
  {
    id: "gestion-calidad",
    titulo: "Gestión de Calidad",
    procesos: [
      { id: "siau", nombre: "SIAU", subprocesos: [] },
      { id: "auditoria-calidad", nombre: "Auditoría de Calidad", subprocesos: [] },
      { id: "interventoria", nombre: "Interventoría", subprocesos: [] },
      { id: "reporte-informacion", nombre: "Reporte de Información", subprocesos: [] },
    ],
  },
    {
    id: "asesoria-juridica",
    titulo: "Asesoría Jurídica",
    procesos: [],
  },
  {
    id: "sarlaft",
    titulo: "SARLAFT",
    procesos: [],
  },
  {
    id: "comunicaciones",
    titulo: "Comunicaciones",
    procesos: [],
  }
];

/**
 * Finds an area by its ID.
 * @param id - The ID of the area to find.
 * @returns The area object or undefined if not found.
 */
export function getAreaById(id: string) {
  return AREAS_DEPRECATED.find(area => area.id === id);
}

/**
 * Finds a specific process within a specific area.
 * @param areaId - The ID of the area.
 * @param procesoId - The ID of the process to find.
 * @returns The process object or undefined if not found.
 */
export function getProceso(areaId: string, procesoId: string) {
  const area = getAreaById(areaId);
  if (!area) return undefined;
  return area.procesos.find(proceso => proceso.id === procesoId);
}
