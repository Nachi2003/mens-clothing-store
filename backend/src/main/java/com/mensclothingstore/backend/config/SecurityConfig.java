package com.mensclothingstore.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/health",
                                "/api/categories/**",
                                "/api/products/**",
                                "/api/product-variants/**",
                                "/api/inventory/**",
                                "/api/stock-movements/**",
                                "/api/users/register",
                                "/api/users/login",
                                "/api/customers/**",
                                "/api/admin/**"
                        )
                        .permitAll()
                        .anyRequest()
                        .authenticated()
                );

        return http.build();
    }
}