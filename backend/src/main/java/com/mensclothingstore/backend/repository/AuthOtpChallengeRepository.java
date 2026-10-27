package com.mensclothingstore.backend.repository;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import com.mensclothingstore.backend.entity.AuthOtpChallenge;

public interface AuthOtpChallengeRepository extends JpaRepository<AuthOtpChallenge, String> {
    Optional<AuthOtpChallenge> findFirstByPhoneAndPurposeOrderByCreatedAtDesc(String phone, String purpose);
    Optional<AuthOtpChallenge> findFirstByEmailAndPurposeOrderByCreatedAtDesc(String email, String purpose);
    Optional<AuthOtpChallenge> findByResetTokenHash(String resetTokenHash);
}
