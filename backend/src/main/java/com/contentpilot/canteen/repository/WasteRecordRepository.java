package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.WasteRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WasteRecordRepository extends JpaRepository<WasteRecord, Long> {
    List<WasteRecord> findBySchoolIdAndServiceDate(Long schoolId, LocalDate serviceDate);
    List<WasteRecord> findBySchoolIdOrderByServiceDateDesc(Long schoolId);
}
