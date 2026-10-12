package com.mensclothingstore.backend.controller;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import com.mensclothingstore.backend.dto.CreateStaffRequest;
import com.mensclothingstore.backend.dto.LoginRequest;
import com.mensclothingstore.backend.dto.LoginResponse;
import com.mensclothingstore.backend.dto.RegisterRequest;
import com.mensclothingstore.backend.dto.RegisterResponse;
import com.mensclothingstore.backend.dto.StaffAdminLoginRequest;
import com.mensclothingstore.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public RegisterResponse register(
            @Valid @RequestBody RegisterRequest request) {
        return userService.register(request);
    }

    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest request) {
        return userService.login(request);
    }
    @PostMapping("/staff-admin/login")
public LoginResponse staffAdminLogin(
        @Valid @RequestBody StaffAdminLoginRequest request) {
    return userService.loginStaffAdmin(request);
}
@PostMapping("/staff")
public RegisterResponse createStaff(
        @Valid @RequestBody CreateStaffRequest request) {
    return userService.createStaff(request);
}
}