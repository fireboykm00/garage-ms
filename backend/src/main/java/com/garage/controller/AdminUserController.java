package com.garage.controller;

import com.garage.dto.auth.CreateUserRequest;
import com.garage.dto.response.MessageResponse;
import com.garage.dto.response.UserResponse;
import com.garage.model.enums.UserRole;
import com.garage.security.UserDetailsImpl;
import com.garage.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {
    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.ok(userService.createUser(request));
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<UserResponse> updateUserRole(
            @PathVariable Long id,
            @RequestBody UserRole role,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long currentUserId = ((UserDetailsImpl) userDetails).getId();
        if (currentUserId.equals(id)) {
            return ResponseEntity.badRequest().body(null);
        }
        return ResponseEntity.ok(userService.updateUserRole(id, role));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<MessageResponse> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        Long currentUserId = ((UserDetailsImpl) userDetails).getId();
        if (currentUserId.equals(id)) {
            return ResponseEntity.badRequest().body(new MessageResponse("Cannot delete yourself"));
        }
        userService.deleteUser(id);
        return ResponseEntity.ok(new MessageResponse("User deleted successfully"));
    }
}
