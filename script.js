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

// Smart Advice Generator Logic
function generateSmartAdvice(temp, rainChance, windSpeed) {
    if (rainChance >= 60) {
        return "🌧️ Aaj baarish ke asaar bohot zyada hain, bahar nikalte waqt chhata (umbrella) lena na bhoolen!";
    } else if (rainChance >= 30 && rainChance < 60) {
        return "🌦️ Halki baarish ho sakti hai, savdhani ke liye raincoat ya umbrella sath rakhein.";
    } else if (temp >= 38) {
        return "🔥 Bohot tezz garmi hai! Paani zyada peeyein aur dhoop se bachne ke liye sunglasses pehenen.";
    } else if (temp <= 12) {
        return "❄️ Thand kafi zyada hai! Garam kapde pehen kar hi bahar niklein.";
    } else if (windSpeed >= 25) {
        return "💨 Tez hawa chal rahi hai, gadi chalate waqt thodi savdhani bartein.";
    } else {
        return "😊 Mausam bilkul suhana hai! Outdoor activities ya ghumne ke liye badhiya din hai.";
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

// 2. Fetch Weather Data
async function fetchWeatherData(city) {
    const coords = await fetchCoordinates(city);
    if (!coords) return;

    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_probability_max&past_days=1&forecast_days=6&timezone=auto`;

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

    // Smart Weather Advice Update
    const adviceText = generateSmartAdvice(current.temperature_2m, rainChance, current.wind_speed_10m);
    const adviceElem = document.getElementById('weather-advice');
    if (adviceElem) {
        adviceElem.innerText = adviceText;
    }

    // Forecast Cards
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

// Unit Toggle Button Event
if (unitToggleBtn) {
    unitToggleBtn.addEventListener('click', () => {
        isCelsius = !isCelsius;
        unitToggleBtn.innerText = isCelsius ? 'Switch to °F' : 'Switch to °C';
        updateUI();
    });
}

// Event Listeners
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
