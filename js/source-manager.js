/* Unified source manager: keeps source state, freshness and provenance visible. */
window.EPAY_SOURCES = {
  "OPEN_METEO_WEATHER": {name:"Open-Meteo Weather", type:"LIVE", requiresKey:false},
  "OPEN_METEO_AIR": {name:"Open-Meteo Air Quality", type:"LIVE", requiresKey:false},
  "NASA_POWER": {name:"NASA POWER", type:"LIVE", requiresKey:false},
  "USGS_EARTHQUAKES": {name:"USGS Earthquake Feed", type:"LIVE", requiresKey:false},
  "WINDY_EMBED": {name:"Windy Embed", type:"REFERENCE", requiresKey:false}
};

window.EPAY_SOURCE_STATE = {};

window.EPAY_setSourceState = function(sourceId, patch) {
  const previous = window.EPAY_SOURCE_STATE[sourceId] || {};
  window.EPAY_SOURCE_STATE[sourceId] = {
    ...previous,
    ...patch,
    checkedAt: new Date().toISOString()
  };
  window.dispatchEvent(new CustomEvent("epay:source-update", {
    detail: {sourceId, state: window.EPAY_SOURCE_STATE[sourceId]}
  }));
};

window.EPAY_getSourceState = function(sourceId) {
  return window.EPAY_SOURCE_STATE[sourceId] || {
    status: "UNAVAILABLE",
    confidence: "Not Available"
  };
};
