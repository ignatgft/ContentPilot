package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.AttendancePlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendancePlanRepository extends JpaRepository<AttendancePlan, Long> {
    Optional<AttendancePlan> findBySchoolIdAndServiceDateAndMealPeriod(Long schoolId, LocalDate serviceDate, String mealPeriod);
    List<AttendancePlan> findBySchoolIdOrderByServiceDateDesc(Long schoolId);
}
