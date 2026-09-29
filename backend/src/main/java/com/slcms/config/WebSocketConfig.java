package com.slcms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket and STOMP message broker configuration for secure live case chat.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // In-memory message broker for broadcasting to subscribers
        config.enableSimpleBroker("/topic", "/queue");
        // Application prefix for messages handled by @MessageMapping
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register /ws-chat with CORS allowance and SockJS fallback
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*")
                .withSockJS();

        // Also register pure WebSocket endpoint without SockJS
        registry.addEndpoint("/ws-chat")
                .setAllowedOriginPatterns("*");
    }
}
