import { BusinessError } from "./crypto.js";
export function googleQuota(redis: {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
}) {
  return async () => {
    try {
      const key = `reviesnest:gbp:quota:${Math.floor(Date.now() / 60000)}`;
      const count = await redis.incr(key);
      if (count === 1) await redis.expire(key, 120);
      if (count > 60) throw new BusinessError("RATE_LIMITED", 429, true, 60);
    } catch (error) {
      if (error instanceof BusinessError) throw error;
      throw new BusinessError("QUEUE_UNAVAILABLE", 503, true);
    }
  };
}
