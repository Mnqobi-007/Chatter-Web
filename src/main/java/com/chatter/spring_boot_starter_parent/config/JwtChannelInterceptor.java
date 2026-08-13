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
import org.springframework.stereotype.Component;

import com.chatter.spring_boot_starter_parent.util.JwtUtil;

@Component
public class JwtChannelInterceptor implements ChannelInterceptor {
    private final JwtUtil jwtUtil;
    private static final Logger log = LoggerFactory.getLogger(JwtChannelInterceptor.class);

    public JwtChannelInterceptor(JwtUtil jwtUtil) {
        super();
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        // TODO Auto-generated method stub
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if(StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> auth = accessor.getNativeHeader("Authorization");

            if(auth != null && !auth.isEmpty()) {
                String authHeader = auth.get(0);
                String token = authHeader.replaceFirst("^Bearer ", "");
                try {
                    String username = jwtUtil.extractUsername(token);

                    if(username != null && jwtUtil.validateToken(token, username)) {
                        UsernamePasswordAuthenticationToken authenticated = new UsernamePasswordAuthenticationToken(username, null, List.of());
                        accessor.setUser(authenticated);
                        log.debug("{} connected via WebSocket", username);
                    } else{
                        // Reject connection
                    }
                } catch (JwtException | IllegalArgumentException e){
                    // Reject connection
                }
            }
        }
        return message;
    }

}