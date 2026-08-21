/* ============================================================
   EPAY — Yemen Environmental Intelligence Platform
   WASH Intelligence Engine
   Version: 1.0.0

   Scope:
   - Water security
   - Water stress
   - Water availability
   - Water quality
   - Sanitation vulnerability
   - Hygiene vulnerability
   - WASH priority
   - Explainable WASH analysis
   - Priority intervention identification

   Important:
   This engine does NOT create or claim live observations.
   It calculates analytical results only from supplied data.
   ============================================================ */

(function (window) {
    "use strict";

    const VERSION = "1.0.0";

    const LIMITS = Object.freeze({
        MIN: 0,
        MAX: 100
    });

    /*
     * Prototype analytical weights.
     *
     * These weights are configurable and must not be
     * presented as an officially adopted national methodology.
     */
    const WASH_PRIORITY_WEIGHTS = Object.freeze({
        waterStress: 0.25,
        waterAvailabilityRisk: 0.20,
        waterQualityRisk: 0.15,
        sanitationVulnerability: 0.20,
        hygieneVulnerability: 0.10,
        climatePressure: 0.10
    });

    const WATER_SECURITY_WEIGHTS = Object.freeze({
        waterAvailability: 0.35,
        waterStress: 0.30,
        waterQuality: 0.20,
        climatePressure: 0.15
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

    function extractStatus(indicator) {
        if (
            !indicator ||
            typeof indicator !== "object"
        ) {
            return "UNAVAILABLE";
        }

        return typeof indicator.status === "string"
            ? indicator.status
            : "UNAVAILABLE";
    }

    /* ---------------------------------------------------------
       Risk classification
       --------------------------------------------------------- */

    function classifyRisk(score) {
        const value = clamp(score);

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
                const value =
                    extractValue(
                        indicators[key]
                    );

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

        if (availableWeight === 0) {
            return {
                value: null,
                coverage: 0
            };
        }

        return {
            value: round(
                weightedTotal /
                availableWeight,
                1
            ),

            coverage: round(
                availableWeight * 100,
                1
            )
        };
    }

    /* ---------------------------------------------------------
       Water availability risk
       ---------------------------------------------------------

       Input:
       waterAvailability is interpreted as
       a 0–100 vulnerability/risk scale.

       If the input represents availability,
       higher availability is safer, therefore
       it is inverted before risk calculations.
       --------------------------------------------------------- */

    function availabilityToRisk(indicator) {
        const value =
            extractValue(indicator);

        if (value === null) {
            return null;
        }

        return {
            value:
                round(
                    100 - value,
                    1
                ),

            status:
                extractStatus(
                    indicator
                )
        };
    }

    /* ---------------------------------------------------------
       Water security index
       --------------------------------------------------------- */

    function calculateWaterSecurity(
        input = {}
    ) {
        const waterAvailability =
            extractValue(
                input.waterAvailability
            );

        const waterStress =
            extractValue(
                input.waterStress
            );

        const waterQuality =
            extractValue(
                input.waterQuality
            );

        const climatePressure =
            extractValue(
                input.climatePressure
            );

        /*
         * Water security is a positive capability index.
         * Therefore risk-type indicators are inverted.
         */

        const indicators = {
            waterAvailability:
                waterAvailability === null
                    ? null
                    : {
                        value:
                            waterAvailability
                    },

            waterStress:
                waterStress === null
                    ? null
                    : {
                        value:
                            100 -
                            waterStress
                    },

            waterQuality:
                waterQuality === null
                    ? null
                    : {
                        value:
                            100 -
                            waterQuality
                    },

            climatePressure:
                climatePressure === null
                    ? null
                    : {
                        value:
                            100 -
                            climatePressure
                    }
        };

        const calculation =
            calculateWeightedScore(
                indicators,
                WATER_SECURITY_WEIGHTS
            );

        return {
            score:
                calculation.value,

            level:
                classifySecurity(
                    calculation.value
                ),

            dataCoverage:
                calculation.coverage,

            methodology:
                {
                    type:
                        "EPAY Water Security Prototype",

                    weights:
                        {
                            ...WATER_SECURITY_WEIGHTS
                        },

                    note:
                        "Prototype analytical methodology."
                }
        };
    }

    /* ---------------------------------------------------------
       Water security classification
       --------------------------------------------------------- */

    function classifySecurity(score) {
        const value =
            clamp(score);

        if (value === null) {
            return {
                key: "unavailable",
                label: "Unavailable",
                labelAr: "غير متوفر"
            };
        }

        if (value <= 24) {
            return {
                key: "critical",
                label: "Critical Water Security",
                labelAr: "أمن مائي حرج"
            };
        }

        if (value <= 49) {
            return {
                key: "weak",
                label: "Weak Water Security",
                labelAr: "أمن مائي ضعيف"
            };
        }

        if (value <= 74) {
            return {
                key: "moderate",
                label: "Moderate Water Security",
                labelAr: "أمن مائي متوسط"
            };
        }

        return {
            key: "strong",
            label: "Strong Water Security",
            labelAr: "أمن مائي مرتفع"
        };
    }

    /* ---------------------------------------------------------
       WASH priority calculation
       --------------------------------------------------------- */

    function calculateWASHPriority(
        input = {}
    ) {
        const indicators = {
            waterStress:
                input.waterStress || null,

            waterAvailabilityRisk:
                availabilityToRisk(
                    input.waterAvailability
                ),

            waterQualityRisk:
                input.waterQuality || null,

            sanitationVulnerability:
                input.sanitationVulnerability ||
                null,

            hygieneVulnerability:
                input.hygieneVulnerability ||
                null,

            climatePressure:
                input.climatePressure || null
        };

        const calculation =
            calculateWeightedScore(
                indicators,
                WASH_PRIORITY_WEIGHTS
            );

        const level =
            classifyRisk(
                calculation.value
            );

        return {
            score:
                calculation.value,

            level:
                level,

            dataCoverage:
                calculation.coverage,

            inputs:
                {
                    waterStress:
                        extractValue(
                            indicators.waterStress
                        ),

                    waterAvailabilityRisk:
                        extractValue(
                            indicators.waterAvailabilityRisk
                        ),

                    waterQualityRisk:
                        extractValue(
                            indicators.waterQualityRisk
                        ),

                    sanitationVulnerability:
                        extractValue(
                            indicators.sanitationVulnerability
                        ),

                    hygieneVulnerability:
                        extractValue(
                            indicators.hygieneVulnerability
                        ),

                    climatePressure:
                        extractValue(
                            indicators.climatePressure
                        )
                },

            methodology:
                {
                    type:
                        "EPAY WASH Priority Prototype",

                    weights:
                        {
                            ...WASH_PRIORITY_WEIGHTS
                        },

                    note:
                        "Prototype analytical methodology. Not an officially adopted national WASH index."
                }
        };
    }

    /* ---------------------------------------------------------
       Vulnerability calculation
       --------------------------------------------------------- */

    function calculateWASHVulnerability(
        input = {}
    ) {
        const indicators = {
            sanitation:
                input.sanitationVulnerability ||
                null,

            hygiene:
                input.hygieneVulnerability ||
                null,

            waterAccess:
                input.waterAccess ||
                null,

            waterQuality:
                input.waterQuality ||
                null
        };

        /*
         * Water access is treated as a positive
         * service-access indicator and therefore
         * inverted for vulnerability.
         */

        const normalized = {
            sanitation:
                indicators.sanitation,

            hygiene:
                indicators.hygiene,

            waterAccess:
                extractValue(
                    indicators.waterAccess
                ) === null
                    ? null
                    : {
                        value:
                            100 -
                            extractValue(
                                indicators.waterAccess
                            )
                    },

            waterQuality:
                indicators.waterQuality
        };

        const weights = {
            sanitation: 0.30,
            hygiene: 0.25,
            waterAccess: 0.25,
            waterQuality: 0.20
        };

        const calculation =
            calculateWeightedScore(
                normalized,
                weights
            );

        return {
            score:
                calculation.value,

            level:
                classifyRisk(
                    calculation.value
                ),

            dataCoverage:
                calculation.coverage,

            methodology:
                {
                    type:
                        "EPAY WASH Vulnerability Prototype",

                    weights:
                        {
                            ...weights
                        }
                }
        };
    }

    /* ---------------------------------------------------------
       Risk drivers
       --------------------------------------------------------- */

    function getWASHDrivers(
        input = {}
    ) {
        const items = [
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
                key: "waterAvailability",
                label: "Water Availability Risk",
                labelAr: "خطر انخفاض توفر المياه",
                value:
                    extractValue(
                        availabilityToRisk(
                            input.waterAvailability
                        )
                    )
            },

            {
                key: "waterQuality",
                label: "Water Quality Risk",
                labelAr: "مخاطر جودة المياه",
                value:
                    extractValue(
                        input.waterQuality
                    )
            },

            {
                key: "sanitationVulnerability",
                label: "Sanitation Vulnerability",
                labelAr: "هشاشة خدمات الإصحاح",
                value:
                    extractValue(
                        input.sanitationVulnerability
                    )
            },

            {
                key: "hygieneVulnerability",
                label: "Hygiene Vulnerability",
                labelAr: "هشاشة خدمات النظافة",
                value:
                    extractValue(
                        input.hygieneVulnerability
                    )
            },

            {
                key: "climatePressure",
                label: "Climate Pressure",
                labelAr: "الضغط المناخي",
                value:
                    extractValue(
                        input.climatePressure
                    )
            }
        ];

        return items
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
       Explainable WASH analysis
       --------------------------------------------------------- */

    function explainWASHPriority(
        input = {}
    ) {
        const priority =
            calculateWASHPriority(
                input
            );

        const vulnerability =
            calculateWASHVulnerability(
                input
            );

        const waterSecurity =
            calculateWaterSecurity(
                input
            );

        const drivers =
            getWASHDrivers(
                input
            );

        const primaryDriver =
            drivers.length > 0
                ? drivers[0]
                : null;

        if (
            priority.score === null
        ) {
            return {
                priority,
                vulnerability,
                waterSecurity,
                primaryDriver: null,
                drivers: [],
                explanation:
                    "Insufficient verified data to calculate WASH priority.",
                explanationAr:
                    "لا تتوفر بيانات موثوقة كافية لحساب أولوية WASH."
            };
        }

        let explanation =
            `WASH priority is ${priority.level.label.toLowerCase()}.`;

        let explanationAr =
            `أولوية WASH ${priority.level.labelAr}.`;

        if (primaryDriver) {
            explanation +=
                ` The strongest available driver is ${primaryDriver.label}.`;

            explanationAr +=
                ` وأقوى عامل مؤثر متاح هو ${primaryDriver.labelAr}.`;
        }

        return {
            priority,
            vulnerability,
            waterSecurity,

            primaryDriver,

            drivers,

            explanation,

            explanationAr
        };
    }

    /* ---------------------------------------------------------
       Recommended action
       --------------------------------------------------------- */

    function recommendAction(
        analysis
    ) {
        if (
            !analysis ||
            !analysis.priority
        ) {
            return {
                priority: "unknown",
                action:
                    "Additional assessment required.",
                actionAr:
                    "يلزم إجراء تقييم إضافي."
            };
        }

        const score =
            analysis.priority.score;

        if (score === null) {
            return {
                priority: "unknown",
                action:
                    "Collect and verify WASH data.",
                actionAr:
                    "جمع بيانات WASH والتحقق منها."
            };
        }

        const driver =
            analysis.primaryDriver;

        if (
            !driver
        ) {
            return {
                priority: analysis.priority.level.key,
                action:
                    "Conduct targeted WASH assessment.",
                actionAr:
                    "إجراء تقييم ميداني مستهدف لخدمات WASH."
            };
        }

        switch (
            driver.key
        ) {
            case "waterStress":
                return {
                    priority:
                        analysis.priority.level.key,

                    action:
                        "Prioritize water-demand management and resilient water supply measures.",

                    actionAr:
                        "إعطاء الأولوية لإدارة الطلب على المياه وتعزيز مصادر الإمداد المائي القادرة على الصمود."
                };

            case "waterAvailability":
                return {
                    priority:
                        analysis.priority.level.key,

                    action:
                        "Prioritize resilient water access and supply continuity.",

                    actionAr:
                        "إعطاء الأولوية لاستمرارية الوصول إلى المياه وتعزيز مرونة الإمداد."
                };

            case "waterQuality":
                return {
                    priority:
                        analysis.priority.level.key,

                    action:
                        "Prioritize water quality monitoring and risk mitigation.",

                    actionAr:
                        "إعطاء الأولوية لمراقبة جودة المياه والحد من المخاطر."
                };

            case "sanitationVulnerability":
                return {
                    priority:
                        analysis.priority.level.key,

                    action:
                        "Prioritize sanitation infrastructure and service continuity.",

                    actionAr:
                        "إعطاء الأولوية للبنية التحتية للإصحاح واستمرارية الخدمات."
                };

            case "hygieneVulnerability":
                return {
                    priority:
                        analysis.priority.level.key,

                    action:
                        "Prioritize hygiene services, communication and community preparedness.",

                    actionAr:
                        "إعطاء الأولوية لخدمات النظافة والتوعية والاستعداد المجتمعي."
                };

            case "climatePressure":
                return {
                    priority:
                        analysis.priority.level.key,

                    action:
                        "Integrate climate adaptation into WASH planning.",

                    actionAr:
                        "دمج التكيف المناخي في تخطيط خدمات WASH."
                };

            default:
                return {
                    priority:
                        analysis.priority.level.key,

                    action:
                        "Conduct targeted WASH assessment.",

                    actionAr:
                        "إجراء تقييم ميداني مستهدف لخدمات WASH."
                };
        }
    }

    /* ---------------------------------------------------------
       Data Layer integration
       --------------------------------------------------------- */

    function getFromEPAYData() {
        if (
            !window.EPAYData
        ) {
            return null;
        }

        if (
            typeof window.EPAYData
                .getWASHIndicators !==
            "function"
        ) {
            return null;
        }

        const wash =
            window.EPAYData
                .getWASHIndicators();

        const water =
            typeof window.EPAYData
                .getWaterIndicators ===
            "function"
                ? window.EPAYData
                    .getWaterIndicators()
                : {};

        const climate =
            typeof window.EPAYData
                .getClimateIndicators ===
            "function"
                ? window.EPAYData
                    .getClimateIndicators()
                : {};

        return {
            waterStress:
                water.waterStress,

            waterAvailability:
                water.waterAvailability,

            waterQuality:
                water.waterQuality,

            sanitationVulnerability:
                wash.sanitationVulnerability,

            hygieneVulnerability:
                wash.hygieneVulnerability,

            waterAccess:
                wash.waterAccess,

            climatePressure:
                climate.riskIndex
        };
    }

    /* ---------------------------------------------------------
       Current platform analysis
       --------------------------------------------------------- */

    function analyzeCurrentData() {
        const input =
            getFromEPAYData();

        if (!input) {
            return {
                available: false,

                reason:
                    "EPAYData Data Layer is not available.",

                analysis:
                    explainWASHPriority({})
            };
        }

        const analysis =
            explainWASHPriority(
                input
            );

        return {
            available: true,

            analysis,

            recommendedAction:
                recommendAction(
                    analysis
                )
        };
    }

    /* ---------------------------------------------------------
       Public API
       --------------------------------------------------------- */

    const EPAYWASHEngine = {

        version: VERSION,

        weights: {
            priority:
                {
                    ...WASH_PRIORITY_WEIGHTS
                },

            waterSecurity:
                {
                    ...WATER_SECURITY_WEIGHTS
                }
        },

        calculateWASHPriority,

        calculateWASHVulnerability,

        calculateWaterSecurity,

        explainWASHPriority,

        getWASHDrivers,

        recommendAction,

        classifyRisk,

        analyzeCurrentData,

        getFromEPAYData
    };

    window.EPAYWASHEngine =
        EPAYWASHEngine;

})(window);
