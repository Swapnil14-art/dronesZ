package com.dronestore.system.controller;

import com.dronestore.system.dto.AdminDto;
import com.dronestore.system.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class ProtectedAdminController {

    private final AuthService authService;

    public ProtectedAdminController(AuthService authService) {
        this.authService = authService;
    }

    @GetMapping("/me")
    public ResponseEntity<AdminDto> getCurrentAdmin(Authentication authentication) {
        String email = authentication.getName();
        AdminDto adminDto = authService.getAdminByEmail(email);
        return ResponseEntity.ok(adminDto);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getAdminDashboardSummary(Authentication authentication) {
        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("status", "Authenticated");
        dashboard.put("authenticatedAdmin", authentication.getName());
        dashboard.put("role", "ADMIN");
        dashboard.put("systemAccess", "Granted");
        dashboard.put("timestamp", System.currentTimeMillis());
        return ResponseEntity.ok(dashboard);
    }
}
