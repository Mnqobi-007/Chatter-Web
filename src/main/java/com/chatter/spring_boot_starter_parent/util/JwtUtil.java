package com.chatter.spring_boot_starter_parent.util;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;

@Component
public class JwtUtil {
	@Value("${jwt.secret}")
	private String jwtSecret;

    @Value("${jwt.expiration}")
	private Long expiration;

	@PostConstruct
	public void init() {
	    if (jwtSecret == null || jwtSecret.length() < 32) {
	        throw new IllegalStateException("JWT secret must be at least 32 characters");
	    }
	}
	
	private SecretKey getSigningKey() {
        byte[] keyBytes = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }
	
	public String generateToken(String username) {
        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                .compact();
	}
	
	public String extractUsername(String token) {
		return extractAllClaims(token).getSubject();
	}
	
	public Boolean isTokenExpired(String token) {
		return extractAllClaims(token).getExpiration().before(new Date());
	}
	
	public boolean validateToken(String token, String username) {
		return extractUsername(token).equals(username) && !isTokenExpired(token);
	}
	
	public Claims extractAllClaims(String token) {
		return Jwts.parserBuilder()
				.setSigningKey(getSigningKey())
				.build()
				.parseClaimsJws(token)
				.getBody();
	}
}
