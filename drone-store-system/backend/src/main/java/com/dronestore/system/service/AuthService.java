package com.dronestore.system.service;

import com.dronestore.system.dto.AdminDto;
import com.dronestore.system.dto.LoginRequest;
import com.dronestore.system.dto.LoginResponse;
import com.dronestore.system.entity.Admin;
import com.dronestore.system.repository.AdminRepository;
import com.dronestore.system.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class AuthService {

    private final AdminRepository adminRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;

    @Value("${INITIAL_ADMIN_EMAIL:admin@example.com}")
    private String initialAdminEmail;

    @Value("${INITIAL_ADMIN_PASSWORD:AdminPassword123!}")
    private String initialAdminPassword;

    public AuthService(AdminRepository adminRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider tokenProvider) {
        this.adminRepository = adminRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
    }

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Admin admin = adminRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!Boolean.TRUE.equals(admin.getEnabled())) {
            throw new BadCredentialsException("Account is disabled");
        }

        if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String role = admin.getRole();
        String token = tokenProvider.generateToken(admin.getEmail(), role);
        long expiresIn = tokenProvider.getJwtExpirationMs() / 1000;

        AdminDto adminDto = new AdminDto(admin.getId(), admin.getEmail(), admin.getRole());
        return new LoginResponse(token, expiresIn, adminDto);
    }

    @Transactional(readOnly = true)
    public AdminDto getAdminByEmail(String email) {
        Admin admin = adminRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadCredentialsException("Admin account not found"));
        return new AdminDto(admin.getId(), admin.getEmail(), admin.getRole());
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedInitialAdminAccount() {
        Optional<Admin> existing = adminRepository.findByEmailIgnoreCase(initialAdminEmail);
        String hash = passwordEncoder.encode(initialAdminPassword);

        if (!existing.isPresent()) {
            Admin defaultAdmin = new Admin(initialAdminEmail, hash, "ADMIN", true);
            adminRepository.save(defaultAdmin);
        } else {
            Admin admin = existing.get();
            if (!passwordEncoder.matches(initialAdminPassword, admin.getPasswordHash())) {
                admin.setPasswordHash(hash);
                admin.setEnabled(true);
                adminRepository.save(admin);
            }
        }
    }
}
