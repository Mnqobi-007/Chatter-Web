package com.chatter.spring_boot_starter_parent.controller;

import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.chatter.spring_boot_starter_parent.model.User;
import com.chatter.spring_boot_starter_parent.repository.UserRepository;

import java.util.*;

@RestController
@RequestMapping("/contacts")
public class ContactsController {
    private final UserRepository userRepository;

    public ContactsController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    //@Cacheable("contacts")
    public ResponseEntity<List<User>> getContacts(Authentication auth) {
        String currentUser = auth.getName();
        List<User> users = userRepository.findAll();
        users.removeIf(u -> u.getUsername().equals(currentUser));
        return ResponseEntity.ok(users);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addContact(@RequestBody Map<String, String> request, Authentication auth) {
        String username = request.get("username");
        Optional<User> user = userRepository.findByUsername(username);

        if (user.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        return ResponseEntity.ok(Map.of("message", "Contact added successfully"));
    }
}