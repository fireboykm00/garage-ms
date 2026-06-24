package com.garage.config;

import com.garage.model.Part;
import com.garage.model.User;
import com.garage.model.enums.UserRole;
import com.garage.repository.PartRepository;
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
    private final PartRepository partRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        loadUsers();
        loadParts();
    }

    private void loadUsers() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = new User("admin", "admin@garage.com", "admin123", "System Administrator", UserRole.ROLE_ADMIN);
            admin.encodePassword(passwordEncoder);
            userRepository.save(admin);
            log.info("Admin user created: admin / admin123");
        }

        if (!userRepository.existsByUsername("storekeeper")) {
            User storekeeper = new User("storekeeper", "storekeeper@garage.com", "storekeeper123", "Store Keeper", UserRole.ROLE_STOREKEEPER);
            storekeeper.encodePassword(passwordEncoder);
            userRepository.save(storekeeper);
            log.info("Storekeeper user created: storekeeper / storekeeper123");
        }

        if (!userRepository.existsByUsername("mechanic")) {
            User mechanic = new User("mechanic", "mechanic@garage.com", "mechanic123", "Senior Mechanic", UserRole.ROLE_MECHANIC);
            mechanic.encodePassword(passwordEncoder);
            userRepository.save(mechanic);
            log.info("Mechanic user created: mechanic / mechanic123");
        }

        if (!userRepository.existsByUsername("receptionist")) {
            User receptionist = new User("receptionist", "receptionist@garage.com", "receptionist123", "Front Desk Receptionist", UserRole.ROLE_RECEPTIONIST);
            receptionist.encodePassword(passwordEncoder);
            userRepository.save(receptionist);
            log.info("Receptionist user created: receptionist / receptionist123");
        }
    }

    private void loadParts() {
        if (partRepository.count() > 0) return;

        partRepository.save(createPart("03H115562", null, "Oil Filter", "Amarok", "Volkswagen", "H1", "HEAD Q", 16, 3));
        partRepository.save(createPart("04152-31090", null, "Oil Filter", "Rava", "TOYOTA", "H1", "HEAD Q", 70, 5));
        partRepository.save(createPart("04152-38020", null, "Oil Filter", "Land cruiser V8", "TOYOTA", "H1", "HEAD Q", 37, 5));
        partRepository.save(createPart("90915-30002-8T", null, "Oil Filter", "Land Cruiser", "TOYOTA", "H", "HEAD Q", 40, 5));
        partRepository.save(createPart("15600-41010", null, "Oil Filter", "Toyota Hilux-5L", "TOYOTA", "H", "HEAD Q", 20, 5));
        partRepository.save(createPart("16510-61A01", null, "Oil Filter", "SUZUKI JIMNY", "SUZUKI", "H1", "HEAD Q", 96, 5));
        partRepository.save(createPart("23390-0L070", null, "Fuel Filter", "Toyota Hilux Revo", "TOYOTA", "H1", "HEAD Q", 100, 10));
        partRepository.save(createPart("23390-51070", null, "Fuel Filter", "Land cruiser", "TOYOTA", "H1", "HEAD Q", 25, 5));
        partRepository.save(createPart("23390-0L041", null, "Fuel Filter", "Toyota Hilux Vigo", "TOYOTA", "H1", "HEAD Q", 40, 5));
        partRepository.save(createPart("17801-0L040", null, "Air Filter", "Toyota Hilux Revo", "TOYOTA", "H1", "HEAD Q", 213, 10));
        partRepository.save(createPart("17801-30050", null, "Air Filter", "Toyota Hiace Old Vision", "TOYOTA", "H1", "HEAD Q", 43, 5));
        partRepository.save(createPart("17801-0C010", null, "Air Filter", "Toyota Hilux Vigo", "TOYOTA", "H1", "HEAD Q", 115, 10));
        partRepository.save(createPart("17801-65070", null, "Air Filter", "Corolla", "TOYOTA", "H1", "HEAD Q", 1, 1));
        partRepository.save(createPart("13780-77E00", null, "Air Filter", "SUZUKI Swift-Maruti", "SUZUKI", "H1", "HEAD Q", 50, 5));
        partRepository.save(createPart("87139-30040", null, "Air Condition Filter", "Toyota Hilux Revo", "TOYOTA", "H1", "HEAD Q", 73, 5));
        partRepository.save(createPart("212-11AKL", null, "Head Lamp-Left", "Toyota Hilux Revo", "TOYOTA", "H4", "HEAD Q", 16, 3));
        partRepository.save(createPart("212-11AKR", null, "Head Lamp-Right", "Toyota Hilux Revo", "TOYOTA", "H4", "HEAD Q", 16, 3));
        partRepository.save(createPart("212-11T2L", null, "Head Lamp-Left", "Toyota Hilux Vigo", "TOYOTA", "H4", "HEAD Q", 12, 3));
        partRepository.save(createPart("212-11T2R", null, "Head Lamp-Right", "Toyota Hilux Vigo", "TOYOTA", "H4", "HEAD Q", 13, 3));
        partRepository.save(createPart("212-11G9L", null, "Head Lamp-Left", "Toyota Hilux Vigo-Old", "TOYOTA", "H5", "HEAD Q", 1, 1));
        partRepository.save(createPart("212-11G9R", null, "Head Lamp-Right", "Toyota Hilux Vigo-Old", "TOYOTA", "H5", "HEAD Q", 1, 1));
        partRepository.save(createPart("47201-0K590", null, "Brake Master Cylinder", "Toyota Hilux Vigo", "TOYOTA", "H2", "HEAD Q", 10, 3));
        partRepository.save(createPart("47201-0K040", null, "Brake Master Cylinder", "Toyota Hilux Revo", "TOYOTA", "H2", "HEAD Q", 10, 3));
        partRepository.save(createPart("27060-0L170", null, "Alternator", "Toyota Hilux Revo", "TOYOTA", "H", "HEAD Q", 16, 2));
        partRepository.save(createPart("28100-0L040-W", null, "Starter", "Toyota Hilux-5L", "TOYOTA", "H1", "HEAD Q", 19, 2));
        partRepository.save(createPart("53401-65J00", null, "Wheel Cylinder-Rear", "SUZUKI Grand Vitara", "SUZUKI", "H2", "HEAD Q", 10, 2));

        log.info("Sample parts created");
    }

    private Part createPart(String partNumber, String ourPartNumber, String name, String model, String manufacturer, String location, String warehouse, int quantity, int minQty) {
        Part p = new Part(partNumber, name, model, manufacturer, location, warehouse, "pcs", quantity, minQty);
        p.setOurPartNumber(ourPartNumber);
        return p;
    }
}
