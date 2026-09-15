package com.mensclothingstore.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.Category;

public interface CategoryRepository extends JpaRepository<Category, Long> {
}