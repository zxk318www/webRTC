package com.example.webrtc;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.ErrorPage;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;


@SpringBootApplication
public class WebrtcApplication {

	public static void main(String[] args) {
		SpringApplication.run(WebrtcApplication.class, args);
	}

	@Bean
	public ConfigurableServletWebServerFactory webServerFactory() {
		TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
		ErrorPage errorPage400 = new ErrorPage(HttpStatus.BAD_REQUEST, "/error");
		ErrorPage errorPage401 = new ErrorPage(HttpStatus.UNAUTHORIZED, "/error");
		ErrorPage errorPage403 = new ErrorPage(HttpStatus.FORBIDDEN, "/error");
		ErrorPage errorPage404 = new ErrorPage(HttpStatus.NOT_FOUND, "/404");
		ErrorPage errorPage415 = new ErrorPage(HttpStatus.UNSUPPORTED_MEDIA_TYPE, "/error");
		ErrorPage errorPage500 = new ErrorPage(HttpStatus.INTERNAL_SERVER_ERROR, "/500");
		factory.addErrorPages(errorPage400, errorPage401, errorPage403, errorPage404, errorPage415, errorPage500);
		return factory;
	}
}
