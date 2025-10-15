package com.sra.backend.repository;

import com.sra.backend.entity.Prediction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PredictionRepository extends JpaRepository<Prediction, UUID> {}
