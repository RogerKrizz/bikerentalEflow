package com.eflow.config;

import com.eflow.auth.entity.Student;
import com.eflow.auth.repository.StudentRepository;
import com.eflow.bike.entity.Bike;
import com.eflow.bike.repository.BikeRepository;
import com.eflow.device.entity.Device;
import com.eflow.device.repository.DeviceRepository;
import com.eflow.stand.entity.Stand;
import com.eflow.stand.repository.StandRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

/**
 * Dev-only seeder for default testing accounts, demo stands, bikes, and simulated smart locks.
 */
@Component
@Profile("dev")
public class DevDataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DevDataSeeder.class);

    private final StudentRepository studentRepository;
    private final PasswordEncoder passwordEncoder;
    private final StandRepository standRepository;
    private final BikeRepository bikeRepository;
    private final DeviceRepository deviceRepository;

    public DevDataSeeder(
            StudentRepository studentRepository,
            PasswordEncoder passwordEncoder,
            StandRepository standRepository,
            BikeRepository bikeRepository,
            DeviceRepository deviceRepository
    ) {
        this.studentRepository = studentRepository;
        this.passwordEncoder = passwordEncoder;
        this.standRepository = standRepository;
        this.bikeRepository = bikeRepository;
        this.deviceRepository = deviceRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        seedAccounts();
        seedStandsAndBikes();
    }

    private void seedAccounts() {
        studentRepository.findByEmail("admin@ssn.edu.in").ifPresentOrElse(
                admin -> {
                    admin.setPasswordHash(passwordEncoder.encode("admin123"));
                    admin.setRole(Student.Role.ADMIN);
                    admin.setEmailVerified(true);
                    studentRepository.save(admin);
                    log.info(">>> Updated DEV admin account: admin@ssn.edu.in / admin123");
                },
                () -> {
                    Student admin = new Student(
                            "admin@ssn.edu.in",
                            passwordEncoder.encode("admin123"),
                            "SSN Admin",
                            Student.Role.ADMIN
                    );
                    admin.setEmailVerified(true);
                    studentRepository.save(admin);
                    log.info(">>> Seeded DEV admin account: admin@ssn.edu.in / admin123");
                }
        );

        studentRepository.findByEmail("student@ssn.edu.in").ifPresentOrElse(
                student -> {
                    student.setPasswordHash(passwordEncoder.encode("student123"));
                    student.setEmailVerified(true);
                    studentRepository.save(student);
                    log.info(">>> Updated DEV student account: student@ssn.edu.in / student123");
                },
                () -> {
                    Student student = new Student(
                            "student@ssn.edu.in",
                            passwordEncoder.encode("student123"),
                            "SSN Student",
                            Student.Role.STUDENT
                    );
                    student.setEmailVerified(true);
                    studentRepository.save(student);
                    log.info(">>> Seeded DEV student account: student@ssn.edu.in / student123");
                }
        );
    }

    private void seedStandsAndBikes() {
        if (standRepository.count() > 0) {
            return;
        }

        log.info(">>> Seeding demo stands, bikes, and simulated devices (DEMO — not official SSN coordinates)...");

        // Demo Stand A: Main Gate / Clock Tower
        Stand standA = standRepository.save(new Stand(
                "Main Gate Stand (Demo A)",
                new BigDecimal("12.7511000"),
                new BigDecimal("80.1965000"),
                10,
                new BigDecimal("40.0")
        ));

        // Demo Stand B: Central Library / Admin Block
        Stand standB = standRepository.save(new Stand(
                "Central Library Stand (Demo B)",
                new BigDecimal("12.7528000"),
                new BigDecimal("80.1978000"),
                10,
                new BigDecimal("40.0")
        ));

        // Demo Stand C: Tech Park / Hostel Quad
        Stand standC = standRepository.save(new Stand(
                "Tech Park Stand (Demo C)",
                new BigDecimal("12.7542000"),
                new BigDecimal("80.1992000"),
                10,
                new BigDecimal("40.0")
        ));

        // Seed 8 demo bikes across the 3 stands
        List<Stand> stands = List.of(standA, standB, standC);
        int bikeIndex = 1;

        for (Stand stand : stands) {
            int bikesForStand = (stand == standC) ? 2 : 3;
            for (int i = 0; i < bikesForStand; i++) {
                String bikeCode = String.format("EFLOW-BK-%03d", bikeIndex);
                Bike bike = new Bike(
                        bikeCode,
                        stand,
                        Bike.Status.AVAILABLE,
                        90 + (i * 3) % 11, // Battery 90-100%
                        Bike.LockState.LOCKED
                );
                bike = bikeRepository.save(bike);

                // Attach simulated smart lock device
                String deviceId = String.format("DEV-SIM-%03d", bikeIndex);
                Device device = new Device(
                        deviceId,
                        bike,
                        Device.Transport.SIMULATOR,
                        "in-process://simulator/" + deviceId,
                        "secret-key-sim-" + bikeIndex
                );
                deviceRepository.save(device);

                bikeIndex++;
            }
        }

        log.info(">>> Seeded 3 stands and 8 demo bikes with simulated smart locks.");
    }
}
