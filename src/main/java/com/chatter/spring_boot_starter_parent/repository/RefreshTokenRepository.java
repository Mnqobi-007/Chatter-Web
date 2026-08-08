<<<<<<< HEAD
package com.chatter.spring_boot_starter_parent.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.chatter.spring_boot_starter_parent.model.RefreshToken;
import com.chatter.spring_boot_starter_parent.model.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
=======
package com.chatter.spring_boot_starter_parent.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.chatter.spring_boot_starter_parent.model.RefreshToken;
import com.chatter.spring_boot_starter_parent.model.User;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    void deleteByUser(User user);
>>>>>>> dc4e11545fdc64da6d219f6e8f6886bef7e1e4fe
}