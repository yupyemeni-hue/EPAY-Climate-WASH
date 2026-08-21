/* ============================================================
   EPAY — Yemen Environmental Intelligence Platform
   Open-Meteo Weather Provider
   Version: 1.0.0

   Purpose:
   - Retrieve live weather data
   - Use Open-Meteo public API
   - No API key required for this connector
   - Normalize provider response
   - Attach timestamps and source metadata
   - Prepare weather indicators for the climate engine

   IMPORTANT:
   This connector does NOT claim that weather observations
   are climate-risk measurements. Weather observations are
   one input into the wider climate-risk assessment.
   ============================================================ */

(function (window) {
    "use strict";

    const VERSION = "1.0.0";

    /* =========================================================
       1. PROVIDER CONFIGURATION
       ========================================================= */

    const PROVIDER = Object.freeze({

        id:
            "open-meteo",

        name:
            "Open-Meteo",

        baseUrl:
            "https://api.open-meteo.com/v1/forecast",

        sourceUrl:
            "https://open-meteo.com/",

        timezone:
            "auto",

        forecastDays:
            7

    });

    /* =========================================================
       2. YEMEN LOCATION REFERENCE
       =========================================================

       These coordinates are representative city/reference
       points for retrieving weather information.

       They are NOT governorate boundaries.

       Geographic polygon data will be handled separately.
       ========================================================= */

    const LOCATIONS = Object.freeze({

        "amanat-al-asimah": {
            name:
                "Amanat Al Asimah",

            nameAr:
                "أمانة العاصمة",

            latitude:
                15.3694,

            longitude:
                44.1910
        },

        "sanaa": {
            name:
                "Sana'a",

            nameAr:
                "صنعاء",

            latitude:
                15.3547,

            longitude:
                44.2067
        },

        "aden": {
            name:
                "Aden",

            nameAr:
                "عدن",

            latitude:
                12.7855,

            longitude:
                45.0187
        },

        "abyan": {
            name:
                "Abyan",

            nameAr:
                "أبين",

            latitude:
                13.6343,

            longitude:
                46.0563
        },

        "al-dhale": {
            name:
                "Al Dhale'e",

            nameAr:
                "الضالع",

            latitude:
                13.6957,

            longitude:
                44.7314
        },

        "al-bayda": {
            name:
                "Al Bayda",

            nameAr:
                "البيضاء",

            latitude:
                14.0872,

            longitude:
                45.3340
        },

        "al-hudaydah": {
            name:
                "Al Hudaydah",

            nameAr:
                "الحديدة",

            latitude:
                14.7978,

            longitude:
                42.9545
        },

        "al-jawf": {
            name:
                "Al Jawf",

            nameAr:
                "الجوف",

            latitude:
                16.7900,

            longitude:
                45.3000
        },

        "al-mahrah": {
            name:
                "Al Mahrah",

            nameAr:
                "المهرة",

            latitude:
                16.5230,

            longitude:
                52.1740
        },

        "al-mahwit": {
            name:
                "Al Mahwit",

            nameAr:
                "المحويت",

            latitude:
                15.4701,

            longitude:
                43.5448
        },

        "amran": {
            name:
                "Amran",

            nameAr:
                "عمران",

            latitude:
                15.6594,

            longitude:
                43.9439
        },

        "dhamar": {
            name:
                "Dhamar",

            nameAr:
                "ذمار",

            latitude:
                14.5427,

            longitude:
                44.4051
        },

        "hadramout": {
            name:
                "Hadramout",

            nameAr:
                "حضرموت",

            latitude:
                15.9586,

            longitude:
                48.7866
        },

        "hajjah": {
            name:
                "Hajjah",

            nameAr:
                "حجة",

            latitude:
                15.6917,

            longitude:
                43.6021
        },

        "ibb": {
            name:
                "Ibb",

            nameAr:
                "إب",

            latitude:
                13.9667,

            longitude:
                44.1833
        },

        "lahj": {
            name:
                "Lahj",

            nameAr:
                "لحج",

            latitude:
                13.0582,

            longitude:
                44.8819
        },

        "marib": {
            name:
                "Marib",

            nameAr:
                "مأرب",

            latitude:
                15.4625,

            longitude:
                45.3269
        },

        "raymah": {
            name:
                "Raymah",

            nameAr:
                "ريمة",

            latitude:
                15.4720,

            longitude:
                43.5560
        },

        "saada": {
            name:
                "Saada",

            nameAr:
                "صعدة",

            latitude:
                16.9400,

            longitude:
                43.7600
        },

        "shabwah": {
            name:
                "Shabwah",

            nameAr:
                "شبوة",

            latitude:
                14.5000,

            longitude:
                46.8333
        },

        "socotra": {
            name:
                "Socotra",

            nameAr:
                "سقطرى",

            latitude:
                12.4634,

            longitude:
                53.8237
        },

        "taiz": {
            name:
                "Taiz",

            nameAr:
                "تعز",

            latitude:
                13.5795,

            longitude:
                44.0209
        }

    });

    /* =========================================================
       3. REQUEST VARIABLES
       ========================================================= */

    const DAILY_VARIABLES = [

        "temperature_2m_max",

        "temperature_2m_min",

        "precipitation_sum",

        "rain_sum",

        "precipitation_hours",

        "wind_speed_10m_max"

    ];

    const CURRENT_VARIABLES = [

        "temperature_2m",

        "relative_humidity_2m",

        "apparent_temperature",

        "precipitation",

        "rain",

        "showers",

        "weather_code",

        "wind_speed_10m"

    ];

    /* =========================================================
       4. BASIC UTILITIES
       ========================================================= */

    function isValidCoordinate(
        latitude,
        longitude
    ) {

        return (

            typeof latitude ===
                "number" &&

            Number.isFinite(
                latitude
            ) &&

            latitude >= -90 &&

            latitude <= 90 &&

            typeof longitude ===
                "number" &&

            Number.isFinite(
                longitude
            ) &&

            longitude >= -180 &&

            longitude <= 180

        );

    }

    function buildUrl(
        location
    ) {

        const params =
            new URLSearchParams();

        params.set(
            "latitude",
            location.latitude
        );

        params.set(
            "longitude",
            location.longitude
        );

        params.set(
            "current",
            CURRENT_VARIABLES.join(",")
        );

        params.set(
            "daily",
            DAILY_VARIABLES.join(",")
        );

        params.set(
            "forecast_days",
            PROVIDER.forecastDays
        );

        params.set(
            "timezone",
            PROVIDER.timezone
        );

        return (
            PROVIDER.baseUrl +
            "?" +
            params.toString()
        );

    }

    /* =========================================================
       5. WEATHER CODE DESCRIPTION
       ========================================================= */

    function weatherCodeDescription(
        code
    ) {

        const map = {

            0: {
                en:
                    "Clear sky",

                ar:
                    "سماء صافية"
            },

            1: {
                en:
                    "Mainly clear",

                ar:
                    "صافي غالبًا"
            },

            2: {
                en:
                    "Partly cloudy",

                ar:
                    "غائم جزئيًا"
            },

            3: {
                en:
                    "Overcast",

                ar:
                    "غائم"
            },

            45: {
                en:
                    "Fog",

                ar:
                    "ضباب"
            },

            48: {
                en:
                    "Depositing rime fog",

                ar:
                    "ضباب متجمد"
            },

            51: {
                en:
                    "Light drizzle",

                ar:
                    "رذاذ خفيف"
            },

            53: {
                en:
                    "Moderate drizzle",

                ar:
                    "رذاذ متوسط"
            },

            55: {
                en:
                    "Dense drizzle",

                ar:
                    "رذاذ كثيف"
            },

            61: {
                en:
                    "Slight rain",

                ar:
                    "أمطار خفيفة"
            },

            63: {
                en:
                    "Moderate rain",

                ar:
                    "أمطار متوسطة"
            },

            65: {
                en:
                    "Heavy rain",

                ar:
                    "أمطار غزيرة"
            },

            71: {
                en:
                    "Slight snowfall",

                ar:
                    "ثلوج خفيفة"
            },

            73: {
                en:
                    "Moderate snowfall",

                ar:
                    "ثلوج متوسطة"
            },

            75: {
                en:
                    "Heavy snowfall",

                ar:
                    "ثلوج غزيرة"
            },

            80: {
                en:
                    "Slight rain showers",

                ar:
                    "زخات مطر خفيفة"
            },

            81: {
                en:
                    "Moderate rain showers",

                ar:
                    "زخات مطر متوسطة"
            },

            82: {
                en:
                    "Violent rain showers",

                ar:
                    "زخات مطر شديدة"
            },

            95: {
                en:
                    "Thunderstorm",

                ar:
                    "عاصفة رعدية"
            },

            96: {
                en:
                    "Thunderstorm with hail",

                ar:
                    "عاصفة رعدية مع برد"
            },

            99: {
                en:
                    "Thunderstorm with heavy hail",

                ar:
                    "عاصفة رعدية مع برد شديد"
            }

        };

        return (
            map[code] ||
            {
                en:
                    "Unknown",

                ar:
                    "غير معروف"
            }
        );

    }

    /* =========================================================
       6. NORMALIZE RESPONSE
       ========================================================= */

    function normalizeResponse(
        raw,
        governorateId,
        location
    ) {

        if (
            !raw ||
            typeof raw !==
                "object"
        ) {

            throw new Error(
                "Invalid weather response."
            );

        }

        const current =
            raw.current || {};

        const daily =
            raw.daily || {};

        const weatherCode =
            current.weather_code ??
            null;

        const normalized = {

            provider: {

                id:
                    PROVIDER.id,

                name:
                    PROVIDER.name,

                sourceUrl:
                    PROVIDER.sourceUrl

            },

            location: {

                governorateId:
                    governorateId,

                name:
                    location.name,

                nameAr:
                    location.nameAr,

                latitude:
                    location.latitude,

                longitude:
                    location.longitude

            },

            retrievedAt:
                new Date()
                    .toISOString(),

            timezone:
                raw.timezone ||
                null,

            current: {

                temperature:
                    current.temperature_2m ??
                    null,

                humidity:
                    current.relative_humidity_2m ??
                    null,

                apparentTemperature:
                    current.apparent_temperature ??
                    null,

                precipitation:
                    current.precipitation ??
                    null,

                rain:
                    current.rain ??
                    null,

                showers:
                    current.showers ??
                    null,

                windSpeed:
                    current.wind_speed_10m ??
                    null,

                weatherCode:
                    weatherCode,

                weatherDescription:
                    weatherCodeDescription(
                        weatherCode
                    )

            },

            daily: {

                dates:
                    daily.time ||
                    [],

                maxTemperature:
                    daily.temperature_2m_max ||
                    [],

                minTemperature:
                    daily.temperature_2m_min ||
                    [],

                precipitation:
                    daily.precipitation_sum ||
                    [],

                rain:
                    daily.rain_sum ||
                    [],

                precipitationHours:
                    daily.precipitation_hours ||
                    [],

                maxWindSpeed:
                    daily.wind_speed_10m_max ||
                    []

            },

            sourceMetadata: {

                status:
                    "LIVE",

                verified:
                    false,

                dataType:
                    "weather",

                note:
                    "Weather observations are not by themselves a climate-risk assessment."

            }

        };

        return normalized;

    }

    /* =========================================================
       7. FETCH ONE LOCATION
       ========================================================= */

    async function fetchGovernorateWeather(
        governorateId
    ) {

        const location =
            LOCATIONS[
                governorateId
            ];

        if (
            !location
        ) {

            return {

                success:
                    false,

                governorateId:
                    governorateId,

                error:
                    "Governorate location is not configured."

            };

        }

        if (
            !isValidCoordinate(
                location.latitude,
                location.longitude
            )
        ) {

            return {

                success:
                    false,

                governorateId:
                    governorateId,

                error:
                    "Invalid geographic coordinates."

            };

        }

        const url =
            buildUrl(
                location
            );

        const started =
            performance.now();

        try {

            const response =
                await fetch(
                    url,
                    {
                        method:
                            "GET",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            if (
                !response.ok
            ) {

                throw new Error(
                    `Weather provider returned HTTP ${response.status}.`
                );

            }

            const raw =
                await response.json();

            const normalized =
                normalizeResponse(
                    raw,
                    governorateId,
                    location
                );

            return {

                success:
                    true,

                governorateId:
                    governorateId,

                data:
                    normalized,

                responseTimeMs:
                    Math.round(
                        performance.now() -
                        started
                    )

            };

        } catch (error) {

            return {

                success:
                    false,

                governorateId:
                    governorateId,

                error:
                    error.message,

                responseTimeMs:
                    Math.round(
                        performance.now() -
                        started
                    )

            };

        }

    }

    /* =========================================================
       8. FETCH MULTIPLE GOVERNORATES
       ========================================================= */

    async function fetchGovernoratesWeather(
        governorateIds
    ) {

        if (
            !Array.isArray(
                governorateIds
            )
        ) {

            throw new Error(
                "governorateIds must be an array."
            );

        }

        const results = [];

        for (
            const governorateId of
            governorateIds
        ) {

            const result =
                await fetchGovernorateWeather(
                    governorateId
                );

            results.push(
                result
            );

        }

        return results;

    }

    /* =========================================================
       9. FETCH ALL CONFIGURED LOCATIONS
       ========================================================= */

    async function fetchAllWeather() {

        const ids =
            Object.keys(
                LOCATIONS
            );

        return fetchGovernoratesWeather(
            ids
        );

    }

    /* =========================================================
       10. CALCULATE SIMPLE WEATHER INDICATORS
       =========================================================

       These are descriptive indicators only.

       They are NOT the final climate-risk score.
       The climate engine will perform the risk analysis.
       ========================================================= */

    function calculateWeatherIndicators(
        weather
    ) {

        if (
            !weather ||
            !weather.current
        ) {

            return null;

        }

        const temperature =
            weather.current.temperature;

        const precipitation =
            weather.current.precipitation;

        const windSpeed =
            weather.current.windSpeed;

        return {

            temperature:
                temperature,

            precipitation:
                precipitation,

            windSpeed:
                windSpeed,

            heatAlert:
                (
                    typeof temperature ===
                        "number" &&
                    temperature >= 40
                ),

            heavyRainIndicator:
                (
                    typeof precipitation ===
                        "number" &&
                    precipitation >= 20
                ),

            strongWindIndicator:
                (
                    typeof windSpeed ===
                        "number" &&
                    windSpeed >= 40
                )

        };

    }

    /* =========================================================
       11. PROVIDER HEALTH
       ========================================================= */

    async function healthCheck() {

        const testLocation =
            LOCATIONS[
                "amanat-al-asimah"
            ];

        const url =
            buildUrl(
                testLocation
            );

        const started =
            performance.now();

        try {

            const response =
                await fetch(
                    url,
                    {
                        method:
                            "GET",

                        headers: {
                            "Accept":
                                "application/json"
                        }
                    }
                );

            return {

                online:
                    response.ok,

                status:
                    response.status,

                responseTimeMs:
                    Math.round(
                        performance.now() -
                        started
                    ),

                checkedAt:
                    new Date()
                        .toISOString(),

                provider:
                    PROVIDER.name

            };

        } catch (error) {

            return {

                online:
                    false,

                status:
                    null,

                responseTimeMs:
                    Math.round(
                        performance.now() -
                        started
                    ),

                checkedAt:
                    new Date()
                        .toISOString(),

                provider:
                    PROVIDER.name,

                error:
                    error.message

            };

        }

    }

    /* =========================================================
       12. PUBLIC API
       ========================================================= */

    const EPAYWeather = {

        version:
            VERSION,

        provider:
            PROVIDER,

        locations:
            LOCATIONS,

        dailyVariables:
            DAILY_VARIABLES,

        currentVariables:
            CURRENT_VARIABLES,

        buildUrl:
            buildUrl,

        fetchGovernorateWeather:
            fetchGovernorateWeather,

        fetchGovernoratesWeather:
            fetchGovernoratesWeather,

        fetchAllWeather:
            fetchAllWeather,

        normalizeResponse:
            normalizeResponse,

        calculateWeatherIndicators:
            calculateWeatherIndicators,

        weatherCodeDescription:
            weatherCodeDescription,

        healthCheck:
            healthCheck

    };

    /* =========================================================
       13. GLOBAL EXPORT
       ========================================================= */

    window.EPAYWeather =
        EPAYWeather;

})(window);
