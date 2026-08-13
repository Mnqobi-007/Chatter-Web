package com.chatter.spring_boot_starter_parent.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {
    @NotBlank
    @Pattern(regexp = "^[a-zA-Z0-9_.-]{3,20}$", message = "Username must be 3-20 characters: letters, numbers, underscore, dot, hyphen only")
	private String username;
    @NotBlank
    @Email
	private String email;
    @NotBlank
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
	private String password;
	
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public String getPassword() {
		return password;
	}
	public void setPassword(String password) {
		this.password = password;
	}
	
	
}