package com.chatter.spring_boot_starter_parent.exception;

public class WebSocketAuthenticationException
        extends RuntimeException {

    public WebSocketAuthenticationException(String message) {
        super(message);
    }

    public WebSocketAuthenticationException(
            String message,
            Throwable cause) {

        super(message, cause);
    }
}