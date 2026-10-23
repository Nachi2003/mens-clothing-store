package com.mensclothingstore.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class OtpVerifyRequest {
    @NotBlank private String challengeId;
    @NotBlank @Pattern(regexp = "^[0-9]{6}$", message = "Enter the 6-digit OTP sent to your email") private String otp;
    public String getChallengeId() { return challengeId; }
    public void setChallengeId(String value) { challengeId = value; }
    public String getOtp() { return otp; }
    public void setOtp(String value) { otp = value; }
}
