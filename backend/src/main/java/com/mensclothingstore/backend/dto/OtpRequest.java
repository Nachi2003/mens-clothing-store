package com.mensclothingstore.backend.dto;

import jakarta.validation.constraints.*;

public class OtpRequest {
    @NotBlank @Size(max=100) private String name;
    @NotBlank @Email @Size(max=150) private String email;
    @NotBlank @Pattern(regexp="^[6-9][0-9]{9}$", message="Enter a valid 10-digit Indian mobile number") private String phone;
    @NotBlank @Size(min=8,max=100) private String password;
    public String getName(){return name;} public void setName(String v){name=v;}
    public String getEmail(){return email;} public void setEmail(String v){email=v;}
    public String getPhone(){return phone;} public void setPhone(String v){phone=v;}
    public String getPassword(){return password;} public void setPassword(String v){password=v;}
}
