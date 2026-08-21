/* ============================================================
   EPAY — Yemen Environmental Intelligence Platform
   Data Layer
   Version: 1.0.0

   Purpose:
   - Load centralized EPAY data
   - Validate data structure
   - Normalize indicator values
   - Protect the UI from missing/invalid data
   - Provide a stable interface for future live APIs
   - Preserve data provenance and status
   ============================================================ */

(function (window) {
    "use strict";

    const EPAY_DATA_URL = "./data/epay-data.json";

    const DATA_STATUS = Object.freeze({
        LIVE: "LIVE",
        NEAR_REAL_TIME: "NEAR_REAL_TIME",
        MODELLED: "MODELLED",
        ESTIMATED: "ESTIMATED",
        REFERENCE: "REFERENCE",
        DEMO: "DEMO",
        UNAVAILABLE: "UNAVAILABLE"
    });

    const CONFIDENCE_LEVELS = Object.freeze([
        "High",
        "Medium",
        "Low",
        "Not Available"
    ]);

    const RISK_LEVELS = Object.freeze({
        LOW: {
            key: "low",
            label: "Low",
            labelAr: "منخفض",
            min: 0,
            max: 24
        },

        MODERATE: {
            key: "moderate",
            label: "Moderate",
            labelAr: "متوسط",
            min: 25,
            max: 49
        },

        HIGH: {
            key: "high",
            label: "High",
            labelAr: "مرتفع",
            min: 50,
            max: 74
        },

        CRITICAL: {
            key: "critical",
            label: "Critical",
            labelAr: "حرج",
            min: 75,
            max: 100
        }
    });

    let state = {
        data: null,
        loading: false,
        loaded: false,
        error: null,
        loadedAt: null
    };

    /* ------------------------------------------------------------
       Utility
       ------------------------------------------------------------ */

    function isObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }

    function isFiniteNumber(value) {
        return (
            typeof value === "number" &&
            Number.isFinite(value)
        );
    }

    function clamp(value, min = 0, max = 100) {
        if (!isFiniteNumber(value)) {
            return null;
        }

        return Math.min(
            Math.max(value, min),
            max
        );
    }

    function normalizeText(value, fallback = "") {
        if (
            typeof value === "string" &&
            value.trim() !== ""
        ) {
            return value.trim();
        }

        return fallback;
    }

    /* ------------------------------------------------------------
       Risk classification
       ------------------------------------------------------------ */

    function getRiskLevel(value) {
        const score = clamp(value);

        if (score === null) {
            return {
                key: "unavailable",
                label: "Unavailable",
                labelAr: "غير متوفر",
                min: null,
                max: null
            };
        }

        if (score <= 24) {
            return { ...RISK_LEVELS.LOW };
        }

        if (score <= 49) {
            return { ...RISK_LEVELS.MODERATE };
        }

        if (score <= 74) {
            return { ...RISK_LEVELS.HIGH };
        }

        return { ...RISK_LEVELS.CRITICAL };
    }

    /* ------------------------------------------------------------
       Data status
       ------------------------------------------------------------ */

    function normalizeStatus(status) {
        if (
            typeof status !== "string"
        ) {
            return DATA_STATUS.UNAVAILABLE;
        }

        const normalized = status
            .trim()
            .toUpperCase();

        if (
            Object.values(DATA_STATUS)
                .includes(normalized)
        ) {
            return normalized;
        }

        return DATA_STATUS.UNAVAILABLE;
    }

    function normalizeConfidence(confidence) {
        if (
            typeof confidence !== "string"
        ) {
            return "Not Available";
        }

        if (
            CONFIDENCE_LEVELS.includes(confidence)
        ) {
            return confidence;
        }

        return "Not Available";
    }

    /* ------------------------------------------------------------
       Indicator normalization
       ------------------------------------------------------------ */

    function normalizeIndicator(indicator) {
        if (!isObject(indicator)) {
            return {
                value: null,
                unit: null,
                status: DATA_STATUS.UNAVAILABLE,
                source: null,
                updated_at: null,
                confidence: "Not Available"
            };
        }

        const value =
            isFiniteNumber(indicator.value)
                ? indicator.value
                : null;

        const normalized = {
            value: value,
            unit: normalizeText(
                indicator.unit,
                "index"
            ),
            status: normalizeStatus(
                indicator.status
            ),
            source:
                indicator.source || null,
            updated_at:
                indicator.updated_at || null,
            confidence:
                normalizeConfidence(
                    indicator.confidence
                )
        };

        if (
            normalized.value !== null &&
            normalized.unit === "index"
        ) {
            normalized.value =
                clamp(normalized.value);
        }

        normalized.risk =
            normalized.value !== null &&
            normalized.unit === "index"
                ? getRiskLevel(normalized.value)
                : getRiskLevel(null);

        return normalized;
    }

    /* ------------------------------------------------------------
       Data validation
       ------------------------------------------------------------ */

    function validateDataStructure(data) {
        const errors = [];
        const warnings = [];

        if (!isObject(data)) {
            errors.push(
                "EPAY data is not a valid object."
            );

            return {
                valid: false,
                errors,
                warnings
            };
        }

        if (
            !isObject(data.platform)
        ) {
            errors.push(
                "Missing platform metadata."
            );
        }

        if (
            !isObject(data.system)
        ) {
            errors.push(
                "Missing system metadata."
            );
        }

        if (
            !isObject(data.national)
        ) {
            errors.push(
                "Missing national data object."
            );
        }

        if (
            !isObject(data.sources)
            &&
            !Array.isArray(data.sources)
        ) {
            errors.push(
                "Sources must be an array."
            );
        }

        if (
            !Array.isArray(data.alerts)
        ) {
            warnings.push(
                "Alerts array is missing."
            );
        }

        if (
            !Array.isArray(data.priority_areas)
        ) {
            warnings.push(
                "Priority areas array is missing."
            );
        }

        if (
            !Array.isArray(data.governorates)
        ) {
            warnings.push(
                "Governorates array is missing."
            );
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /* ------------------------------------------------------------
       Safe nested access
       ------------------------------------------------------------ */

    function getPath(object, path) {
        if (
            !isObject(object) &&
            !Array.isArray(object)
        ) {
            return undefined;
        }

        const parts = Array.isArray(path)
            ? path
            : String(path)
                .split(".")
                .filter(Boolean);

        let current = object;

        for (const part of parts) {
            if (
                current === null ||
                current === undefined ||
                !(part in current)
            ) {
                return undefined;
            }

            current = current[part];
        }

        return current;
    }

    /* ------------------------------------------------------------
       Indicator getter
       ------------------------------------------------------------ */

    function getIndicator(path) {
        const raw = getPath(
            state.data,
            path
        );

        return normalizeIndicator(raw);
    }

    /* ------------------------------------------------------------
       National climate indicators
       ------------------------------------------------------------ */

    function getClimateIndicators() {
        return {
            riskIndex:
                getIndicator(
                    "national.climate.risk_index"
                ),

            temperatureStress:
                getIndicator(
                    "national.climate.temperature_stress"
                ),

            droughtRisk:
                getIndicator(
                    "national.climate.drought_risk"
                ),

            floodRisk:
                getIndicator(
                    "national.climate.flood_risk"
                ),

            adaptationReadiness:
                getIndicator(
                    "national.climate.adaptation_readiness"
                )
        };
    }

    /* ------------------------------------------------------------
       National water indicators
       ------------------------------------------------------------ */

    function getWaterIndicators() {
        return {
            waterStress:
                getIndicator(
                    "national.water.water_stress"
                ),

            waterAvailability:
                getIndicator(
                    "national.water.water_availability"
                ),

            waterQuality:
                getIndicator(
                    "national.water.water_quality"
                )
        };
    }

    /* ------------------------------------------------------------
       National WASH indicators
       ------------------------------------------------------------ */

    function getWASHIndicators() {
        return {
            priorityIndex:
                getIndicator(
                    "national.wash.priority_index"
                ),

            waterAccess:
                getIndicator(
                    "national.wash.water_access"
                ),

            sanitationVulnerability:
                getIndicator(
                    "national.wash.sanitation_vulnerability"
                ),

            hygieneVulnerability:
                getIndicator(
                    "national.wash.hygiene_vulnerability"
                )
        };
    }

    /* ------------------------------------------------------------
       Alerts
       ------------------------------------------------------------ */

    function getAlerts() {
        if (
            !state.data ||
            !Array.isArray(state.data.alerts)
        ) {
            return [];
        }

        return state.data.alerts.map(
            function (alert) {
                if (!isObject(alert)) {
                    return null;
                }

                return {
                    id:
                        normalizeText(
                            alert.id,
                            null
                        ),

                    type:
                        normalizeText(
                            alert.type,
                            "GENERAL"
                        ),

                    severity:
                        normalizeText(
                            alert.severity,
                            "UNKNOWN"
                        ),

                    location:
                        normalizeText(
                            alert.location,
                            "Unknown"
                        ),

                    title:
                        normalizeText(
                            alert.title,
                            "Environmental Alert"
                        ),

                    description:
                        normalizeText(
                            alert.description,
                            ""
                        ),

                    status:
                        normalizeStatus(
                            alert.status
                        ),

                    source:
                        alert.source || null,

                    updated_at:
                        alert.updated_at || null,

                    confidence:
                        normalizeConfidence(
                            alert.confidence
                        )
                };
            }
        ).filter(Boolean);
    }

    /* ------------------------------------------------------------
       Priority areas
       ------------------------------------------------------------ */

    function getPriorityAreas() {
        if (
            !state.data ||
            !Array.isArray(
                state.data.priority_areas
            )
        ) {
            return [];
        }

        return state.data.priority_areas.map(
            function (area, index) {
                if (!isObject(area)) {
                    return null;
                }

                const score =
                    isFiniteNumber(area.score)
                        ? clamp(area.score)
                        : null;

                return {
                    id:
                        normalizeText(
                            area.id,
                            `priority-${index + 1}`
                        ),

                    rank:
                        Number.isInteger(area.rank)
                            ? area.rank
                            : index + 1,

                    name:
                        normalizeText(
                            area.name,
                            "Unknown Area"
                        ),

                    governorate:
                        normalizeText(
                            area.governorate,
                            "Unknown"
                        ),

                    score: score,

                    risk:
                        getRiskLevel(score),

                    main_driver:
                        normalizeText(
                            area.main_driver,
                            "Not available"
                        ),

                    recommended_action:
                        normalizeText(
                            area.recommended_action,
                            "Assessment recommended"
                        ),

                    status:
                        normalizeStatus(
                            area.status
                        ),

                    source:
                        area.source || null,

                    updated_at:
                        area.updated_at || null
                };
            }
        ).filter(Boolean);
    }

    /* ------------------------------------------------------------
       Governorates
       ------------------------------------------------------------ */

    function getGovernorates() {
        if (
            !state.data ||
            !Array.isArray(
                state.data.governorates
            )
        ) {
            return [];
        }

        return state.data.governorates.map(
            function (governorate) {
                if (!isObject(governorate)) {
                    return null;
                }

                return {
                    id:
                        normalizeText(
                            governorate.id,
                            null
                        ),

                    name:
                        normalizeText(
                            governorate.name,
                            "Unknown"
                        ),

                    name_ar:
                        normalizeText(
                            governorate.name_ar,
                            ""
                        ),

                    climate:
                        isObject(
                            governorate.climate
                        )
                            ? governorate.climate
                            : {},

                    water:
                        isObject(
                            governorate.water
                        )
                            ? governorate.water
                            : {},

                    wash:
                        isObject(
                            governorate.wash
                        )
                            ? governorate.wash
                            : {},

                    status:
                        normalizeStatus(
                            governorate.status
                        ),

                    source:
                        governorate.source || null,

                    updated_at:
                        governorate.updated_at || null
                };
            }
        ).filter(Boolean);
    }

    /* ------------------------------------------------------------
       Data freshness
       ------------------------------------------------------------ */

    function getFreshness(updatedAt) {
        if (!updatedAt) {
            return {
                available: false,
                ageHours: null,
                label: "No update date",
                labelAr: "لا يوجد تاريخ تحديث"
            };
        }

        const timestamp =
            Date.parse(updatedAt);

        if (
            Number.isNaN(timestamp)
        ) {
            return {
                available: false,
                ageHours: null,
                label: "Invalid date",
                labelAr: "تاريخ غير صالح"
            };
        }

        const ageMilliseconds =
            Date.now() - timestamp;

        const ageHours =
            ageMilliseconds /
            (1000 * 60 * 60);

        let label;
        let labelAr;

        if (ageHours < 1) {
            label = "Less than 1 hour";
            labelAr = "أقل من ساعة";
        } else if (ageHours < 24) {
            label =
                `${Math.floor(ageHours)} hours ago`;
            labelAr =
                `منذ ${Math.floor(ageHours)} ساعة`;
        } else {
            const days =
                Math.floor(
                    ageHours / 24
                );

            label =
                `${days} day${days !== 1 ? "s" : ""} ago`;

            labelAr =
                `منذ ${days} يوم`;
        }

        return {
            available: true,
            ageHours,
            label,
            labelAr
        };
    }

    /* ------------------------------------------------------------
       System status
       ------------------------------------------------------------ */

    function getSystemStatus() {
        if (!state.data) {
            return {
                status: "offline",
                label: "Data unavailable",
                labelAr: "البيانات غير متوفرة"
            };
        }

        const system =
            isObject(state.data.system)
                ? state.data.system
                : {};

        const pipeline =
            normalizeText(
                system.data_pipeline,
                "unknown"
            );

        if (
            pipeline === "prototype"
        ) {
            return {
                status: "prototype",
                label: "Prototype data pipeline",
                labelAr: "خط بيانات تجريبي"
            };
        }

        return {
            status: "operational",
            label: "Data pipeline operational",
            labelAr: "خط البيانات يعمل"
        };
    }

    /* ------------------------------------------------------------
       Public state
       ------------------------------------------------------------ */

    function getState() {
        return {
            data: state.data,
            loading: state.loading,
            loaded: state.loaded,
            error: state.error,
            loadedAt: state.loadedAt
        };
    }

    /* ------------------------------------------------------------
       Load data
       ------------------------------------------------------------ */

    async function loadData(url = EPAY_DATA_URL) {
        if (state.loading) {
            return state.data;
        }

        state.loading = true;
        state.error = null;

        try {
            const response =
                await fetch(
                    url,
                    {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            if (!response.ok) {
                throw new Error(
                    `EPAY data request failed: ${response.status} ${response.statusText}`
                );
            }

            const data =
                await response.json();

            const validation =
                validateDataStructure(data);

            if (!validation.valid) {
                throw new Error(
                    "EPAY data validation failed: " +
                    validation.errors.join("; ")
                );
            }

            state.data = data;
            state.loaded = true;
            state.loadedAt =
                new Date().toISOString();

            state.error = null;

            if (
                validation.warnings.length > 0
            ) {
                console.warn(
                    "EPAY Data Warnings:",
                    validation.warnings
                );
            }

            emitEvent(
                "epay:data-loaded",
                {
                    data: data,
                    validation: validation
                }
            );

            return data;

        } catch (error) {
            state.error = error;
            state.loaded = false;

            console.error(
                "EPAY Data Layer Error:",
                error
            );

            emitEvent(
                "epay:data-error",
                {
                    error: error
                }
            );

            throw error;

        } finally {
            state.loading = false;
        }
    }

    /* ------------------------------------------------------------
       Event system
       ------------------------------------------------------------ */

    function emitEvent(
        eventName,
        detail = {}
    ) {
        try {
            window.dispatchEvent(
                new CustomEvent(
                    eventName,
                    {
                        detail
                    }
                )
            );
        } catch (error) {
            console.warn(
                "EPAY event dispatch failed:",
                error
            );
        }
    }

    /* ------------------------------------------------------------
       Public API
       ------------------------------------------------------------ */

    const EPAYData = {

        version: "1.0.0",

        constants: {
            DATA_STATUS,
            CONFIDENCE_LEVELS,
            RISK_LEVELS
        },

        loadData,

        getState,

        getData: function () {
            return state.data;
        },

        getSystemStatus,

        getClimateIndicators,

        getWaterIndicators,

        getWASHIndicators,

        getAlerts,

        getPriorityAreas,

        getGovernorates,

        getIndicator,

        getRiskLevel,

        getFreshness,

        validateDataStructure,

        isLoaded: function () {
            return state.loaded;
        },

        hasError: function () {
            return state.error !== null;
        }
    };

    window.EPAYData = EPAYData;

})(window);
