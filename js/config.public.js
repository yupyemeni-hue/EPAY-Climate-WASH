/* EPAY public runtime configuration.
 * IMPORTANT: Never place API secrets in this file.
 * Open-data sources used here do not require a browser-visible secret.
 */
window.EPAY_CONFIG = Object.freeze({
  app: {
    name: "EPAY",
    fullName: "Yemen Environmental Intelligence Platform",
    mode: "prototype",
    timezone: "Asia/Aden",
    locale: "ar"
  },

  endpoints: {
    openMeteoForecast: "https://api.open-meteo.com/v1/forecast",
    openMeteoAir: "https://air-quality-api.open-meteo.com/v1/air-quality",
    nasaPower: "https://power.larc.nasa.gov/api/temporal/hourly/point",
    usgsEarthquakes: "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson"
  },

  maps: {
    windyEmbed: "https://embed.windy.com/embed.html",
    defaultZoom: 6
  },

  policy: {
    live: "Directly retrieved from an active source.",
    nearRealTime: "Recently retrieved with a short processing delay.",
    modelled: "Calculated by an EPAY model using verified inputs.",
    estimated: "Estimated using a documented methodology.",
    reference: "Published reference data, not a live observation.",
    demo: "Demonstration-only value.",
    unavailable: "No verified value is currently available."
  }
});
