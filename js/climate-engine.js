/* ============================================================
   EPAY — Yemen Environmental Intelligence Platform
   Climate Intelligence Engine
   Version: 1.0.0

   Purpose:
   - Climate indicator normalization
   - Climate risk calculation
   - Explainable climate risk analysis
   - Adaptation readiness calculation
   - No fabricated live data
   - Compatible with EPAYData Data Layer

   IMPORTANT:
   This engine does NOT claim that its inputs are live.
   It only calculates results from the data supplied to it.
   ============================================================ */

(function (window) {
    "use strict";

    const VERSION = "1.0.0";

    const LIMITS = Object.freeze({
        MIN: 0,
        MAX: 100
    });

    /*
     * Default analytical weights.
     *
     * These are EPAY prototype weights.
     * They are NOT presented as an officially adopted
     * national climate methodology.
     */
    const RISK_WEIGHTS = Object.freeze({
        temperatureStress: 0.10,
        droughtRisk: 0.20,
        floodRisk: 0.20,
        waterStress: 0.20,
        washVulnerability: 0.15,
        climateExposure: 0.15
    });

    const ADAPTATION_WEIGHTS = Object.freeze({
        preparedness: 0.30,
        waterResilience: 0.20,
        washResilience: 0.20,
        earlyWarningReadiness: 0.15,
        climateExposure: 0.15
    });

    /* ---------------------------------------------------------
       Utility functions
       --------------------------------------------------------- */

    function isFiniteNumber(value) {
        return (
            typeof value === "number" &&
            Number.isFinite(value)
        );
    }

    function clamp(value) {
        if (!isFiniteNumber(value)) {
            return null;
        }

        return Math.min(
            Math.max(value, LIMITS.MIN),
            LIMITS.MAX
        );
    }

    function round(value, decimals = 1) {
        if (!isFiniteNumber(value)) {
            return null;
        }

        const factor =
            Math.pow(10, decimals);

        return Math.round(
            value * factor
        ) / factor;
    }

    function normalizeScore(value) {
        const score = clamp(value);

        return score === null
            ? null
            : round(score, 1);
    }

    /* ---------------------------------------------------------
       Risk classification
       --------------------------------------------------------- */

    function classifyRisk(score) {
        const value = normalizeScore(score);

        if (value === null) {
            return {
                key: "unavailable",
                label: "Unavailable",
                labelAr: "غير متوفر"
            };
        }

        if (value <= 24) {
            return {
                key: "low",
                label: "Low",
                labelAr: "منخفض"
            };
        }

        if (value <= 49) {
            return {
                key: "moderate",
                label: "Moderate",
                labelAr: "متوسط"
            };
        }

        if (value <= 74) {
            return {
                key: "high",
                label: "High",
                labelAr: "مرتفع"
            };
        }

        return {
            key: "critical",
            label: "Critical",
            labelAr: "حرج"
        };
    }

    /* ---------------------------------------------------------
       Indicator extraction
       --------------------------------------------------------- */

    function extractValue(indicator) {
        if (
            !indicator ||
            typeof indicator !== "object"
        ) {
            return null;
        }

        return isFiniteNumber(indicator.value)
            ? clamp(indicator.value)
            : null;
    }

    function getIndicatorStatus(indicator) {
        if (
            !indicator ||
            typeof indicator !== "object"
        ) {
            return "UNAVAILABLE";
        }

        return (
            typeof indicator.status === "string"
                ? indicator.status
                : "UNAVAILABLE"
        );
    }

    function isUsableIndicator(indicator) {
        const value =
            extractValue(indicator);

        if (value === null) {
            return false;
        }

        return (
            getIndicatorStatus(indicator) !==
            "UNAVAILABLE"
        );
    }

    /* ---------------------------------------------------------
       Weighted calculation
       --------------------------------------------------------- */

    function calculateWeightedScore(
        indicators,
        weights
    ) {
        let weightedTotal = 0;
        let availableWeight = 0;

        Object.keys(weights).forEach(
            function (key) {
                const indicator =
                    indicators[key];

                const value =
                    extractValue(indicator);

                if (value === null) {
                    return;
                }

                const weight =
                    weights[key];

                weightedTotal +=
                    value * weight;

                availableWeight +=
                    weight;
            }
        );

        /*
         * If no valid indicators exist,
         * do not return zero.
         *
         * Zero is a valid score and must not
         * be confused with missing data.
         */
        if (availableWeight === 0) {
            return {
                value: null,
                coverage: 0
            };
        }

        /*
         * Normalize by the weight that actually
         * has available data.
         */
        const normalized =
            weightedTotal /
            availableWeight;

        return {
            value: round(
                normalized,
                1
            ),

            coverage: round(
                availableWeight * 100,
                1
            )
        };
    }

    /* ---------------------------------------------------------
       Main climate risk calculation
       --------------------------------------------------------- */

    function calculateClimateRisk(input = {}) {
        const indicators = {
            temperatureStress:
                input.temperatureStress || null,

            droughtRisk:
                input.droughtRisk || null,

            floodRisk:
                input.floodRisk || null,

            waterStress:
                input.waterStress || null,

            washVulnerability:
                input.washVulnerability || null,

            climateExposure:
                input.climateExposure || null
        };

        const calculation =
            calculateWeightedScore(
                indicators,
                RISK_WEIGHTS
            );

        const risk =
            classifyRisk(
                calculation.value
            );

        return {
            score:
                calculation.value,

            level:
                risk,

            dataCoverage:
                calculation.coverage,

            methodology:
                {
                    type:
                        "EPAY Weighted Climate Risk Prototype",

                    weights:
                        {
                            ...RISK_WEIGHTS
                        },

                    note:
                        "Prototype analytical methodology. Not an officially adopted national index."
                },

            inputs:
                {
                    temperatureStress:
                        extractValue(
                            indicators.temperatureStress
                        ),

                    droughtRisk:
                        extractValue(
                            indicators.droughtRisk
                        ),

                    floodRisk:
                        extractValue(
                            indicators.floodRisk
                        ),

                    waterStress:
                        extractValue(
                            indicators.waterStress
                        ),

                    washVulnerability:
                        extractValue(
                            indicators.washVulnerability
                        ),

                    climateExposure:
                        extractValue(
                            indicators.climateExposure
                        )
                }
        };
    }

    /* ---------------------------------------------------------
       Risk drivers
       --------------------------------------------------------- */

    function getRiskDrivers(input = {}) {
        const candidates = [
            {
                key: "temperatureStress",
                label: "Temperature Stress",
                labelAr: "الإجهاد الحراري",
                value:
                    extractValue(
                        input.temperatureStress
                    )
            },

            {
                key: "droughtRisk",
                label: "Drought Risk",
                labelAr: "خطر الجفاف",
                value:
                    extractValue(
                        input.droughtRisk
                    )
            },

            {
                key: "floodRisk",
                label: "Flood Risk",
                labelAr: "خطر الفيضانات",
                value:
                    extractValue(
                        input.floodRisk
                    )
            },

            {
                key: "waterStress",
                label: "Water Stress",
                labelAr: "الإجهاد المائي",
                value:
                    extractValue(
                        input.waterStress
                    )
            },

            {
                key: "washVulnerability",
                label: "WASH Vulnerability",
                labelAr: "هشاشة WASH",
                value:
                    extractValue(
                        input.washVulnerability
                    )
            },

            {
                key: "climateExposure",
                label: "Climate Exposure",
                labelAr: "التعرض للمخاطر المناخية",
                value:
                    extractValue(
                        input.climateExposure
                    )
            }
        ];

        return candidates
            .filter(
                function (item) {
                    return item.value !== null;
                }
            )
            .sort(
                function (a, b) {
                    return b.value - a.value;
                }
            );
    }

    /* ---------------------------------------------------------
       Explainable risk analysis
       --------------------------------------------------------- */

    function explainRisk(input = {}) {
        const result =
            calculateClimateRisk(input);

        const drivers =
            getRiskDrivers(input);

        if (result.score === null) {
            return {
                score: null,
                level: result.level,
                primaryDriver: null,
                drivers: [],
                explanation:
                    "Insufficient verified data to calculate climate risk.",
                explanationAr:
                    "لا تتوفر بيانات موثوقة كافية لحساب مستوى الخطر المناخي."
            };
        }

        const primaryDriver =
            drivers.length > 0
                ? drivers[0]
                : null;

        let explanation =
            `Climate risk is ${result.level.label.toLowerCase()}.`;

        let explanationAr =
            `مستوى الخطر المناخي ${result.level.labelAr}.`;

        if (primaryDriver) {
            explanation +=
                ` The strongest available driver is ${primaryDriver.label}.`;

            explanationAr +=
                ` وأقوى عامل متاح مؤثر هو ${primaryDriver.labelAr}.`;
        }

        return {
            score:
                result.score,

            level:
                result.level,

            primaryDriver:
                primaryDriver,

            drivers:
                drivers,

            explanation:
                explanation,

            explanationAr:
                explanationAr
        };
    }

    /* ---------------------------------------------------------
       Adaptation readiness
       --------------------------------------------------------- */

    function calculateAdaptationReadiness(
        input = {}
    ) {
        const indicators = {
            preparedness:
                input.preparedness || null,

            waterResilience:
                input.waterResilience || null,

            washResilience:
                input.washResilience || null,

            earlyWarningReadiness:
                input.earlyWarningReadiness || null,

            climateExposure:
                input.climateExposure || null
        };

        /*
         * Exposure is treated inversely:
         * high exposure reduces readiness.
         */
        let exposureValue =
            extractValue(
                indicators.climateExposure
            );

        let adjustedExposure = null;

        if (
            exposureValue !== null
        ) {
            adjustedExposure =
                100 - exposureValue;
        }

        const transformed = {
            preparedness:
                indicators.preparedness,

            waterResilience:
                indicators.waterResilience,

            washResilience:
                indicators.washResilience,

            earlyWarningReadiness:
                indicators.earlyWarningReadiness,

            climateExposure:
                adjustedExposure === null
                    ? null
                    : {
                        value:
                            adjustedExposure
                    }
        };

        const calculation =
            calculateWeightedScore(
                transformed,
                ADAPTATION_WEIGHTS
            );

        const readiness =
            classifyReadiness(
                calculation.value
            );

        return {
            score:
                calculation.value,

            level:
                readiness,

            dataCoverage:
                calculation.coverage,

            methodology:
                {
                    type:
                        "EPAY Climate Adaptation Readiness Prototype",

                    weights:
                        {
                            ...ADAPTATION_WEIGHTS
                        }
                }
        };
    }

    /* ---------------------------------------------------------
       Adaptation classification
       --------------------------------------------------------- */

    function classifyReadiness(score) {
        const value =
            normalizeScore(score);

        if (value === null) {
            return {
                key: "unavailable",
                label: "Unavailable",
                labelAr: "غير متوفر"
            };
        }

        if (value <= 24) {
            return {
                key: "low",
                label: "Low Readiness",
                labelAr: "جاهزية منخفضة"
            };
        }

        if (value <= 49) {
            return {
                key: "moderate",
                label: "Moderate Readiness",
                labelAr: "جاهزية متوسطة"
            };
        }

        if (value <= 74) {
            return {
                key: "good",
                label: "Good Readiness",
                labelAr: "جاهزية جيدة"
            };
        }

        return {
            key: "high",
            label: "High Readiness",
            labelAr: "جاهزية مرتفعة"
        };
    }

    /* ---------------------------------------------------------
       Data Layer integration
       --------------------------------------------------------- */

    function getFromEPAYData() {
        if (
            !window.EPAYData ||
            typeof window.EPAYData.getClimateIndicators !==
                "function"
        ) {
            return null;
        }

        const climate =
            window.EPAYData
                .getClimateIndicators();

        const water =
            typeof window.EPAYData.getWaterIndicators ===
            "function"
                ? window.EPAYData.getWaterIndicators()
                : {};

        const wash =
            typeof window.EPAYData.getWASHIndicators ===
            "function"
                ? window.EPAYData.getWASHIndicators()
                : {};

        return {
            temperatureStress:
                climate.temperatureStress,

            droughtRisk:
                climate.droughtRisk,

            floodRisk:
                climate.floodRisk,

            waterStress:
                water.waterStress,

            washVulnerability:
                wash.priorityIndex,

            climateExposure:
                null
        };
    }

    function analyzeCurrentData() {
        const input =
            getFromEPAYData();

        if (!input) {
            return {
                available: false,

                reason:
                    "EPAYData Data Layer is not available.",

                risk:
                    calculateClimateRisk({}),

                explanation:
                    explainRisk({}),

                adaptation:
                    calculateAdaptationReadiness({})
            };
        }

        return {
            available: true,

            risk:
                calculateClimateRisk(
                    input
                ),

            explanation:
                explainRisk(
                    input
                ),

            adaptation:
                calculateAdaptationReadiness(
                    input
                )
        };
    }

    /* ---------------------------------------------------------
       Public API
       --------------------------------------------------------- */

    const EPAYClimateEngine = {

        version: VERSION,

        weights: {
            risk:
                { ...RISK_WEIGHTS },

            adaptation:
                { ...ADAPTATION_WEIGHTS }
        },

        calculateClimateRisk,

        explainRisk,

        getRiskDrivers,

        calculateAdaptationReadiness,

        classifyRisk,

        classifyReadiness,

        analyzeCurrentData,

        getFromEPAYData
    };

    window.EPAYClimateEngine =
        EPAYClimateEngine;

})(window);
