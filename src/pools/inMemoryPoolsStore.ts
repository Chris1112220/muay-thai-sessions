import type { Pools } from "../videos";
import type { PoolsStore } from "./poolsStore";

export function inMemoryPoolsStore(pools: Pools): PoolsStore {
  return {
    getPools: async () => pools,
  };
}