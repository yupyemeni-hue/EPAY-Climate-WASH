/* ============================================================
   EPAY — Yemen Environmental Intelligence Platform
   Risk Intelligence UI
   Version: 1.0.0

   Purpose:
   - Evidence-aware risk presentation
   - Explainable risk visualization
   - Data provenance
   - Confidence and coverage
   - Early-action presentation
   - No modification of risk calculations
   - No fabricated LIVE data
   ============================================================ */

(function (window, document) {
    "use strict";

    const UI_ID = "epay-risk-intelligence";

    const STATUS_LABELS = {
        LIVE: "مباشر",
        NEAR_REAL_TIME: "شبه لحظي",
        MODELLED: "نمذجة",
        ESTIMATED: "تقديري",
        REFERENCE: "مرجعي",
        DEMO: "تجريبي",
        UNAVAILABLE: "غير متوفر"
    };

    const STATUS_CLASSES = {
        LIVE: "live",
        NEAR_REAL_TIME: "near-real-time",
        MODELLED: "modelled",
        ESTIMATED: "estimated",
        REFERENCE: "reference",
        DEMO: "demo",
        UNAVAILABLE: "unavailable"
    };

    function safe(value, fallback = "—") {
        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return fallback;
        }

        return value;
    }

    function number(value, decimals = 0) {
        if (
            typeof value !== "number" ||
            !Number.isFinite(value)
        ) {
            return null;
        }

        return Number(
            value.toFixed(decimals)
        );
    }

    function escapeHTML(value) {
        return String(
            safe(value, "")
        )
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function statusLabel(status) {
        return (
            STATUS_LABELS[status] ||
            "غير متوفر"
        );
    }

    function statusClass(status) {
        return (
            STATUS_CLASSES[status] ||
            "unavailable"
        );
    }

    function riskClass(level) {
        if (!level) {
            return "unavailable";
        }

        return (
            level.key ||
            "unavailable"
        );
    }

    function riskArabic(level) {
        if (!level) {
            return "غير متوفر";
        }

        return (
            level.labelAr ||
            "غير متوفر"
        );
    }

    function riskEnglish(level) {
        if (!level) {
            return "Unavailable";
        }

        return (
            level.label ||
            "Unavailable"
        );
    }

    function getAllIndicators() {
        const data = window.EPAYData;

        if (!data) {
            return [];
        }

        const groups = [];

        let climate = {};
        let water = {};
        let wash = {};

        try {
            climate =
                typeof data.getClimateIndicators ===
                "function"
                    ? data.getClimateIndicators()
                    : {};
        } catch (error) {
            console.warn(
                "EPAY Risk UI: climate indicators unavailable",
                error
            );
        }

        try {
            water =
                typeof data.getWaterIndicators ===
                "function"
                    ? data.getWaterIndicators()
                    : {};
        } catch (error) {
            console.warn(
                "EPAY Risk UI: water indicators unavailable",
                error
            );
        }

        try {
            wash =
                typeof data.getWASHIndicators ===
                "function"
                    ? data.getWASHIndicators()
                    : {};
        } catch (error) {
            console.warn(
                "EPAY Risk UI: WASH indicators unavailable",
                error
            );
        }

        const add = (
            domain,
            key,
            labelAr,
            indicator
        ) => {
            if (!indicator) {
                return;
            }

            groups.push({
                domain,
                key,
                labelAr,
                value:
                    typeof indicator.value ===
                    "number"
                        ? indicator.value
                        : null,
                unit:
                    indicator.unit ||
                    "index",
                status:
                    indicator.status ||
                    "UNAVAILABLE",
                source:
                    indicator.source ||
                    null,
                updated_at:
                    indicator.updated_at ||
                    null,
                confidence:
                    indicator.confidence ||
                    "Not Available"
            });
        };

        add(
            "المناخ",
            "riskIndex",
            "مؤشر الخطر المناخي",
            climate.riskIndex
        );

        add(
            "المناخ",
            "temperatureStress",
            "الإجهاد الحراري",
            climate.temperatureStress
        );

        add(
            "المناخ",
            "droughtRisk",
            "خطر الجفاف",
            climate.droughtRisk
        );

        add(
            "المناخ",
            "floodRisk",
            "خطر الفيضانات",
            climate.floodRisk
        );

        add(
            "المياه",
            "waterStress",
            "الإجهاد المائي",
            water.waterStress
        );

        add(
            "المياه",
            "waterAvailability",
            "توافر المياه",
            water.waterAvailability
        );

        add(
            "المياه",
            "waterQuality",
            "جودة المياه",
            water.waterQuality
        );

        add(
            "WASH",
            "priorityIndex",
            "أولوية WASH",
            wash.priorityIndex
        );

        add(
            "WASH",
            "waterAccess",
            "الوصول إلى المياه",
            wash.waterAccess
        );

        add(
            "WASH",
            "sanitationVulnerability",
            "هشاشة الصرف الصحي",
            wash.sanitationVulnerability
        );

        add(
            "WASH",
            "hygieneVulnerability",
            "هشاشة النظافة",
            wash.hygieneVulnerability
        );

        return groups;
    }

    function calculateEvidenceSummary(
        indicators
    ) {
        const available =
            indicators.filter(
                item =>
                    typeof item.value ===
                    "number" &&
                    Number.isFinite(item.value)
            );

        const withConfidence =
            available.filter(
                item =>
                    item.confidence &&
                    item.confidence !==
                        "Not Available"
            );

        const confidenceValues = {
            High: 3,
            Medium: 2,
            Low: 1
        };

        let confidenceScore = 0;
        let confidenceCount = 0;

        withConfidence.forEach(
            item => {
                const value =
                    confidenceValues[
                        item.confidence
                    ];

                if (value) {
                    confidenceScore += value;
                    confidenceCount += 1;
                }
            }
        );

        let confidence =
            "Not Available";

        if (confidenceCount > 0) {
            const average =
                confidenceScore /
                confidenceCount;

            if (average >= 2.5) {
                confidence = "High";
            } else if (average >= 1.5) {
                confidence = "Medium";
            } else {
                confidence = "Low";
            }
        }

        const coverage =
            indicators.length > 0
                ? Math.round(
                    (
                        available.length /
                        indicators.length
                    ) * 100
                )
                : 0;

        const liveCount =
            available.filter(
                item =>
                    item.status === "LIVE"
            ).length;

        const modelledCount =
            available.filter(
                item =>
                    item.status === "MODELLED"
            ).length;

        const demoCount =
            available.filter(
                item =>
                    item.status === "DEMO"
            ).length;

        return {
            total:
                indicators.length,
            available:
                available.length,
            coverage,
            confidence,
            liveCount,
            modelledCount,
            demoCount
        };
    }

    function confidenceArabic(
        confidence
    ) {
        switch (confidence) {
            case "High":
                return "مرتفعة";

            case "Medium":
                return "متوسطة";

            case "Low":
                return "منخفضة";

            default:
                return "غير متاحة";
        }
    }

    function createStyles() {
        if (
            document.getElementById(
                "epay-risk-intelligence-styles"
            )
        ) {
            return;
        }

        const style =
            document.createElement("style");

        style.id =
            "epay-risk-intelligence-styles";

        style.textContent = `
        #${UI_ID} {
            direction: rtl;
            width: 100%;
            margin: 32px auto;
            max-width: 1400px;
            font-family:
                "Tajawal",
                "Cairo",
                Arial,
                sans-serif;
            color: #17251f;
        }

        #${UI_ID} *,
        #${UI_ID} *::before,
        #${UI_ID} *::after {
            box-sizing: border-box;
        }

        #${UI_ID} .epay-risk-shell {
            background:
                linear-gradient(
                    135deg,
                    #ffffff 0%,
                    #f6faf8 100%
                );
            border: 1px solid #dce8e2;
            border-radius: 24px;
            overflow: hidden;
            box-shadow:
                0 16px 45px
                rgba(24, 67, 49, 0.10);
        }

        #${UI_ID} .epay-risk-header {
            padding: 28px 30px;
            background:
                linear-gradient(
                    135deg,
                    #103f2c,
                    #176044
                );
            color: #ffffff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 20px;
            flex-wrap: wrap;
        }

        #${UI_ID} .epay-risk-title {
            margin: 0;
            font-size: 26px;
            font-weight: 800;
        }

        #${UI_ID} .epay-risk-subtitle {
            margin-top: 7px;
            opacity: .82;
            font-size: 13px;
        }

        #${UI_ID} .epay-risk-badge {
            border: 1px solid
                rgba(255,255,255,.30);
            background:
                rgba(255,255,255,.10);
            padding: 9px 14px;
            border-radius: 999px;
            font-size: 12px;
            font-weight: 700;
        }

        #${UI_ID} .epay-risk-main {
            padding: 28px;
        }

        #${UI_ID} .epay-risk-grid {
            display: grid;
            grid-template-columns:
                minmax(260px, .9fr)
                minmax(360px, 1.5fr);
            gap: 20px;
        }

        #${UI_ID} .epay-card {
            background: #ffffff;
            border: 1px solid #e2ebe6;
            border-radius: 18px;
            padding: 20px;
        }

        #${UI_ID} .epay-score-card {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            text-align: center;
        }

        #${UI_ID} .epay-score-ring {
            width: 178px;
            height: 178px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background:
                conic-gradient(
                    var(--risk-ring, #176044)
                    var(--risk-progress, 0%),
                    #e9f0ec
                    var(--risk-progress, 0%)
                );
            position: relative;
        }

        #${UI_ID} .epay-score-ring::after {
            content: "";
            position: absolute;
            inset: 12px;
            background: #ffffff;
            border-radius: 50%;
        }

        #${UI_ID} .epay-score-value {
            position: relative;
            z-index: 2;
            font-size: 40px;
            font-weight: 900;
            line-height: 1;
        }

        #${UI_ID} .epay-score-label {
            margin-top: 14px;
            font-size: 21px;
            font-weight: 800;
        }

        #${UI_ID} .epay-score-en {
            margin-top: 4px;
            color: #708078;
            font-size: 12px;
        }

        #${UI_ID} .epay-meta-grid {
            width: 100%;
            display: grid;
            grid-template-columns:
                repeat(3, 1fr);
            gap: 8px;
            margin-top: 20px;
        }

        #${UI_ID} .epay-meta-item {
            background: #f5f8f6;
            border-radius: 12px;
            padding: 10px 6px;
        }

        #${UI_ID} .epay-meta-value {
            font-weight: 800;
            font-size: 16px;
        }

        #${UI_ID} .epay-meta-label {
            margin-top: 3px;
            color: #718078;
            font-size: 10px;
        }

        #${UI_ID} .epay-section-title {
            margin: 0 0 15px;
            font-size: 17px;
            font-weight: 850;
        }

        #${UI_ID} .epay-driver {
            margin-bottom: 14px;
        }

        #${UI_ID} .epay-driver:last-child {
            margin-bottom: 0;
        }

        #${UI_ID} .epay-driver-head {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 6px;
            font-size: 13px;
        }

        #${UI_ID} .epay-driver-value {
            font-weight: 800;
        }

        #${UI_ID} .epay-progress {
            height: 9px;
            border-radius: 99px;
            background: #edf2ef;
            overflow: hidden;
        }

        #${UI_ID} .epay-progress-bar {
            height: 100%;
            border-radius: inherit;
            background:
                linear-gradient(
                    90deg,
                    #2b7656,
                    #123f2c
                );
        }

        #${UI_ID} .epay-components {
            display: grid;
            grid-template-columns:
                repeat(3, 1fr);
            gap: 12px;
            margin-top: 20px;
        }

        #${UI_ID} .epay-component {
            border: 1px solid #e4ece8;
            border-radius: 14px;
            padding: 15px;
            background: #fbfdfc;
        }

        #${UI_ID} .epay-component-name {
            color: #68776f;
            font-size: 11px;
        }

        #${UI_ID} .epay-component-score {
            margin-top: 5px;
            font-size: 22px;
            font-weight: 900;
        }

        #${UI_ID} .epay-component-weight {
            margin-top: 3px;
            color: #8a9690;
            font-size: 10px;
        }

        #${UI_ID} .epay-action {
            border-right: 4px solid #176044;
            background: #f5faf7;
            padding: 14px 15px;
            margin-bottom: 10px;
            border-radius: 10px;
        }

        #${UI_ID} .epay-action-title {
            font-weight: 800;
            font-size: 13px;
        }

        #${UI_ID} .epay-action-text {
            margin-top: 5px;
            color: #607068;
            font-size: 12px;
            line-height: 1.65;
        }

        #${UI_ID} .epay-evidence {
            margin-top: 20px;
        }

        #${UI_ID} .epay-table-wrap {
            width: 100%;
            overflow-x: auto;
            border: 1px solid #e1e9e5;
            border-radius: 14px;
        }

        #${UI_ID} table {
            width: 100%;
            border-collapse: collapse;
            min-width: 760px;
            background: #ffffff;
        }

        #${UI_ID} th,
        #${UI_ID} td {
            padding: 12px 10px;
            border-bottom: 1px solid #edf1ef;
            text-align: right;
            font-size: 11px;
            white-space: nowrap;
        }

        #${UI_ID} th {
            background: #f5f8f6;
            font-weight: 800;
            color: #526159;
        }

        #${UI_ID} tr:last-child td {
            border-bottom: 0;
        }

        #${UI_ID} .epay-status {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 5px 8px;
            border-radius: 999px;
            font-size: 9px;
            font-weight: 800;
        }

        #${UI_ID} .epay-status.live {
            background: #e7f6ed;
            color: #176044;
        }

        #${UI_ID} .epay-status.near-real-time {
            background: #eaf5f7;
            color: #17636c;
        }

        #${UI_ID} .epay-status.modelled {
            background: #eeeafb;
            color: #5a4e9b;
        }

        #${UI_ID} .epay-status.estimated {
            background: #fff5df;
            color: #8a641b;
        }

        #${UI_ID} .epay-status.reference {
            background: #eef2f4;
            color: #53616a;
        }

        #${UI_ID} .epay-status.demo {
            background: #fff0e8;
            color: #9a4e25;
        }

        #${UI_ID} .epay-status.unavailable {
            background: #f1f2f2;
            color: #747b78;
        }

        #${UI_ID} .epay-methodology {
            margin-top: 20px;
            padding: 15px 17px;
            border-radius: 13px;
            background: #f8faf9;
            border: 1px solid #e5ece8;
            color: #68766f;
            font-size: 11px;
            line-height: 1.8;
        }

        #${UI_ID} .epay-primary-driver {
            margin-top: 17px;
            padding: 13px 15px;
            border-radius: 12px;
            background: #eef7f2;
            border: 1px solid #d7e9df;
        }

        #${UI_ID} .epay-primary-driver strong {
            color: #123f2c;
        }

        #${UI_ID} .epay-empty {
            text-align: center;
            padding: 45px 20px;
            color: #68766f;
        }

        #${UI_ID} .epay-footer {
            padding: 15px 28px;
            background: #f7faf8;
            border-top: 1px solid #e3ebe6;
            color: #718078;
            font-size: 10px;
            display: flex;
            justify-content: space-between;
            gap: 10px;
            flex-wrap: wrap;
        }

        @media (max-width: 850px) {
            #${UI_ID} .epay-risk-grid {
                grid-template-columns: 1fr;
            }

            #${UI_ID} .epay-components {
                grid-template-columns: 1fr;
            }

            #${UI_ID} .epay-meta-grid {
                grid-template-columns:
                    repeat(3, 1fr);
            }

            #${UI_ID} .epay-risk-main {
                padding: 15px;
            }

            #${UI_ID} .epay-risk-header {
                padding: 22px 18px;
            }
        }

        @media (max-width: 460px) {
            #${UI_ID} .epay-meta-grid {
                grid-template-columns: 1fr;
            }

            #${UI_ID} .epay-title {
                font-size: 21px;
            }

            #${UI_ID} .epay-score-ring {
                width: 150px;
                height: 150px;
            }
        }
        `;

        document.head.appendChild(style);
    }

    function renderUnavailable(container) {
        container.innerHTML = `
            <div class="epay-risk-shell">
                <div class="epay-risk-header">
                    <div>
                        <h2 class="epay-risk-title">
                            EPAY — الذكاء الاستخباراتي للمخاطر
                        </h2>
                        <div class="epay-risk-subtitle">
                            Explainable Environmental Risk Intelligence
                        </div>
                    </div>
                    <div class="epay-risk-badge">
                        حالة البيانات
                    </div>
                </div>

                <div class="epay-empty">
                    <strong>
                        البيانات غير متوفرة حاليًا
                    </strong>
                    <br>
                    لا يمكن حساب تقييم المخاطر قبل تحميل
                    طبقة البيانات والتحقق منها.
                </div>
            </div>
        `;
    }

    function render(container) {
        if (
            !window.EPAYData ||
            !window.EPAYRiskEngine
        ) {
            renderUnavailable(container);
            return;
        }

        let analysis;

        try {
            analysis =
                window.EPAYRiskEngine.analyze();
        } catch (error) {
            console.error(
                "EPAY Risk UI: risk analysis failed",
                error
            );

            renderUnavailable(container);
            return;
        }

        if (
            !analysis ||
            analysis.score === null ||
            analysis.score === undefined
        ) {
            renderUnavailable(container);
            return;
        }

        const indicators =
            getAllIndicators();

        const evidence =
            calculateEvidenceSummary(
                indicators
            );

        const score =
            number(
                analysis.score,
                1
            );

        const progress =
            Math.max(
                0,
                Math.min(
                    100,
                    score === null
                        ? 0
                        : score
                )
            );

        const level =
            analysis.level || {
                key: "unavailable",
                label: "Unavailable",
                labelAr: "غير متوفر"
            };

        const drivers =
            Array.isArray(
                analysis.drivers
            )
                ? analysis.drivers
                : [];

        const actions =
            Array.isArray(
                analysis.recommendedActions
            )
                ? analysis.recommendedActions
                : [];

        const components =
            analysis.components || {};

        const primaryDriver =
            analysis.primaryDriver;

        const riskColor =
            level.key === "critical"
                ? "#9f3b2e"
                : level.key === "high"
                    ? "#9a681f"
                    : level.key === "moderate"
                        ? "#68751f"
                        : level.key === "low"
                            ? "#176044"
                            : "#7a817e";

        const driverHTML =
            drivers.length > 0
                ? drivers
                    .slice(0, 5)
                    .map(
                        driver => {
                            const value =
                                number(
                                    driver.value,
                                    1
                                );

                            const width =
                                value === null
                                    ? 0
                                    : Math.max(
                                        0,
                                        Math.min(
                                            100,
                                            value
                                        )
                                    );

                            return `
                                <div class="epay-driver">
                                    <div class="epay-driver-head">
                                        <span>
                                            ${escapeHTML(
                                                driver.labelAr
                                            )}
                                        </span>
                                        <span class="epay-driver-value">
                                            ${value === null
                                                ? "—"
                                                : value}
                                        </span>
                                    </div>
                                    <div class="epay-progress">
                                        <div
                                            class="epay-progress-bar"
                                            style="width:${width}%"
                                        ></div>
                                    </div>
                                </div>
                            `;
                        }
                    )
                    .join("")
                : `
                    <div class="epay-empty">
                        لا توجد عوامل خطر قابلة للتفسير
                        من البيانات المتاحة.
                    </div>
                `;

        const actionHTML =
            actions.length > 0
                ? actions
                    .slice(0, 5)
                    .map(
                        action => `
                            <div class="epay-action">
                                <div class="epay-action-title">
                                    ${escapeHTML(
                                        action.titleAr ||
                                        action.title ||
                                        "إجراء موصى به"
                                    )}
                                </div>
                                <div class="epay-action-text">
                                    ${escapeHTML(
                                        action.actionAr ||
                                        action.action ||
                                        ""
                                    )}
                                </div>
                            </div>
                        `
                    )
                    .join("")
                : `
                    <div class="epay-empty">
                        لا توجد إجراءات آلية متاحة.
                    </div>
                `;

        const componentValue =
            component => {
                if (
                    !component ||
                    component.score === null ||
                    component.score === undefined
                ) {
                    return "غير متوفر";
                }

                return number(
                    component.score,
                    1
                );
            };

        const evidenceRows =
            indicators
                .map(
                    item => {
                        const value =
                            item.value === null
                                ? "—"
                                : number(
                                    item.value,
                                    1
                                );

                        const freshness =
                            window.EPAYData &&
                            typeof window.EPAYData
                                .getFreshness ===
                                "function"
                                ? window.EPAYData
                                    .getFreshness(
                                        item.updated_at
                                    )
                                : null;

                        return `
                            <tr>
                                <td>
                                    ${escapeHTML(
                                        item.domain
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        item.labelAr
                                    )}
                                </td>

                                <td>
                                    ${value}
                                    ${item.unit !== "index"
                                        ? escapeHTML(
                                            " " +
                                            item.unit
                                        )
                                        : ""}
                                </td>

                                <td>
                                    <span class="epay-status ${statusClass(
                                        item.status
                                    )}">
                                        ${escapeHTML(
                                            statusLabel(
                                                item.status
                                            )
                                        )}
                                    </span>
                                </td>

                                <td>
                                    ${escapeHTML(
                                        item.source ||
                                        "غير محدد"
                                    )}
                                </td>

                                <td>
                                    ${escapeHTML(
                                        item.confidence ||
                                        "غير متاحة"
                                    )}
                                </td>

                                <td>
                                    ${freshness &&
                                    freshness.available
                                        ? escapeHTML(
                                            freshness.labelAr
                                        )
                                        : "غير معروف"}
                                </td>
                            </tr>
                        `;
                    }
                )
                .join("");

        container.innerHTML = `
            <div class="epay-risk-shell">

                <header class="epay-risk-header">
                    <div>
                        <h2 class="epay-risk-title">
                            EPAY — الذكاء الاستخباراتي للمخاطر
                        </h2>

                        <div class="epay-risk-subtitle">
                            من البيانات إلى تفسير الخطر ثم الأولوية والإجراء
                        </div>
                    </div>

                    <div class="epay-risk-badge">
                        Risk Intelligence • v${escapeHTML(
                            analysis.version || "1.0.0"
                        )}
                    </div>
                </header>

                <main class="epay-risk-main">

                    <div class="epay-risk-grid">

                        <section
                            class="epay-card epay-score-card"
                        >
                            <div
                                class="epay-score-ring"
                                style="
                                    --risk-progress:${progress}%;
                                    --risk-ring:${riskColor};
                                "
                            >
                                <div class="epay-score-value">
                                    ${score}
                                </div>
                            </div>

                            <div class="epay-score-label">
                                ${escapeHTML(
                                    riskArabic(level)
                                )}
                            </div>

                            <div class="epay-score-en">
                                ${escapeHTML(
                                    riskEnglish(level)
                                )}
                            </div>

                            <div class="epay-meta-grid">

                                <div class="epay-meta-item">
                                    <div class="epay-meta-value">
                                        ${number(
                                            analysis.dataCoverage,
                                            0
                                        ) ?? 0}%
                                    </div>

                                    <div class="epay-meta-label">
                                        تغطية مكونات الخطر
                                    </div>
                                </div>

                                <div class="epay-meta-item">
                                    <div class="epay-meta-value">
                                        ${evidence.coverage}%
                                    </div>

                                    <div class="epay-meta-label">
                                        توفر المؤشرات
                                    </div>
                                </div>

                                <div class="epay-meta-item">
                                    <div class="epay-meta-value">
                                        ${escapeHTML(
                                            confidenceArabic(
                                                evidence.confidence
                                            )
                                        )}
                                    </div>

                                    <div class="epay-meta-label">
                                        الثقة في الأدلة
                                    </div>
                                </div>

                            </div>

                            ${
                                primaryDriver
                                    ? `
                                        <div class="epay-primary-driver">
                                            <strong>
                                                العامل الأبرز:
                                            </strong>
                                            ${escapeHTML(
                                                primaryDriver.labelAr ||
                                                primaryDriver.label ||
                                                "غير محدد"
                                            )}
                                        </div>
                                    `
                                    : ""
                            }

                        </section>

                        <section class="epay-card">

                            <h3 class="epay-section-title">
                                لماذا ارتفع الخطر؟
                            </h3>

                            ${driverHTML}

                            <div class="epay-components">

                                <div class="epay-component">
                                    <div class="epay-component-name">
                                        المناخ
                                    </div>

                                    <div class="epay-component-score">
                                        ${componentValue(
                                            components.climate
                                        )}
                                    </div>

                                    <div class="epay-component-weight">
                                        الوزن النموذجي:
                                        ${components.climate
                                            ? Math.round(
                                                components.climate.weight *
                                                100
                                            )
                                            : 40}%
                                    </div>
                                </div>

                                <div class="epay-component">
                                    <div class="epay-component-name">
                                        المياه
                                    </div>

                                    <div class="epay-component-score">
                                        ${componentValue(
                                            components.water
                                        )}
                                    </div>

                                    <div class="epay-component-weight">
                                        الوزن النموذجي:
                                        ${components.water
                                            ? Math.round(
                                                components.water.weight *
                                                100
                                            )
                                            : 25}%
                                    </div>
                                </div>

                                <div class="epay-component">
                                    <div class="epay-component-name">
                                        WASH
                                    </div>

                                    <div class="epay-component-score">
                                        ${componentValue(
                                            components.wash
                                        )}
                                    </div>

                                    <div class="epay-component-weight">
                                        الوزن النموذجي:
                                        ${components.wash
                                            ? Math.round(
                                                components.wash.weight *
                                                100
                                            )
                                            : 35}%
                                    </div>
                                </div>

                            </div>

                        </section>

                    </div>

                    <section
                        class="epay-card"
                        style="margin-top:20px;"
                    >
                        <h3 class="epay-section-title">
                            ماذا نفعل الآن؟
                        </h3>

                        <div>
                            ${actionHTML}
                        </div>

                        ${
                            analysis.earlyAction
                                ? `
                                    <div class="epay-primary-driver">
                                        <strong>
                                            أولوية الإجراء:
                                        </strong>
                                        ${escapeHTML(
                                            analysis.earlyAction.labelAr ||
                                            "يلزم التقييم"
                                        )}
                                    </div>
                                `
                                : ""
                        }
                    </section>

                    <section
                        class="epay-card epay-evidence"
                    >
                        <h3 class="epay-section-title">
                            سلسلة الأدلة ومصدر البيانات
                        </h3>

                        <div class="epay-table-wrap">
                            <table>
                                <thead>
                                    <tr>
                                        <th>المجال</th>
                                        <th>المؤشر</th>
                                        <th>القيمة</th>
                                        <th>حالة البيانات</th>
                                        <th>المصدر</th>
                                        <th>الثقة</th>
                                        <th>الحداثة</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    ${
                                        evidenceRows ||
                                        `
                                            <tr>
                                                <td colspan="7">
                                                    لا توجد مؤشرات متاحة.
                                                </td>
                                            </tr>
                                        `
                                    }
                                </tbody>
                            </table>
                        </div>

                        <div class="epay-methodology">
                            <strong>
                                ملاحظة منهجية:
                            </strong>

                            محرك المخاطر الحالي هو
                            نموذج تحليلي أولي.
                            الأوزان المستخدمة في الحساب
                            ليست مؤشرًا وطنيًا معتمدًا،
                            وتحتاج إلى معايرة ببيانات
                            موثقة ومراجعة خبراء قبل
                            استخدامها في قرارات تشغيلية
                            أو سياسات عامة.

                            المنصة لا تعتبر البيانات
                            "مباشرة" إلا إذا كان مصدرها
                            مصنفًا كذلك، ولا تحول البيانات
                            المفقودة إلى صفر.
                        </div>
                    </section>

                </main>

                <footer class="epay-footer">
                    <span>
                        EPAY • Explainable Environmental Intelligence
                    </span>

                    <span>
                        ${evidence.liveCount} مباشر •
                        ${evidence.modelledCount} نمذجة •
                        ${evidence.demoCount} تجريبي
                    </span>
                </footer>

            </div>
        `;
    }

    function findMountPoint() {
        const selectors = [
            "#risk-intelligence",
            "#risk-engine",
            "#risk-dashboard",
            "[data-epay-risk]",
            "main"
        ];

        for (
            let i = 0;
            i < selectors.length;
            i += 1
        ) {
            const element =
                document.querySelector(
                    selectors[i]
                );

            if (element) {
                return element;
            }
        }

        return document.body;
    }

    function mount() {
        createStyles();

        let container =
            document.getElementById(
                UI_ID
            );

        if (!container) {
            container =
                document.createElement("section");

            container.id = UI_ID;

            const mountPoint =
                findMountPoint();

            if (
                mountPoint === document.body
            ) {
                document.body.appendChild(
                    container
                );
            } else {
                mountPoint.appendChild(
                    container
                );
            }
        }

        render(container);
    }

    function scheduleMount() {
        if (
            document.readyState ===
            "loading"
        ) {
            document.addEventListener(
                "DOMContentLoaded",
                mount,
                {
                    once: true
                }
            );
        } else {
            mount();
        }

        window.addEventListener(
            "epay:data-loaded",
            function () {
                window.setTimeout(
                    mount,
                    50
                );
            }
        );

        window.addEventListener(
            "epay:data-error",
            function () {
                window.setTimeout(
                    mount,
                    50
                );
            }
        );
    }

    window.EPAYRiskIntelligenceUI = {
        version: "1.0.0",
        mount
    };

    scheduleMount();

})(window, document);
