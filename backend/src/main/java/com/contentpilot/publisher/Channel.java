package com.contentpilot.publisher;

import com.contentpilot.brand.Brand;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.OffsetDateTime;

@Entity
@Table(name = "channels")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Channel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "brand_id", nullable = false)
    @JsonIgnore
    private Brand brand;

    @Column(nullable = false, length = 50)
    private String platform; // TELEGRAM, VK, INSTAGRAM

    @Column(name = "external_id", nullable = false)
    private String externalId; // e.g. @my_channel or -100123456789

    @Column(name = "encrypted_token", nullable = false, columnDefinition = "TEXT")
    private String encryptedToken;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "CONNECTED"; // CONNECTED, DISCONNECTED, ERROR

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
