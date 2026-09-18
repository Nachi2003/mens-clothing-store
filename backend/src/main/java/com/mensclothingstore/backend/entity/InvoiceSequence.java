package com.mensclothingstore.backend.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "invoice_sequence")
public class InvoiceSequence {

    @Id
    @Column(name = "sequence_id")
    private Long sequenceId;

    @Column(name = "next_number", nullable = false)
    private Long nextNumber;

    public Long getSequenceId() {
        return sequenceId;
    }

    public void setSequenceId(Long sequenceId) {
        this.sequenceId = sequenceId;
    }

    public Long getNextNumber() {
        return nextNumber;
    }

    public void setNextNumber(Long nextNumber) {
        this.nextNumber = nextNumber;
    }
}