/*
 * EPAY Validation Engine
 * Standalone Test Suite
 *
 * This file tests the validation engine only.
 * It does not modify production data.
 */

(function (window) {
  "use strict";

  function print(title, value) {
    console.log(
      "[EPAY VALIDATION TEST] " + title,
      value
    );
  }

  function assert(condition, message) {
    if (!condition) {
      throw new Error(
        "[EPAY TEST FAILED] " + message
      );
    }

    console.log(
      "[EPAY TEST PASSED] " + message
    );
  }

  function runTests() {

    if (!window.EPAYValidation) {
      console.error(
        "[EPAY TEST FAILED] EPAYValidation is not loaded."
      );
      return false;
    }

    const validator = window.EPAYValidation;

    print(
      "Validation Engine Version",
      validator.VERSION
    );

    /*
     * TEST 1
     * Valid temperature record
     */
    const validTemperature = {
      indicatorId: "temperature",
      value: 27,
      unit: "°C",
      timestamp: new Date().toISOString(),
      sourceId: "open-weather",
      sourceName: "OpenWeather",
      status: "VERIFIED",
      maxAgeHours: 24
    };

    const result1 =
      validator.validateRecord(
        validTemperature
      );

    assert(
      result1.valid === true,
      "Valid temperature record should pass."
    );

    assert(
      result1.status === "VERIFIED",
      "Explicit VERIFIED status must remain VERIFIED."
    );

    print(
      "TEST 1 RESULT",
      result1
    );

    /*
     * TEST 2
     * Missing value
     */
    const missingValue = {
      indicatorId: "temperature",
      value: null,
      unit: "°C",
      timestamp: new Date().toISOString(),
      sourceId: "open-weather",
      sourceName: "OpenWeather",
      status: "VERIFIED",
      maxAgeHours: 24
    };

    const result2 =
      validator.validateRecord(
        missingValue
      );

    assert(
      result2.valid === false,
      "Missing value must fail validation."
    );

    print(
      "TEST 2 RESULT",
      result2
    );

    /*
     * TEST 3
     * Impossible temperature sanity value
     */
    const invalidTemperature = {
      indicatorId: "temperature",
      value: 500,
      unit: "°C",
      timestamp: new Date().toISOString(),
      sourceId: "open-weather",
      sourceName: "OpenWeather",
      status: "LIVE",
      maxAgeHours: 24
    };

    const result3 =
      validator.validateRecord(
        invalidTemperature
      );

    assert(
      result3.valid === false,
      "Out-of-range temperature must fail."
    );

    print(
      "TEST 3 RESULT",
      result3
    );

    /*
     * TEST 4
     * Missing source
     */
    const missingSource = {
      indicatorId: "rainfall",
      value: 20,
      unit: "mm",
      timestamp: new Date().toISOString(),
      sourceId: "",
      sourceName: "",
      status: "LIVE",
      maxAgeHours: 24
    };

    const result4 =
      validator.validateRecord(
        missingSource
      );

    assert(
      result4.warnings.length > 0,
      "Missing source metadata should generate a warning."
    );

    print(
      "TEST 4 RESULT",
      result4
    );

    /*
     * TEST 5
     * Unknown status
     */
    const unknownStatus = {
      indicatorId: "rainfall",
      value: 20,
      unit: "mm",
      timestamp: new Date().toISOString(),
      sourceId: "open-weather",
      sourceName: "OpenWeather",
      status: "FAKE_STATUS",
      maxAgeHours: 24
    };

    const result5 =
      validator.validateRecord(
        unknownStatus
      );

    assert(
      result5.valid === false,
      "Unknown data status must fail."
    );

    print(
      "TEST 5 RESULT",
      result5
    );

    /*
     * TEST 6
     * Modelled risk score
     */
    const modelledRisk = {
      indicatorId: "flood-risk",
      value: 72,
      unit: "risk_score_0_100",
      timestamp: new Date().toISOString(),
      sourceId: "open-weather",
      sourceName: "OpenWeather",
      status: "MODELLED",
      maxAgeHours: 24
    };

    const result6 =
      validator.validateRecord(
        modelledRisk
      );

    assert(
      result6.valid === true,
      "Valid modelled risk should pass."
    );

    assert(
      result6.status === "MODELLED",
      "MODELLED status must not be converted to LIVE."
    );

    print(
      "TEST 6 RESULT",
      result6
    );

    /*
     * TEST 7
     * Batch validation
     */
    const batch = [
      validTemperature,
      modelledRisk,
      missingValue
    ];

    const batchResult =
      validator.validateBatch(batch);

    assert(
      batchResult.total === 3,
      "Batch should contain three records."
    );

    assert(
      batchResult.validRecords === 2,
      "Two records should pass the basic validation."
    );

    assert(
      batchResult.invalidRecords === 1,
      "One record should fail validation."
    );

    print(
      "BATCH RESULT",
      batchResult
    );

    /*
     * TEST 8
     * Explanation generation
     */
    const explanation =
      validator.explain(result3);

    assert(
      typeof explanation === "string",
      "Explanation must be a string."
    );

    print(
      "EXPLANATION TEST",
      explanation
    );

    console.log(
      "========================================"
    );

    console.log(
      "EPAY VALIDATION TEST SUITE COMPLETED"
    );

    console.log(
      "========================================"
    );

    return true;
  }

  window.EPAYValidationTest = {
    run: runTests
  };

})(window);
