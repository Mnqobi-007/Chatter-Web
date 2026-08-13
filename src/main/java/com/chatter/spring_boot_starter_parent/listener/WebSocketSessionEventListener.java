package com.chatter.spring_boot_starter_parent.listener;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.chatter.spring_boot_starter_parent.repository.UserRepository;

@Component
public class WebSocketSessionEventListener {
	private static final ConcurrentHashMap<String, String> onlineUsers = new ConcurrentHashMap<>();
	@Autowired
	private UserRepository userRepository;
	@EventListener
	public void handleSessionConnected(SessionConnectedEvent event) {
		Principal userPrincipal = event.getUser();
		if(userPrincipal != null && !userPrincipal.getName().isEmpty()) {
			String userID = userPrincipal.getName();
			onlineUsers.put(userID, "ONLINE");
			//update database
			userRepository.findByUsername(userID).ifPresent(user -> {
				user.setOnline(true);
				userRepository.save(user);
			});
		}
	}
	
	@EventListener
	public void handleSessionDisconnected(SessionDisconnectEvent event) {
		Principal userPrincipal = event.getUser();
		if(userPrincipal != null && !userPrincipal.getName().isEmpty()) {
			String userID = userPrincipal.getName();
			onlineUsers.remove(userID);
			userRepository.findByUsername(userID).ifPresent(user -> {
				user.setOnline(false);
				user.setLastActive(LocalDateTime.now());
				userRepository.save(user);
			});
		}
	}
	
	public boolean isUserOnline(String username) {
		return onlineUsers.containsKey(username);
	}
}
