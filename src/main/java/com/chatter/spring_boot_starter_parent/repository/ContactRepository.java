package com.chatter.spring_boot_starter_parent.repository;

import com.chatter.spring_boot_starter_parent.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ContactRepository extends JpaRepository<Contact, Long> {
    Optional<Contact> findByOwnerUsernameAndContactUsername(String owner, String contact);
    List<Contact> findByOwnerUsername(String username);
}