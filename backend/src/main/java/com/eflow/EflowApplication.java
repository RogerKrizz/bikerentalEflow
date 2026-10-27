package com.eflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * E-FLOW — Campus E-Bike Rental System.
 * Main entry point for the Spring Boot application.
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class EflowApplication {

    public static void main(String[] args) {
        SpringApplication.run(EflowApplication.class, args);
    }
}
