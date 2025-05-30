import React, { useEffect, useState } from "react";
import "./App.css";

// == Public weather API info ==
// We'll use OpenWeatherMap (https://openweathermap.org/api) as the public API.
// Replace 'YOUR_API_KEY' below with your own OpenWeatherMap API key for local testing.
// For the demo, a placeholder will be present in the variable, shown with a demo warning if key is invalid.

// PUBLIC_INTERFACE
function App() {
  // State for city query, current location, error, and fresh weather data
  const [city, setCity] = useState("");
  const [searchText, setSearchText] = useState("");
  const [location, setLocation] = useState(null); // {lat, lon}
  const [weather, setWeather] = useState(null); // Current weather data
  const [forecast, setForecast] = useState([]); // Daily forecast array
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // OpenWeatherMap API key (for demonstration purpose, keep as 'demo' which shows warning in UI)
  const API_KEY = "demo"; // Replace with your OpenWeatherMap API key

  // == Use geolocation on first app load ==
  useEffect(() => {
    setError("");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
          });
          setCity(""); // Clear previous city search
        },
        (err) => {
          // fallback: No location
          setError("Could not access your location. Enter a city to search.");
        }
      );
    }
  }, []);

  // == Fetch weather when location or city changes ==
  useEffect(() => {
    async function fetchWeatherData(cityQuery, lat, lon) {
      setLoading(true);
      setWeather(null);
      setForecast([]);
      setError("");
      try {
        let urlCurrent = "";
        let urlForecast = "";
        if (cityQuery) {
          urlCurrent = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
            cityQuery
          )}&units=metric&appid=${API_KEY}`;
          urlForecast = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
            cityQuery
          )}&units=metric&appid=${API_KEY}`;
        } else if (lat && lon) {
          urlCurrent = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
          urlForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
        } else {
          setLoading(false);
          return;
        }
        // Fetch both current weather and forecast in parallel
        const [curRes, foreRes] = await Promise.all([
          fetch(urlCurrent),
          fetch(urlForecast),
        ]);
        if (!curRes.ok) throw new Error("Current weather not found");
        if (!foreRes.ok) throw new Error("Forecast not found");
        const currentWeather = await curRes.json();
        const forecastData = await foreRes.json();
        setWeather(currentWeather);
        setForecast(processForecast(forecastData));
      } catch (err) {
        setError(
          err.message.includes("401")
            ? "Invalid API key for weather service. Set your key in the source code."
            : "Could not fetch weather data. Please try another city."
        );
      }
      setLoading(false);
    }

    if (city) {
      fetchWeatherData(city, null, null);
    } else if (location) {
      fetchWeatherData("", location.lat, location.lon);
    }
    // eslint-disable-next-line
  }, [city, location]);

  // == Parse the OpenWeatherMap 3-hour forecast into daily summaries
  // Returns array of { date, temp_min, temp_max, icon, main }
  function processForecast(data) {
    if (!data || !data.list) return [];
    const days = {};
    data.list.forEach((entry) => {
      const dt = new Date(entry.dt * 1000);
      const dateStr = dt.toISOString().split("T")[0];
      if (!days[dateStr]) {
        days[dateStr] = {
          temps: [],
          icons: [],
          mains: [],
          date: dateStr,
        };
      }
      days[dateStr].temps.push(entry.main.temp);
      days[dateStr].icons.push(entry.weather[0].icon);
      days[dateStr].mains.push(entry.weather[0].main);
    });
    // Convert to array, skip today, take next 5 days
    const todayStr = new Date().toISOString().split("T")[0];
    return Object.values(days)
      .filter((d) => d.date !== todayStr)
      .slice(0, 5)
      .map((d) => ({
        date: d.date,
        temp_min: Math.round(Math.min(...d.temps)),
        temp_max: Math.round(Math.max(...d.temps)),
        icon: d.icons[Math.floor(d.icons.length / 2)],
        main: d.mains[Math.floor(d.mains.length / 2)],
      }));
  }

  // == Handle search form submit ==
  // PUBLIC_INTERFACE
  function handleSearch(e) {
    e.preventDefault();
    if (!searchText.trim()) {
      setError("Enter a city name");
      return;
    }
    setCity(searchText.trim());
    setLocation(null);
    setError("");
  }

  // == UI theme variables ==
  const PRIMARY = "#2196F3";
  const SECONDARY = "#E3F2FD";
  const ACCENT = "#FFC107";
  const CARD_BG = "#ffffff";
  const CARD_SHADOW =
    "0 2px 8px rgba(33,150,243,0.09), 0 1.5px 4px rgba(33, 150, 243, 0.04)";
  const BG = SECONDARY;

  // == Helper: format date as Day, MM/DD
  function formatDay(d) {
    const dt = new Date(d);
    return dt.toLocaleDateString("en-US", {
      weekday: "short",
      month: "numeric",
      day: "numeric",
    });
  }

  // == Helper: OpenWeather icon URL
  function getIconUrl(icon) {
    return `https://openweathermap.org/img/wn/${icon}@2x.png`;
  }

  return (
    <div
      className="app"
      style={{
        minHeight: "100vh",
        background: BG,
        color: "#102a43",
        fontFamily: "'Inter','Roboto','Helvetica Neue',Arial,sans-serif",
      }}
    >
      <nav
        className="navbar"
        style={{
          background: PRIMARY,
          borderBottom: `2px solid ${ACCENT}`,
          color: "#fff",
        }}
      >
        <div className="container" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="logo" style={{ gap: 12 }}>
            <span className="logo-symbol" style={{ color: ACCENT, fontSize: 24 }}>
              <svg height="24" width="24" viewBox="0 0 24 24" style={{verticalAlign:"middle"}}><circle cx="12" cy="12" r="8" fill={ACCENT} opacity="0.8"/><circle cx="16" cy="8" r="3.5" fill="#fff" opacity="0.7"/></svg>
            </span>
            <span style={{ fontWeight: 700, fontSize: "1.3rem" }}>WeatherWatch</span>
          </div>
        </div>
      </nav>

      <main
        style={{
          marginTop: 92,
          minHeight: "70vh",
          background: BG,
          paddingBottom: 48,
        }}
      >
        <div className="container" style={{ maxWidth: 480, margin: "0 auto" }}>
          <form
            onSubmit={handleSearch}
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 28,
              marginTop: 32,
              alignItems: "center",
            }}
            aria-label="Search Location"
          >
            <input
              aria-label="Enter city"
              type="text"
              placeholder="Enter city name"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                flex: 1,
                padding: "12px 18px",
                fontSize: "1rem",
                borderRadius: 7,
                border: `1.5px solid ${PRIMARY}`,
                background: "#fff",
                color: "#12214a",
                outline: "none",
                boxShadow: "0 1.5px 10px 0 rgba(33,150,243,0.06)",
              }}
            />
            <button
              type="submit"
              className="btn"
              style={{
                backgroundColor: PRIMARY,
                color: "#fff",
                borderRadius: 5,
                fontWeight: 600,
                fontSize: "1rem",
                padding: "12px 24px",
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Search
            </button>
          </form>
          {/* DEMO warning for public API key */}
          {API_KEY === "demo" && (
            <div
              style={{
                fontSize: "0.9rem",
                color: "#e53935",
                background: "#fffbe9",
                border: "1px solid #ffc107aa",
                padding: "7px 16px",
                borderRadius: 5,
                marginBottom: 15,
                lineHeight: 1.5,
              }}
            >
              <b>Warning:</b> Demo API key in use. Weather info may be unavailable or limited. For real results, use your own OpenWeatherMap Key in App.js.
            </div>
          )}
          {/* Error message */}
          {error && (
            <div
              style={{
                background: "#ffe1e1",
                color: "#b71c1c",
                border: "1.5px solid #ffaeae",
                borderRadius: 6,
                padding: "12px 12px",
                fontWeight: 500,
                marginBottom: 16,
              }}
              aria-live="polite"
            >
              {error}
            </div>
          )}

          {/* -- Weather Card -- */}
          <section>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                background: CARD_BG,
                color: "#08204f",
                boxShadow: CARD_SHADOW,
                borderRadius: 18,
                padding: "28px 20px 20px 20px",
                minHeight: 165,
                minWidth: 0,
                marginBottom: 17,
                position: "relative",
                zIndex: 1,
                transition: "box-shadow 0.2s",
              }}
            >
              {!loading && !weather && (
                <div
                  style={{
                    fontSize: "1.18rem",
                    color: "#5a6aa6",
                    textAlign: "center",
                  }}
                >
                  Enter a city or allow geolocation to view weather.
                </div>
              )}

              {loading && (
                <div
                  style={{
                    color: PRIMARY,
                    fontWeight: 600,
                    fontSize: "1.1rem",
                    margin: "32px 0",
                  }}
                >
                  Loading weather&hellip;
                </div>
              )}

              {weather && (
                <>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 10,
                      gap: 14,
                    }}
                  >
                    <img
                      src={getIconUrl(weather.weather[0].icon)}
                      alt={weather.weather[0].description}
                      style={{ width: 64, height: 64 }}
                    />
                    <div style={{ fontSize: 38, fontWeight: 700 }}>
                      {Math.round(weather.main.temp)}
                      <span style={{ fontWeight: 400, color: "#5aa1e6", fontSize: 22 }}>
                        &deg;C
                      </span>
                    </div>
                  </div>
                  <div style={{ marginBottom: 7, textTransform: "capitalize", fontSize: 20, fontWeight: 600 }}>
                    {weather.name}
                  </div>
                  <div style={{ marginBottom: 3 }}>
                    <span style={{ color: PRIMARY, marginRight: 7, fontWeight: 500 }}>{weather.weather[0].main}</span>
                    <span style={{ fontSize: "0.98rem", color: "#839dc9" }}>
                      {weather.weather[0].description}
                    </span>
                  </div>
                  <div style={{ fontSize: 15 }}>
                    Humidity:{" "}
                    <b style={{ color: "#577fa6" }}>{weather.main.humidity}%</b>
                    {"  "} | Wind:{" "}
                    <b style={{ color: "#607d8b" }}>{weather.wind.speed} m/s</b>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* -- Forecast Cards -- */}
          {forecast && forecast.length > 0 && (
            <section>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: "1.06rem",
                  color: "#2a588e",
                  margin: "0 0 13px 4px",
                }}
              >
                5-Day Forecast
              </div>
              <div
                style={{
                  display: "flex",
                  overflowX: "auto",
                  gap: 17,
                  paddingBottom: 6,
                }}
              >
                {forecast.map((d) => (
                  <div
                    key={d.date}
                    style={{
                      background: "#fff",
                      borderRadius: 14,
                      minWidth: 110,
                      boxShadow: "0 2px 6px rgba(33,150,243,0.08)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      padding: "17px 7px 11px 7px",
                      textAlign: "center",
                    }}
                  >
                    <div style={{ fontSize: 15, fontWeight: 600, color: "#1396ec", marginBottom: 0 }}>
                      {formatDay(d.date)}
                    </div>
                    <img
                      src={getIconUrl(d.icon)}
                      alt={d.main}
                      style={{ width: 38, height: 38, margin: "8px 0" }}
                    />
                    <div style={{ fontSize: 22, fontWeight: 600, color: PRIMARY }}>
                      {d.temp_max}&deg;C
                      <span style={{ fontWeight: 400, color: "#668" }}>/{d.temp_min}°</span>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#708aaa",
                        textTransform: "capitalize",
                      }}
                    >
                      {d.main}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* -- Attribution -- */}
          <div
            style={{
              marginTop: 46,
              textAlign: "center",
              fontSize: "1rem",
              color: "#6d809c",
            }}
          >
            <span>
              <a
                href="https://openweathermap.org/"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: PRIMARY,
                  textDecoration: "underline",
                  fontWeight: 500,
                }}
              >
                Weather by OpenWeatherMap
              </a>
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
