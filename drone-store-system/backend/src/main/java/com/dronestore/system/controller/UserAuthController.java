package com.dronestore.system.controller;

import com.dronestore.system.dto.UserDto;
import com.dronestore.system.dto.UserLoginRequest;
import com.dronestore.system.dto.UserLoginResponse;
import com.dronestore.system.dto.UserSignupRequest;
import com.dronestore.system.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;

@RestController
@RequestMapping("/api/auth/user")
public class UserAuthController {

    private final UserService userService;

    public UserAuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/signup")
    public ResponseEntity<UserDto> registerUser(@Valid @RequestBody UserSignupRequest request) {
        UserDto registered = userService.registerUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(registered);
    }

    @PostMapping("/login")
    public ResponseEntity<UserLoginResponse> loginUser(@Valid @RequestBody UserLoginRequest request) {
        UserLoginResponse response = userService.loginUser(request);
        return ResponseEntity.ok(response);
    }
}
