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
        java.util.Optional<User> existing = userRepository.findByEmailIgnoreCase(cleanEmail);
        if (existing.isPresent()) {
            User existingUser = existing.get();
            if (Boolean.TRUE.equals(existingUser.getIsDeleted())) {
                throw new BusinessRuleException("An account with this email was previously registered and deactivated. Please contact support to reactivate your account.");
            }
            throw new BusinessRuleException("An account with this email address already exists. Please sign in instead.");
        }

        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(cleanEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setPhone(request.getPhone().trim());
        user.setRole("USER");
        user.setEnabled(true);
        user.setIsDeleted(false);

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

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new BusinessRuleException("This account has been deactivated or deleted. Please contact support.");
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
        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new ResourceNotFoundException("User profile not found for email: " + email);
        }
        return mapToDto(user);
    }

    @Transactional
    public UserDto updateUserProfile(String email, UserProfileRequest request) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User profile not found for email: " + email));

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new BusinessRuleException("Cannot update profile of a deactivated account.");
        }

        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone().trim());

        User updatedUser = userRepository.save(user);
        return mapToDto(updatedUser);
    }

    public User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for email: " + email));
    }

    public java.util.List<UserDto> getAllUsers(boolean includeDeleted, String keyword) {
        java.util.List<User> users = includeDeleted ? userRepository.findAll() : userRepository.findByIsDeletedFalse();
        if (keyword != null && !keyword.trim().isEmpty()) {
            String lowerKw = keyword.trim().toLowerCase();
            users = users.stream()
                    .filter(u -> (u.getFullName() != null && u.getFullName().toLowerCase().contains(lowerKw))
                            || (u.getEmail() != null && u.getEmail().toLowerCase().contains(lowerKw))
                            || (u.getPhone() != null && u.getPhone().toLowerCase().contains(lowerKw)))
                    .collect(java.util.stream.Collectors.toList());
        }
        return users.stream().map(this::mapToDto).collect(java.util.stream.Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + id + " not found"));
        return mapToDto(user);
    }

    @Transactional
    public UserDto softDeleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + id + " not found"));

        user.setIsDeleted(true);
        user.setEnabled(false);
        user.setDeletedAt(java.time.LocalDateTime.now());
        User saved = userRepository.save(user);
        return mapToDto(saved);
    }

    @Transactional
    public UserDto restoreUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + id + " not found"));

        user.setIsDeleted(false);
        user.setEnabled(true);
        user.setDeletedAt(null);
        User saved = userRepository.save(user);
        return mapToDto(saved);
    }

    @Transactional
    public UserDto toggleUserStatus(Long id, boolean enabled) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User with ID " + id + " not found"));

        if (Boolean.TRUE.equals(user.getIsDeleted())) {
            throw new BusinessRuleException("Cannot change status of a deleted user. Restore the user first.");
        }

        user.setEnabled(enabled);
        User saved = userRepository.save(user);
        return mapToDto(saved);
    }

    public UserDto mapToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                user.getEnabled() != null ? user.getEnabled() : true,
                user.getIsDeleted() != null ? user.getIsDeleted() : false,
                user.getDeletedAt(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
