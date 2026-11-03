package com.contentpilot.canteen.repository;

import com.contentpilot.canteen.domain.StudentMealBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentMealBookingRepository extends JpaRepository<StudentMealBooking, Long> {

    List<StudentMealBooking> findBySchoolIdOrderByBookingDateDescCreatedAtDesc(Long schoolId);

    List<StudentMealBooking> findBySchoolIdAndBookingDateOrderByCreatedAtDesc(Long schoolId, LocalDate bookingDate);

    List<StudentMealBooking> findBySchoolIdAndBookingDateAndGrade(Long schoolId, LocalDate bookingDate, String grade);

    Optional<StudentMealBooking> findByCodeIgnoreCase(String code);

    List<StudentMealBooking> findByStudentNameIgnoreCaseOrderByBookingDateDesc(String studentName);

    long countBySchoolIdAndBookingDateAndStatus(Long schoolId, LocalDate bookingDate, String status);
}
