package com.mensclothingstore.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.ShopSettings;

public interface ShopSettingsRepository extends JpaRepository<ShopSettings, Long> {
}