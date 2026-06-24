package com.garage.service;

import com.garage.dto.auth.CreateUserRequest;
import com.garage.dto.response.UserResponse;
import com.garage.exception.BadRequestException;
import com.garage.exception.DuplicateFieldException;
import com.garage.model.User;
import com.garage.model.enums.UserRole;
import com.garage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream().map(UserResponse::fromEntity).toList();
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new DuplicateFieldException("username", "Username already exists");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateFieldException("email", "Email already exists");
        }
        UserRole role = request.getRole() != null ? request.getRole() : UserRole.ROLE_STOREKEEPER;
        User user = new User(request.getUsername(), request.getEmail(), request.getPassword(), request.getFullName(), role);
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateUserRole(Long id, UserRole role) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("User not found"));
        user.setRole(role);
        user = userRepository.save(user);
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new BadRequestException("User not found");
        }
        userRepository.deleteById(id);
    }
}
