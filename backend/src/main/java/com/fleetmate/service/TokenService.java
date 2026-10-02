package com.fleetmate.service;

import com.fleetmate.config.AuthConfig;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.Key;
import java.util.Base64;
import java.util.Optional;
import org.jboss.logging.Logger;
import org.jose4j.jwa.AlgorithmConstraints;
import org.jose4j.jws.AlgorithmIdentifiers;
import org.jose4j.jws.JsonWebSignature;
import org.jose4j.jwt.JwtClaims;
import org.jose4j.jwt.consumer.InvalidJwtException;
import org.jose4j.jwt.consumer.JwtConsumer;
import org.jose4j.jwt.consumer.JwtConsumerBuilder;
import org.jose4j.keys.HmacKey;
import org.jose4j.lang.JoseException;

/** Issues and verifies signed login tokens (JWT, HS256). */
@ApplicationScoped
public class TokenService {

    private static final Logger LOG = Logger.getLogger(TokenService.class);
    private static final String ISSUER = "fleetmate";

    @Inject
    AuthConfig config;

    private Key key;
    private JwtConsumer consumer;

    @PostConstruct
    void init() {
        String secret = config.jwtSecret().filter(s -> !s.isBlank()).orElseGet(() -> {
            byte[] random = new byte[48];
            new SecureRandom().nextBytes(random);
            LOG.warn("JWT_SECRET is not set: using a random secret, so users must sign in again after every restart.");
            return Base64.getEncoder().encodeToString(random);
        });
        if (secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must be at least 32 characters long");
        }
        key = new HmacKey(secret.getBytes(StandardCharsets.UTF_8));
        consumer = new JwtConsumerBuilder()
                .setRequireExpirationTime()
                .setRequireSubject()
                .setExpectedIssuer(ISSUER)
                .setVerificationKey(key)
                .setJwsAlgorithmConstraints(AlgorithmConstraints.ConstraintType.PERMIT, AlgorithmIdentifiers.HMAC_SHA256)
                .build();
    }

    public long lifetimeSeconds() {
        return config.tokenHours() * 3600L;
    }

    public String issue(String username) {
        JwtClaims claims = new JwtClaims();
        claims.setIssuer(ISSUER);
        claims.setSubject(username);
        claims.setIssuedAtToNow();
        claims.setExpirationTimeMinutesInTheFuture(config.tokenHours() * 60f);
        JsonWebSignature jws = new JsonWebSignature();
        jws.setPayload(claims.toJson());
        jws.setKey(key);
        jws.setAlgorithmHeaderValue(AlgorithmIdentifiers.HMAC_SHA256);
        try {
            return jws.getCompactSerialization();
        } catch (JoseException e) {
            throw new IllegalStateException("Could not sign token", e);
        }
    }

    /** Returns the username when the token is valid, correctly signed and not expired. */
    public Optional<String> verify(String token) {
        try {
            return Optional.of(consumer.processToClaims(token).getSubject());
        } catch (InvalidJwtException | org.jose4j.jwt.MalformedClaimException e) {
            return Optional.empty();
        }
    }
}
