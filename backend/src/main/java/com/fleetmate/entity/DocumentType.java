package com.fleetmate.entity;

public enum DocumentType {
    RC(false),
    INSURANCE(false),
    FITNESS_CERTIFICATE(false),
    POLLUTION_CERTIFICATE(false),
    PERMIT(false),
    ROAD_TAX(false),
    DRIVING_LICENCE(true);

    private final boolean driverDocument;

    DocumentType(boolean driverDocument) {
        this.driverDocument = driverDocument;
    }

    public boolean isDriverDocument() {
        return driverDocument;
    }
}
