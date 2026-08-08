package com.chatter.spring_boot_starter_parent.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.chatter.spring_boot_starter_parent.model.Message;
import com.chatter.spring_boot_starter_parent.service.MessageService;

@RestController
@RequestMapping("/chat")
public class MessageHistoryController {
	@Autowired
    private MessageService messageService;
    
//    @GetMapping("/history/{contactId}")
//    public ResponseEntity<List<Message>> getHistory(
//            @PathVariable String contactId, 
//            Authentication auth) {
//        String currentUser = auth.getName();
//        List<Message> messages = messageService.getConversation(currentUser, contactId);
//        return ResponseEntity.ok(messages);
//    }
}