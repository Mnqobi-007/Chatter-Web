package com.chatter.spring_boot_starter_parent.config;

import java.util.List;

import com.chatter.spring_boot_starter_parent.exception.WebSocketAuthenticationException;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Component;

import com.chatter.spring_boot_starter_parent.util.JwtUtil;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {

    private static final Logger log =
            LoggerFactory.getLogger(JwtChannelInterceptor.class);

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public JwtChannelInterceptor(
            JwtUtil jwtUtil,
            UserDetailsService userDetailsService) {

        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null) {
            return message;
        }

        if (!StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        List<String> auth =
                accessor.getNativeHeader("Authorization");

        // No Authorization header = reject
        if (auth == null || auth.isEmpty()) {
            log.warn(
                    "WebSocket CONNECT rejected: missing Authorization header"
            );

            throw new WebSocketAuthenticationException(
                    "Missing Authorization header"
            );
        }

        String authHeader = auth.get(0);

        if (authHeader == null ||
                !authHeader.startsWith("Bearer ")) {

            throw new WebSocketAuthenticationException(
                    "Invalid Authorization header"
            );
        }

        String token = authHeader.substring(7).trim();

        if (token.isEmpty()) {
            throw new WebSocketAuthenticationException(
                    "Missing JWT"
            );
        }

        try {

            String username = jwtUtil.extractUsername(token);

            if (username == null || username.isBlank()) {
                throw new WebSocketAuthenticationException(
                        "JWT does not contain a username"
                );
            }

            if (!jwtUtil.validateToken(token, username)) {
                throw new WebSocketAuthenticationException(
                        "Invalid JWT"
                );
            }

            UserDetails userDetails =
                    userDetailsService.loadUserByUsername(username);

            UsernamePasswordAuthenticationToken authenticated =
                    new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities()
                    );

            accessor.setUser(authenticated);

            log.debug(
                    "{} connected via WebSocket",
                    username
            );

            return message;

        } catch (JwtException e) {

            log.warn(
                    "Invalid JWT presented during WebSocket CONNECT"
            );

            throw new WebSocketAuthenticationException(
                    "Invalid JWT",
                    e
            );

        } catch (UsernameNotFoundException e) {

            log.warn(
                    "JWT user does not exist"
            );

            throw new WebSocketAuthenticationException(
                    "User does not exist",
                    e
            );
        }
    }
}