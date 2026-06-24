package com.garage.config;

import com.garage.model.Part;
import com.garage.model.Stock;
import com.garage.model.User;
import com.garage.model.enums.UserRole;
import com.garage.repository.PartRepository;
import com.garage.repository.StockRepository;
import com.garage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.logging.Logger;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = Logger.getLogger(DataInitializer.class.getName());
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final StockRepository stockRepository;
    private final PartRepository partRepository;

    @Override
    public void run(String... args) {
        loadAdmin();
        loadStocks();
    }

    private void loadAdmin() {
        if (userRepository.existsByUsername("admin")) return;

        User admin = new User("admin", "admin@garage.com", "admin123", "System Administrator", UserRole.ROLE_ADMIN);
        admin.encodePassword(passwordEncoder);
        userRepository.save(admin);
        log.info("Admin user created: admin / admin123");
    }

    private void loadStocks() {
        if (stockRepository.count() > 0) return;

        Stock headQ = stockRepository.save(new Stock("HEAD Q", "Main warehouse, Nairobi"));
        Stock h1 = stockRepository.save(new Stock("H1", "Shelf A - Engine parts"));
        Stock h2 = stockRepository.save(new Stock("H2", "Shelf B - Brake parts"));
        Stock h4 = stockRepository.save(new Stock("H4", "Shelf C - Filters"));
        Stock h5 = stockRepository.save(new Stock("H5", "Shelf D - Misc"));
        log.info("5 stock locations created");

        // Create demo parts assigned to stocks
        if (!partRepository.existsByPartNumber("OIL-001")) {
            partRepository.save(new Part("OIL-001", "Oil Filter 3.0L", "D4D", "Toyota", "pcs", 50, 10, h4));
            partRepository.save(new Part("OIL-002", "Oil Filter 2.0L", "2KD-FTV", "Toyota", "pcs", 30, 10, h4));
            partRepository.save(new Part("BRK-001", "Brake Pads Front", "Corolla 2018+", "Toyota Genuine", "set", 25, 5, h2));
            partRepository.save(new Part("BRK-002", "Brake Pads Rear", "Corolla 2018+", "Toyota Genuine", "set", 20, 5, h2));
            partRepository.save(new Part("FLT-001", "Air Filter", "D4D", "Toyota", "pcs", 40, 10, h4));
            partRepository.save(new Part("FLT-002", "Cabin Filter", "All Models", "Toyota", "pcs", 35, 10, h4));
            partRepository.save(new Part("ENG-001", "Engine Oil 5W-30", "All Models", "Mobil 1", "pcs", 100, 20, h1));
            partRepository.save(new Part("BELT-001", "Timing Belt Kit", "2KD-FTV", "Toyota", "set", 15, 3, h5));
            partRepository.save(new Part("SPK-001", "Spark Plug Iridium", "All Models", "NGK", "pcs", 60, 20, h5));
            partRepository.save(new Part("CLT-001", "Clutch Kit", "Hilux 2015+", "Toyota Genuine", "set", 8, 2, h5));
            partRepository.save(new Part("WTR-001", "Water Pump", "D4D", "Toyota", "pcs", 12, 3, h1));
            partRepository.save(new Part("RAD-001", "Radiator", "Corolla 2018+", "Toyota Genuine", "pcs", 5, 2, h1));
            log.info("12 demo parts created with stock assignments");
        }
    }
}
