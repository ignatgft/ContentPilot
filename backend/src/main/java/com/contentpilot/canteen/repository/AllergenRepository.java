package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.Allergen;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AllergenRepository extends JpaRepository<Allergen, Long> {
    Optional<Allergen> findByCodeIgnoreCase(String code);
}
