package com.example.UberBackend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class UberBackendApplication {


	public static void main(String[] args) {
		SpringApplication.run(UberBackendApplication.class, args);
	}

}
