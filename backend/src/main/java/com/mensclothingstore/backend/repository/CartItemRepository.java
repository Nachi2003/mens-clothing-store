
package com.mensclothingstore.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.mensclothingstore.backend.entity.CartItem;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
void deleteByVariant_VariantId(Long variantId);
    Optional<CartItem> findByCart_CartIdAndVariant_VariantId(
            Long cartId,
            Long variantId
    );

    List<CartItem> findByCart_CartId(Long cartId);

    boolean existsByVariant_VariantId(Long variantId);
}
