package com.dronestore.system.cache;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Thread-safe collector for lightweight Redis cache efficiency metrics:
 * tracks cache hits, misses, evictions, puts, and average Redis GET latency.
 */
@Component
public class CacheMetricsCollector {

    private static final Logger log = LoggerFactory.getLogger(CacheMetricsCollector.class);

    private final Map<String, AtomicLong> hitsByCache = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> missesByCache = new ConcurrentHashMap<>();
    private final Map<String, AtomicLong> totalGetNanosByCache = new ConcurrentHashMap<>();
    private final AtomicLong totalHits = new AtomicLong(0);
    private final AtomicLong totalMisses = new AtomicLong(0);
    private final AtomicLong totalPuts = new AtomicLong(0);
    private final AtomicLong totalEvictions = new AtomicLong(0);

    public void recordHit(String cacheName, long durationNanos) {
        hitsByCache.computeIfAbsent(cacheName, k -> new AtomicLong(0)).incrementAndGet();
        totalGetNanosByCache.computeIfAbsent(cacheName, k -> new AtomicLong(0)).addAndGet(durationNanos);
        totalHits.incrementAndGet();
    }

    public void recordMiss(String cacheName, long durationNanos) {
        missesByCache.computeIfAbsent(cacheName, k -> new AtomicLong(0)).incrementAndGet();
        totalGetNanosByCache.computeIfAbsent(cacheName, k -> new AtomicLong(0)).addAndGet(durationNanos);
        totalMisses.incrementAndGet();
    }

    public void recordPut(String cacheName) {
        totalPuts.incrementAndGet();
    }

    public void recordEviction(String cacheName) {
        totalEvictions.incrementAndGet();
    }

    public long getHits(String cacheName) {
        AtomicLong count = hitsByCache.get(cacheName);
        return count != null ? count.get() : 0L;
    }

    public long getMisses(String cacheName) {
        AtomicLong count = missesByCache.get(cacheName);
        return count != null ? count.get() : 0L;
    }

    public double getHitRate(String cacheName) {
        long h = getHits(cacheName);
        long m = getMisses(cacheName);
        long total = h + m;
        return total > 0 ? ((double) h / total) * 100.0 : 0.0;
    }

    public double getAverageGetLatencyMs(String cacheName) {
        long h = getHits(cacheName);
        long m = getMisses(cacheName);
        long totalOps = h + m;
        AtomicLong nanos = totalGetNanosByCache.get(cacheName);
        if (totalOps > 0 && nanos != null) {
            return (nanos.get() / 1_000_000.0) / totalOps;
        }
        return 0.0;
    }

    public long getTotalHits() {
        return totalHits.get();
    }

    public long getTotalMisses() {
        return totalMisses.get();
    }

    public double getOverallHitRate() {
        long h = totalHits.get();
        long m = totalMisses.get();
        long total = h + m;
        return total > 0 ? ((double) h / total) * 100.0 : 0.0;
    }

    public long getTotalPuts() {
        return totalPuts.get();
    }

    public long getTotalEvictions() {
        return totalEvictions.get();
    }

    public void reset() {
        hitsByCache.clear();
        missesByCache.clear();
        totalGetNanosByCache.clear();
        totalHits.set(0);
        totalMisses.set(0);
        totalPuts.set(0);
        totalEvictions.set(0);
    }
}
