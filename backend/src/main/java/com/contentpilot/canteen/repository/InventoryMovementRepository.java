package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.InventoryMovement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InventoryMovementRepository extends JpaRepository<InventoryMovement, Long> {
    List<InventoryMovement> findByIngredientIdOrderByCreatedAtDesc(Long ingredientId);
    List<InventoryMovement> findTop50ByOrderByCreatedAtDesc();
}
