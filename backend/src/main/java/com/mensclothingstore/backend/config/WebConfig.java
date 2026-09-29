package com.mensclothingstore.backend.config;
import jakarta.annotation.PostConstruct;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        registry.addResourceHandler("/uploads/**")
                .addResourceLocations(
                    "file:///C:/Users/nachi/OneDrive/Desktop/mens-clothing-store/backend/uploads/"
                );
    }
    @PostConstruct
public void checkConfig() {
    System.out.println("WebConfig is loaded!");
}
}