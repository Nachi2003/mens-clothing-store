package com.mensclothingstore.backend.entity;

import java.time.LocalDateTime;
import jakarta.persistence.*;

@Entity
@Table(name = "auth_otp_challenges")
public class AuthOtpChallenge {
    @Id @Column(name = "challenge_id", length = 36) private String challengeId;
    @Column(nullable = false, length = 20) private String purpose;
    @Column(nullable = false, length = 20) private String phone;
    @Column(length = 150) private String email;
    @Column(length = 100) private String name;
    @Column(name = "password_hash", length = 255) private String passwordHash;
    @Column(name = "otp_hash", length = 64) private String otpHash;
    @Column(name = "expires_at", nullable = false) private LocalDateTime expiresAt;
    @Column(nullable = false) private boolean verified;
    @Column(name = "reset_token_hash", length = 64) private String resetTokenHash;
    @Column(name = "created_at", nullable = false) private LocalDateTime createdAt;
    @Column(name = "last_sent_at", nullable = false) private LocalDateTime lastSentAt;
    @Column(nullable = false) private int attempts;

    public String getChallengeId(){return challengeId;} public void setChallengeId(String v){challengeId=v;}
    public String getPurpose(){return purpose;} public void setPurpose(String v){purpose=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getPasswordHash(){return passwordHash;} public void setPasswordHash(String v){passwordHash=v;}
    public String getOtpHash(){return otpHash;} public void setOtpHash(String v){otpHash=v;}
    public LocalDateTime getExpiresAt(){return expiresAt;} public void setExpiresAt(LocalDateTime v){expiresAt=v;}
    public boolean isVerified(){return verified;} public void setVerified(boolean v){verified=v;}
    public String getResetTokenHash(){return resetTokenHash;} public void setResetTokenHash(String v){resetTokenHash=v;}
    public LocalDateTime getCreatedAt(){return createdAt;} public void setCreatedAt(LocalDateTime v){createdAt=v;}
    public LocalDateTime getLastSentAt(){return lastSentAt;} public void setLastSentAt(LocalDateTime v){lastSentAt=v;}
    public int getAttempts(){return attempts;} public void setAttempts(int v){attempts=v;}
}
