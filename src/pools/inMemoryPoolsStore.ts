import type { Pools } from "../videos";
import type { PoolsStore } from "./poolsStore";

export function inMemoryPoolsStore(initial: Pools): PoolsStore {
  let pools = initial;
  return {
    getPools: async () => pools,
    setPools: async (next) => {
      pools = next;
    },
  };
}