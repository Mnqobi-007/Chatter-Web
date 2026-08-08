package com.chatter.spring_boot_starter_parent;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

@SpringBootApplication
//@EnableCaching
public class SpringBootStarterParentApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringBootStarterParentApplication.class, args);
	}

}
