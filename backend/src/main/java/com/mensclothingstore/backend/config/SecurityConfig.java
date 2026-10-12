
package com.mensclothingstore.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http)
            throws Exception {

        http
            .cors(cors ->
                cors.configurationSource(corsConfigurationSource())
            )
            .csrf(csrf -> csrf.disable())
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )
            .authorizeHttpRequests(auth -> auth

                // CORS preflight requests
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                // Public authentication endpoints
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/users/register",
                    "/api/users/login",
                    "/api/users/staff-admin/login"
                ).permitAll()

                // Only Admin can create staff accounts
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/users/staff"
                ).hasRole("ADMIN")

                // Public product browsing
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/products",
                    "/api/products/**"
                ).permitAll()

                // Product management: Admin and Staff
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/products",
                    "/api/products/**"
                ).hasAnyRole("ADMIN", "STAFF")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/products",
                    "/api/products/**"
                ).hasAnyRole("ADMIN", "STAFF")

                .requestMatchers(
                    HttpMethod.PATCH,
                    "/api/products",
                    "/api/products/**"
                ).hasAnyRole("ADMIN", "STAFF")

                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/products",
                    "/api/products/**"
                ).hasAnyRole("ADMIN", "STAFF")

                // Public stock checks for customer cart
                // Keep this rule BEFORE broader inventory rules
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inventory/variant/**"
                ).permitAll()

                // Other inventory reads: Admin and Staff only
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/inventory",
                    "/api/inventory/low-stock",
                    "/api/inventory/**"
                ).hasAnyRole("ADMIN", "STAFF")

                // Inventory creation: Admin and Staff
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/inventory",
                    "/api/inventory/**"
                ).hasAnyRole("ADMIN", "STAFF")

                // Stock movement records: Admin and Staff
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/stock-movements",
                    "/api/stock-movements/**"
                ).hasAnyRole("ADMIN", "STAFF")

                // Stock-in operations
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/stock-movements/stock-in"
                ).hasAnyRole("ADMIN", "STAFF")

                // Stock adjustments
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/stock-movements/adjust"
                ).hasAnyRole("ADMIN", "STAFF")

                // Invoice viewing and PDF downloads
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/admin/invoices",
                    "/api/admin/invoices/**"
                ).hasAnyRole("ADMIN", "STAFF")

                // Invoice creation
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/admin/invoices",
                    "/api/admin/invoices/**"
                ).hasAnyRole("ADMIN", "STAFF")

                // Sales reports and sales history: Admin only
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/admin/reports",
                    "/api/admin/reports/**"
                ).hasRole("ADMIN")

                // Admin/Staff order management
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/customers/admin/orders",
                    "/api/customers/admin/orders/**"
                ).hasAnyRole("ADMIN", "STAFF")

                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/customers/admin/orders/**"
                ).hasAnyRole("ADMIN", "STAFF")

                // Remaining endpoints are unchanged for now.
                // Review them before production deployment.
                .anyRequest().permitAll()
            )
            .addFilterBefore(
                jwtAuthenticationFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        ));

        configuration.setAllowedMethods(List.of(
            "GET",
            "POST",
            "PUT",
            "PATCH",
            "DELETE",
            "OPTIONS"
        ));

        configuration.setAllowedHeaders(List.of(
            "Authorization",
            "Content-Type"
        ));

        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}
