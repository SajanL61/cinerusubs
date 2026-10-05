import { PHASE_PRODUCTION_BUILD } from 'next/constants';
import { assertProductionEnvironment } from '@/lib/env';

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  if (process.env.NEXT_PHASE === PHASE_PRODUCTION_BUILD) return;
  assertProductionEnvironment();
}
