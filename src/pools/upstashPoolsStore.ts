import { Redis } from "@upstash/redis";
import type { Pools } from "../videos";
import type { PoolsStore } from "./poolsStore";
import { POOLS_STORE_KEY } from "./poolsStore";

export function upstashPoolsStore(redis: Redis): PoolsStore {
  return {
    getPools: async () => {
      const pools = await redis.get<Pools>(POOLS_STORE_KEY);
      if (!pools) {
        return { Training: [], Fights: [], History: [] };
      }
      return pools;
    },
    setPools: async (pools) => {
      await redis.set(POOLS_STORE_KEY, pools);
    },
  };
}

export function poolsStoreFromEnv(): PoolsStore {
  return upstashPoolsStore(Redis.fromEnv());
}