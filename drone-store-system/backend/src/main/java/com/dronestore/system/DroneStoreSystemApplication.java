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
        SpringApplication.run(DroneStoreSystemApplication.class, args);
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
