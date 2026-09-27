package com.dronestore.system.exception;

import com.dronestore.system.dto.ErrorResponse;
import org.apache.catalina.connector.ClientAbortException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("handleClientAbort should handle ClientAbortException gracefully without error")
    void testHandleClientAbort() {
        ClientAbortException ex = new ClientAbortException("Client disconnected");
        assertDoesNotThrow(() -> handler.handleClientAbort(ex));
    }

    @Test
    @DisplayName("handleIOException should return null for client disconnects like broken pipe")
    void testHandleIOException_BrokenPipe() {
        IOException ex = new IOException("Broken pipe");
        ResponseEntity<ErrorResponse> response = handler.handleIOException(ex);
        assertNull(response);
    }

    @Test
    @DisplayName("handleIOException should return 500 for genuine IO errors")
    void testHandleIOException_GenuineError() {
        IOException ex = new IOException("Disk read failed");
        ResponseEntity<ErrorResponse> response = handler.handleIOException(ex);
        assertNotNull(response);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(500, response.getBody().getStatus());
        assertTrue(response.getBody().getMessage().contains("Disk read failed"));
    }

    @Test
    @DisplayName("handleGenericException should return null for wrapped client aborts")
    void testHandleGenericException_WrappedClientAbort() {
        Exception ex = new RuntimeException("Outer error", new IOException("Connection reset by peer"));
        ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);
        assertNull(response);
    }

    @Test
    @DisplayName("handleGenericException should return 500 for genuine unhandled server exceptions")
    void testHandleGenericException_GenuineServerException() {
        Exception ex = new NullPointerException("Null pointer encountered");
        ResponseEntity<ErrorResponse> response = handler.handleGenericException(ex);
        assertNotNull(response);
        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
        assertEquals(500, response.getBody().getStatus());
        assertTrue(response.getBody().getMessage().contains("Null pointer encountered"));
    }
}
