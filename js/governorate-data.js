/* ============================================================
   EPAY — Yemen Environmental Intelligence Platform
   Governorate Data Registry
   Version: 1.1.0

   Purpose:
   - Official governorate registry structure
   - Stable identifiers for maps and data
   - Climate / Water / WASH data schema
   - Data validation
   - Data completeness tracking
   - Source and verification metadata
   - No fabricated environmental measurements

   IMPORTANT:
   This file contains the structural registry only.
   Environmental measurements must come from verified
   data sources and must never be fabricated.
   ============================================================ */

(function (window) {
    "use strict";

    const VERSION = "1.1.0";

    /* =========================================================
       1. YEMEN ADMINISTRATIVE REGISTRY
       =========================================================

       Important distinction:
       - Amanat Al Asimah = municipality / capital
       - Sana'a = governorate surrounding the capital

       They must have different IDs.
       ========================================================= */

    const GOVERNORATES = Object.freeze([
        {
            id: "amanat-al-asimah",
            name: "Amanat Al Asimah",
            nameAr: "أمانة العاصمة",
            type: "municipality"
        },

        {
            id: "sanaa",
            name: "Sana'a",
            nameAr: "صنعاء",
            type: "governorate"
        },

        {
            id: "aden",
            name: "Aden",
            nameAr: "عدن",
            type: "governorate"
        },

        {
            id: "abyan",
            name: "Abyan",
            nameAr: "أبين",
            type: "governorate"
        },

        {
            id: "al-dhale",
            name: "Al Dhale'e",
            nameAr: "الضالع",
            type: "governorate"
        },

        {
            id: "al-bayda",
            name: "Al Bayda",
            nameAr: "البيضاء",
            type: "governorate"
        },

        {
            id: "al-hudaydah",
            name: "Al Hudaydah",
            nameAr: "الحديدة",
            type: "governorate"
        },

        {
            id: "al-jawf",
            name: "Al Jawf",
            nameAr: "الجوف",
            type: "governorate"
        },

        {
            id: "al-mahrah",
            name: "Al Mahrah",
            nameAr: "المهرة",
            type: "governorate"
        },

        {
            id: "al-mahwit",
            name: "Al Mahwit",
            nameAr: "المحويت",
            type: "governorate"
        },

        {
            id: "amran",
            name: "Amran",
            nameAr: "عمران",
            type: "governorate"
        },

        {
            id: "dhamar",
            name: "Dhamar",
            nameAr: "ذمار",
            type: "governorate"
        },

        {
            id: "hadramout",
            name: "Hadramout",
            nameAr: "حضرموت",
            type: "governorate"
        },

        {
            id: "hajjah",
            name: "Hajjah",
            nameAr: "حجة",
            type: "governorate"
        },

        {
            id: "ibb",
            name: "Ibb",
            nameAr: "إب",
            type: "governorate"
        },

        {
            id: "lahj",
            name: "Lahj",
            nameAr: "لحج",
            type: "governorate"
        },

        {
            id: "marib",
            name: "Marib",
            nameAr: "مأرب",
            type: "governorate"
        },

        {
            id: "raymah",
            name: "Raymah",
            nameAr: "ريمة",
            type: "governorate"
        },

        {
            id: "saada",
            name: "Saada",
            nameAr: "صعدة",
            type: "governorate"
        },

        {
            id: "shabwah",
            name: "Shabwah",
            nameAr: "شبوة",
            type: "governorate"
        },

        {
            id: "socotra",
            name: "Socotra",
            nameAr: "سقطرى",
            type: "governorate"
        },

        {
            id: "taiz",
            name: "Taiz",
            nameAr: "تعز",
            type: "governorate"
        }
    ]);

    /* =========================================================
       2. FREEZE REGISTRY
       ========================================================= */

    const REGISTRY = Object.freeze(
        GOVERNORATES.map(function (item) {
            return Object.freeze({
                id: item.id,
                name: item.name,
                nameAr: item.nameAr,
                type: item.type
            });
        })
    );

    /* =========================================================
       3. BASIC HELPERS
       ========================================================= */

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

    function isValidScore(value) {
        return (
            value === null ||
            typeof value === "undefined" ||
            (
                isNumber(value) &&
                value >= 0 &&
                value <= 100
            )
        );
    }

    /* =========================================================
       4. FIND GOVERNORATE
       ========================================================= */

    function findById(id) {
        if (
            typeof id !== "string" ||
            id.trim() === ""
        ) {
            return null;
        }

        return (
            REGISTRY.find(function (item) {
                return item.id === id.trim();
            }) ||
            null
        );
    }

    function findByArabicName(name) {
        if (
            typeof name !== "string" ||
            name.trim() === ""
        ) {
            return null;
        }

        const normalized = name.trim();

        return (
            REGISTRY.find(function (item) {
                return item.nameAr === normalized;
            }) ||
            null
        );
    }

    function findByEnglishName(name) {
        if (
            typeof name !== "string" ||
            name.trim() === ""
        ) {
            return null;
        }

        const normalized =
            name.trim().toLowerCase();

        return (
            REGISTRY.find(function (item) {
                return (
                    item.name.toLowerCase() ===
                    normalized
                );
            }) ||
            null
        );
    }

    /* =========================================================
       5. GOVERNORATE VALIDATION
       ========================================================= */

    function validateGovernorate(governorate) {
        const errors = [];

        if (!isObject(governorate)) {
            return {
                valid: false,
                errors: [
                    "Governorate record must be an object."
                ]
            };
        }

        if (
            typeof governorate.id !== "string" ||
            governorate.id.trim() === ""
        ) {
            errors.push(
                "Missing governorate ID."
            );
        }

        if (
            typeof governorate.name !== "string" ||
            governorate.name.trim() === ""
        ) {
            errors.push(
                "Missing English name."
            );
        }

        if (
            typeof governorate.nameAr !== "string" ||
            governorate.nameAr.trim() === ""
        ) {
            errors.push(
                "Missing Arabic name."
            );
        }

        if (
            typeof governorate.type !== "string" ||
            governorate.type.trim() === ""
        ) {
            errors.push(
                "Missing administrative type."
            );
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /* =========================================================
       6. EMPTY ENVIRONMENTAL RECORD
       ========================================================= */

    function createEmptyEnvironmentalRecord(
        governorate
    ) {
        const validation =
            validateGovernorate(
                governorate
            );

        if (!validation.valid) {
            return null;
        }

        return {
            governorate: {
                id: governorate.id,
                name: governorate.name,
                nameAr: governorate.nameAr,
                type: governorate.type
            },

            climate: {
                risk_index: null,
                drought_risk: null,
                flood_risk: null,
                heat_risk: null,

                data_status: "UNAVAILABLE"
            },

            water: {
                water_stress: null,
                water_availability: null,
                water_quality: null,

                data_status: "UNAVAILABLE"
            },

            wash: {
                priority_index: null,
                vulnerability: null,
                water_access: null,
                sanitation: null,
                hygiene: null,

                data_status: "UNAVAILABLE"
            },

            metadata: {
                last_updated: null,
                source: null,
                source_type: null,

                verification_status:
                    "UNVERIFIED"
            }
        };
    }

    /* =========================================================
       7. BUILD NATIONAL EMPTY REGISTRY
       ========================================================= */

    function buildNationalRegistry() {
        return REGISTRY.map(function (
            governorate
        ) {
            return createEmptyEnvironmentalRecord(
                governorate
            );
        });
    }

    /* =========================================================
       8. VALIDATE ENVIRONMENTAL RECORD
       ========================================================= */

    function validateEnvironmentalRecord(
        record
    ) {
        const errors = [];

        if (!isObject(record)) {
            return {
                valid: false,
                errors: [
                    "Environmental record must be an object."
                ]
            };
        }

        if (
            !isObject(
                record.governorate
            )
        ) {
            errors.push(
                "Missing governorate object."
            );
        } else {
            if (
                !findById(
                    record.governorate.id
                )
            ) {
                errors.push(
                    "Governorate ID is not registered."
                );
            }
        }

        const scoreFields = [
            [
                "climate.risk_index",
                record.climate &&
                    record.climate.risk_index
            ],

            [
                "climate.drought_risk",
                record.climate &&
                    record.climate.drought_risk
            ],

            [
                "climate.flood_risk",
                record.climate &&
                    record.climate.flood_risk
            ],

            [
                "climate.heat_risk",
                record.climate &&
                    record.climate.heat_risk
            ],

            [
                "water.water_stress",
                record.water &&
                    record.water.water_stress
            ],

            [
                "water.water_availability",
                record.water &&
                    record.water.water_availability
            ],

            [
                "water.water_quality",
                record.water &&
                    record.water.water_quality
            ],

            [
                "wash.priority_index",
                record.wash &&
                    record.wash.priority_index
            ],

            [
                "wash.vulnerability",
                record.wash &&
                    record.wash.vulnerability
            ],

            [
                "wash.water_access",
                record.wash &&
                    record.wash.water_access
            ],

            [
                "wash.sanitation",
                record.wash &&
                    record.wash.sanitation
            ],

            [
                "wash.hygiene",
                record.wash &&
                    record.wash.hygiene
            ]
        ];

        scoreFields.forEach(function (item) {
            if (!isValidScore(item[1])) {
                errors.push(
                    item[0] +
                    " must be between 0 and 100."
                );
            }
        });

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /* =========================================================
       9. MERGE VERIFIED DATA
       ========================================================= */

    function mergeEnvironmentalData(
        baseRecord,
        incomingData
    ) {
        if (
            !isObject(baseRecord) ||
            !isObject(incomingData)
        ) {
            return {
                success: false,
                errors: [
                    "Invalid base or incoming data."
                ]
            };
        }

        const cloned =
            JSON.parse(
                JSON.stringify(
                    baseRecord
                )
            );

        const sections = [
            "climate",
            "water",
            "wash",
            "metadata"
        ];

        sections.forEach(function (
            section
        ) {
            if (
                isObject(
                    incomingData[section]
                )
            ) {
                cloned[section] = {
                    ...cloned[section],
                    ...incomingData[section]
                };
            }
        });

        const validation =
            validateEnvironmentalRecord(
                cloned
            );

        if (!validation.valid) {
            return {
                success: false,
                errors:
                    validation.errors
            };
        }

        return {
            success: true,
            data: cloned
        };
    }

    /* =========================================================
       10. DATA COMPLETENESS
       ========================================================= */

    function calculateCompleteness(
        record
    ) {
        if (!isObject(record)) {
            return {
                percentage: 0,
                available: 0,
                total: 0
            };
        }

        const fields = [
            record.climate &&
                record.climate.risk_index,

            record.climate &&
                record.climate.drought_risk,

            record.climate &&
                record.climate.flood_risk,

            record.climate &&
                record.climate.heat_risk,

            record.water &&
                record.water.water_stress,

            record.water &&
                record.water.water_availability,

            record.water &&
                record.water.water_quality,

            record.wash &&
                record.wash.priority_index,

            record.wash &&
                record.wash.vulnerability,

            record.wash &&
                record.wash.water_access,

            record.wash &&
                record.wash.sanitation,

            record.wash &&
                record.wash.hygiene
        ];

        const available =
            fields.filter(function (
                value
            ) {
                return (
                    value !== null &&
                    typeof value !==
                        "undefined"
                );
            }).length;

        const total =
            fields.length;

        return {
            percentage:
                total === 0
                    ? 0
                    : Math.round(
                        (
                            available /
                            total
                        ) *
                        100
                    ),

            available:
                available,

            total:
                total
        };
    }

    /* =========================================================
       11. DATA STATUS
       ========================================================= */

    function getDataStatus(record) {
        if (!isObject(record)) {
            return {
                key: "unavailable",
                label: "Unavailable",
                labelAr: "غير متوفر"
            };
        }

        const completeness =
            calculateCompleteness(
                record
            );

        if (
            completeness.available === 0
        ) {
            return {
                key: "unavailable",
                label: "Unavailable",
                labelAr: "غير متوفر"
            };
        }

        if (
            record.metadata &&
            record.metadata
                .verification_status ===
                "VERIFIED"
        ) {
            return {
                key: "verified",
                label: "Verified",
                labelAr: "موثق"
            };
        }

        return {
            key: "provisional",
            label: "Provisional",
            labelAr: "أولي"
        };
    }

    /* =========================================================
       12. SOURCE METADATA VALIDATION
       ========================================================= */

    function validateSourceMetadata(
        metadata
    ) {
        const errors = [];

        if (!isObject(metadata)) {
            return {
                valid: false,
                errors: [
                    "Source metadata must be an object."
                ]
            };
        }

        if (
            metadata.source !== null &&
            typeof metadata.source !==
                "undefined" &&
            typeof metadata.source !==
                "string"
        ) {
            errors.push(
                "Source must be a string."
            );
        }

        if (
            metadata.last_updated !== null &&
            typeof metadata.last_updated !==
                "undefined"
        ) {
            const date =
                new Date(
                    metadata.last_updated
                );

            if (
                Number.isNaN(
                    date.getTime()
                )
            ) {
                errors.push(
                    "Invalid last_updated date."
                );
            }
        }

        const validStatuses = [
            "UNVERIFIED",
            "VERIFIED",
            "PROVISIONAL"
        ];

        if (
            metadata.verification_status &&
            !validStatuses.includes(
                metadata.verification_status
            )
        ) {
            errors.push(
                "Invalid verification status."
            );
        }

        return {
            valid: errors.length === 0,
            errors: errors
        };
    }

    /* =========================================================
       13. PUBLIC API
       ========================================================= */

    const EPAYGovernorates = {

        version:
            VERSION,

        count:
            REGISTRY.length,

        list: function () {
            return REGISTRY.map(
                function (item) {
                    return {
                        ...item
                    };
                }
            );
        },

        findById:
            findById,

        findByArabicName:
            findByArabicName,

        findByEnglishName:
            findByEnglishName,

        validateGovernorate:
            validateGovernorate,

        createEmptyEnvironmentalRecord:
            createEmptyEnvironmentalRecord,

        buildNationalRegistry:
            buildNationalRegistry,

        validateEnvironmentalRecord:
            validateEnvironmentalRecord,

        validateSourceMetadata:
            validateSourceMetadata,

        mergeEnvironmentalData:
            mergeEnvironmentalData,

        calculateCompleteness:
            calculateCompleteness,

        getDataStatus:
            getDataStatus
    };

    /* =========================================================
       14. GLOBAL EXPORT
       ========================================================= */

    window.EPAYGovernorates =
        EPAYGovernorates;

})(window);
