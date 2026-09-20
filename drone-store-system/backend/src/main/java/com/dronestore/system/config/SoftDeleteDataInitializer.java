package com.dronestore.system.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * One-time data migration to backfill NULL is_deleted values that may have been
 * inserted before the soft-delete columns were added.
 *
 * Runs at startup (Order = 1, before all other ApplicationRunners) using raw JDBC
 * so it executes before Hibernate validates NOT NULL constraints on existing rows.
 */
@Component
@Order(1)
public class SoftDeleteDataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SoftDeleteDataInitializer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        try {
            int usersFixed = jdbcTemplate.update(
                "UPDATE users SET is_deleted = false WHERE is_deleted IS NULL"
            );
            if (usersFixed > 0) {
                log.info("[SoftDelete Init] Backfilled {} user row(s) with is_deleted = false", usersFixed);
            }
        } catch (Exception e) {
            log.warn("[SoftDelete Init] Could not backfill users.is_deleted: {}", e.getMessage());
        }

        try {
            int catsFixed = jdbcTemplate.update(
                "UPDATE categories SET is_deleted = false WHERE is_deleted IS NULL"
            );
            if (catsFixed > 0) {
                log.info("[SoftDelete Init] Backfilled {} category row(s) with is_deleted = false", catsFixed);
            }
        } catch (Exception e) {
            log.warn("[SoftDelete Init] Could not backfill categories.is_deleted: {}", e.getMessage());
        }
    }
}
