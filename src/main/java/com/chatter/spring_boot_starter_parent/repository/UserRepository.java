package com.chatter.spring_boot_starter_parent.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import com.chatter.spring_boot_starter_parent.model.User;
import java.util.List;
import java.util.Optional;



public interface UserRepository extends JpaRepository<User, Long> {
	@Query("SELECT u FROM User u WHERE u.id = :id")
	Optional<User> findUserById(@Param("id") Long id);

	Optional<User> findByUsername(String username);
	
	Optional<User> findByEmail(String email);
}