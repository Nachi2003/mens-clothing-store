package com.mensclothingstore.backend.service;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.LoginRequest;
import com.mensclothingstore.backend.dto.LoginResponse;
import com.mensclothingstore.backend.dto.RegisterRequest;
import com.mensclothingstore.backend.dto.RegisterResponse;
import com.mensclothingstore.backend.entity.User;
import com.mensclothingstore.backend.repository.UserRepository;

@Service
public class UserService {


    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            BCryptPasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public RegisterResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered");
        }

        User user = new User();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());

        String hashedPassword =
                passwordEncoder.encode(request.getPassword());

        user.setPasswordHash(hashedPassword);

        user.setRole("CUSTOMER");

        User savedUser = userRepository.save(user);

        return new RegisterResponse(
                savedUser.getUserId(),
                savedUser.getName(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getRole()
        );
    }
    public LoginResponse login(LoginRequest request) {

    User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() ->
                    new RuntimeException("Invalid email or password"));

    if (!passwordEncoder.matches(
            request.getPassword(),
            user.getPasswordHash())) {

        throw new RuntimeException("Invalid email or password");
    }

    return new LoginResponse(
            user.getUserId(),
            user.getName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole()
    );
}
}