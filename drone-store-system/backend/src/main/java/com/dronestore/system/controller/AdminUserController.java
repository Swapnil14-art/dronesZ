package com.dronestore.system.controller;

import com.dronestore.system.dto.UserDto;
import com.dronestore.system.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

    private final UserService userService;

    public AdminUserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<List<UserDto>> getAllUsers(
            @RequestParam(name = "includeDeleted", defaultValue = "false") boolean includeDeleted,
            @RequestParam(name = "keyword", required = false) String keyword) {
        List<UserDto> users = userService.getAllUsers(includeDeleted, keyword);
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDto> getUserById(@PathVariable("id") Long id) {
        UserDto user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<UserDto> softDeleteUser(@PathVariable("id") Long id) {
        UserDto deleted = userService.softDeleteUser(id);
        return ResponseEntity.ok(deleted);
    }

    @PutMapping("/{id}/restore")
    public ResponseEntity<UserDto> restoreUser(@PathVariable("id") Long id) {
        UserDto restored = userService.restoreUser(id);
        return ResponseEntity.ok(restored);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<UserDto> toggleUserStatus(
            @PathVariable("id") Long id,
            @RequestParam(name = "enabled") boolean enabled) {
        UserDto updated = userService.toggleUserStatus(id, enabled);
        return ResponseEntity.ok(updated);
    }
}
