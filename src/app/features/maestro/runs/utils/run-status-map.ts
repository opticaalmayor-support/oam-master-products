import { RunStatus } from '../models/run.model';

export interface RunStatusMeta {
  label: string;
  badgeClass: string;
}

export const RUN_STATUS_MAP: Record<RunStatus, RunStatusMeta> = {
  created: {
    label: 'Creado',
    badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  },
  pending: {
    label: 'Pendiente',
    badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
  },
  init: {
    label: 'Inicializando',
    badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  },
  loaded: {
    label: 'Cargado',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  completed: {
    label: 'Completado',
    badgeClass: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  normalized: {
    label: 'Normalizado',
    badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
  },
  matched: {
    label: 'Match',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  },
  offers_built: {
    label: 'Ofertas construidas',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  },
  winner_selected: {
    label: 'Ganador seleccionado',
    badgeClass: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
  },
  winner: {
    label: 'Ganador',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  },
  published: {
    label: 'Publicado',
    badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
  },
  failed: {
    label: 'Fallido',
    badgeClass: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
};

export const RUN_STATUS_FALLBACK: RunStatusMeta = {
  label: 'Desconocido',
  badgeClass: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export const RUN_STAGES: RunStatus[] = [
  'created',
  'pending',
  'init',
  'loaded',
  'completed',
  'normalized',
  'matched',
  'offers_built',
  'winner_selected',
  'winner',
  'published',
];

export function getRunStatusMeta(status: string): RunStatusMeta {
  return RUN_STATUS_MAP[status as RunStatus] ?? { ...RUN_STATUS_FALLBACK, label: status || 'Desconocido' };
}
