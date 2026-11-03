package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.ProcurementPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProcurementPlanRepository extends JpaRepository<ProcurementPlan, Long> {
    Optional<ProcurementPlan> findFirstBySchoolIdAndServiceDateOrderByCreatedAtDesc(Long schoolId, LocalDate serviceDate);
    List<ProcurementPlan> findBySchoolIdOrderByServiceDateDesc(Long schoolId);
}
