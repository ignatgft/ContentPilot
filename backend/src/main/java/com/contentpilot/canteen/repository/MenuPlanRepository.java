package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.MenuPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface MenuPlanRepository extends JpaRepository<MenuPlan, Long> {
    Optional<MenuPlan> findBySchoolIdAndServiceDateAndMealPeriod(Long schoolId, LocalDate serviceDate, String mealPeriod);
    List<MenuPlan> findBySchoolIdOrderByServiceDateDesc(Long schoolId);
}
