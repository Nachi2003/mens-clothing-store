package com.mensclothingstore.backend.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mensclothingstore.backend.dto.ForgotPasswordRequest;
import com.mensclothingstore.backend.dto.OtpRequest;
import com.mensclothingstore.backend.dto.OtpVerifyRequest;
import com.mensclothingstore.backend.dto.ResetPasswordRequest;
import com.mensclothingstore.backend.entity.AuthOtpChallenge;
import com.mensclothingstore.backend.entity.User;
import com.mensclothingstore.backend.repository.AuthOtpChallengeRepository;
import com.mensclothingstore.backend.repository.UserRepository;

@Service
public class AuthOtpService {
    private static final int MAX_ATTEMPTS = 5;
    private static final int OTP_MINUTES = 5;
    private static final int RESEND_SECONDS = 60;

    private final UserRepository users;
    private final AuthOtpChallengeRepository challenges;
    private final BCryptPasswordEncoder encoder;
    private final EmailOtpService emailOtpService;

    public AuthOtpService(UserRepository users, AuthOtpChallengeRepository challenges,
                          BCryptPasswordEncoder encoder, EmailOtpService emailOtpService) {
        this.users = users;
        this.challenges = challenges;
        this.encoder = encoder;
        this.emailOtpService = emailOtpService;
    }

    @Transactional
    public Map<String, String> requestRegistrationOtp(OtpRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        String phone = req.getPhone().trim();
        String password = req.getPassword();
        validatePassword(password);
        if (users.existsByEmail(email)) throw new IllegalArgumentException("Email is already registered. Please log in instead.");
        if (users.existsByPhone(phone)) throw new IllegalArgumentException("Phone number is already registered.");

        AuthOtpChallenge c = startChallenge(phone, email, "REGISTER");
        c.setName(req.getName().trim());
        c.setPasswordHash(encoder.encode(password));
        String otp = emailOtpService.generateOtp();
        c.setOtpHash(sha256(otp));
        challenges.save(c);
        emailOtpService.sendOtp(email, otp, "account registration");
        return Map.of("challengeId", c.getChallengeId(), "message", "Verification code sent to your email address.");
    }

    @Transactional
    public Map<String, String> verifyRegistrationOtp(OtpVerifyRequest req) {
        AuthOtpChallenge c = getActive(req.getChallengeId(), "REGISTER");
        checkAttempts(c);
        c.setAttempts(c.getAttempts() + 1);
        if (!constantTimeEquals(c.getOtpHash(), sha256(req.getOtp()))) {
            challenges.save(c);
            throw new IllegalArgumentException("Invalid OTP. Please check your email and try again.");
        }
        if (users.existsByEmail(c.getEmail())) throw new IllegalArgumentException("Email is already registered. Please log in instead.");
        if (users.existsByPhone(c.getPhone())) throw new IllegalArgumentException("Phone number is already registered.");

        User user = new User();
        user.setName(c.getName());
        user.setEmail(c.getEmail());
        user.setPhone(c.getPhone());
        user.setPasswordHash(c.getPasswordHash());
        user.setRole("CUSTOMER");
        users.save(user);
        challenges.delete(c);
        return Map.of("message", "Account created successfully. Please log in.");
    }

    @Transactional
    public Map<String, String> requestPasswordOtp(ForgotPasswordRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        User user = users.findByEmail(email).orElse(null);
        AuthOtpChallenge c = startChallenge(user == null ? "" : user.getPhone(), email, "RESET");
        challenges.save(c);
        if (user != null && "CUSTOMER".equalsIgnoreCase(user.getRole())) {
            String otp = emailOtpService.generateOtp();
            c.setOtpHash(sha256(otp));
            challenges.save(c);
            emailOtpService.sendOtp(email, otp, "password reset");
        }
        // Avoid revealing whether an email address is registered.
        return Map.of("challengeId", c.getChallengeId(), "message", "If this email is registered, a verification code has been sent.");
    }

