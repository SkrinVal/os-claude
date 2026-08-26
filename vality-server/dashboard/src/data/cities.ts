import type { CityMarker } from "../state/types";

// Reale, oeffentlich bekannte Hauptstadt-Koordinaten - keine erfundenen
// Werte. Dient als feste Marker-Liste, bis eine echte Ortssuche/Backend-
// Anbindung existiert.
export const CITIES: CityMarker[] = [
  { id: "berlin", name: "Berlin", country: "Deutschland", lat: 52.52, lng: 13.405 },
  { id: "london", name: "London", country: "Vereinigtes Königreich", lat: 51.5074, lng: -0.1278 },
  { id: "paris", name: "Paris", country: "Frankreich", lat: 48.8566, lng: 2.3522 },
  { id: "newyork", name: "New York", country: "USA", lat: 40.7128, lng: -74.006 },
  { id: "tokyo", name: "Tokio", country: "Japan", lat: 35.6762, lng: 139.6503 },
  { id: "sydney", name: "Sydney", country: "Australien", lat: -33.8688, lng: 151.2093 },
  { id: "riodejaneiro", name: "Rio de Janeiro", country: "Brasilien", lat: -22.9068, lng: -43.1729 },
  { id: "capetown", name: "Kapstadt", country: "Südafrika", lat: -33.9249, lng: 18.4241 },
  { id: "moscow", name: "Moskau", country: "Russland", lat: 55.7558, lng: 37.6173 },
  { id: "dubai", name: "Dubai", country: "Vereinigte Arabische Emirate", lat: 25.2048, lng: 55.2708 },
  { id: "singapore", name: "Singapur", country: "Singapur", lat: 1.3521, lng: 103.8198 },
  { id: "mumbai", name: "Mumbai", country: "Indien", lat: 19.076, lng: 72.8777 },
];
