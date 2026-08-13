package com.chatter.spring_boot_starter_parent.model;

import jakarta.persistence.*;

@Entity
@Table(name = "contact",
        uniqueConstraints = @UniqueConstraint(columnNames = {"owner_username", "contact_username"}))
public class Contact {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "owner_username", nullable = false)
    private String ownerUsername;

    @Column(name = "contact_username", nullable = false)
    private String contactUsername;

    public Contact() {}

    public Contact(String ownerUsername, String contactUsername) {
        this.ownerUsername = ownerUsername;
        this.contactUsername = contactUsername;
    }

    public String getOwnerUsername() {
        return ownerUsername;
    }

    public void setOwnerUsername(String ownerUsername) {
        this.ownerUsername = ownerUsername;
    }

    public String getContactUsername() {
        return contactUsername;
    }

    public void setContactUsername(String contactUsername) {
        this.contactUsername = contactUsername;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

}