package com.sra.backend.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;
import java.util.UUID;

@Entity
@Getter @Setter
public class Prediction {
  @Id
  private UUID id = UUID.randomUUID();

  private String label;
  private double confidence;
  private String binColor;
  private Instant createdAt = Instant.now();
}
