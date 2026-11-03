package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.ProcurementLine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProcurementLineRepository extends JpaRepository<ProcurementLine, Long> {
    List<ProcurementLine> findByProcurementPlanId(Long procurementPlanId);
}
