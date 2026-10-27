package com.eflow.stand.repository;

import com.eflow.stand.entity.Stand;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface StandRepository extends JpaRepository<Stand, UUID> {
    List<Stand> findByActiveTrue();
    boolean existsByName(String name);
}
