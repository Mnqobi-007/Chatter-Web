package com.chatter.spring_boot_starter_parent.dto;

import jakarta.persistence.Column;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageRequest {
    @Size(max = 1000)
    private String conversation;

    private String sender;

    private String receiver;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "file_type")
    private String fileType;

}
