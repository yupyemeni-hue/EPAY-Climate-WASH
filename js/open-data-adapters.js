/* EPAY — Open Data Adapters / Stage A
   Open-Meteo + Open-Meteo Air Quality + NASA POWER + USGS
   No private API keys are embedded in this browser-side file.
*/
(function () {
  "use strict";

  const CONFIG = {
    timeoutMs: 15000,
    retryCount: 2,
    endpoints: {
      weather: "https://api.open-meteo.com/v1/forecast",
      airQuality: "https://air-quality-api.open-meteo.com/v1/air-quality",
      nasaPower: "https://power.larc.nasa.gov/api/temporal/daily/point",
      usgs: "https://earthquake.usgs.gov/fdsnws/event/1/query"
    }
  };

  const SOURCES = {
    OPEN_METEO: "Open-Meteo",
    OPEN_METEO_AIR: "Open-Meteo Air Quality",
    NASA_POWER: "NASA POWER",
    USGS: "USGS Earthquake Hazards Program"
  };

  const sleep = ms => new Promise(r => setTimeout(r, ms));

  async function fetchJSON(url, attempt = 0) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONFIG.timeoutMs);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (err) {
      if (attempt < CONFIG.retryCount) {
        await sleep(800 * (attempt + 1));
        return fetchJSON(url, attempt + 1);
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }

  function coordinates(latitude, longitude) {
    const lat = Number(latitude), lon = Number(longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) ||
        lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error("Invalid coordinates");
    }
    return { latitude: lat, longitude: lon };
  }

  function unavailable(source, error) {
    return {
      status: "UNAVAILABLE",
      source,
      retrieved_at: new Date().toISOString(),
      confidence: "Not Available",
      error: error ? String(error.message || error) : null
    };
  }

  function value(source, value, unit) {
    return {
      value,
      unit,
      status: value === null || value === undefined ? "UNAVAILABLE" : "LIVE",
      source,
      retrieved_at: new Date().toISOString(),
      confidence: value === null || value === undefined ? "Not Available" : "High"
    };
  }

  async function getWeather(latitude, longitude, forecastDays = 7) {
    const c = coordinates(latitude, longitude);
    const days = Math.min(Math.max(Number(forecastDays) || 7, 1), 16);

    const p = new URLSearchParams({
      latitude: c.latitude,
      longitude: c.longitude,
      current: "temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,pressure_msl",
      daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
      forecast_days: days,
      timezone: "auto"
    });

    try {
      const d = await fetchJSON(`${CONFIG.endpoints.weather}?${p}`);
      return {
        source: SOURCES.OPEN_METEO,
        status: "LIVE",
        retrieved_at: new Date().toISOString(),
        timezone: d.timezone || null,
        current: {
          temperature: value(SOURCES.OPEN_METEO, d.current?.temperature_2m ?? null, d.current_units?.temperature_2m || "°C"),
          humidity: value(SOURCES.OPEN_METEO, d.current?.relative_humidity_2m ?? null, d.current_units?.relative_humidity_2m || "%"),
          precipitation: value(SOURCES.OPEN_METEO, d.current?.precipitation ?? null, d.current_units?.precipitation || "mm"),
          wind_speed: value(SOURCES.OPEN_METEO, d.current?.wind_speed_10m ?? null, d.current_units?.wind_speed_10m || "km/h"),
          pressure: value(SOURCES.OPEN_METEO, d.current?.pressure_msl ?? null, d.current_units?.pressure_msl || "hPa")
        },
        daily: {
          time: d.daily?.time || [],
          temperature_max: d.daily?.temperature_2m_max || [],
          temperature_min: d.daily?.temperature_2m_min || [],
          precipitation_sum: d.daily?.precipitation_sum || [],
          precipitation_probability_max: d.daily?.precipitation_probability_max || [],
          wind_speed_max: d.daily?.wind_speed_10m_max || []
        }
      };
    } catch (err) {
      return { ...unavailable(SOURCES.OPEN_METEO, err), current: null, daily: null };
    }
  }

  async function getAirQuality(latitude, longitude) {
    const c = coordinates(latitude, longitude);
    const p = new URLSearchParams({
      latitude: c.latitude,
      longitude: c.longitude,
      current: "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone",
      timezone: "auto"
    });

    try {
      const d = await fetchJSON(`${CONFIG.endpoints.airQuality}?${p}`);
      return {
        source: SOURCES.OPEN_METEO_AIR,
        status: "LIVE",
        retrieved_at: new Date().toISOString(),
        timezone: d.timezone || null,
        current: {
          pm10: value(SOURCES.OPEN_METEO_AIR, d.current?.pm10 ?? null, d.current_units?.pm10 || "µg/m³"),
          pm2_5: value(SOURCES.OPEN_METEO_AIR, d.current?.pm2_5 ?? null, d.current_units?.pm2_5 || "µg/m³"),
          carbon_monoxide: value(SOURCES.OPEN_METEO_AIR, d.current?.carbon_monoxide ?? null, d.current_units?.carbon_monoxide || "µg/m³"),
          nitrogen_dioxide: value(SOURCES.OPEN_METEO_AIR, d.current?.nitrogen_dioxide ?? null, d.current_units?.nitrogen_dioxide || "µg/m³"),
          sulphur_dioxide: value(SOURCES.OPEN_METEO_AIR, d.current?.sulphur_dioxide ?? null, d.current_units?.sulphur_dioxide || "µg/m³"),
          ozone: value(SOURCES.OPEN_METEO_AIR, d.current?.ozone ?? null, d.current_units?.ozone || "µg/m³")
        }
      };
    } catch (err) {
      return { ...unavailable(SOURCES.OPEN_METEO_AIR, err), current: null };
    }
  }

  async function getNASA(latitude, longitude, startDate, endDate) {
    const c = coordinates(latitude, longitude);
    const start = startDate || new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
    const end = endDate || new Date().toISOString().slice(0, 10);

    const p = new URLSearchParams({
      parameters: "ALLSKY_SFC_SW_DWN,T2M,RH2M,PRECTOTCORR",
      community: "AG",
      longitude: c.longitude,
      latitude: c.latitude,
      start: start.replaceAll("-", ""),
      end: end.replaceAll("-", ""),
      format: "JSON"
    });

    try {
      const d = await fetchJSON(`${CONFIG.endpoints.nasaPower}?${p}`);
      return {
        source: SOURCES.NASA_POWER,
        status: "LIVE",
        retrieved_at: new Date().toISOString(),
        requested_period: { start, end },
        parameters: d.properties?.parameter || {}
      };
    } catch (err) {
      return { ...unavailable(SOURCES.NASA_POWER, err), parameters: null };
    }
  }

  async function getEarthquakes(latitude, longitude, radiusKm = 500) {
    const c = coordinates(latitude, longitude);
    const p = new URLSearchParams({
      format: "geojson",
      latitude: c.latitude,
      longitude: c.longitude,
      maxradiuskm: Math.max(1, Number(radiusKm) || 500),
      orderby: "time",
      limit: "20"
    });

    try {
      const d = await fetchJSON(`${CONFIG.endpoints.usgs}?${p}`);
      const events = (d.features || []).map(f => ({
        id: f.id,
        magnitude: f.properties?.mag ?? null,
        place: f.properties?.place ?? null,
        time: f.properties?.time ? new Date(f.properties.time).toISOString() : null,
        longitude: f.geometry?.coordinates?.[0] ?? null,
        latitude: f.geometry?.coordinates?.[1] ?? null,
        depth_km: f.geometry?.coordinates?.[2] ?? null,
        url: f.properties?.url ?? null
      }));

      return {
        source: SOURCES.USGS,
        status: "LIVE",
        retrieved_at: new Date().toISOString(),
        count: events.length,
        events,
        note: "USGS provides observed earthquake records; this layer does not claim deterministic earthquake prediction."
      };
    } catch (err) {
      return { ...unavailable(SOURCES.USGS, err), count: 0, events: [] };
    }
  }

  async function getLocationSnapshot({ governorate, latitude, longitude, forecastDays = 7, earthquakeRadiusKm = 500 }) {
    const c = coordinates(latitude, longitude);

    const [weather, airQuality, nasa, earthquakes] = await Promise.all([
      getWeather(c.latitude, c.longitude, forecastDays),
      getAirQuality(c.latitude, c.longitude),
      getNASA(c.latitude, c.longitude),
      getEarthquakes(c.latitude, c.longitude, earthquakeRadiusKm)
    ]);

    const sources = [weather, airQuality, nasa, earthquakes];
    const available = sources.filter(s => s.status === "LIVE").length;
    const coverage = Math.round((available / sources.length) * 100);

    return {
      schema_version: "EPAY-LIVE-1.0",
      platform: "EPAY",
      location: { governorate: governorate || null, latitude: c.latitude, longitude: c.longitude },
      retrieved_at: new Date().toISOString(),
      data_quality: {
        source_count: sources.length,
        available_sources: available,
        coverage_percent: coverage,
        status: coverage === 100 ? "COMPLETE" : coverage > 0 ? "PARTIAL" : "UNAVAILABLE"
      },
      weather,
      air_quality: airQuality,
      nasa_power: nasa,
      earthquakes,
      methodology: {
        live_data_only: true,
        missing_values_remain_missing: true,
        no_demo_values_in_live_layer: true
      }
    };
  }

  const api = { getWeather, getAirQuality, getNASA, getEarthquakes, getLocationSnapshot, CONFIG, SOURCES };
  window.EPAYOpenData = api;

  /* Do not overwrite the existing EPAYLiveData gateway. */
  if (window.EPAYLiveData) window.EPAYLiveData.openDataAdapters = api;
})();
