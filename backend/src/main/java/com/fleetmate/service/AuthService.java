package com.fleetmate.service;

import com.fleetmate.dto.LoginRequest;
import com.fleetmate.dto.LoginResponse;
import com.fleetmate.entity.User;
import com.fleetmate.exception.ApiException;
import com.fleetmate.repository.UserRepository;
import io.quarkus.elytron.security.common.BcryptUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

@ApplicationScoped
public class AuthService {

    @Inject
    UserRepository users;
    @Inject
    TokenService tokens;

    @Transactional
    public LoginResponse login(LoginRequest request) {
        User user = users.find("username", request.username().trim()).firstResult();
        boolean valid = user != null && user.active && user.passwordHash != null
                && BcryptUtil.matches(request.password(), user.passwordHash);
        if (!valid) {
            // Same message for unknown user and wrong password so usernames cannot be probed.
            throw new ApiException(401, "INVALID_CREDENTIALS", "Invalid username or password");
        }
        return new LoginResponse(tokens.issue(user.username), user.username, tokens.lifetimeSeconds());
    }
}
