package com.dronestore.system.service;

import com.dronestore.system.dto.*;
import com.dronestore.system.entity.User;
import com.dronestore.system.exception.BusinessRuleException;
import com.dronestore.system.exception.ResourceNotFoundException;
import com.dronestore.system.repository.UserRepository;
import com.dronestore.system.security.JwtTokenProvider;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public UserService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public UserDto registerUser(UserSignupRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(cleanEmail)) {
            throw new BusinessRuleException("An account with this email address already exists. Please sign in instead.");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(cleanEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone().trim());
        user.setRole("USER");
        user.setEnabled(true);

        User savedUser = userRepository.save(user);
        return mapToDto(savedUser);
    }

    public UserLoginResponse loginUser(UserLoginRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(cleanEmail)
                .orElseThrow(() -> new BusinessRuleException("Invalid email address or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("Invalid email address or password.");
        }

        if (!Boolean.TRUE.equals(user.getEnabled())) {
            throw new BusinessRuleException("User account has been disabled. Please contact support.");
        }

        String token = jwtTokenProvider.generateToken(user.getEmail(), user.getRole());
        long expiresIn = jwtTokenProvider.getJwtExpirationMs() / 1000;

        return new UserLoginResponse(token, expiresIn, mapToDto(user));
    }

    public UserDto getUserProfile(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for email: " + email));
        return mapToDto(user);
    }

    @Transactional
    public UserDto updateUserProfile(String email, UserProfileRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for email: " + email));

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone().trim());

        User updatedUser = userRepository.save(user);
        return mapToDto(updatedUser);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + email));
    }

    public UserDto mapToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getCreatedAt()
        );
    }
}
