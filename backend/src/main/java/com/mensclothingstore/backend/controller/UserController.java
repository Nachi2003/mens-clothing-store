package com.mensclothingstore.backend.controller;

import java.util.Map;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mensclothingstore.backend.dto.CreateStaffRequest;
import com.mensclothingstore.backend.dto.ForgotPasswordRequest;
import com.mensclothingstore.backend.dto.LoginRequest;
import com.mensclothingstore.backend.dto.LoginResponse;
import com.mensclothingstore.backend.dto.OtpRequest;
import com.mensclothingstore.backend.dto.OtpVerifyRequest;
import com.mensclothingstore.backend.dto.RegisterRequest;
import com.mensclothingstore.backend.dto.RegisterResponse;
import com.mensclothingstore.backend.dto.ResetPasswordRequest;
import com.mensclothingstore.backend.dto.StaffAdminLoginRequest;
import com.mensclothingstore.backend.service.AuthOtpService;
import com.mensclothingstore.backend.service.UserService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;
    private final AuthOtpService authOtpService;

    public UserController(UserService userService, AuthOtpService authOtpService) {
        this.userService = userService;
        this.authOtpService = authOtpService;
    }

    // Direct registration is disabled so an OTP cannot be bypassed.
    @PostMapping("/register")
    public Map<String, String> register(@Valid @RequestBody RegisterRequest request) {
        throw new org.springframework.web.server.ResponseStatusException(
                org.springframework.http.HttpStatus.GONE,
                "Registration requires email OTP verification. Use /api/users/register/request-otp.");
    }

    @PostMapping("/register/request-otp")
    public Map<String, String> requestRegistrationOtp(@Valid @RequestBody OtpRequest request) {
        return authOtpService.requestRegistrationOtp(request);
    }

    @PostMapping("/register/verify-otp")
    public Map<String, String> verifyRegistrationOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return authOtpService.verifyRegistrationOtp(request);
    }

    @PostMapping("/forgot-password/request-otp")
    public Map<String, String> requestPasswordOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        return authOtpService.requestPasswordOtp(request);
    }

    @PostMapping("/forgot-password/verify-otp")
    public Map<String, String> verifyPasswordOtp(@Valid @RequestBody OtpVerifyRequest request) {
        return authOtpService.verifyPasswordOtp(request);
    }

    @PostMapping("/forgot-password/reset")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        return authOtpService.resetPassword(request);
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