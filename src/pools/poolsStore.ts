import type { Pools } from "../videos";

/** Redis key holding all category pools as one JSON value (single GET per session request). */
export const POOLS_STORE_KEY = "pools";

export interface PoolsStore {
  getPools(): Promise<Pools>;
}