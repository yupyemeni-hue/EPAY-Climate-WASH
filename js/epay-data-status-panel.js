/* ============================================================
   EPAY — Data Sources Status Panel
   Stage A2
   ------------------------------------------------------------
   Purpose:
   - Visually expose the status of the open-data adapters.
   - Does NOT replace live-data.js, validation-engine.js, or risk-engine.js.
   - Uses EPAYOpenData created by open-data-adapters.js.
   - Defaults to Sana'a only as a test location; it is NOT presented
     as a national observation.
   ============================================================ */

(function () {
  "use strict";

  const DEFAULT_LOCATION = {
    governorate: "صنعاء",
    latitude: 15.3694,
    longitude: 44.1910
  };

  const STYLE_ID = "epay-data-status-style";
  const PANEL_ID = "epay-data-status-panel";

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${PANEL_ID} {
        direction: rtl;
        font-family: Tajawal, Cairo, Arial, sans-serif;
        background: #fff;
        border: 1px solid rgba(0,0,0,.08);
        border-radius: 16px;
        padding: 18px;
        margin: 16px 0;
        box-shadow: 0 8px 28px rgba(0,0,0,.07);
      }

      #${PANEL_ID} .epay-dsp-head {
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:12px;
        margin-bottom:14px;
      }

      #${PANEL_ID} .epay-dsp-title {
        font-size:18px;
        font-weight:800;
        color:#164a32;
      }

      #${PANEL_ID} .epay-dsp-subtitle {
        font-size:12px;
        color:#6b7280;
        margin-top:3px;
      }

      #${PANEL_ID} .epay-dsp-refresh {
        border:0;
        border-radius:10px;
        padding:9px 13px;
        cursor:pointer;
        background:#164a32;
        color:#fff;
        font-family:inherit;
      }

      #${PANEL_ID} .epay-dsp-grid {
        display:grid;
        grid-template-columns:repeat(2,minmax(0,1fr));
        gap:10px;
      }

      #${PANEL_ID} .epay-dsp-source {
        border:1px solid #e5e7eb;
        border-radius:12px;
        padding:12px;
        background:#fafafa;
      }

      #${PANEL_ID} .epay-dsp-source-name {
        font-weight:700;
        font-size:14px;
      }

      #${PANEL_ID} .epay-dsp-state {
        display:flex;
        align-items:center;
        gap:7px;
        margin-top:7px;
        font-size:12px;
      }

      #${PANEL_ID} .epay-dsp-dot {
        width:9px;
        height:9px;
        border-radius:50%;
        display:inline-block;
        background:#9ca3af;
      }

      #${PANEL_ID} .epay-dsp-dot.live { background:#16a34a; }
      #${PANEL_ID} .epay-dsp-dot.unavailable { background:#dc2626; }
      #${PANEL_ID} .epay-dsp-dot.waiting { background:#d97706; }

      #${PANEL_ID} .epay-dsp-meta {
        color:#6b7280;
        font-size:11px;
        margin-top:5px;
        line-height:1.6;
      }

      #${PANEL_ID} .epay-dsp-summary {
        margin-top:12px;
        padding:12px;
        border-radius:12px;
        background:#f3f7f5;
        font-size:13px;
        line-height:1.8;
      }

      @media(max-width:650px) {
        #${PANEL_ID} .epay-dsp-grid {
          grid-template-columns:1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function createPanel() {
    if (document.getElementById(PANEL_ID)) return document.getElementById(PANEL_ID);

    injectStyles();

    const panel = document.createElement("section");
    panel.id = PANEL_ID;
    panel.setAttribute("aria-label", "EPAY Data Sources Status");

    panel.innerHTML = `
      <div class="epay-dsp-head">
        <div>
          <div class="epay-dsp-title">مصادر البيانات المفتوحة — EPAY</div>
          <div class="epay-dsp-subtitle">
            طبقة التحقق والربط الخارجي — لا تُعرض بيانات غير متاحة على أنها LIVE
          </div>
        </div>
        <button class="epay-dsp-refresh" type="button">اختبار المصادر</button>
      </div>

      <div class="epay-dsp-grid">
        ${sourceCard("open-meteo", "Open-Meteo")}
        ${sourceCard("air", "Open-Meteo Air Quality")}
        ${sourceCard("nasa", "NASA POWER")}
        ${sourceCard("usgs", "USGS Earthquakes")}
      </div>

      <div class="epay-dsp-summary" id="epay-dsp-summary">
        جاهز لاختبار مصادر البيانات.
      </div>
    `;

    const host =
      document.querySelector("#data-status") ||
      document.querySelector("#diagnostics") ||
      document.querySelector("main") ||
      document.body;

    host.appendChild(panel);

    panel.querySelector(".epay-dsp-refresh")
      .addEventListener("click", runTest);

    return panel;
  }

  function sourceCard(id, name) {
    return `
      <div class="epay-dsp-source" data-source="${id}">
        <div class="epay-dsp-source-name">${name}</div>
        <div class="epay-dsp-state">
          <span class="epay-dsp-dot waiting"></span>
          <span class="state-text">لم يتم الاختبار</span>
        </div>
        <div class="epay-dsp-meta">بانتظار الاتصال بالمصدر.</div>
      </div>
    `;
  }

  function setCard(id, status, meta) {
    const card = document.querySelector(
      `#${PANEL_ID} [data-source="${id}"]`
    );
    if (!card) return;

    const dot = card.querySelector(".epay-dsp-dot");
    const state = card.querySelector(".state-text");
    const info = card.querySelector(".epay-dsp-meta");

    dot.className = "epay-dsp-dot " +
      (status === "LIVE" ? "live" :
       status === "UNAVAILABLE" ? "unavailable" : "waiting");

    state.textContent =
      status === "LIVE" ? "متصل — LIVE" :
      status === "UNAVAILABLE" ? "غير متاح" :
      "قيد الاختبار";

    info.textContent = meta || "";
  }

  function errorText(result) {
    return result && result.error ? result.error : "لا توجد تفاصيل إضافية.";
  }

  async function runTest() {
    const panel = createPanel();
    const button = panel.querySelector(".epay-dsp-refresh");
    const summary = panel.querySelector("#epay-dsp-summary");

    if (!window.EPAYOpenData) {
      summary.textContent =
        "لم يتم تحميل open-data-adapters.js. تأكد من ترتيب ملفات JavaScript.";
      return;
    }

    button.disabled = true;
    button.textContent = "جارٍ الاختبار...";

    ["open-meteo", "air", "nasa", "usgs"].forEach(id => {
      setCard(id, "WAITING", "جاري الاتصال...");
    });

    try {
      const result = await window.EPAYOpenData.getLocationSnapshot(
        DEFAULT_LOCATION
      );

      const items = [
        ["open-meteo", result.weather],
        ["air", result.air_quality],
        ["nasa", result.nasa_power],
        ["usgs", result.earthquakes]
      ];

      let liveCount = 0;

      items.forEach(([id, source]) => {
        if (source && source.status === "LIVE") {
          liveCount++;
          setCard(
            id,
            "LIVE",
            `المصدر: ${source.source} | ${source.retrieved_at}`
          );
        } else {
          setCard(
            id,
            "UNAVAILABLE",
            `المصدر غير متاح. ${errorText(source)}`
          );
        }
      });

      summary.innerHTML =
        `<strong>نتيجة الاختبار:</strong> ${liveCount}/4 مصادر متاحة. ` +
        `الموقع المستخدم للاختبار: ${DEFAULT_LOCATION.governorate}. ` +
        `هذه قراءة اختبارية لموقع محدد وليست مؤشرًا وطنيًا.`;
    } catch (error) {
      summary.textContent =
        "تعذر تنفيذ اختبار المصادر: " + String(error.message || error);
    } finally {
      button.disabled = false;
      button.textContent = "إعادة اختبار المصادر";
    }
  }

  function init() {
    createPanel();
  }

  window.EPAYDataStatusPanel = {
    init,
    test: runTest
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
