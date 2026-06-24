package com.garage.security;

import org.springframework.stereotype.Component;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

@Component
public class LoginRateLimiter {
    private final Map<String, AtomicInteger> attempts = new ConcurrentHashMap<>();
    private final Map<String, Long> blockedUntil = new ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 5;
    private static final long BLOCK_DURATION_MS = 60_000;

    public boolean isAllowed(String ip) {
        Long blocked = blockedUntil.get(ip);
        if (blocked != null) {
            if (System.currentTimeMillis() < blocked) {
                return false;
            }
            blockedUntil.remove(ip);
            attempts.remove(ip);
        }

        AtomicInteger count = attempts.computeIfAbsent(ip, k -> new AtomicInteger(0));
        int current = count.incrementAndGet();
        if (current >= MAX_ATTEMPTS) {
            blockedUntil.put(ip, System.currentTimeMillis() + BLOCK_DURATION_MS);
            return false;
        }
        return true;
    }

    public void reset(String ip) {
        attempts.remove(ip);
        blockedUntil.remove(ip);
    }
}
