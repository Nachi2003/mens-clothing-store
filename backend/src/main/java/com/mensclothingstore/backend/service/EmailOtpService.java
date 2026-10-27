package com.mensclothingstore.backend.service;

import java.security.SecureRandom;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailOtpService {
    private final JavaMailSender mailSender;
    private final SecureRandom random = new SecureRandom();

    public EmailOtpService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public String generateOtp() {
        return String.format("%06d", random.nextInt(1_000_000));
    }

    public void sendOtp(String email, String otp, String purpose) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(email);
        message.setSubject("UNIQUE ZONE - Email verification code");
        message.setText("Your UNIQUE ZONE verification code is: " + otp + "\n\n"
                + "This code is for " + purpose + " and expires in 5 minutes.\n"
                + "Do not share this code with anyone. If you did not request it, you can ignore this email.");
        mailSender.send(message);
    }
}
