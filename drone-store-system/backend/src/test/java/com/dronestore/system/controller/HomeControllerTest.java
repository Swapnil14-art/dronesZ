package com.dronestore.system.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

class HomeControllerTest {

    private final HomeController controller = new HomeController();

    @Test
    @DisplayName("healthCheck should return 200 OK with status UP")
    void testHealthCheck() {
        ResponseEntity<Map<String, String>> response = controller.healthCheck();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("UP", response.getBody().get("status"));
    }

    @Test
    @DisplayName("getApiInfo should return 200 OK with API info and status UP")
    void testGetApiInfo() {
        ResponseEntity<Map<String, Object>> response = controller.getApiInfo();

        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("UP", response.getBody().get("status"));
        assertEquals("Drone Store Backend API", response.getBody().get("system"));
    }
}
