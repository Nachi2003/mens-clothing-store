package com.mensclothingstore.backend.dto;

public class LoginResponse {

    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String role;
    private String token;

    public LoginResponse(
            Long userId,
            String name,
            String email,
            String phone,
            String role) {

        this(userId, name, email, phone, role, null);
    }

    public LoginResponse(
            Long userId,
            String name,
            String email,
            String phone,
            String role,
            String token) {

        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
        this.token = token;
    }

    public Long getUserId() {
        return userId;
    }

    public String getName() {
        return name;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getRole() {
        return role;
    }

    public String getToken() {
        return token;
    }
}