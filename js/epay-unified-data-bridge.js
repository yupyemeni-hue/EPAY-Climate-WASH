/* ============================================================
   EPAY — Unified Data Bridge
   المرحلة B1: طبقة توحيد البيانات
   ============================================================ */

(function () {
  "use strict";

  const STORAGE_KEY = "EPAY_UNIFIED_DATA_SNAPSHOT_V1";
  const MAX_AGE_MS = 30 * 60 * 1000;

  function isObject(value) {
    return value !== null && typeof value === "object";
  }

  function normalize(snapshot) {
    const now = new Date().toISOString();

    if (!isObject(snapshot)) {
      return {
        schema_version: "EPAY-UNIFIED-1.0",
        platform: "EPAY",
        status: "UNAVAILABLE",
        retrieved_at: now,
        location: null,
        sources: {},
        quality: {
          available: 0,
          total: 0,
          coverage_percent: 0,
          stale: true
        }
      };
    }

    const sourceList = [
      ["weather", snapshot.weather],
      ["air_quality", snapshot.air_quality],
      ["nasa_power", snapshot.nasa_power],
      ["earthquakes", snapshot.earthquakes]
    ];

    let available = 0;
    const sources = {};

    sourceList.forEach(function ([key, item]) {
      const isLive = item && item.status === "LIVE";

      if (isLive) {
        available++;
      }

      sources[key] = {
        status: item?.status || "UNAVAILABLE",
        source: item?.source || null,
        retrieved_at: item?.retrieved_at || null,
        confidence:
          item?.confidence ||
          (isLive ? "High" : "Not Available"),
        data: item || null
      };
    });

    const total = sourceList.length;
    const coverage =
      total > 0
        ? Math.round((available / total) * 100)
        : 0;

    return {
      schema_version: "EPAY-UNIFIED-1.0",
      platform: "EPAY",
      status:
        coverage === 100
          ? "COMPLETE"
          : coverage > 0
            ? "PARTIAL"
            : "UNAVAILABLE",

      retrieved_at:
        snapshot.retrieved_at || now,

      location:
        snapshot.location || null,

      sources: sources,

      quality: {
        available: available,
        total: total,
        coverage_percent: coverage,
        stale: false
      },

      policy: {
        missing_values_remain_missing: true,
        demo_values_are_not_live: true,
        source_provenance_required: true,
        risk_engine_must_validate_inputs: true
      }
    };
  }

  function save(snapshot) {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(snapshot)
      );
    } catch (error) {
      /*
       * التخزين المحلي اختياري.
       * فشل التخزين لا يوقف البيانات الحية.
       */
    }
  }

  function load() {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY);

      if (!raw) {
        return null;
      }

      const parsed =
        JSON.parse(raw);

      if (
        !parsed ||
        !parsed.retrieved_at
      ) {
        return null;
      }

      const age =
        Date.now() -
        new Date(
          parsed.retrieved_at
        ).getTime();

      if (
        !Number.isFinite(age) ||
        age > MAX_AGE_MS
      ) {
        return {
          ...parsed,
          quality: {
            ...(parsed.quality || {}),
            stale: true
          }
        };
      }

      return parsed;

    } catch (error) {
      return null;
    }
  }

  function publish(snapshot) {
    const normalized =
      normalize(snapshot);

    save(normalized);

    window.EPAYUnifiedData =
      normalized;

    window.dispatchEvent(
      new CustomEvent(
        "epay:data-ready",
        {
          detail: normalized
        }
      )
    );

    return normalized;
  }

  async function refresh(location) {

    if (!window.EPAYOpenData) {
      throw new Error(
        "EPAYOpenData is not loaded."
      );
    }

    const snapshot =
      await window.EPAYOpenData
        .getLocationSnapshot(location);

    return publish(snapshot);
  }

  function get() {

    if (window.EPAYUnifiedData) {
      return window.EPAYUnifiedData;
    }

    const cached = load();

    if (cached) {
      window.EPAYUnifiedData =
        cached;

      return cached;
    }

    return null;
  }

  window.EPAYDataBridge = Object.freeze({

    refresh: refresh,

    get: get,

    publish: publish,

    storage_key: STORAGE_KEY,

    max_age_ms: MAX_AGE_MS

  });

  window.dispatchEvent(
    new CustomEvent(
      "epay:bridge-ready"
    )
  );

})();
