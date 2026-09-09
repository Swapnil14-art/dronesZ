package com.dronestore.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;

@SpringBootApplication
public class DroneStoreSystemApplication {

    public static void main(String[] args) {
        // Enable IPv6 address resolution in JVM for cloud databases (such as Supabase direct IPv6 hosts)
        System.setProperty("java.net.preferIPv6Addresses", "true");

        loadDotEnvIfPresent();
        ensureRedisAvailable();
        SpringApplication.run(DroneStoreSystemApplication.class, args);
    }

    /**
     * Verifies Redis availability on startup and automatically launches local Redis if on localhost.
     * Keeps production and cloud deployments unaffected while providing seamless zero-setup local performance.
     */
    private static void ensureRedisAvailable() {
        String host = System.getProperty("REDIS_HOST");
        if (host == null || host.trim().isEmpty()) {
            host = System.getenv("REDIS_HOST");
        }
        if (host == null || host.trim().isEmpty()) {
            host = "localhost";
        }

        String portStr = System.getProperty("REDIS_PORT");
        if (portStr == null || portStr.trim().isEmpty()) {
            portStr = System.getenv("REDIS_PORT");
        }
        int port = 6379;
        if (portStr != null && !portStr.trim().isEmpty()) {
            try {
                port = Integer.parseInt(portStr.trim());
            } catch (NumberFormatException ignored) {
            }
        }

        if (isPortListening(host, port, 500)) {
            System.out.println("[Redis Health] Active Redis instance detected on " + host + ":" + port);
            return;
        }

        if ("localhost".equalsIgnoreCase(host) || "127.0.0.1".equals(host)) {
            System.out.println("[Redis Health] Redis not listening on " + host + ":" + port + ". Attempting auto-start...");
            boolean started = tryStartLocalRedis(port);
            if (started) {
                long deadline = System.currentTimeMillis() + 4000;
                while (System.currentTimeMillis() < deadline) {
                    if (isPortListening(host, port, 300)) {
                        System.out.println("[Redis Health] Local Redis server auto-started successfully on port " + port);
                        return;
                    }
                    try {
                        Thread.sleep(200);
                    } catch (InterruptedException ignored) {
                        break;
                    }
                }
            }
            System.out.println("[Redis Health] Could not auto-start local Redis daemon. Application will continue with resilient PostgreSQL fallback.");
        } else {
            System.out.println("[Redis Health] Remote Redis host (" + host + ":" + port + ") not reachable. Application will proceed with PostgreSQL fallback.");
        }
    }

    private static boolean isPortListening(String host, int port, int timeoutMs) {
        try (java.net.Socket socket = new java.net.Socket()) {
            socket.connect(new java.net.InetSocketAddress(host, port), timeoutMs);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private static boolean tryStartLocalRedis(int port) {
        String userHome = System.getProperty("user.home");
        String[] candidatePaths = new String[]{
                userHome + "/scoop/apps/redis/current/redis-server.exe",
                userHome + "/scoop/shims/redis-server.exe",
                "C:/Program Files/Redis/redis-server.exe",
                "C:/Program Files/Memurai/memurai.exe"
        };

        boolean isWindows = System.getProperty("os.name", "").toLowerCase().contains("win");
        File nullDev = new File(isWindows ? "NUL" : "/dev/null");

        for (String candidate : candidatePaths) {
            File bin = new File(candidate);
            if (bin.exists() && bin.canExecute()) {
                try {
                    ProcessBuilder pb = new ProcessBuilder(bin.getAbsolutePath(), "--port", String.valueOf(port));
                    pb.redirectOutput(ProcessBuilder.Redirect.to(nullDev));
                    pb.redirectError(ProcessBuilder.Redirect.to(nullDev));
                    pb.start();
                    return true;
                } catch (Exception e) {
                    System.err.println("[Redis Health] Failed to execute " + candidate + ": " + e.getMessage());
                }
            }
        }

        try {
            ProcessBuilder pb = new ProcessBuilder("redis-server", "--port", String.valueOf(port));
            pb.redirectOutput(ProcessBuilder.Redirect.to(nullDev));
            pb.redirectError(ProcessBuilder.Redirect.to(nullDev));
            pb.start();
            return true;
        } catch (Exception ignored) {
        }

        return false;
    }



    /**
     * Pure Java 8 compatible helper to load `.env` key-value pairs into System properties
     * without relying on external dependencies compiled for higher JDK versions.
     */
    private static void loadDotEnvIfPresent() {
        File[] candidateFiles = new File[]{
            new File("../.env"),
            new File(".env"),
            new File("drone-store-system/.env")
        };

        for (File envFile : candidateFiles) {
            if (envFile.exists() && envFile.isFile()) {
                try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (line.isEmpty() || line.startsWith("#")) {
                            continue;
                        }
                        int eqIdx = line.indexOf('=');
                        if (eqIdx > 0) {
                            String key = line.substring(0, eqIdx).trim();
                            String value = line.substring(eqIdx + 1).trim();
                            if ((value.startsWith("\"") && value.endsWith("\"")) ||
                                (value.startsWith("'") && value.endsWith("'"))) {
                                value = value.substring(1, value.length() - 1);
                            }
                            if (System.getProperty(key) == null && System.getenv(key) == null) {
                                System.setProperty(key, value);
                            }
                        }
                    }
                } catch (Exception ignored) {
                }
                break;
            }
        }
    }
}
