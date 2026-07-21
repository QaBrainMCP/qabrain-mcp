import { performance } from "node:perf_hooks";
import { logger } from "./logger.js";

export class Metrics {
    startTimer(name: string) {
        const start = performance.now();
        return () => {
            const duration = performance.now() - start;
            this.record(name, duration);
            return duration;
        };
    }

    record(name: string, value: number, tags?: Record<string, unknown>) {
        const mem = process.memoryUsage();
        logger.info({ metric: name, value, memory: { rss: mem.rss, heapUsed: mem.heapUsed }, ...tags }, "metric");
    }

    snapshot(name: string) {
        const mem = process.memoryUsage();
        logger.info({ metric: name, memory: mem }, "metric.snapshot");
    }
}

export const metrics = new Metrics();
