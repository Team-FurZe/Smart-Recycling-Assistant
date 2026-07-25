package com.sra.backend.repository;

import com.sra.backend.entity.PredictionHistory;
import com.sra.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PredictionHistoryRepository extends JpaRepository<PredictionHistory, Long> {
    List<PredictionHistory> findByUserOrderByCreatedAtDesc(User user);
    Optional<PredictionHistory> findByIdAndUser(Long id, User user);
    void deleteByUser(User user);
}
