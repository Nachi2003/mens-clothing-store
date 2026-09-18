package com.mensclothingstore.backend.repository;

import com.mensclothingstore.backend.entity.InvoiceSequence;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InvoiceSequenceRepository
        extends JpaRepository<InvoiceSequence, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT s
            FROM InvoiceSequence s
            WHERE s.sequenceId = :sequenceId
            """)
    InvoiceSequence findBySequenceIdForUpdate(
            @Param("sequenceId") Long sequenceId
    );
}