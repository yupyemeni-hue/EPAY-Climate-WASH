/*
 * EPAY Environmental Intelligence Platform
 * Data Validation Engine
 *
 * Purpose:
 * - Validate incoming indicator records.
 * - Detect missing, invalid, stale or suspicious values.
 * - Classify data status.
 * - Provide transparent validation results.
 *
 * Important:
 * This engine does NOT invent, repair or fabricate missing data.
 * It only validates and classifies what is provided to it.
 */

(function (window) {
  "use strict";

  const EPAYValidation = {

    VERSION: "1.0.0",

    STATUS: {
      LIVE: "LIVE",
      VERIFIED: "VERIFIED",
      MODELLED: "MODELLED",
      DEMO: "DEMO",
      UNAVAILABLE: "UNAVAILABLE"
    },

    SEVERITY: {
      INFO: "INFO",
      WARNING: "WARNING",
      ERROR: "ERROR",
      CRITICAL: "CRITICAL"
    },

    /*
     * Generic validation limits.
     *
     * These are sanity checks only.
     * They are NOT scientific thresholds.
     * Indicator-specific scientific validation will be added later.
     */
    LIMITS: {
      temperature: {
        min: -90,
        max: 70
      },

      rainfall: {
        min: 0,
        max: 2000
      },

      windSpeed: {
        min: 0,
        max: 150
      },

      riskScore: {
        min: 0,
        max: 100
      },

      percentage: {
        min: 0,
        max: 100
      }
    },

    /*
     * Normalize an incoming value.
     */
    normalizeValue: function (value) {

      if (value === null || value === undefined) {
        return null;
      }

      if (typeof value === "string") {
        const trimmed = value.trim();

        if (trimmed === "") {
          return null;
        }

        const numericValue = Number(trimmed);

        if (!Number.isNaN(numericValue)) {
          return numericValue;
        }

        return trimmed;
      }

      return value;
    },

    /*
     * Check whether a value is missing.
     */
    isMissing: function (value) {

      return (
        value === null ||
        value === undefined ||
        value === ""
      );
    },

    /*
     * Check whether a numeric value is actually numeric.
     */
    isNumeric: function (value) {

      return (
        typeof value === "number" &&
        Number.isFinite(value)
      );
    },

    /*
     * Validate numeric range.
     */
    validateRange: function (value, min, max) {

      if (!this.isNumeric(value)) {
        return {
          valid: false,
          severity: this.SEVERITY.ERROR,
          message: "Value is not a valid number."
        };
      }

      if (value < min || value > max) {
        return {
          valid: false,
          severity: this.SEVERITY.ERROR,
          message: "Value is outside the accepted sanity range.",
          min: min,
          max: max
        };
      }

      return {
        valid: true,
        severity: this.SEVERITY.INFO,
        message: "Value is within the accepted sanity range."
      };
    },

    /*
     * Validate timestamp.
     */
    validateTimestamp: function (timestamp) {

      if (!timestamp) {
        return {
          valid: false,
          severity: this.SEVERITY.WARNING,
          message: "Timestamp is missing."
        };
      }

      const date = new Date(timestamp);

      if (Number.isNaN(date.getTime())) {
        return {
          valid: false,
          severity: this.SEVERITY.ERROR,
          message: "Timestamp is invalid."
        };
      }

      return {
        valid: true,
        severity: this.SEVERITY.INFO,
        message: "Timestamp is valid.",
        normalizedTimestamp: date.toISOString()
      };
    },

    /*
     * Calculate age in hours.
     */
    getAgeHours: function (timestamp) {

      const date = new Date(timestamp);

      if (Number.isNaN(date.getTime())) {
        return null;
      }

      const now = Date.now();

      return Math.max(
        0,
        (now - date.getTime()) / (1000 * 60 * 60)
      );
    },

    /*
     * Determine freshness.
     *
     * This does not claim scientific freshness.
     * It only evaluates elapsed time against the provided threshold.
     */
    validateFreshness: function (timestamp, maxAgeHours) {

      const ageHours = this.getAgeHours(timestamp);

      if (ageHours === null) {
        return {
          valid: false,
          severity: this.SEVERITY.WARNING,
          message: "Freshness cannot be determined."
        };
      }

      if (ageHours > maxAgeHours) {
        return {
          valid: false,
          severity: this.SEVERITY.WARNING,
          message: "Data is older than the configured freshness window.",
          ageHours: Number(ageHours.toFixed(2)),
          maxAgeHours: maxAgeHours
        };
      }

      return {
        valid: true,
        severity: this.SEVERITY.INFO,
        message: "Data is inside the configured freshness window.",
        ageHours: Number(ageHours.toFixed(2)),
        maxAgeHours: maxAgeHours
      };
    },

    /*
     * Validate source metadata.
     */
    validateSource: function (record) {

      const problems = [];

      if (!record.sourceId) {
        problems.push("sourceId is missing.");
      }

      if (!record.sourceName) {
        problems.push("sourceName is missing.");
      }

      if (problems.length > 0) {
        return {
          valid: false,
          severity: this.SEVERITY.WARNING,
          message: problems.join(" ")
        };
      }

      return {
        valid: true,
        severity: this.SEVERITY.INFO,
        message: "Source metadata is present."
      };
    },

    /*
     * Validate data status.
     */
    validateStatus: function (status) {

      const allowed = Object.values(this.STATUS);

      if (!allowed.includes(status)) {
        return {
          valid: false,
          severity: this.SEVERITY.ERROR,
          message: "Unknown data status."
        };
      }

      return {
        valid: true,
        severity: this.SEVERITY.INFO,
        message: "Data status is recognized."
      };
    },

    /*
     * Validate a single indicator record.
     *
     * Expected structure:
     *
     * {
     *   indicatorId: "temperature",
     *   value: 27,
     *   unit: "°C",
     *   timestamp: "...",
     *   sourceId: "...",
     *   sourceName: "...",
     *   status: "LIVE",
     *   maxAgeHours: 24
     * }
     */
    validateRecord: function (record) {

      const result = {
        valid: true,
        score: 100,
        status: this.STATUS.UNAVAILABLE,
        errors: [],
        warnings: [],
        checks: [],
        metadata: {
          indicatorId: record && record.indicatorId
            ? record.indicatorId
            : null,

          validatedAt: new Date().toISOString()
        }
      };

      if (!record || typeof record !== "object") {

        result.valid = false;
        result.score = 0;

        result.errors.push(
          "Input record is missing or invalid."
        );

        return result;
      }

      /*
       * Indicator ID
       */
      if (!record.indicatorId) {

        result.valid = false;
        result.score -= 20;

        result.errors.push(
          "indicatorId is missing."
        );

      } else {

        result.checks.push({
          check: "indicator_id",
          valid: true
        });
      }

      /*
       * Value
       */
      const normalizedValue =
        this.normalizeValue(record.value);

      if (this.isMissing(normalizedValue)) {

        result.valid = false;
        result.score -= 30;

        result.errors.push(
          "Indicator value is missing."
        );

      } else {

        result.checks.push({
          check: "value_presence",
          valid: true
        });
      }

      /*
       * Numeric sanity checks.
       */
      if (this.isNumeric(normalizedValue)) {

        let rangeRule = null;

        switch (record.indicatorId) {

          case "temperature":
            rangeRule = this.LIMITS.temperature;
            break;

          case "rainfall":
            rangeRule = this.LIMITS.rainfall;
            break;

          case "wind-speed":
            rangeRule = this.LIMITS.windSpeed;
            break;

          case "flood-risk":
          case "drought-risk":
          case "environmental-priority":
          case "wash-risk":
            rangeRule = this.LIMITS.riskScore;
            break;

          default:
            rangeRule = null;
        }

        if (rangeRule) {

          const rangeResult =
            this.validateRange(
              normalizedValue,
              rangeRule.min,
              rangeRule.max
            );

          result.checks.push({
            check: "numeric_range",
            ...rangeResult
          });

          if (!rangeResult.valid) {

            result.valid = false;
            result.score -= 30;

            result.errors.push(
              rangeResult.message
            );
          }
        }
      }

      /*
       * Timestamp validation.
       */
      const timestampResult =
        this.validateTimestamp(record.timestamp);

      result.checks.push({
        check: "timestamp",
        ...timestampResult
      });

      if (!timestampResult.valid) {

        result.score -= 10;

        if (
          timestampResult.severity ===
          this.SEVERITY.ERROR
        ) {
          result.valid = false;
          result.errors.push(
            timestampResult.message
          );
        } else {
          result.warnings.push(
            timestampResult.message
          );
        }
      }

      /*
       * Freshness validation.
       */
      if (
        timestampResult.valid &&
        record.maxAgeHours !== undefined
      ) {

        const freshnessResult =
          this.validateFreshness(
            record.timestamp,
            record.maxAgeHours
          );

        result.checks.push({
          check: "freshness",
          ...freshnessResult
        });

        if (!freshnessResult.valid) {

          result.score -= 10;

          result.warnings.push(
            freshnessResult.message
          );
        }
      }

      /*
       * Source validation.
       */
      const sourceResult =
        this.validateSource(record);

      result.checks.push({
        check: "source",
        ...sourceResult
      });

      if (!sourceResult.valid) {

        result.score -= 10;

        result.warnings.push(
          sourceResult.message
        );
      }

      /*
       * Status validation.
       */
      const statusResult =
        this.validateStatus(record.status);

      result.checks.push({
        check: "status",
        ...statusResult
      });

      if (!statusResult.valid) {

        result.valid = false;
        result.score -= 20;

        result.errors.push(
          statusResult.message
        );
      }

      /*
       * Never allow score outside 0–100.
       */
      result.score = Math.max(
        0,
        Math.min(100, result.score)
      );

      /*
       * Preserve explicit status.
       *
       * Validation does not silently convert MODELLED
       * into LIVE or VERIFIED into LIVE.
       */
      result.status = record.status || this.STATUS.UNAVAILABLE;

      /*
       * Final classification.
       */
      if (result.errors.length > 0) {

        result.valid = false;

      } else if (result.warnings.length > 0) {

        result.valid = true;

      }

      result.normalized = {
        indicatorId: record.indicatorId || null,
        value: normalizedValue,
        unit: record.unit || null,
        timestamp:
          timestampResult.normalizedTimestamp || null,
        sourceId: record.sourceId || null,
        sourceName: record.sourceName || null,
        status: result.status
      };

      return result;
    },

    /*
     * Validate an array of records.
     */
    validateBatch: function (records) {

      if (!Array.isArray(records)) {

        return {
          valid: false,
          total: 0,
          validRecords: 0,
          invalidRecords: 0,
          warnings: 0,
          averageScore: 0,
          results: []
        };
      }

      const results = records.map(
        (record) => this.validateRecord(record)
      );

      const validRecords =
        results.filter(
          (item) => item.valid
        ).length;

      const invalidRecords =
        results.length - validRecords;

      const warnings =
        results.reduce(
          (total, item) =>
            total + item.warnings.length,
          0
        );

      const averageScore =
        results.length === 0
          ? 0
          : results.reduce(
              (total, item) =>
                total + item.score,
              0
            ) / results.length;

      return {
        valid: invalidRecords === 0,
        total: results.length,
        validRecords: validRecords,
        invalidRecords: invalidRecords,
        warnings: warnings,
        averageScore: Number(
          averageScore.toFixed(2)
        ),
        results: results
      };
    },

    /*
     * Human-readable explanation.
     */
    explain: function (validationResult) {

      if (!validationResult) {
        return "No validation result is available.";
      }

      if (
        validationResult.errors &&
        validationResult.errors.length > 0
      ) {

        return (
          "Data validation failed: " +
          validationResult.errors.join(" ")
        );
      }

      if (
        validationResult.warnings &&
        validationResult.warnings.length > 0
      ) {

        return (
          "Data passed the basic validation checks " +
          "but requires attention: " +
          validationResult.warnings.join(" ")
        );
      }

      return (
        "Data passed the configured validation checks."
      );
    }
  };

  /*
   * Public API
   */
  window.EPAYValidation = EPAYValidation;

})(window);
