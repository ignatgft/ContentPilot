package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.StudentPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentPreferenceRepository extends JpaRepository<StudentPreference, Long> {

    List<StudentPreference> findBySchoolIdAndServiceDate(Long schoolId, LocalDate serviceDate);

    long countBySchoolIdAndServiceDateAndDishId(Long schoolId, LocalDate serviceDate, Long dishId);

    Optional<StudentPreference> findBySchoolIdAndServiceDateAndSessionIdAndDishId(
            Long schoolId, LocalDate serviceDate, String sessionId, Long dishId
    );
}
