package com.garage.exception;

import java.util.Map;

public class DuplicateFieldException extends RuntimeException {
    private final Map<String, String> fieldErrors;

    public DuplicateFieldException(String field, String message) {
        super(message);
        this.fieldErrors = Map.of(field, message);
    }

    public DuplicateFieldException(Map<String, String> fieldErrors) {
        super(fieldErrors.values().iterator().next());
        this.fieldErrors = fieldErrors;
    }

    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }
}
