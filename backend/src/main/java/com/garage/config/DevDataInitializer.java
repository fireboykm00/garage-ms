package com.garage.config;

import com.garage.model.Part;
import com.garage.model.User;
import com.garage.model.enums.UserRole;
import com.garage.repository.PartRepository;
import com.garage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.logging.Logger;

@Component
@Profile("dev")
@RequiredArgsConstructor
public class DevDataInitializer implements CommandLineRunner {
    private static final Logger log = Logger.getLogger(DevDataInitializer.class.getName());
    private final UserRepository userRepository;
    private final PartRepository partRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        loadDevUsers();
        loadDevParts();
    }

    private void loadDevUsers() {
        if (!userRepository.existsByUsername("storekeeper")) {
            User sk = new User("storekeeper", "storekeeper@garage.com", "storekeeper123",
                    "Store Keeper", UserRole.ROLE_STOREKEEPER);
            sk.encodePassword(passwordEncoder);
            userRepository.save(sk);
            log.info("Dev user created: storekeeper / storekeeper123");
        }

        if (!userRepository.existsByUsername("mechanic")) {
            User mech = new User("mechanic", "mechanic@garage.com", "mechanic123",
                    "Senior Mechanic", UserRole.ROLE_MECHANIC);
            mech.encodePassword(passwordEncoder);
            userRepository.save(mech);
            log.info("Dev user created: mechanic / mechanic123");
        }

        if (!userRepository.existsByUsername("receptionist")) {
            User rec = new User("receptionist", "receptionist@garage.com", "receptionist123",
                    "Front Desk Receptionist", UserRole.ROLE_RECEPTIONIST);
            rec.encodePassword(passwordEncoder);
            userRepository.save(rec);
            log.info("Dev user created: receptionist / receptionist123");
        }
    }

    private void loadDevParts() {
        if (partRepository.count() > 0) return;

        partRepository.save(createPart("04152-31090", null, "Oil Filter", "Rav4",
                "TOYOTA", "H1", "HEAD Q", 50, 5));
        partRepository.save(createPart("23390-0L070", null, "Fuel Filter", "Hilux Revo",
                "TOYOTA", "H1", "HEAD Q", 50, 5));
        partRepository.save(createPart("17801-0L040", null, "Air Filter", "Hilux Revo",
                "TOYOTA", "H1", "HEAD Q", 50, 5));
        partRepository.save(createPart("47201-0K590", null, "Brake Master Cylinder", "Hilux Vigo",
                "TOYOTA", "H2", "HEAD Q", 50, 5));
        partRepository.save(createPart("212-11AKL", null, "Head Lamp-Left", "Hilux Revo",
                "TOYOTA", "H4", "HEAD Q", 50, 5));

        log.info("5 dev sample parts created");
    }

    private Part createPart(String partNumber, String ourPartNumber, String name, String model,
                            String manufacturer, String location, String warehouse, int quantity, int minQty) {
        Part p = new Part(partNumber, name, model, manufacturer, location, warehouse, "pcs", quantity, minQty);
        p.setOurPartNumber(ourPartNumber);
        return p;
    }
}
