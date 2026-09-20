package com.dronestore.system.controller;

import com.dronestore.system.dto.UserAddressDto;
import com.dronestore.system.dto.UserAddressRequest;
import com.dronestore.system.dto.UserDto;
import com.dronestore.system.dto.UserProfileRequest;
import com.dronestore.system.service.UserAddressService;
import com.dronestore.system.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;
    private final UserAddressService addressService;

    public UserController(UserService userService, UserAddressService addressService) {
        this.userService = userService;
        this.addressService = addressService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUserProfile(Authentication authentication) {
        String email = authentication.getName();
        UserDto profile = userService.getUserProfile(email);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/profile")
    public ResponseEntity<UserDto> updateUserProfile(Authentication authentication,
                                                     @Valid @RequestBody UserProfileRequest request) {
        String email = authentication.getName();
        UserDto updated = userService.updateUserProfile(email, request);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<UserAddressDto>> getUserAddresses(Authentication authentication) {
        String email = authentication.getName();
        List<UserAddressDto> addresses = addressService.getUserAddresses(email);
        return ResponseEntity.ok(addresses);
    }

    @PostMapping("/addresses")
    public ResponseEntity<UserAddressDto> addAddress(Authentication authentication,
                                                     @Valid @RequestBody UserAddressRequest request) {
        String email = authentication.getName();
        UserAddressDto address = addressService.addAddress(email, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(address);
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<UserAddressDto> updateAddress(Authentication authentication,
                                                        @PathVariable("id") Long id,
                                                        @Valid @RequestBody UserAddressRequest request) {
        String email = authentication.getName();
        UserAddressDto updated = addressService.updateAddress(email, id, request);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<Void> deleteAddress(Authentication authentication, @PathVariable("id") Long id) {
        String email = authentication.getName();
        addressService.deleteAddress(email, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/addresses/{id}/default")
    public ResponseEntity<UserAddressDto> setDefaultAddress(Authentication authentication, @PathVariable("id") Long id) {
        String email = authentication.getName();
        UserAddressDto address = addressService.setDefaultAddress(email, id);
        return ResponseEntity.ok(address);
    }
}
