package com.mensclothingstore.backend.dto;
import jakarta.validation.constraints.*;
public class ResetPasswordRequest {
 @NotBlank private String resetToken; @NotBlank @Size(min=8,max=100) private String newPassword;
 public String getResetToken(){return resetToken;} public void setResetToken(String v){resetToken=v;}
 public String getNewPassword(){return newPassword;} public void setNewPassword(String v){newPassword=v;}
}
