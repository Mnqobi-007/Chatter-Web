package com.chatter.spring_boot_starter_parent.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;

import com.chatter.spring_boot_starter_parent.model.User;
import com.chatter.spring_boot_starter_parent.repository.UserRepository;
import jakarta.transaction.Transactional;

@Service
public class UserService {
	//@Autowired
	private final UserRepository userRepository;
	
	public UserService(UserRepository userRepository) {
		this.userRepository = userRepository;
	}
	
	@Transactional
	public User registerUser(String username, String hashedPassword, String email) {
		User user = new User(username, email, hashedPassword);
		user.setCreatedAt(LocalDateTime.now());
		//save
		return userRepository.save(user);
	}
}
