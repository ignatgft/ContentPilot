package com.contentpilot.canteen.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "allergens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Allergen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String icon = "shield-alert";

    @Column(length = 255)
    private String description;
}
