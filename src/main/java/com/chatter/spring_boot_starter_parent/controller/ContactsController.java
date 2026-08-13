package com.chatter.spring_boot_starter_parent.controller;

import com.chatter.spring_boot_starter_parent.model.Contact;
import com.chatter.spring_boot_starter_parent.repository.ContactRepository;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.chatter.spring_boot_starter_parent.model.User;
import com.chatter.spring_boot_starter_parent.repository.UserRepository;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/contacts")
public class ContactsController {
    private final UserRepository userRepository;
    private final ContactRepository contactRepository;

    public ContactsController(UserRepository userRepository, ContactRepository contactRepository) {
        this.userRepository = userRepository;
        this.contactRepository = contactRepository;
    }

    @GetMapping
    //@Cacheable("contacts")
    public ResponseEntity<List<User>> getContacts(Authentication auth) {
        String currentUser = auth.getName();
        List<Contact> contacts = contactRepository.findByOwnerUsername(currentUser);
        List<String> contactUsernames = contacts.stream()
                .map(Contact::getContactUsername)
                .collect(Collectors.toList());

        List<User> users = userRepository.findByUsernameIn(contactUsernames);
        return ResponseEntity.ok(users);
    }

    @PostMapping("/add")
    public ResponseEntity<?> addContact(@RequestBody Map<String, String> request, Authentication auth) {
        String username = request.get("username");
        String currentUser = auth.getName();
        Optional<User> user = userRepository.findByUsername(username);

        if (user.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "User not found"));
        }

        // Check if already a contact
        Optional<Contact> existing = contactRepository.findByOwnerUsernameAndContactUsername(currentUser, username);
        if (existing.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Already a contact"));
        }

        Contact contact = new Contact(currentUser, username);
        contactRepository.save(contact);

        return ResponseEntity.ok(Map.of("message", "Contact added successfully"));
    }
}