package com.chatter.spring_boot_starter_parent.dto;

import com.chatter.spring_boot_starter_parent.model.User;

import java.time.LocalDateTime;

public class ContactDto {
    private Long id;
    private String username;
    private String firstName;
    private String lastName;
    private String profilePicture;
    private boolean online;
    private LocalDateTime lastActive;

    public ContactDto(Long id, String username, String firstName, String lastName,
                      String profilePicture, boolean online, LocalDateTime lastActive) {
        this.id = id;
        this.username = username;
        this.firstName = firstName;
        this.lastName = lastName;
        this.profilePicture = profilePicture;
        this.online = online;
        this.lastActive = lastActive;
    }

    public ContactDto() {
    }

    public static ContactDto from(User user){
        return new ContactDto(
                user.getId(),
                user.getUsername(),
                user.getFirstName(),
                user.getLastName(),
                user.getProfilePicture(),
                user.isActive(),
                user.getLastActive()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getFirstName() {
        return firstName;
    }

    public void setFirstName(String firstName) {
        this.firstName = firstName;
    }

    public String getLastName() {
        return lastName;
    }

    public void setLastName(String lastName) {
        this.lastName = lastName;
    }

    public String getProfilePicture() {
        return profilePicture;
    }

    public void setProfilePicture(String profilePicture) {
        this.profilePicture = profilePicture;
    }

    public boolean isOnline() {
        return online;
    }

    public void setOnline(boolean online) {
        this.online = online;
    }

    public LocalDateTime getLastActive() {
        return lastActive;
    }

    public void setLastActive(LocalDateTime lastActive) {
        this.lastActive = lastActive;
    }
}
