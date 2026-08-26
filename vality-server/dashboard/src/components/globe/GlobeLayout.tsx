import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import { useHudDispatch, useHudState } from "../../state/store";
import { CITIES } from "../../data/cities";
import { focusCity } from "../../services/weather";
import { geocodeAndFocusCity } from "../../services/geocoding";
import CoreRing from "../core/CoreRing";
import HudFrame from "../layout/HudFrame";
import type { CityMarker } from "../../state/types";
import "./GlobeLayout.css";

export default function GlobeLayout() {
  const { globe } = useHudState();
  const dispatch = useHudDispatch();
  const containerRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const [size, setSize] = useState({ width: 400, height: 400 });
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Reagiert auf JEDE Aenderung der fokussierten Stadt - nicht nur beim
  // ersten Rendern - damit ein zweiter Sprachbefehl waehrend der Globus
  // schon offen ist ("zeig mir Paris" -> "zeig mir Tokio") ebenfalls
  // hinfliegt. NaN-Koordinaten (Ort wird noch geokodiert) werden ignoriert,
  // sonst fliegt die Kamera kurz zu 0/0.
  useEffect(() => {
    const city = globe.focusCity;
    if (city && Number.isFinite(city.lat) && Number.isFinite(city.lng)) {
      globeRef.current?.pointOfView({ lat: city.lat, lng: city.lng, altitude: 1.1 }, 1400);
    } else if (!city) {
      globeRef.current?.pointOfView({ lat: 20, lng: 10, altitude: 2.2 }, 0);
    }
  }, [globe.focusCity]);

  // Dreht sich sanft von selbst, solange niemand einen Ort fokussiert hat -
  // wirkt lebendig statt eines starren Standbilds. Sobald eine Stadt
  // angeflogen wird, haelt die Drehung an, damit der Blick nicht wegdriftet.
  function onGlobeReady() {
    const controls = globeRef.current?.controls();
    if (!controls) return;
    controls.autoRotate = !globe.focusCity;
    controls.autoRotateSpeed = 0.5;
  }
  useEffect(() => {
    const controls = globeRef.current?.controls();
    if (controls) controls.autoRotate = !globe.focusCity;
  }, [globe.focusCity]);

  const ringsData = useMemo(() => {
    const city = globe.focusCity;
    return city && Number.isFinite(city.lat) ? [city] : [];
  }, [globe.focusCity]);

  function selectCity(city: CityMarker) {
    focusCity(dispatch, city);
  }

  function onSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed || searching) return;
    setSearching(true);
    geocodeAndFocusCity(dispatch, trimmed).finally(() => setSearching(false));
  }

  // Jede frei gesuchte Stadt bekommt ebenfalls einen echten Marker auf dem
  // Globus, nicht nur die feste Liste - "keine Vorschlaege wie Berlin",
  // der Globus soll auf jeden genannten Ort reagieren.
  const labelsData = useMemo(() => {
    const city = globe.focusCity;
    if (city && Number.isFinite(city.lat) && !CITIES.some((c) => c.id === city.id)) {
      return [...CITIES, city];
    }
    return CITIES;
  }, [globe.focusCity]);

  return (
    <div className="globe-layout">
      <div className="globe-layout__corner">
        <CoreRing expanded={false} />
      </div>

      <button
        type="button"
        className="globe-layout__back mono"
        onClick={() => dispatch({ type: "SET_MODE", mode: "idle" })}
      >
        ← ZURÜCK
      </button>

      <div className="globe-layout__globe" ref={containerRef}>
        <div className="globe-layout__stars" aria-hidden="true" />
        <Globe
          ref={globeRef}
          width={size.width}
          height={size.height}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl="./textures/earth-night.jpg"
          showAtmosphere
          atmosphereColor="#22d3ee"
          atmosphereAltitude={0.22}
          onGlobeReady={onGlobeReady}
          labelsData={labelsData}
          labelLat={(d) => (d as CityMarker).lat}
          labelLng={(d) => (d as CityMarker).lng}
          labelText={(d) => (d as CityMarker).name}
          labelSize={1.1}
          labelDotRadius={0.45}
          labelColor={(d) => ((d as CityMarker).id === globe.focusCity?.id ? "#22d3ee" : "rgba(238,240,244,0.75)")}
          labelResolution={2}
          onLabelClick={(d) => selectCity(d as CityMarker)}
          ringsData={ringsData}
          ringLat={(d) => (d as CityMarker).lat}
          ringLng={(d) => (d as CityMarker).lng}
          ringColor={() => (t: number) => `rgba(34, 211, 238, ${1 - t})`}
          ringMaxRadius={3.5}
          ringPropagationSpeed={2.2}
          ringRepeatPeriod={1400}
        />
      </div>

      <div className="globe-layout__overlay">
        <HudFrame title="Ort suchen" className="globe-layout__search-frame">
          <form className="globe-layout__search" onSubmit={onSearchSubmit}>
            <input
              className="mono"
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Jede Stadt der Welt..."
              aria-label="Stadt suchen"
            />
            <button type="submit" className="mono" disabled={searching}>
              {searching ? "…" : "FLIEGEN"}
            </button>
          </form>
        </HudFrame>

        <HudFrame title="Städte" className="globe-layout__cities" delay={0.05}>
          <div className="globe-layout__city-list">
            {CITIES.map((city) => (
              <button
                key={city.id}
                type="button"
                className={`globe-layout__city-btn mono${city.id === globe.focusCity?.id ? " globe-layout__city-btn--active" : ""}`}
                onClick={() => selectCity(city)}
              >
                {city.name}
              </button>
            ))}
          </div>
        </HudFrame>

        <HudFrame title="Wetter" className="globe-layout__weather" delay={0.1}>
          {!globe.focusCity && <p className="globe-layout__hint mono">Stadt auswählen.</p>}
          {globe.focusCity && globe.loading && <p className="globe-layout__hint mono">LÄDT…</p>}
          {globe.focusCity && !globe.loading && globe.error && (
            <p className="globe-layout__hint globe-layout__hint--error mono">{globe.error}</p>
          )}
          {globe.focusCity && !globe.loading && globe.weather && (
            <div className="globe-layout__weather-body">
              <div className="globe-layout__weather-city">
                {globe.weather.city.name}
                <span className="globe-layout__weather-country">{globe.weather.city.country}</span>
              </div>
              <div className="globe-layout__weather-temp mono">{Math.round(globe.weather.temperatureC)}°C</div>
              <div className="globe-layout__weather-desc">{globe.weather.description}</div>
              <div className="globe-layout__weather-meta mono">
                WIND {Math.round(globe.weather.windKph)} KM/H · {globe.weather.isDay ? "TAG" : "NACHT"}
              </div>
            </div>
          )}
        </HudFrame>
      </div>
    </div>
  );
}
