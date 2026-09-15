package com.mensclothingstore.backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.mensclothingstore.backend.dto.CategoryRequest;
import com.mensclothingstore.backend.dto.CategoryResponse;
import com.mensclothingstore.backend.entity.Category;
import com.mensclothingstore.backend.repository.CategoryRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getAllCategories() {

        List<Category> categories = categoryRepository.findAll();

        return categories.stream()
                .map(category -> new CategoryResponse(
                        category.getCategoryId(),
                        category.getCategoryName(),
                        category.getDescription()
                ))
                .toList();
    }

    public CategoryResponse createCategory(CategoryRequest request) {

        Category category = new Category();

        category.setCategoryName(request.getCategoryName());
        category.setDescription(request.getDescription());

        Category savedCategory = categoryRepository.save(category);

        return new CategoryResponse(
                savedCategory.getCategoryId(),
                savedCategory.getCategoryName(),
                savedCategory.getDescription()
        );
    }
    public CategoryResponse getCategoryById(Long categoryId) {

    Optional<Category> category = categoryRepository.findById(categoryId);

    if (category.isEmpty()) {
        throw new RuntimeException("Category not found");
    }

    Category foundCategory = category.get();

    return new CategoryResponse(
            foundCategory.getCategoryId(),
            foundCategory.getCategoryName(),
            foundCategory.getDescription()
    );
}
public CategoryResponse updateCategory(Long categoryId, CategoryRequest request) {

    Optional<Category> categoryOptional =
            categoryRepository.findById(categoryId);

    if (categoryOptional.isEmpty()) {
        throw new RuntimeException("Category not found");
    }

    Category category = categoryOptional.get();

    category.setCategoryName(request.getCategoryName());
    category.setDescription(request.getDescription());

    Category updatedCategory = categoryRepository.save(category);

    return new CategoryResponse(
            updatedCategory.getCategoryId(),
            updatedCategory.getCategoryName(),
            updatedCategory.getDescription()
    );
}
public void deleteCategory(Long categoryId) {

    Optional<Category> categoryOptional =
            categoryRepository.findById(categoryId);

    if (categoryOptional.isEmpty()) {
        throw new RuntimeException("Category not found");
    }

    categoryRepository.delete(categoryOptional.get());
}
}