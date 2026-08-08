<<<<<<< HEAD
package com.chatter.spring_boot_starter_parent.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.chatter.spring_boot_starter_parent.model.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {
	List<Message> findByReceiverAndDeliveredFalse(String recieverID);
	
	@Query("SELECT m FROM Message m WHERE (m.sender = :user1 AND m.receiver = :user2) OR (m.sender = :user2 AND m.receiver = :user1) ORDER BY m.timestamp ASC")
	List<Message> findConversation(@Param("user1") String user1, @Param("user2") String user2);

	@Modifying
	@Query("UPDATE Message m SET m.read = true, m.delivered = true WHERE m.sender = :sender AND m.receiver = :receiver AND m.read = false")
	void markAsRead(@Param("sender") String sender, @Param("receiver") String receiver);
}
=======
package com.chatter.spring_boot_starter_parent.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.chatter.spring_boot_starter_parent.model.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {
	List<Message> findByReceiverAndDeliveredFalse(String recieverID);
	
	@Query("SELECT m FROM Message m WHERE (m.sender = :user1 AND m.receiver = :user2) OR (m.sender = :user2 AND m.receiver = :user1) ORDER BY m.timestamp ASC")
	List<Message> findConversation(@Param("user1") String user1, @Param("user2") String user2);

	@Modifying
	@Query("UPDATE Message m SET m.read = true, m.delivered = true WHERE m.sender = :sender AND m.receiver = :receiver AND m.read = false")
	void markAsRead(@Param("sender") String sender, @Param("receiver") String receiver);
}
>>>>>>> dc4e11545fdc64da6d219f6e8f6886bef7e1e4fe
