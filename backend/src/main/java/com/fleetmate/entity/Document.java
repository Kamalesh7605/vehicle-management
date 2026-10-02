package com.fleetmate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;

@Entity
@Table(name = "documents")
public class Document extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 30)
    public DocumentType documentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id")
    public Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "driver_id")
    public Driver driver;

    @Column(name = "document_number", length = 100)
    public String documentNumber;

    @Column(name = "issue_date")
    public LocalDate issueDate;

    @Column(name = "expiry_date", nullable = false)
    public LocalDate expiryDate;

    @Column(length = 500)
    public String notes;

    /** Location of the uploaded file relative to the storage directory; the file itself is not stored in MySQL. */
    @Column(name = "file_path", length = 300)
    public String filePath;

    @Column(name = "file_name", length = 200)
    public String fileName;

    @Column(name = "content_type", length = 100)
    public String contentType;
}
