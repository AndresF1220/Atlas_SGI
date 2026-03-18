export interface Indicador {
  id?: string
  codigo: string
  nombre: string
  tipo: 'indicador' | 'variable'
  clase: string
  unidadMedida: string
  finalidad: 'minimizar' | 'maximizar'
  frecuencia: 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'
  diaCorte: string
  meta: number
  verdeMax?: number
  amarilloMax?: number
  formula: string
  descripcion: string
  interpretacion: string
  fuenteInformacion?: string
  procesoId: string
  subprocesoId?: string
  categorias: string[]
  atributosCalidad: string[]
  controlCambios?: { fecha: string; descripcion: string }[]
  activo: boolean
  permitirPeriodosSinMedicion: boolean
  creadoEn?: any
  creadoPor?: string
}

export interface Variable {
  id?: string
  abreviatura: string
  nombre: string
  unidadMedida: string
  periodicidad: string
}

export interface ConfigSemaforo {
  tipoMeta: 'unica' | 'sin_meta' | 'periodica'
  tipoSemaforo: 'lineal' | 'dinamico'
  verde:    { min: number | null; max: number | null }
  amarillo: { min: number | null; max: number | null }
  rojo:     { min: number | null; max: number | null }
}

export interface Medicion {
  id?: string
  indicadorId: string
  periodo: string
  valor: number
  variables: Record<string, number>
  semaforo: 'verde' | 'amarillo' | 'rojo'
  observacion: string
  responsableId: string
  responsableNombre: string
  responsableCargo: string
  creadoEn?: any
}

export interface Categoria {
  id?: string
  nombre: string
  color: string
  creadoPor: string
  creadoEn?: any
}

export interface PrivilegioIndicador {
  id?: string
  indicadorId: string
  usuarioId: string
  permisos: {
    consultar: boolean
    medicion: boolean
    analisis: boolean
    exportar: boolean
    modificar: boolean
    ajustarMetas: boolean
  }
}