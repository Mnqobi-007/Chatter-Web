package com.chatter.spring_boot_starter_parent.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {
	
	@Autowired
	private JwtChannelInterceptor jwtChannelInterceptor;
	
	@Override
	public void configureMessageBroker(MessageBrokerRegistry registry) {
		// TODO Auto-generated method stub
		WebSocketMessageBrokerConfigurer.super.configureMessageBroker(registry);
		registry.enableSimpleBroker("/topic","/private","/queue");
		registry.setApplicationDestinationPrefixes("/chat");
		registry.setUserDestinationPrefix("/user");
	}
	@Override
	public void registerStompEndpoints(StompEndpointRegistry registry) {
		// TODO Auto-generated method stub
		WebSocketMessageBrokerConfigurer.super.registerStompEndpoints(registry);
		registry.addEndpoint("/ws")
	    .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:8080", "https://chatter-web.onrender.com")
	    .withSockJS();
	}
	
	@Override
	public void configureClientInboundChannel(ChannelRegistration registration) {
	    registration.interceptors(jwtChannelInterceptor);
	    registration.taskExecutor().corePoolSize(4).maxPoolSize(10);
	}
}
