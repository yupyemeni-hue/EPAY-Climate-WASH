/* ============================================================
   EPAY — System Diagnostics
   Version: 1.0.0

   Purpose:
   - Mobile-friendly system verification
   - Verify loaded EPAY modules
   - Verify live weather provider
   - Verify API connectivity
   - Display real diagnostic results
   - No fabricated environmental measurements
   ============================================================ */

(function (window, document) {
    "use strict";

    const VERSION = "1.0.0";

    const state = {
        running: false,
        completed: false,
        startedAt: null,
        completedAt: null,
        checks: []
    };

    function createCheck(
        id,
        name,
        status,
        message,
        details
    ) {
        return {
            id: id,
            name: name,
            status: status,
            message: message || "",
            details: details || null,
            timestamp:
                new Date().toISOString()
        };
    }

    function addCheck(
        id,
        name,
        status,
        message,
        details
    ) {
        state.checks.push(
            createCheck(
                id,
                name,
                status,
                message,
                details
            )
        );
    }

    function statusLabel(status) {
        const labels = {
            PASS: "ناجح",
            WARN: "تحذير",
            FAIL: "فشل",
            RUNNING: "جارٍ الاختبار",
            UNKNOWN: "غير معروف"
        };

        return (
            labels[status] ||
            labels.UNKNOWN
        );
    }

    function escapeHtml(value) {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    function render(container) {
        if (!container) {
            return;
        }

        const passed =
            state.checks.filter(
                function (item) {
                    return item.status === "PASS";
                }
            ).length;

        const warnings =
            state.checks.filter(
                function (item) {
                    return item.status === "WARN";
                }
            ).length;

        const failed =
            state.checks.filter(
                function (item) {
                    return item.status === "FAIL";
                }
            ).length;

        let html = "";

        html += `
            <section
                class="epay-diagnostics"
                dir="rtl"
                aria-label="EPAY System Diagnostics"
            >

                <div class="epay-diagnostics-header">

                    <div>
                        <div class="epay-diagnostics-title">
                            فحص نظام EPAY
                        </div>

                        <div class="epay-diagnostics-subtitle">
                            System Diagnostics
                        </div>
                    </div>

                    <button
                        type="button"
                        id="epay-run-diagnostics"
                        class="epay-diagnostics-button"
                    >
                        إعادة الفحص
                    </button>

                </div>

                <div class="epay-diagnostics-summary">

                    <div class="epay-diagnostics-stat">
                        <strong>${passed}</strong>
                        <span>ناجح</span>
                    </div>

                    <div class="epay-diagnostics-stat">
                        <strong>${warnings}</strong>
                        <span>تحذير</span>
                    </div>

                    <div class="epay-diagnostics-stat">
                        <strong>${failed}</strong>
                        <span>فشل</span>
                    </div>

                </div>

                <div class="epay-diagnostics-results">
        `;

        if (state.running) {
            html += `
                <div class="epay-diagnostics-loading">
                    جارٍ فحص النظام والاتصال بمصدر البيانات...
                </div>
            `;
        }

        state.checks.forEach(
            function (check) {

                const statusClass =
                    check.status.toLowerCase();

                html += `
                    <article
                        class="
                            epay-diagnostic-item
                            epay-status-${statusClass}
                        "
                    >

                        <div class="epay-diagnostic-main">

                            <div class="epay-diagnostic-name">
                                ${escapeHtml(
                                    check.name
                                )}
                            </div>

                            <div class="epay-diagnostic-message">
                                ${escapeHtml(
                                    check.message
                                )}
                            </div>

                        </div>

                        <div class="epay-diagnostic-status">
                            ${escapeHtml(
                                statusLabel(
                                    check.status
                                )
                            )}
                        </div>

                    </article>
                `;
            }
        );

        html += `
                </div>

                <div class="epay-diagnostics-footer">

                    <span>
                        EPAY Diagnostics v${VERSION}
                    </span>

                    ${
                        state.completedAt
                            ? `
                                <span>
                                    آخر فحص:
                                    ${escapeHtml(
                                        new Date(
                                            state.completedAt
                                        ).toLocaleString(
                                            "ar-YE"
                                        )
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

            </section>
        `;

        container.innerHTML = html;

        const button =
            document.getElementById(
                "epay-run-diagnostics"
            );

        if (button) {
            button.addEventListener(
                "click",
                function () {
                    run(container);
                }
            );
        }
    }

    function checkGovernorateRegistry() {

        if (
            !window.EPAYGovernorates
        ) {
            return createCheck(
                "governorates",
                "سجل المحافظات",
                "FAIL",
                "EPAYGovernorates غير محمل."
            );
        }

        if (
            typeof window
                .EPAYGovernorates.list !==
            "function"
        ) {
            return createCheck(
                "governorates",
                "سجل المحافظات",
                "FAIL",
                "واجهة سجل المحافظات غير مكتملة."
            );
        }

        const list =
            window.EPAYGovernorates.list();

        if (
            !Array.isArray(list) ||
            list.length === 0
        ) {
            return createCheck(
                "governorates",
                "سجل المحافظات",
                "FAIL",
                "لم يتم العثور على سجلات المحافظات."
            );
        }

        return createCheck(
            "governorates",
            "سجل المحافظات",
            "PASS",
            `تم تحميل ${list.length} وحدة إدارية.`,
            {
                count:
                    list.length
            }
        );
    }

    function checkLiveGateway() {

        if (
            !window.EPAYLiveData
        ) {
            return createCheck(
                "live-gateway",
                "بوابة البيانات الحية",
                "FAIL",
                "EPAYLiveData غير محملة."
            );
        }

        if (
            typeof window
                .EPAYLiveData.getSnapshot !==
            "function"
        ) {
            return createCheck(
                "live-gateway",
                "بوابة البيانات الحية",
                "FAIL",
                "واجهة بوابة البيانات غير مكتملة."
            );
        }

        return createCheck(
            "live-gateway",
            "بوابة البيانات الحية",
            "PASS",
            "تم تحميل طبقة البيانات الحية بنجاح."
        );
    }

    function checkWeatherProvider() {

        if (
            !window.EPAYWeather
        ) {
            return createCheck(
                "weather-provider",
                "موصل البيانات الجوية",
                "FAIL",
                "EPAYWeather غير محمل."
            );
        }

        if (
            typeof window
                .EPAYWeather.healthCheck !==
            "function"
        ) {
            return createCheck(
                "weather-provider",
                "موصل البيانات الجوية",
                "FAIL",
                "موصل الطقس لا يحتوي على اختبار صحة."
            );
        }

        return createCheck(
            "weather-provider",
            "موصل البيانات الجوية",
            "PASS",
            "تم تحميل موصل Open-Meteo."
        );
    }

    async function checkWeatherConnection() {

        if (
            !window.EPAYWeather
        ) {
            return createCheck(
                "weather-api",
                "الاتصال بمصدر البيانات",
                "FAIL",
                "موصل الطقس غير متوفر."
            );
        }

        try {

            const result =
                await window
                    .EPAYWeather
                    .healthCheck();

            if (
                result &&
                result.online
            ) {

                return createCheck(
                    "weather-api",
                    "الاتصال بمصدر البيانات",
                    "PASS",
                    "مصدر البيانات متصل ويستجيب.",
                    {
                        provider:
                            result.provider,

                        status:
                            result.status,

                        responseTimeMs:
                            result.responseTimeMs,

                        checkedAt:
                            result.checkedAt
                    }
                );

            }

            return createCheck(
                "weather-api",
                "الاتصال بمصدر البيانات",
                "FAIL",
                result &&
                    result.error
                    ? result.error
                    : "المصدر لم يستجب."
            );

        } catch (error) {

            return createCheck(
                "weather-api",
                "الاتصال بمصدر البيانات",
                "FAIL",
                error.message
            );
        }
    }

    async function checkSanaaWeather() {

        if (
            !window.EPAYWeather
        ) {
            return createCheck(
                "sanaa-weather",
                "اختبار بيانات صنعاء",
                "FAIL",
                "موصل الطقس غير متوفر."
            );
        }

        try {

            const result =
                await window
                    .EPAYWeather
                    .fetchGovernorateWeather(
                        "sanaa"
                    );

            if (
                !result ||
                !result.success
            ) {
                return createCheck(
                    "sanaa-weather",
                    "اختبار بيانات صنعاء",
                    "FAIL",
                    result &&
                        result.error
                        ? result.error
                        : "فشل جلب بيانات صنعاء."
                );
            }

            const weather =
                result.data;

            const current =
                weather.current || {};

            const temperature =
                current.temperature;

            const description =
                current.weatherDescription;

            return createCheck(
                "sanaa-weather",
                "اختبار بيانات صنعاء",
                "PASS",
                "تم استلام بيانات جوية فعلية من المصدر.",
                {
                    temperature:
                        temperature,

                    weather:
                        description,

                    retrievedAt:
                        weather.retrievedAt,

                    responseTimeMs:
                        result.responseTimeMs
                }
            );

        } catch (error) {

            return createCheck(
                "sanaa-weather",
                "اختبار بيانات صنعاء",
                "FAIL",
                error.message
            );
        }
    }

    function checkRiskEngine() {

        if (
            window.EPAYRisk ||
            window.EPAYRiskEngine ||
            window.RiskEngine
        ) {
            return createCheck(
                "risk-engine",
                "محرك تقييم المخاطر",
                "PASS",
                "تم العثور على طبقة محرك المخاطر."
            );
        }

        return createCheck(
            "risk-engine",
            "محرك تقييم المخاطر",
            "WARN",
            "محرك المخاطر موجود في المشروع، لكن واجهته العامة لم تُحدد بعد."
        );
    }

    async function run(container) {

        if (
            state.running
        ) {
            return;
        }

        state.running =
            true;

        state.completed =
            false;

        state.startedAt =
            new Date()
                .toISOString();

        state.completedAt =
            null;

        state.checks =
            [];

        render(container);

        const checks = [
            checkGovernorateRegistry(),
            checkLiveGateway(),
            checkWeatherProvider()
        ];

        checks.forEach(
            function (check) {
                state.checks.push(check);
            }
        );

        render(container);

        state.checks.push(
            await checkWeatherConnection()
        );

        render(container);

        state.checks.push(
            await checkSanaaWeather()
        );

        render(container);

        state.checks.push(
            checkRiskEngine()
        );

        state.running =
            false;

        state.completed =
            true;

        state.completedAt =
            new Date()
                .toISOString();

        render(container);
    }

    function initialize() {

        const container =
            document.getElementById(
                "epay-system-diagnostics"
            );

        if (!container) {
            return;
        }

        run(container);
    }

    window.EPAYDiagnostics = {
        version: VERSION,
        run: run,
        initialize: initialize,
        state: state
    };

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initialize
        );

    } else {

        initialize();

    }

})(window, document);
