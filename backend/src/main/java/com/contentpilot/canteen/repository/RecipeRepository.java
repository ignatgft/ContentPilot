package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.Recipe;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecipeRepository extends JpaRepository<Recipe, Long> {
    Optional<Recipe> findFirstByDishIdAndActiveTrueOrderByVersionDesc(Long dishId);
    List<Recipe> findByDishId(Long dishId);
}
