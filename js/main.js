$(function(){
    // Function to fetch and display weather data
    function fetchWeatherData(city, province) {
        // Clear any previous error messages
        $('.weather-info').removeClass('error');

        fetch(`https://api.weatherapi.com/v1/current.json?q=${city}, ${province}&key=${weather_config.key}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Weather data could not be retrieved');
            }
            return response.json();
        })
        .then(data => {
            // Update weather image
            $('.weather > .weather-content > .weather-image').html(`
                <img src="${data.current.condition.icon.replace('64x64', '128x128')}" alt="${data.current.condition.text}">
            `);

            // Update weather information
            $('.weather > .weather-content > .weather-info').html(`
                <h1>${data.location.name}</h1>
                <h2>${data.current.condition.text}</h2>
                <h3>${data.current.temp_c}°C</h3>
                <p>Humidity: ${data.current.humidity}% | Wind: ${data.current.wind_kph} km/h</p>
                <p>Last Updated: ${data.location.localtime}</p>
            `);
        })
        .catch(error => {
            // Handle errors
            console.error('Error fetching weather data:', error);
            $('.weather > .weather-content > .weather-info').html(`
                <h1>Error</h1>
                <h2>Unable to fetch weather data</h2>
                <h3>Please try again later</h3>
                <p>${error.message}</p>
            `).addClass('error');
        });
    }

    // Get initial city and province
    const albertaElement = $('#alberta');
    const province = albertaElement.attr('name');
    const initialCity = albertaElement.val();

    // Fetch initial weather data
    fetchWeatherData(initialCity, province);

    // Refresh button click handler
    $('#refresh-weather').on('click', function() {
        const currentCity = $('#alberta').val();
        fetchWeatherData(currentCity, province);
    });

    // City change handler
    $('#alberta').on('change', function() {
        const selectedCity = $(this).val();
        fetchWeatherData(selectedCity, province);
    });
});