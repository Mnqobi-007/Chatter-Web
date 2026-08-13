package com.chatter.spring_boot_starter_parent.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.chatter.spring_boot_starter_parent.listener.WebSocketSessionEventListener;
import com.chatter.spring_boot_starter_parent.model.Message;
import com.chatter.spring_boot_starter_parent.repository.MessageRepository;
import com.chatter.spring_boot_starter_parent.service.FileStorageService;
import com.chatter.spring_boot_starter_parent.service.MessageService;

@RestController
@RequestMapping("/chat")
public class ChatController {
	private final SimpMessagingTemplate messagingTemplate;
	private final MessageService messageService;
	private final FileStorageService fileStorageService;
	
	@Autowired
	private WebSocketSessionEventListener listener;
	
	@Autowired
	private MessageRepository messageRepository;

	public ChatController(SimpMessagingTemplate messagingTemplate, MessageService messageService,
			FileStorageService fileStorageService) {
		super();
		this.messagingTemplate = messagingTemplate;
		this.messageService = messageService;
		this.fileStorageService = fileStorageService;
	}
	
	@MessageMapping("/chat.private")
	public void sendMessage(Message message, Authentication auth) {
		if(auth != null) {
			message.setSender(auth.getName());
			if(message.getTimestamp() == null) {
				message.setTimestamp(LocalDateTime.now());
			}
			Message saved = messageService.saveMessage(message);  // save the message
			message.setId(saved.getId());
			
			if(listener.isUserOnline(message.getReceiver())) {  //check if user is online
				messagingTemplate.convertAndSendToUser(message.getReceiver(), "/queue/private", saved);
				saved.setDelivered(true);
				messageRepository.save(saved);
			}
		}
	}
	
	@PostMapping("/send")
	public ResponseEntity<?> sendMessageRest(@RequestBody Message message, Authentication auth) {
	    message.setSender(auth.getName());
	    message.setTimestamp(LocalDateTime.now());
	    Message saved = messageService.saveMessage(message);
	    
	    if (listener.isUserOnline(message.getReceiver())) {
	        messagingTemplate.convertAndSendToUser(message.getReceiver(), "/queue/private", saved);
            saved.setDelivered(true);
            messageRepository.save(saved);
	    }
	    
	    return ResponseEntity.ok(saved);
	}
	
	@MessageMapping("/chat.read")
	public void markAsRead(@Payload Map<String, String> payload, Authentication auth) {
	    String sender = payload.get("sender");
	    String receiver = auth.getName();
	    messageRepository.markAsRead(sender, receiver);
	    
	    // Notify sender
        messagingTemplate.convertAndSendToUser(
            sender,
            "/queue/read",
            Map.of("status", "read", "receiver", receiver)
        );
	}
	
	@MessageMapping("/chat.status")
    public void updateStatus(@Payload Map<String, String> payload, Authentication auth) {
        String username = auth.getName();
        String status = payload.get("status");
        
        // Broadcast status to all online users
        messagingTemplate.convertAndSend(
            "/topic/status",
            Map.of("userId", username, "status", status)
        );
    }
	
	@GetMapping("/history/{contactId}")
    public ResponseEntity<List<Message>> getHistory(
            @PathVariable String contactId, 
            Authentication auth) {
        String currentUser = auth.getName();
        List<Message> messages = messageService.getConversation(currentUser, contactId);
        return ResponseEntity.ok(messages);
    }
    
    @GetMapping("/unread")
    public ResponseEntity<List<Message>> getUnreadMessages(Authentication auth) {
        String username = auth.getName();
        List<Message> unread = messageRepository.findByReceiverAndDeliveredFalse(username);
        return ResponseEntity.ok(unread);
    }
    
    // file share
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(@RequestParam("file") MultipartFile file, Authentication auth) {
        try {
            String storedFilename = fileStorageService.store(file);
            String fileUrl = "/chat/files/" + storedFilename;
            return ResponseEntity.ok(Map.of(
                "fileUrl", fileUrl,
                "originalName", file.getOriginalFilename(),
                "contentType", file.getContentType(),
                "size", file.getSize()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Upload failed"));
        }
    }

    @GetMapping("/files/{filename}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String filename) {
        try {
            Path filePath = fileStorageService.resolve(filename);
            Resource resource = new UrlResource(filePath.toUri());

            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }

            String contentType = Files.probeContentType(filePath);
            if (contentType == null) {
                contentType = "application/octet-stream";
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_TYPE, contentType)
                    .body(resource);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }
	
	
}