    @Transactional
    public Map<String, String> verifyPasswordOtp(OtpVerifyRequest req) {
        AuthOtpChallenge c = getActive(req.getChallengeId(), "RESET");
        checkAttempts(c);
        c.setAttempts(c.getAttempts() + 1);
        if (c.getOtpHash() == null || !constantTimeEquals(c.getOtpHash(), sha256(req.getOtp()))) {
            challenges.save(c);
            throw new IllegalArgumentException("Invalid OTP. Please check your email and try again.");
        }
        String resetToken = UUID.randomUUID().toString() + UUID.randomUUID();
        c.setVerified(true);
        c.setResetTokenHash(sha256(resetToken));
        c.setExpiresAt(LocalDateTime.now().plusMinutes(5));
        challenges.save(c);
        return Map.of("resetToken", resetToken, "message", "Email verified. You can now set a new password.");
    }

    @Transactional
    public Map<String, String> resetPassword(ResetPasswordRequest req) {
        validatePassword(req.getNewPassword());
        AuthOtpChallenge c = challenges.findByResetTokenHash(sha256(req.getResetToken()))
                .orElseThrow(() -> new IllegalArgumentException("Password reset session is invalid or expired. Please verify OTP again."));
        if (!c.isVerified() || !"RESET".equals(c.getPurpose()) || c.getExpiresAt().isBefore(LocalDateTime.now())) {
            challenges.delete(c);
            throw new IllegalArgumentException("Password reset session is invalid or expired. Please verify OTP again.");
        }
        User user = users.findByEmail(c.getEmail())
                .orElseThrow(() -> new IllegalArgumentException("Customer account was not found."));
        if (!"CUSTOMER".equalsIgnoreCase(user.getRole())) throw new IllegalArgumentException("Password reset is available for customer accounts only.");
        user.setPasswordHash(encoder.encode(req.getNewPassword()));
        users.save(user);
        challenges.delete(c);
        return Map.of("message", "Password changed successfully. Please log in with your new password.");
    }

    private AuthOtpChallenge startChallenge(String phone, String email, String purpose) {
        if ("RESET".equals(purpose)) {
            challenges.findFirstByEmailAndPurposeOrderByCreatedAtDesc(email, purpose).ifPresent(old -> {
                if (old.getLastSentAt().plusSeconds(RESEND_SECONDS).isAfter(LocalDateTime.now()))
                    throw new IllegalArgumentException("Please wait before requesting another OTP.");
                challenges.delete(old);
            });
        } else {
            challenges.findFirstByPhoneAndPurposeOrderByCreatedAtDesc(phone, purpose).ifPresent(old -> {
                if (old.getLastSentAt().plusSeconds(RESEND_SECONDS).isAfter(LocalDateTime.now()))
                    throw new IllegalArgumentException("Please wait before requesting another OTP.");
                challenges.delete(old);
            });
        }
        AuthOtpChallenge c = new AuthOtpChallenge();
        c.setChallengeId(UUID.randomUUID().toString());
        c.setPhone(phone);
        c.setEmail(email);
        c.setPurpose(purpose);
        c.setCreatedAt(LocalDateTime.now());
        c.setLastSentAt(LocalDateTime.now());
        c.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_MINUTES));
        c.setAttempts(0);
        c.setVerified(false);
        return c;
    }

    private AuthOtpChallenge getActive(String id, String purpose) {
        AuthOtpChallenge c = challenges.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("OTP session was not found. Request a new OTP."));
        if (!purpose.equals(c.getPurpose()) || c.getExpiresAt().isBefore(LocalDateTime.now())) {
            challenges.delete(c);
            throw new IllegalArgumentException("OTP expired. Please request a new OTP.");
        }
        return c;
    }

    private void checkAttempts(AuthOtpChallenge c) {
        if (c.getAttempts() >= MAX_ATTEMPTS) {
            challenges.delete(c);
            throw new IllegalArgumentException("Too many incorrect OTP attempts. Request a new OTP.");
        }
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8 || !password.matches(".*[A-Z].*")
                || !password.matches(".*[a-z].*") || !password.matches(".*[0-9].*")
                || !password.matches(".*[^A-Za-z0-9].*")) {
            throw new IllegalArgumentException("Password must be 8+ characters and include uppercase, lowercase, a number, and a special character.");
        }
    }

    private String sha256(String value) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Unable to secure OTP or reset token.");
        }
    }

    private boolean constantTimeEquals(String expected, String actual) {
        return expected != null && MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), actual.getBytes(StandardCharsets.UTF_8));
    }
}
