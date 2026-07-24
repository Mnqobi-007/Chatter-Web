package com.chatter.spring_boot_starter_parent.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;

@Entity
public class Message {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	private String message;
	private String sender;
	private String receiver;
	
	@Column(nullable = false)
	private boolean delivered = false;
	
	@Column(nullable = false)
	private LocalDateTime timestamp;

	@Column(nullable = false)
	private boolean read = false;
	
	public Message() {
	    this.timestamp = LocalDateTime.now();
	}
	
	@PrePersist
	protected void onCreate() {
	    if (timestamp == null) {
	        timestamp = LocalDateTime.now();
	    }
	}
	
	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
	public String getSender() {
		return sender;
	}
	public void setSender(String sender) {
		this.sender = sender;
	}
	public String getReceiver() {
		return receiver;
	}
	public void setReceiver(String receiver) {
		this.receiver = receiver;
	}
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public boolean isDelivered() {
		return delivered;
	}
	public void setDelivered(boolean delivered) {
		this.delivered = delivered;
	}
	public LocalDateTime getTimestamp() { 
		return timestamp; 
	}
	public void setTimestamp(LocalDateTime timestamp) { 
		this.timestamp = timestamp; 
	}
	public boolean isRead() { 
		return read; 
	}
	public void setRead(boolean read) { 
		this.read = read; 
	}
	
	
}
