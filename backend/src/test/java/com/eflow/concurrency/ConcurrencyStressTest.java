package com.eflow.concurrency;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Concurrency Test Suite verifying multi-threaded atomic claim safety.
 * Simulates 50 students hitting the "Unlock" button at the exact same millisecond.
 */
public class ConcurrencyStressTest {

    @Test
    @DisplayName("50 concurrent student threads claiming the same bike simultaneously")
    void testConcurrentBikeClaimRaceCondition() throws InterruptedException {
        int numberOfStudents = 50;
        ExecutorService executor = Executors.newFixedThreadPool(numberOfStudents);
        CountDownLatch startGate = new CountDownLatch(1);
        CountDownLatch endGate = new CountDownLatch(numberOfStudents);

        // Atomic lock simulating database pessimistic lock / partial unique index
        AtomicBoolean bikeClaimed = new AtomicBoolean(false);
        AtomicInteger successfulRides = new AtomicInteger(0);
        AtomicInteger rejectedStudents = new AtomicInteger(0);

        for (int i = 1; i <= numberOfStudents; i++) {
            final int studentId = i;
            executor.submit(() -> {
                try {
                    // Wait at the starting gate so all 50 threads fire at the EXACT same nanosecond
                    startGate.await();

                    // Atomic operation simulating: SELECT ... FOR UPDATE & UPDATE bike SET status = 'IN_USE'
                    if (bikeClaimed.compareAndSet(false, true)) {
                        successfulRides.incrementAndGet();
                    } else {
                        // 409 Conflict: Bike is already claimed
                        rejectedStudents.incrementAndGet();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                } finally {
                    endGate.countDown();
                }
            });
        }

        // Fire all 50 requests simultaneously
        startGate.countDown();

        // Wait for all 50 threads to complete
        boolean finishedInTime = endGate.await(5, TimeUnit.SECONDS);
        executor.shutdown();

        // Assertions: Exactly 1 student gets the bike, 49 are safely rejected
        assertEquals(true, finishedInTime, "All threads must finish within 5 seconds");
        assertEquals(1, successfulRides.get(), "Exactly ONE student must be granted the bike!");
        assertEquals(49, rejectedStudents.get(), "Exactly 49 students must be rejected with 409 Conflict!");
    }
}
