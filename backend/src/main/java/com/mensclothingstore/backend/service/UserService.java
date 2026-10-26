
package com.mensclothingstore.backend.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.mensclothingstore.backend.dto.CreateStaffRequest;
import com.mensclothingstore.backend.dto.LoginRequest;
import com.mensclothingstore.backend.dto.LoginResponse;
import com.mensclothingstore.backend.dto.RegisterRequest;
import com.mensclothingstore.backend.dto.RegisterResponse;
import com.mensclothingstore.backend.dto.StaffAdminLoginRequest;
import com.mensclothingstore.backend.dto.UpdateStaffRequest;
import com.mensclothingstore.backend.entity.User;
import com.mensclothingstore.backend.repository.UserRepository;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder,
            JwtService jwtService) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    // Customer registration
    public RegisterResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword()));
        user.setRole("CUSTOMER");

        User savedUser = userRepository.save(user);

        return toRegisterResponse(savedUser);
    }

    // Customer login with JWT
    public LoginResponse login(LoginRequest request) {

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() ->
                        new RuntimeException("Invalid email or password"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password");
        }

        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole()
        );

        return new LoginResponse(
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                token
        );
    }

    // Staff/Admin login with JWT
    public LoginResponse loginStaffAdmin(
            StaffAdminLoginRequest request) {

        Long userId;

        try {
            userId = Long.parseLong(request.getUserId());
        } catch (NumberFormatException e) {
            throw new RuntimeException(
                    "Invalid User ID or password");
        }

        User user = userRepository.findByUserId(userId)
                .orElseThrow(() ->
                        new RuntimeException(
                                "Invalid User ID or password"));

        if (!passwordEncoder.matches(
                request.getPassword(),
                user.getPasswordHash())) {
            throw new RuntimeException(
                    "Invalid User ID or password");
        }

        String requestedRole =
                request.getRole().trim().toUpperCase();

        if (!requestedRole.equals("ADMIN")
                && !requestedRole.equals("STAFF")) {
            throw new RuntimeException("Invalid role selected");
        }

        if (!requestedRole.equals(user.getRole())) {
            throw new RuntimeException(
                    "You are not authorized for this role");
        }

        String token = jwtService.generateToken(
                user.getUserId(),
                user.getEmail(),
                user.getRole()
        );

        return new LoginResponse(
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                token
        );
    }

    // Admin creates a staff account
    public RegisterResponse createStaff(
            CreateStaffRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException(
                    "Email is already registered");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPasswordHash(
                passwordEncoder.encode(request.getPassword()));
        user.setRole("STAFF");

        User savedUser = userRepository.save(user);

        return toRegisterResponse(savedUser);
    }

    // Admin views all staff accounts
    public List<RegisterResponse> getAllStaff() {

        return userRepository.findByRole("STAFF")
                .stream()
                .map(this::toRegisterResponse)
                .collect(Collectors.toList());
    }

    // Admin views one staff account
    public RegisterResponse getStaffById(Long id) {

        User user = findStaffById(id);

        return toRegisterResponse(user);
    }

    // Admin edits staff name, email and phone
    public RegisterResponse updateStaff(
            Long id,
            UpdateStaffRequest request) {

        User user = findStaffById(id);

        if (request.getName() == null
                || request.getName().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Staff name is required");
        }

        if (request.getEmail() == null
                || request.getEmail().trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Staff email is required");
        }

        String name = request.getName().trim();
        String email = request.getEmail().trim();

        userRepository.findByEmail(email)
                .filter(existing ->
                        !existing.getUserId().equals(user.getUserId()))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(
                            HttpStatus.CONFLICT,
                            "Email is already registered");
                });

        user.setName(name);
        user.setEmail(email);
        user.setPhone(
                request.getPhone() == null
                        ? null
                        : request.getPhone().trim());

        User updatedUser = userRepository.save(user);

        return toRegisterResponse(updatedUser);
    }

    // Find a user only if their role is STAFF
    private User findStaffById(Long id) {

        return userRepository.findByUserId(id)
                .filter(user -> "STAFF".equals(user.getRole()))
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "Staff member not found"));
    }

    // Return safe user details without password hash
    private RegisterResponse toRegisterResponse(User user) {

        return new RegisterResponse(
                user.getUserId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        );
    }
}
