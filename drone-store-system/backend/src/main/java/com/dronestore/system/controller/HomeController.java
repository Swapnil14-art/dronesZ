package com.dronestore.system.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> getApiInfo() {
        Map<String, Object> response = new HashMap<>();
        response.put("system", "Drone Store Backend API");
        response.put("version", "1.0.0");
        response.put("status", "UP");
        response.put("swaggerUiUrl", "http://localhost:8070/swagger-ui.html");
        response.put("frontendUiUrl", "http://localhost:3000");

        Map<String, String> endpoints = new HashMap<>();
        endpoints.put("Interactive Swagger API Docs", "http://localhost:8070/swagger-ui.html");
        endpoints.put("Admin Login", "POST /api/auth/admin/login");
        endpoints.put("Admin Profile", "GET /api/admin/me (Bearer Token)");
        endpoints.put("Categories Management", "GET|POST|PUT|DELETE /api/admin/categories (Bearer Token)");
        endpoints.put("Products Management", "GET|POST|PUT|DELETE /api/admin/products (Bearer Token)");

        response.put("endpoints", endpoints);
        response.put("message", "Open http://localhost:8070/swagger-ui.html to test all APIs interactively in your browser!");

        return ResponseEntity.ok(response);
    }
}
