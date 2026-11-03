package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.ProductionRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ProductionRecordRepository extends JpaRepository<ProductionRecord, Long> {
    List<ProductionRecord> findBySchoolIdAndServiceDate(Long schoolId, LocalDate serviceDate);
    List<ProductionRecord> findBySchoolIdOrderByServiceDateDesc(Long schoolId);
}
