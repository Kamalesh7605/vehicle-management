package com.fleetmate.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(name = "uk_users_email", columnNames = "email"),
        @UniqueConstraint(name = "uk_users_username", columnNames = "username")})
public class User extends BaseEntity {

    @Column(nullable = false, length = 100)
    public String name;

    @Column(nullable = false, length = 150)
    public String email;

    /** Login name; null for users that cannot sign in. */
    @Column(length = 50)
    public String username;

    /** bcrypt hash - the plain password is never stored. */
    @Column(name = "password_hash", length = 100)
    public String passwordHash;

    @Column(nullable = false)
    public boolean active = true;
}
