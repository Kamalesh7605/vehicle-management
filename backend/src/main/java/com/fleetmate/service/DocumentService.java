package com.fleetmate.service;

import com.fleetmate.config.AlertConfig;
import com.fleetmate.config.StorageConfig;
import com.fleetmate.dto.DocumentRequest;
import com.fleetmate.dto.DocumentResponse;
import com.fleetmate.dto.PageResponse;
import com.fleetmate.entity.Document;
import com.fleetmate.entity.DocumentStatus;
import com.fleetmate.entity.DocumentType;
import com.fleetmate.exception.ApiException;
import com.fleetmate.mapper.DocumentMapper;
import com.fleetmate.repository.DocumentRepository;
import com.fleetmate.repository.DriverRepository;
import com.fleetmate.repository.QueryFilter.PagedResult;
import com.fleetmate.repository.VehicleRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@ApplicationScoped
public class DocumentService {

    private static final long MAX_FILE_BYTES = 10L * 1024 * 1024;
    private static final Map<String, String> EXTENSIONS = Map.of(
            "application/pdf", ".pdf", "image/jpeg", ".jpg", "image/png", ".png");

    public record StoredFile(Path path, String fileName, String contentType) {
    }

    @Inject
    DocumentRepository documents;
    @Inject
    VehicleRepository vehicles;
    @Inject
    DriverRepository drivers;
    @Inject
    AlertConfig alertConfig;
    @Inject
    StorageConfig storage;

    @Transactional
    public PageResponse<DocumentResponse> list(String q, DocumentType type, Long vehicleId, Long driverId,
                                               DocumentStatus status, int page, int size) {
        PagedResult<Document> result = documents.search(q, type, vehicleId, driverId, status, LocalDate.now(),
                alertConfig.documentExpiryDays(), page, size);
        return PageResponse.of(result.items().stream().map(this::toResponse).toList(), result.total(), page, size);
    }

    @Transactional
    public DocumentResponse get(Long id) {
        return toResponse(require(id));
    }

    @Transactional
    public DocumentResponse create(DocumentRequest request) {
        Document document = new Document();
        apply(document, request);
        documents.persist(document);
        return toResponse(document);
    }

    @Transactional
    public DocumentResponse update(Long id, DocumentRequest request) {
        Document document = require(id);
        apply(document, request);
        return toResponse(document);
    }

    @Transactional
    public void delete(Long id) {
        Document document = require(id);
        deleteStoredFile(document);
        documents.delete(document);
    }

    @Transactional
    public void deleteByVehicle(Long vehicleId) {
        // Delete entities (not a bulk query) so nothing stays managed while pointing at a removed vehicle.
        documents.list("vehicle.id", vehicleId).forEach(this::deleteWithFile);
    }

    @Transactional
    public void deleteByDriver(Long driverId) {
        documents.list("driver.id", driverId).forEach(this::deleteWithFile);
    }

    // ---- file storage: files live on disk, MySQL only keeps the relative path ----

    @Transactional
    public DocumentResponse attachFile(Long id, Path uploaded, String originalName, String contentType, long size) {
        Document document = require(id);
        String extension = EXTENSIONS.get(contentType == null ? "" : contentType.toLowerCase(Locale.ROOT));
        if (extension == null) {
            throw ApiException.badRequest("UNSUPPORTED_FILE_TYPE", "Only PDF, JPG and PNG files are allowed");
        }
        if (size > MAX_FILE_BYTES) {
            throw ApiException.badRequest("FILE_TOO_LARGE", "File must be 10 MB or smaller");
        }
        String storedName = id + "-" + UUID.randomUUID() + extension;
        try {
            Files.copy(uploaded, root().resolve(storedName), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not store uploaded file", e);
        }
        deleteStoredFile(document);
        document.filePath = storedName;
        document.fileName = originalName == null || originalName.isBlank() ? "document" + extension
                : Path.of(originalName).getFileName().toString();
        document.contentType = contentType.toLowerCase(Locale.ROOT);
        return toResponse(document);
    }

    @Transactional
    public StoredFile readFile(Long id) {
        Document document = require(id);
        if (document.filePath == null) {
            throw ApiException.notFound("Document file", id);
        }
        Path path = root().resolve(document.filePath).normalize();
        if (!path.startsWith(root()) || !Files.exists(path)) {
            throw ApiException.notFound("Document file", id);
        }
        return new StoredFile(path, document.fileName, document.contentType);
    }

    @Transactional
    public DocumentResponse removeFile(Long id) {
        Document document = require(id);
        deleteStoredFile(document);
        document.filePath = null;
        document.fileName = null;
        document.contentType = null;
        return toResponse(document);
    }

    /** When a document is renewed the old one stays as history; only the newest per type and owner matters. */
    public static List<Document> latestPerType(Collection<Document> all) {
        Map<String, Document> latest = new LinkedHashMap<>();
        for (Document d : all) {
            String key = d.documentType + ":" + (d.vehicle != null ? "V" + d.vehicle.id : "D" + d.driver.id);
            Document current = latest.get(key);
            if (current == null || d.expiryDate.isAfter(current.expiryDate)) {
                latest.put(key, d);
            }
        }
        return List.copyOf(latest.values());
    }

    private DocumentResponse toResponse(Document d) {
        return DocumentMapper.toResponse(d, LocalDate.now(), alertConfig.documentExpiryDays());
    }

    private void apply(Document document, DocumentRequest r) {
        if (r.documentType().isDriverDocument()) {
            if (r.driverId() == null) {
                throw ApiException.badRequest("DRIVER_REQUIRED", "Select the driver this document belongs to");
            }
            document.driver = drivers.findByIdOptional(r.driverId())
                    .orElseThrow(() -> ApiException.notFound("Driver", r.driverId()));
            document.vehicle = null;
        } else {
            if (r.vehicleId() == null) {
                throw ApiException.badRequest("VEHICLE_REQUIRED", "Select the vehicle this document belongs to");
            }
            document.vehicle = vehicles.findByIdOptional(r.vehicleId())
                    .orElseThrow(() -> ApiException.notFound("Vehicle", r.vehicleId()));
            document.driver = null;
        }
        if (r.issueDate() != null && r.issueDate().isAfter(r.expiryDate())) {
            throw ApiException.badRequest("INVALID_DATES", "Issue date cannot be after the expiry date");
        }
        document.documentType = r.documentType();
        document.documentNumber = VehicleService.blankToNull(r.documentNumber());
        document.issueDate = r.issueDate();
        document.expiryDate = r.expiryDate();
        document.notes = VehicleService.blankToNull(r.notes());
    }

    private void deleteWithFile(Document document) {
        deleteStoredFile(document);
        documents.delete(document);
    }

    private void deleteStoredFile(Document document) {
        if (document.filePath == null) {
            return;
        }
        try {
            Files.deleteIfExists(root().resolve(document.filePath).normalize());
        } catch (IOException e) {
            // A leftover file is harmless; do not fail the request because of it.
        }
    }

    private Path root() {
        try {
            Path root = Path.of(storage.dir()).toAbsolutePath().normalize();
            Files.createDirectories(root);
            return root;
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create storage directory", e);
        }
    }

    private Document require(Long id) {
        Document document = documents.findById(id);
        if (document == null) {
            throw ApiException.notFound("Document", id);
        }
        return document;
    }
}
