package com.chatter.spring_boot_starter_parent.service;

import java.util.List;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import com.chatter.spring_boot_starter_parent.model.Message;
import com.chatter.spring_boot_starter_parent.repository.MessageRepository;

import jakarta.transaction.Transactional;

@Service
public class MessageService {
	private final MessageRepository messageRepository;
	
	public MessageService(MessageRepository messageRepository) {
		this.messageRepository = messageRepository;
	}
	
	@Transactional
	public Message saveMessage(Message message) {
		return messageRepository.save(message);
	}
	//@Cacheable("conversation")
    @Transactional
	public List<Message> getConversation(String currentUser, String contactId) {
		return messageRepository.findConversation(currentUser, contactId);
	}
}