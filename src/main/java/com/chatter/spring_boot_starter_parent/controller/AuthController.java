package com.chatter.spring_boot_starter_parent.controller;

import com.chatter.spring_boot_starter_parent.repository.UserRepository;
import java.util.Map;

//import org.springframework.cache.annotation.CacheEvict;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chatter.spring_boot_starter_parent.dto.AuthRequest;
import com.chatter.spring_boot_starter_parent.dto.AuthResponse;
import com.chatter.spring_boot_starter_parent.dto.RegisterRequest;
import com.chatter.spring_boot_starter_parent.exception.RefreshTokenException;
import com.chatter.spring_boot_starter_parent.model.RefreshToken;
import com.chatter.spring_boot_starter_parent.model.User;
import com.chatter.spring_boot_starter_parent.repository.RefreshTokenRepository;
import com.chatter.spring_boot_starter_parent.service.RefreshTokenService;
import com.chatter.spring_boot_starter_parent.service.UserService;
import com.chatter.spring_boot_starter_parent.util.JwtUtil;

@RestController
@RequestMapping("/auth")
public class AuthController {
	private final UserRepository userRepository;
	private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final UserService userService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepository refreshTokenRepository;
	
	
	public AuthController(AuthenticationManager authenticationManager, JwtUtil jwtUtil,
			UserDetailsService userDetailsService, UserService userService, PasswordEncoder passwordEncoder,
			RefreshTokenRepository refreshTokenRepository, RefreshTokenService refreshTokenService, UserRepository userRepository) {
		this.authenticationManager = authenticationManager;
		this.jwtUtil = jwtUtil;
		this.userDetailsService = userDetailsService;
		this.userService = userService;
		this.passwordEncoder = passwordEncoder;
		this.refreshTokenRepository = refreshTokenRepository;
		this.refreshTokenService = refreshTokenService;
		this.userRepository = userRepository;
	}

	@PostMapping("/login")
	public ResponseEntity<?> login(@RequestBody AuthRequest request) throws Exception{
		authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
		
		UserDetails userDetails = userDetailsService.loadUserByUsername(request.getUsername());
		
		User user  = (User) userDetails;
		
		String jwt = jwtUtil.generateToken(userDetails.getUsername());
		RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
		
		AuthResponse response = new AuthResponse();
		response.setToken(jwt);
		response.setRefreshToken(refreshToken.getToken());
		response.setUsername(userDetails.getUsername());
		
		return ResponseEntity.ok(response);
	}
	
	@PostMapping("/refresh")
	public ResponseEntity<?> refresh(@RequestBody Map<String, String> request){
		String requestedToken = request.get("refreshToken");
		
		RefreshToken refreshToken = refreshTokenRepository.findByToken(requestedToken)
				.orElseThrow(() -> new RefreshTokenException("Refresh token not found"));
		refreshTokenService.verifyActive(refreshToken);
		
		String newAccessToken = jwtUtil.generateToken(refreshToken.getUser().getUsername());
		return ResponseEntity.ok(Map.of("token", newAccessToken));
	}
	
	@PostMapping("/logout")
	//@CacheEvict(cacheNames = "contacts", allEntries = true)
	public ResponseEntity<?> logout(@RequestBody Map<String, String> request){
		String requestedToken = request.get("refreshToken");
		
		if(requestedToken != null) {
			refreshTokenService.revokeToken(requestedToken);
		}
		return ResponseEntity.ok(Map.of("message", "Logged out"));
	}
	
	@PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        // RegisterRequest DTO with username, email, password
		if(userRepository.findByUsername(request.getUsername()).isPresent()) {
			return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
		}
		if(userRepository.findByEmail(request.getEmail()).isPresent()) {
			return ResponseEntity.badRequest().body(Map.of("message", "Email already taken"));
		}
        userService.registerUser(request.getUsername(), 
        		passwordEncoder.encode(request.getPassword()), // Hash password!
            request.getEmail());
        return ResponseEntity.ok(Map.of("message", "User registered successfully"));
	}
}