/* NASA POWER hourly radiation/meteorology.
 * This is a live source call; it is not a substitute for a hydrological soil-moisture product.
 */
(function(){
  function qs(p){return Object.entries(p).map(([k,v])=>`${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&");}

  window.EPAY_fetchNASAPower = async function(gov){
    const start = new Date();
    start.setUTCDate(start.getUTCDate()-2);
    const fmt = d => d.toISOString().slice(0,10).replaceAll("-","");
    const url = window.EPAY_CONFIG.endpoints.nasaPower + "?" + qs({
      parameters:"ALLSKY_SFC_SW_DWN,T2M,RH2M",
      community:"AG",
      longitude:gov.lon,
      latitude:gov.lat,
      start:fmt(start),
      end:fmt(new Date()),
      format:"JSON"
    });

    try {
      const res = await fetch(url);
      if(!res.ok) throw new Error(`NASA POWER HTTP ${res.status}`);
      const data = await res.json();
      EPAY_setSourceState("NASA_POWER", {status:"LIVE", confidence:"High", updatedAt:new Date().toISOString(), error:null});
      return {source:"NASA POWER", status:"LIVE", data};
    } catch(error) {
      EPAY_setSourceState("NASA_POWER", {status:"UNAVAILABLE", confidence:"Not Available", error:String(error)});
      return {source:"NASA POWER", status:"UNAVAILABLE", error:String(error)};
    }
  };
})();
