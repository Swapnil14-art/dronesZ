package com.dronestore.system.security;

import com.dronestore.system.entity.Admin;
import com.dronestore.system.entity.User;
import com.dronestore.system.repository.AdminRepository;
import com.dronestore.system.repository.UserRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.Optional;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final AdminRepository adminRepository;

    public CustomUserDetailsService(UserRepository userRepository, AdminRepository adminRepository) {
        this.userRepository = userRepository;
        this.adminRepository = adminRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // 1. Check User (Customer) accounts first
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            String roleName = user.getRole();
            if (!roleName.startsWith("ROLE_")) {
                roleName = "ROLE_" + roleName;
            }
            return new org.springframework.security.core.userdetails.User(
                    user.getEmail(),
                    user.getPasswordHash(),
                    Boolean.TRUE.equals(user.getEnabled()),
                    true,
                    true,
                    true,
                    Collections.singletonList(new SimpleGrantedAuthority(roleName))
            );
        }

        // 2. Check Admin accounts
        Optional<Admin> adminOpt = adminRepository.findByEmailIgnoreCase(email);
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            String roleName = admin.getRole();
            if (!roleName.startsWith("ROLE_")) {
                roleName = "ROLE_" + roleName;
            }
            return new org.springframework.security.core.userdetails.User(
                    admin.getEmail(),
                    admin.getPasswordHash(),
                    Boolean.TRUE.equals(admin.getEnabled()),
                    true,
                    true,
                    true,
                    Collections.singletonList(new SimpleGrantedAuthority(roleName))
            );
        }

        throw new UsernameNotFoundException("Account not found with email: " + email);
    }
}
