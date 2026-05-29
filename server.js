const express = require('express');
const app = express();

const AUTHOR_NAME = "Kinga Kowalska"; 
const PORT = process.env.PORT || 8080;

// 1 a.
const startDate = new Date().toLocaleString('pl-PL', { timeZone: 'Europe/Warsaw' });
console.log(`Data uruchomienia: ${startDate}`);
console.log(`Autor: ${AUTHOR_NAME}`);
console.log(`Aplikacja nasłuchuje na porcie TCP: ${PORT}`);

const allCitiesCoords = {
    "Warszawa": { lat: 52.2298, lon: 21.0118 },
    "Lublin": { lat: 51.25, lon: 22.5667 },
    "London": { lat: 51.5085, lon: -0.1257 },
    "Manchester": { lat: 53.4808, lon: -2.2426 }
};


app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="pl">
        <head>
            <meta charset="UTF-8">
            <title>Pogoda</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                select, button { padding: 5px; margin: 5px 0; font-size: 16px; }
            </style>
            <script>
                const citiesData = {
                    "pl": ["Warszawa", "Lublin"],
                    "uk": ["London", "Manchester"]
                };
                function updateCities() {
                    const countrySelect = document.getElementById("country");
                    const citySelect = document.getElementById("city");
                    const submitBtn = document.getElementById("submitBtn");
                    
                    const selectedCountry = countrySelect.value;
                
                    citySelect.innerHTML = '<option value="" disabled selected>-- Wybierz miasto --</option>';
                    
                    if (selectedCountry && citiesData[selectedCountry]) {
                        citiesData[selectedCountry].forEach(city => {
                            citySelect.innerHTML += \`<option value="\${city}">\${city}</option>\`;
                        });
                        citySelect.disabled = false;
                        submitBtn.disabled = false;
                    } else {
                        citySelect.disabled = true;
                        submitBtn.disabled = true;
                    }
                }
            </script>
        </head>
        <body>
            <h1>Wybierz lokalizację</h1>
            <form action="/weather" method="GET">
                <label for="country">Kraj:</label><br>
                <select id="country" name="country" onchange="updateCities()">
                    <option value="" disabled selected>-- Wybierz kraj --</option>
                    <option value="pl">Polska</option>
                    <option value="uk">Wielka Brytania</option>
                </select>
                
                <br><br>
                
                <label for="city">Miasto:</label><br>
                <select id="city" name="city" disabled>
                    <option value="" disabled selected>Najpierw wybierz kraj</option>
                </select>
                
                <br><br>
                <button id="submitBtn" type="submit" disabled>Sprawdź aktualną pogodę</button>
            </form>
        </body>
        </html>
    `);
});

app.get('/weather', async (req, res) => {
    const cityName = req.query.city;
    const coords = allCitiesCoords[cityName];

    if (!coords) {
        return res.status(404).send('<h2>Nieznane miasto! <a href="/">Powrót</a></h2>');
    }

    try {
        //API Open-Meteo
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current_weather=true`;
        
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Błąd API");
        
        const data = await response.json();
        const weather = data.current_weather;

        res.send(`
            <!DOCTYPE html>
            <html lang="pl">
            <head>
                <meta charset="UTF-8">
                <title>Pogoda: ${cityName}</title>
                <style>body { font-family: Arial, sans-serif; margin: 40px; }</style>
            </head>
            <body>
                <h2>Aktualna pogoda dla: <span style="color: blue;">${cityName}</span></h2>
                <ul>
                    <li><strong>Temperatura:</strong> ${weather.temperature} °C</li>
                    <li><strong>Prędkość wiatru:</strong> ${weather.windspeed} km/h</li>
                    <li><strong>Kierunek wiatru:</strong> ${weather.winddirection}°</li>
                    <li><strong>Czas pomiaru:</strong> ${weather.time.replace('T', ' ')}</li>
                </ul>
                <br>
                <a href="/">Powrót do wyboru miasta</a>
            </body>
            </html>
        `);
    } catch (error) {
        console.error("Błąd podczas pobierania pogody:", error);
        res.status(500).send(`
            <h2>Wystąpił błąd podczas łączenia z serwisem pogodowym.</h2>
            <p>Sprawdź logi kontenera.</p>
            <a href="/">Powrót</a>
        `);
    }
});

app.listen(PORT, '0.0.0.0');