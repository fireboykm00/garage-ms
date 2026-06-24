package com.garage.exception;

import com.garage.dto.response.MessageResponse;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<MessageResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(new MessageResponse(ex.getMessage()));
    }

    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<MessageResponse> handleBadRequest(BadRequestException ex) {
        return ResponseEntity.badRequest().body(new MessageResponse(ex.getMessage()));
    }

    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<MessageResponse> handleAuthentication(AuthenticationException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new MessageResponse("Invalid credentials"));
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<MessageResponse> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new MessageResponse("Access denied"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach(error -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.badRequest().body(errors);
    }

    @ExceptionHandler(DuplicateFieldException.class)
    public ResponseEntity<Map<String, String>> handleDuplicateField(DuplicateFieldException ex) {
        return ResponseEntity.badRequest().body(ex.getFieldErrors());
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleDataIntegrity(DataIntegrityViolationException ex) {
        String message = ex.getMessage() != null ? ex.getMessage() : "";
        if (message.contains("part_number")) {
            return ResponseEntity.badRequest().body(Map.of("partNumber", "Part number already exists"));
        }
        if (message.contains("UK_STOCK_NAME") || (message.contains("name") && message.contains("stock"))) {
            return ResponseEntity.badRequest().body(Map.of("name", "Stock name already exists"));
        }
        if (message.contains("username")) {
            return ResponseEntity.badRequest().body(Map.of("username", "Username already exists"));
        }
        if (message.contains("email")) {
            return ResponseEntity.badRequest().body(Map.of("email", "Email already exists"));
        }
        if (message.contains("job_number")) {
            return ResponseEntity.badRequest().body(Map.of("jobNumber", "Job number already exists"));
        }
        return ResponseEntity.badRequest().body(Map.of("message", "A record with the same unique value already exists"));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<MessageResponse> handleMessageNotReadable(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest()
                .body(new MessageResponse("Invalid request body format"));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<MessageResponse> handleArgumentTypeMismatch(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest()
                .body(new MessageResponse("Invalid parameter: " + ex.getName()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<MessageResponse> handleGeneral(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("An unexpected error occurred"));
    }
}
