<<<<<<< HEAD
package com.chatter.spring_boot_starter_parent.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Controller
public class PageController {
	@GetMapping("/")
	public String chatterHome() {
		return "index";
	}
	
	@GetMapping("/login")
	public String chatterLogin() {
		return "login";
	}
	
	@GetMapping("/signup")
	public String chatterSign() {
		return "signup";
	}
	
	@GetMapping("/chats")
	public String chatterChats() {
		return "chats";
	}
}
=======
package com.chatter.spring_boot_starter_parent.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@Controller
public class PageController {
	@GetMapping("/")
	public String chatterHome() {
		return "index";
	}
	
	@GetMapping("/login")
	public String chatterLogin() {
		return "login";
	}
	
	@GetMapping("/signup")
	public String chatterSign() {
		return "signup";
	}
	
	@GetMapping("/chats")
	public String chatterChats() {
		return "chats";
	}
}
>>>>>>> dc4e11545fdc64da6d219f6e8f6886bef7e1e4fe
