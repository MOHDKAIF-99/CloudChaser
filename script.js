const cityInput = document.getElementById('city-input');
const searchBtn = document.getElementById('search-btn');
const unitToggleBtn = document.getElementById('unit-toggle-btn');

let isCelsius = true;
let currentWeatherData = null;
let currentLocationName = '';

// WMO Weather Code Mapper
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

// English Smart Advice Generator
function generateSmartAdvice(temp, rainChance, windSpeed) {
    if (rainChance >= 60) {
        return "🌧️ High chance of rain today! Don't forget to carry an umbrella when stepping out.";
    } else if (rainChance >= 30 && rainChance < 60) {
        return "🌦️ Light rain expected. Keep a raincoat or umbrella handy just in case.";
    } else if (temp >= 38) {
        return "🔥 Extreme heat today! Stay hydrated and wear sunglasses outdoors.";
    } else if (temp <= 12) {
        return "❄️ It's quite cold outside! Make sure to wear warm clothes.";
    } else if (windSpeed >= 25) {
        return "💨 Strong winds expected today. Exercise caution while driving.";
    } else {
        return "😊 Pleasant weather today! Perfect time for outdoor activities.";
    }
}

// Dynamic Background & Animations Controller
function applyDynamicBackground(weatherCode, isDay) {
    const body = document.body;
    const bgEffects = document.getElementById('bg-effects');
    bgEffects.innerHTML = ''; // Clear previous animations
    body.className = '';      // Clear previous classes

    // Rain / Heavy Rain / Thunderstorm
    if (weatherCode >= 51 && weatherCode <= 95) {
        body.classList.add('theme-rain');
        createRainAnimation();
    } 
    // Night Time
    else if (isDay === 0) {
        body.classList.add('theme-night');
        createStarsAnimation();
    } 
    // Cloudy / Foggy Day
    else if (weatherCode >= 1 && weatherCode <= 48) {
        body.classList.add('theme-cloudy');
    } 
    // Sunny Day
    else {
        body.classList.add('theme-sunny');
    }
}

// Rain Drops Generator
function createRainAnimation() {
    const bgEffects = document.getElementById('bg-effects');
    for (let i = 0; i < 40; i++) {
        const drop = document.createElement('div');
        drop.className = 'raindrop';
        drop.style.left = `${Math.random() * 100}%`;
        drop.style.animationDuration = `${0.4 + Math.random() * 0.4}s`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        bgEffects.appendChild(drop);
    }
}

// Twinkling Stars Generator
function createStarsAnimation() {
    const bgEffects = document.getElementById('bg-effects');
    for (let i = 0; i < 50; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.animationDuration = `${1 + Math.random() * 2}s`;
        star.style.animationDelay = `${Math.random() * 3}s`;
        bgEffects.appendChild(star);
    }
}

// 1. Fetch Coordinates
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

// 2. Fetch Weather Data (With is_day parameter)
async function fetchWeatherData(city) {
    const coords = await fetchCoordinates(city);
    if (!coords) return;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&past_days=1&forecast_days=6&timezone=auto`;

    try {
        const response = await fetch(weatherUrl);
        const data = await response.json();

        currentWeatherData = data;
        currentLocationName = coords.name;

        updateUI();
    } catch (error) {
        console.error("Weather API Error:", error);
        alert("Failed to fetch weather forecast.");
    }
}

// Temperature Conversion Helper
function formatTemp(tempC) {
    if (isCelsius) {
        return `${Math.round(tempC)}°C`;
    } else {
        const tempF = (tempC * 9/5) + 32;
        return `${Math.round(tempF)}°F`;
    }
}

// 3. Update UI
function updateUI() {
    if (!currentWeatherData) return;
    const data = currentWeatherData;

    document.getElementById('city-name').innerText = currentLocationName;

    const current = data.current;
    const condition = getWeatherCondition(current.weather_code);
    
    document.getElementById('temperature').innerText = formatTemp(current.temperature_2m);
    document.getElementById('weather-desc').innerText = condition.desc;
    document.getElementById('main-icon').className = `fa-solid ${condition.icon}`;

    document.getElementById('humidity').innerText = `${current.relative_humidity_2m}%`;
    document.getElementById('wind-speed').innerText = `${current.wind_speed_10m} km/h`;

    const todayIndex = 1;
    const todayDaily = data.daily;

    const rainChance = todayDaily.precipitation_probability_max[todayIndex] ?? 0;
    document.getElementById('rain-chance').innerText = `${rainChance}%`;

    const sunriseTime = todayDaily.sunrise[todayIndex].split('T')[1];
    const sunsetTime = todayDaily.sunset[todayIndex].split('T')[1];
    document.getElementById('sunrise').innerText = sunriseTime;
    document.getElementById('sunset').innerText = sunsetTime;

    // Apply Dynamic Background Theme & Animation
    applyDynamicBackground(current.weather_code, current.is_day);

    // Smart Weather Advice Update
    const adviceText = generateSmartAdvice(current.temperature_2m, rainChance, current.wind_speed_10m);
    const adviceElem = document.getElementById('weather-advice');
    if (adviceElem) {
        adviceElem.innerText = adviceText;
    }

    // Forecast Cards (Yesterday + Next 5 Days)
    const forecastContainer = document.getElementById('forecast-container');
    forecastContainer.innerHTML = '';

    todayDaily.time.forEach((dateStr, index) => {
        const dateObj = new Date(dateStr);
        let dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
        
        if (index === 0) dayLabel = 'Yesterday';
        if (index === 1) dayLabel = 'Today';

        const maxTemp = formatTemp(todayDaily.temperature_2m_max[index]);
        const minTemp = formatTemp(todayDaily.temperature_2m_min[index]);
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

// Unit Toggle Event Listener
if (unitToggleBtn) {
    unitToggleBtn.addEventListener('click', () => {
        isCelsius = !isCelsius;
        unitToggleBtn.innerText = isCelsius ? 'Switch to °F' : 'Switch to °C';
        updateUI();
    });
}

// Search Listeners
searchBtn.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) fetchWeatherData(city);
});

cityInput.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        const city = cityInput.value.trim();
        if (city) fetchWeatherData(city);
    }
});


// Initial Load
fetchWeatherData('Delhi'); 