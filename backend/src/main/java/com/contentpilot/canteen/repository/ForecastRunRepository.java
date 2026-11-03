package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.ForecastRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ForecastRunRepository extends JpaRepository<ForecastRun, Long> {
    Optional<ForecastRun> findFirstBySchoolIdAndServiceDateAndMealPeriodOrderByCreatedAtDesc(Long schoolId, LocalDate serviceDate, String mealPeriod);
    List<ForecastRun> findBySchoolIdOrderByServiceDateDesc(Long schoolId);
}
