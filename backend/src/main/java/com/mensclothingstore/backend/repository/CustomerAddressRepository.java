package com.mensclothingstore.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.CustomerAddress;

public interface CustomerAddressRepository
        extends JpaRepository<CustomerAddress, Long> {

    Optional<CustomerAddress> findByUser_UserId(Long userId);

    boolean existsByUser_UserId(Long userId);
}