/* ============================================================
   EPAY — Yemen Environmental Intelligence Platform
   Live Data Gateway
   Version: 1.0.0

   Purpose:
   - Central gateway for external environmental data
   - Source registry
   - Timestamp management
   - API health monitoring
   - Safe data normalization
   - No fabricated LIVE data
   - Designed for GitHub Pages + external APIs

   IMPORTANT:
   API keys must NOT be hard-coded in this frontend file.
   Public APIs without private credentials may be called
   directly where permitted by CORS and provider policy.

   Private API credentials should be handled through a
   server-side proxy or GitHub Actions workflow.
   ============================================================ */

(function (window) {
    "use strict";

    const VERSION = "1.0.0";

    /* =========================================================
       1. CONFIGURATION
       ========================================================= */

    const CONFIG = Object.freeze({

        requestTimeoutMs: 12000,

        staleAfterMs:
            6 * 60 * 60 * 1000,

        veryStaleAfterMs:
            24 * 60 * 60 * 1000,

        maxRetries: 2

    });

    /* =========================================================
       2. SOURCE REGISTRY
       =========================================================

       These are source definitions, not fabricated readings.

       Actual endpoint URLs will be configured only after
       confirming the provider's current API structure.
       ========================================================= */

    const SOURCES = Object.freeze({

        openMeteo: {
            id: "open-meteo",

            name:
                "Open-Meteo",

            category:
                "weather",

            type:
                "external-api",

            status:
                "AVAILABLE_FOR_INTEGRATION",

            requiresKey:
                false,

            description:
                "Weather and atmospheric data service."
        },

        nasa: {
            id: "nasa",

            name:
                "NASA",

            category:
                "earth-observation",

            type:
                "external-api",

            status:
                "AVAILABLE_FOR_INTEGRATION",

            requiresKey:
                true,

            description:
                "NASA Earth observation and environmental datasets."
        },

        earthEngine: {
            id:
                "google-earth-engine",

            name:
                "Google Earth Engine",

            category:
                "earth-observation",

            type:
                "platform",

            status:
                "AVAILABLE_FOR_INTEGRATION",

            requiresKey:
                true,

            description:
                "Geospatial and Earth observation analysis platform."
        },

        openWeather: {
            id:
                "openweather",

            name:
                "OpenWeather",

            category:
                "weather-air-quality",

            type:
                "external-api",

            status:
                "AVAILABLE_FOR_INTEGRATION",

            requiresKey:
                true,

            description:
                "Weather and air-quality data service."
        },

        internal: {
            id:
                "epay-internal",

            name:
                "EPAY Internal Data",

            category:
                "platform",

            type:
                "internal",

            status:
                "READY",

            requiresKey:
                false,

            description:
                "Data generated and validated by the EPAY platform."
        }

    });

    /* =========================================================
       3. STATE
       ========================================================= */

    const state = {

        lastUpdated:
            null,

        sources:
            {},

        records:
            {},

        errors:
            []

    };

    /* =========================================================
       4. BASIC UTILITIES
       ========================================================= */

    function nowIso() {
        return new Date()
            .toISOString();
    }

    function isObject(value) {
        return (
            value !== null &&
            typeof value === "object" &&
            !Array.isArray(value)
        );
    }

    function isNumber(value) {
        return (
            typeof value === "number" &&
            Number.isFinite(value)
        );
    }

    function safeNumber(
        value,
        fallback = null
    ) {
        if (
            isNumber(value)
        ) {
            return value;
        }

        if (
            typeof value === "string" &&
            value.trim() !== ""
        ) {
            const parsed =
                Number(value);

            if (
                Number.isFinite(
                    parsed
                )
            ) {
                return parsed;
            }
        }

        return fallback;
    }

    function clamp(
        value,
        min = 0,
        max = 100
    ) {
        const number =
            safeNumber(value);

        if (
            number === null
        ) {
            return null;
        }

        return Math.min(
            Math.max(
                number,
                min
            ),
            max
        );
    }

    /* =========================================================
       5. SOURCE STATUS
       ========================================================= */

    function createSourceState(
        source
    ) {
        return {

            sourceId:
                source.id,

            sourceName:
                source.name,

            status:
                "NOT_REQUESTED",

            lastAttempt:
                null,

            lastSuccess:
                null,

            responseTimeMs:
                null,

            recordsReceived:
                0,

            error:
                null
        };
    }

    Object.keys(
        SOURCES
    ).forEach(function (key) {

        const source =
            SOURCES[key];

        state.sources[
            source.id
        ] =
            createSourceState(
                source
            );
    });

    /* =========================================================
       6. FETCH WITH TIMEOUT
       ========================================================= */

    async function fetchWithTimeout(
        url,
        options = {},
        timeout =
            CONFIG.requestTimeoutMs
    ) {

        if (
            typeof fetch !==
            "function"
        ) {
            throw new Error(
                "Fetch API is not available."
            );
        }

        const controller =
            new AbortController();

        const timer =
            setTimeout(
                function () {
                    controller.abort();
                },
                timeout
            );

        try {

            const response =
                await fetch(
                    url,
                    {
                        ...options,
                        signal:
                            controller.signal
                    }
                );

            return response;

        } finally {

            clearTimeout(
                timer
            );
        }
    }

    /* =========================================================
       7. GENERIC JSON REQUEST
       ========================================================= */

    async function requestJSON(
        sourceId,
        url,
        options = {}
    ) {

        const sourceState =
            state.sources[
                sourceId
            ];

        const start =
            performance.now();

        if (
            sourceState
        ) {
            sourceState.status =
                "REQUESTING";

            sourceState.lastAttempt =
                nowIso();

            sourceState.error =
                null;
        }

        try {

            const response =
                await fetchWithTimeout(
                    url,
                    options
                );

            const elapsed =
                Math.round(
                    performance.now() -
                    start
                );

            if (
                sourceState
            ) {
                sourceState.responseTimeMs =
                    elapsed;
            }

            if (
                !response.ok
            ) {
                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const data =
                await response.json();

            if (
                sourceState
            ) {
                sourceState.status =
                    "ONLINE";

                sourceState.lastSuccess =
                    nowIso();

                sourceState.recordsReceived =
                    Array.isArray(data)
                        ? data.length
                        : 1;
            }

            return {
                success: true,

                sourceId:
                    sourceId,

                fetchedAt:
                    nowIso(),

                responseTimeMs:
                    elapsed,

                data:
                    data
            };

        } catch (error) {

            if (
                sourceState
            ) {
                sourceState.status =
                    "ERROR";

                sourceState.error =
                    error.message;
            }

            state.errors.push({

                sourceId:
                    sourceId,

                timestamp:
                    nowIso(),

                error:
                    error.message

            });

            return {
                success: false,

                sourceId:
                    sourceId,

                fetchedAt:
                    nowIso(),

                data:
                    null,

                error:
                    error.message
            };
        }
    }

    /* =========================================================
       8. DATA RECORD CREATOR
       ========================================================= */

    function createRecord(
        sourceId,
        category,
        data,
        metadata = {}
    ) {

        return {

            source:
                sourceId,

            category:
                category,

            retrievedAt:
                nowIso(),

            data:
                data,

            metadata: {

                verified:
                    Boolean(
                        metadata.verified
                    ),

                unit:
                    metadata.unit ||
                    null,

                location:
                    metadata.location ||
                    null,

                period:
                    metadata.period ||
                    null,

                sourceUrl:
                    metadata.sourceUrl ||
                    null

            }

        };
    }

    /* =========================================================
       9. WEATHER NORMALIZATION
       ========================================================= */

    function normalizeWeatherData(
        raw,
        location
    ) {

        if (
            !isObject(raw)
        ) {
            return null;
        }

        /*
         * This function intentionally does not assume
         * a provider-specific response format.
         *
         * Provider-specific adapters will be added after
         * endpoint verification.
         */

        return createRecord(

            "weather",

            "weather",

            raw,

            {
                verified:
                    false,

                location:
                    location ||
                    null
            }

        );
    }

    /* =========================================================
       10. AIR QUALITY NORMALIZATION
       ========================================================= */

    function normalizeAirQualityData(
        raw,
        location
    ) {

        if (
            !isObject(raw)
        ) {
            return null;
        }

        return createRecord(

            "air-quality",

            "air-quality",

            raw,

            {
                verified:
                    false,

                location:
                    location ||
                    null
            }

        );
    }

    /* =========================================================
       11. EARTH OBSERVATION RECORD
       ========================================================= */

    function normalizeEarthObservation(
        sourceId,
        raw,
        location,
        period
    ) {

        if (
            !isObject(raw) &&
            !Array.isArray(raw)
        ) {
            return null;
        }

        return createRecord(

            sourceId,

            "earth-observation",

            raw,

            {

                verified:
                    false,

                location:
                    location ||
                    null,

                period:
                    period ||
                    null

            }

        );
    }

    /* =========================================================
       12. DATA FRESHNESS
       ========================================================= */

    function getFreshness(
        timestamp
    ) {

        if (
            !timestamp
        ) {
            return {

                key:
                    "unknown",

                label:
                    "Unknown",

                labelAr:
                    "غير معروف"

            };
        }

        const time =
            new Date(
                timestamp
            ).getTime();

        if (
            Number.isNaN(
                time
            )
        ) {
            return {

                key:
                    "unknown",

                label:
                    "Unknown",

                labelAr:
                    "غير معروف"

            };
        }

        const age =
            Date.now() -
            time;

        if (
            age <=
            CONFIG.staleAfterMs
        ) {
            return {

                key:
                    "fresh",

                label:
                    "Fresh",

                labelAr:
                    "حديث"

            };
        }

        if (
            age <=
            CONFIG.veryStaleAfterMs
        ) {
            return {

                key:
                    "stale",

                label:
                    "Stale",

                labelAr:
                    "قديم نسبيًا"

            };
        }

        return {

            key:
                "very-stale",

            label:
                "Very Stale",

            labelAr:
                "قديم جدًا"

        };
    }

    /* =========================================================
       13. SOURCE HEALTH
       ========================================================= */

    function getSourceHealth(
        sourceId
    ) {

        const source =
            state.sources[
                sourceId
            ];

        if (
            !source
        ) {
            return {

                status:
                    "UNKNOWN",

                sourceId:
                    sourceId

            };
        }

        return {
            ...source
        };
    }

    /* =========================================================
       14. REGISTER RECORD
       ========================================================= */

    function registerRecord(
        record
    ) {

        if (
            !isObject(record)
        ) {
            return {
                success:
                    false,

                error:
                    "Invalid record."
            };
        }

        if (
            !record.source
        ) {
            return {
                success:
                    false,

                error:
                    "Missing source."
            };
        }

        const key =
            record.category ||
            "general";

        if (
            !state.records[key]
        ) {
            state.records[key] =
                [];
        }

        state.records[key]
            .push(record);

        state.lastUpdated =
            nowIso();

        return {
            success:
                true,

            category:
                key,

            total:
                state.records[key]
                    .length
        };
    }

    /* =========================================================
       15. READ RECORDS
       ========================================================= */

    function getRecords(
        category
    ) {

        if (
            !category
        ) {
            return {
                ...state.records
            };
        }

        return (
            state.records[
                category
            ] || []
        ).map(
            function (record) {
                return {
                    ...record
                };
            }
        );
    }

    /* =========================================================
       16. CLEAR RUNTIME DATA
       ========================================================= */

    function clearRuntimeData() {

        state.records =
            {};

        state.errors =
            [];

        state.lastUpdated =
            null;
    }

    /* =========================================================
       17. DATA SNAPSHOT
       ========================================================= */

    function getSnapshot() {

        return {

            version:
                VERSION,

            generatedAt:
                nowIso(),

            lastUpdated:
                state.lastUpdated,

            sources:
                Object.keys(
                    state.sources
                ).map(
                    function (key) {
                        return {
                            ...state
                                .sources[
                                    key
                                ]
                        };
                    }
                ),

            records:
                getRecords(),

            errors:
                state.errors
                    .slice()

        };
    }

    /* =========================================================
       18. PUBLIC API
       ========================================================= */

    const EPAYLiveData = {

        version:
            VERSION,

        config:
            {
                ...CONFIG
            },

        sources:
            {
                ...SOURCES
            },

        state:
            state,

        fetchWithTimeout:
            fetchWithTimeout,

        requestJSON:
            requestJSON,

        createRecord:
            createRecord,

        normalizeWeatherData:
            normalizeWeatherData,

        normalizeAirQualityData:
            normalizeAirQualityData,

        normalizeEarthObservation:
            normalizeEarthObservation,

        getFreshness:
            getFreshness,

        getSourceHealth:
            getSourceHealth,

        registerRecord:
            registerRecord,

        getRecords:
            getRecords,

        clearRuntimeData:
            clearRuntimeData,

        getSnapshot:
            getSnapshot

    };

    /* =========================================================
       19. GLOBAL EXPORT
       ========================================================= */

    window.EPAYLiveData =
        EPAYLiveData;

})(window);
