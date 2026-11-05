/**
 * Damage zones shown in the UI (v2.1.0), all ground radii in metres.
 * "Lethal" follows the NASA PAIR rule used for casualties: the larger of the
 * 4 psi (27.6 kPa) blast radius and the 3rd-degree burn radius.
 */
import type { SimulationResult } from '../types';

export interface DamageZone {
  key: 'moderate' | 'lethal' | 'collapse' | 'total';
  label: string;
  detail: string;
  radius: number;
  color: string;
  emoji: string;
}

export function damageZones(blast: SimulationResult['blast']): DamageZone[] {
  const lethal = Math.max(blast.lethalBlastRadius ?? 0, blast.thermalRadius ?? 0);
  const lethalCause = (blast.thermalRadius ?? 0) > (blast.lethalBlastRadius ?? 0)
    ? '3rd-degree burns'
    : 'blast >= 4 psi (27.6 kPa)';
  return [
    {
      key: 'moderate',
      label: 'Moderate damage',
      detail: '>= 7 kPa: injuries, light structures damaged, windows broken',
      radius: Number(blast.blast_physics?.moderate_structural ?? 0),
      color: '#ffcc00',
      emoji: '🟡',
    },
    {
      key: 'lethal',
      label: 'Lethal zone',
      detail: `Counted as killed (NASA PAIR rule), set by ${lethalCause}`,
      radius: lethal,
      color: '#ff6600',
      emoji: '🟠',
    },
    {
      key: 'collapse',
      label: 'Building collapse',
      detail: '>= 20 kPa (3 psi): most residential buildings collapse',
      radius: blast.airblastRadius ?? 0,
      color: '#cc33ff',
      emoji: '🟣',
    },
    {
      key: 'total',
      label: 'Total destruction',
      detail: '>= 70 kPa (10 psi): reinforced structures destroyed',
      radius: blast.fireball ?? 0,
      color: '#ff0000',
      emoji: '🔴',
    },
  ];
}
