package com.garage.config;

import com.garage.model.User;
import com.garage.model.enums.UserRole;
import com.garage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.logging.Logger;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {
    private static final Logger log = Logger.getLogger(AdminInitializer.class.getName());
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.existsByUsername("admin")) return;

        User admin = new User("admin", "admin@garage.com", "admin123", "System Administrator", UserRole.ROLE_ADMIN);
        admin.encodePassword(passwordEncoder);
        userRepository.save(admin);
        log.info("Admin user created: admin / admin123");
    }
}
