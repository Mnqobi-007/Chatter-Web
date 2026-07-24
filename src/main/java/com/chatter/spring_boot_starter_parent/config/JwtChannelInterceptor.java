package com.chatter.spring_boot_starter_parent.config;

import java.util.List;

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
				String username = jwtUtil.extractUsername(token);
				
				if(username != null && jwtUtil.validateToken(token, username)) {
					UsernamePasswordAuthenticationToken authenticated = new UsernamePasswordAuthenticationToken(username, null, List.of());
					accessor.setUser(authenticated);
					System.out.println(username + " connected via WebSocket");
				}
			}
		}
		return message;
	}
	
}
