const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const unitToggleBtn = document.getElementById('unit-toggle-btn');

// State variables to manage unit and weather data
let isCelsius = true;
let currentRawData = null;
let currentCityName = '';

// WMO Weather Code Mapper (Code se Icon aur Description lane ke liye)
function getWeatherCondition(code) {
    if (code === 0) return { desc: 'Clear Sky', icon: 'fa-sun' };
    if (code >= 1 && code <= 3) return { desc: 'Partly Cloudy', icon: 'fa-cloud-sun' };
    if (code >= 45 && code <= 48) return { desc: 'Foggy', icon: 'fa-smog' };
    if (code >= 51 && code <= 67) return { desc: 'Rainy', icon: 'fa-cloud-rain' };
    if (code >= 71 && code <= 77) return { desc: 'Snowy', icon: 'fa-snowflake' };
    if (code >= 80 && code <= 82) return { desc: 'Heavy Rain', icon: 'fa-cloud-showers-heavy' };
    if (code >= 95) return { desc: 'Thunderstorm', icon: 'fa-cloud-bolt' };
    return { desc: 'Cloudy', icon: 'fa-cloud' };
}

// Temperature Convertor Helper Function (°C <-> °F)
function formatTemperature(celsiusVal) {
    if (isCelsius) {
        return `${Math.round(celsiusVal)}°C`;
    } else {
        const fahrenheitVal = (celsiusVal * 9) / 5 + 32;
        return `${Math.round(fahrenheitVal)}°F`;
    }
}

// 1. City Name se Latitude & Longitude fetch karna
async function fetchCoordinates(city) {
    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`;
        const response = await fetch(geoUrl);
        const data = await response.json();

        if (!data.results || data.results.length === 0) {
            alert('City not found! Please check the spelling.');
            return null;
        }

        const location = data.results[0];
        return {
            name: `${location.name}, ${location.country_code ? location.country_code.toUpperCase() : ''}`,
            lat: location.latitude,
            lon: location.longitude
        };
    } catch (error) {
        console.error("Geocoding Error:", error);
        alert("Failed to fetch location data.");
        return null;
    }
}

// 2. Open-Meteo API se Weather Data Fetch karna
async function fetchWeatherData(city) {
    const coords = await fetchCoordinates(city);
    if (!coords) return;

    // past_days=1 (Yesterday ke liye) aur forecast_days=6 (Today + Next 5 Days)
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&past_days=1&forecast_days=6&timezone=auto`;

    try {
        const response = await fetch(weatherUrl);
        const data = await response.json();

        // Save data globally
        currentRawData = data;
        currentCityName = coords.name;
        
        // Render Screen
        renderUI();
    } catch (error) {
        console.error("Weather API Error:", error);
        alert("Failed to fetch weather forecast.");
    }
}

// 3. UI Render/Update Logic
function renderUI() {
    if (!currentRawData) return;

    const data = currentRawData;

    // Set City Name
    document.getElementById('city-name').innerText = currentCityName;

    // Current Temp & Weather Condition
    const current = data.current;
    const condition = getWeatherCondition(current.weather_code);
    
    document.getElementById('temperature').innerText = formatTemperature(current.temperature_2m);
    document.getElementById('weather-desc').innerText = condition.desc;
    document.getElementById('main-icon').className = `fa-solid ${condition.icon}`;

    // Weather Metrics
    document.getElementById('humidity').innerText = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').innerText = `${current.wind_speed_10m} km/h`;

    // Today's Data (Index 0 = Yesterday, Index 1 = Today)
    const todayIndex = 1;
    const todayDaily = data.daily;

    const rainChance = todayDaily.precipitation_probability_max[todayIndex] ?? 0;
    document.getElementById('rain-chance').innerText = `${rainChance}%`;

    const sunriseTime = todayDaily.sunrise[todayIndex].split('T')[1];
    const sunsetTime = todayDaily.sunset[todayIndex].split('T')[1];
    document.getElementById('sunrise').innerText = sunriseTime;
    document.getElementById('sunset').innerText = sunsetTime;

    // Forecast List (Yesterday + Today + Next 4 Days)
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';

    const dailyDates = todayDaily.time;

    dailyDates.forEach((dateStr, index) => {
        const dateObj = new Date(dateStr);
        let dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (index === 0) dayLabel = 'Yesterday';
        if (index === 1) dayLabel = 'Today';

        const maxTemp = formatTemperature(todayDaily.temperature_2m_max[index]);
        const minTemp = formatTemperature(todayDaily.temperature_2m_min[index]);
        const dayCondition = getWeatherCondition(todayDaily.weather_code[index]);

        const card = document.createElement('div');
        card.className = `forecast-card ${index === 0 ? 'highlight' : ''}`;
        card.innerHTML = `
            <div class="day">${dayLabel}</div>
            <i class="fa-solid ${dayCondition.icon}"></i>
            <div class="temp">${maxTemp} / ${minTemp}</div>
        `;
        forecastContainer.appendChild(card);
    });
}

// 4. °C / °F Toggle Button Event Listener
if (unitToggleBtn) {
    unitToggleBtn.addEventListener('click', () => {
        isCelsius = !isCelsius; // Switch unit
        unitToggleBtn.innerText = isCelsius ? 'Switch to °F' : 'Switch to °C';
        renderUI(); // Re-render without hitting API again
    });
}

// Search Button Event
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherData(city);
});

// Enter Key Press Event
cityInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchWeatherData(city);
    }
});

// Default Load (Delhi Weather)
fetchWeatherData('Delhi');