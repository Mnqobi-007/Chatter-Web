package com.chatter.spring_boot_starter_parent.config;

import java.util.List;

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
import org.springframework.stereotype.Component;

import com.chatter.spring_boot_starter_parent.util.JwtUtil;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private static final Logger log = LoggerFactory.getLogger(JwtChannelInterceptor.class);

    public JwtChannelInterceptor(JwtUtil jwtUtil, UserDetailsService userDetailsService) {
        super();
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // TODO Auto-generated method stub
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        assert accessor != null;
        if(StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> auth = accessor.getNativeHeader("Authorization");

            if(auth != null && !auth.isEmpty()) {
                String authHeader = auth.get(0);
                String token = authHeader.replaceFirst("^Bearer ", "");
                try {
                    String username = jwtUtil.extractUsername(token);
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);

                    if(username != null && jwtUtil.validateToken(token, username)) {
                        UsernamePasswordAuthenticationToken authenticated = new UsernamePasswordAuthenticationToken(username, null, userDetails.getAuthorities());
                        accessor.setUser(authenticated);
                        log.debug("{} connected via WebSocket", username);
                    } else{
                        // Reject connection
                        throw new IllegalArgumentException("WebSocket Connection failed");
                    }
                } catch (JwtException | IllegalArgumentException e){
                    // Reject connection
                    throw new IllegalArgumentException("WebSocket connection failed");
                }
            }
        }
        return message;
    }

}