package com.mensclothingstore.backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUserId(Long userId);

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByPhone(String phone);
}