package com.garage.config;

import com.garage.model.Part;
import com.garage.model.Stock;
import com.garage.repository.PartRepository;
import com.garage.repository.StockRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import java.util.logging.Logger;

@Component
@Profile("!prod")
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {
    private static final Logger log = Logger.getLogger(DataInitializer.class.getName());
    private final StockRepository stockRepository;
    private final PartRepository partRepository;

    @Override
    public void run(String... args) {
        loadStocks();
    }

    private void loadStocks() {
        if (stockRepository.count() > 0) return;

        Stock stockA = stockRepository.save(new Stock("Stock A", "Main warehouse, Nairobi"));
        Stock stockB = stockRepository.save(new Stock("Stock B", "Secondary warehouse, Mombasa Road"));
        log.info("2 stock locations created: Stock A, Stock B");

        // Create demo parts assigned to stocks
        if (!partRepository.existsByPartNumber("OIL-001")) {
            partRepository.save(new Part("OIL-001", "Oil Filter 3.0L", "D4D", "Toyota", "pcs", 50, 10, stockA));
            partRepository.save(new Part("OIL-002", "Oil Filter 2.0L", "2KD-FTV", "Toyota", "pcs", 30, 10, stockA));
            partRepository.save(new Part("BRK-001", "Brake Pads Front", "Corolla 2018+", "Toyota Genuine", "set", 25, 5, stockA));
            partRepository.save(new Part("BRK-002", "Brake Pads Rear", "Corolla 2018+", "Toyota Genuine", "set", 20, 5, stockA));
            partRepository.save(new Part("FLT-001", "Air Filter", "D4D", "Toyota", "pcs", 40, 10, stockA));
            partRepository.save(new Part("FLT-002", "Cabin Filter", "All Models", "Toyota", "pcs", 35, 10, stockA));
            partRepository.save(new Part("ENG-001", "Engine Oil 5W-30", "All Models", "Mobil 1", "pcs", 100, 20, stockB));
            partRepository.save(new Part("BELT-001", "Timing Belt Kit", "2KD-FTV", "Toyota", "set", 15, 3, stockB));
            partRepository.save(new Part("SPK-001", "Spark Plug Iridium", "All Models", "NGK", "pcs", 60, 20, stockB));
            partRepository.save(new Part("CLT-001", "Clutch Kit", "Hilux 2015+", "Toyota Genuine", "set", 8, 2, stockB));
            partRepository.save(new Part("WTR-001", "Water Pump", "D4D", "Toyota", "pcs", 12, 3, stockB));
            partRepository.save(new Part("RAD-001", "Radiator", "Corolla 2018+", "Toyota Genuine", "pcs", 5, 2, stockB));
            log.info("12 demo parts created with stock assignments");
        }
    }
}
