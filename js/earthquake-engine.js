/* USGS earthquake awareness layer.
 * This reports observed catalog events; it does NOT predict earthquakes.
 */
(function(){
  const distanceKm = (lat1,lon1,lat2,lon2) => {
    const R=6371, r=d=>d*Math.PI/180;
    const dLat=r(lat2-lat1), dLon=r(lon2-lon1);
    const a=Math.sin(dLat/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dLon/2)**2;
    return 2*R*Math.asin(Math.sqrt(a));
  };

  window.EPAY_fetchEarthquakes = async function(gov, radiusKm=250) {
    try {
      const res=await fetch(window.EPAY_CONFIG.endpoints.usgsEarthquakes);
      if(!res.ok) throw new Error(`USGS HTTP ${res.status}`);
      const fc=await res.json();
      const events=(fc.features||[]).map(f=>{
        const [lon,lat,depth]=f.geometry.coordinates;
        return {
          id:f.id, lat, lon, depthKm:depth,
          magnitude:f.properties.mag,
          place:f.properties.place,
          time:f.properties.time,
          distanceKm:distanceKm(gov.lat,gov.lon,lat,lon),
          url:f.properties.url
        };
      }).filter(e=>e.distanceKm<=radiusKm)
        .sort((a,b)=>b.magnitude-a.magnitude);

      EPAY_setSourceState("USGS_EARTHQUAKES",{status:"LIVE",confidence:"High",updatedAt:new Date().toISOString(),error:null});
      return {source:"USGS",status:"LIVE",events};
    } catch(error) {
      EPAY_setSourceState("USGS_EARTHQUAKES",{status:"UNAVAILABLE",confidence:"Not Available",error:String(error)});
      return {source:"USGS",status:"UNAVAILABLE",events:[],error:String(error)};
    }
  };
})();
