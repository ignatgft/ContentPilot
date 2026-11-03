package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "student_preferences", uniqueConstraints = {
        @UniqueConstraint(name = "uq_student_pref", columnNames = {"school_id", "service_date", "session_id", "dish_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "school_id", nullable = false)
    private Long schoolId;

    @Column(name = "service_date", nullable = false)
    private LocalDate serviceDate;

    @Column(name = "dish_id", nullable = false)
    private Long dishId;

    @Column(name = "session_id", nullable = false, length = 100)
    private String sessionId;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
