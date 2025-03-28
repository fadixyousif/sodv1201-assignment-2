$(function() {
    // check if the page is weather page
    if ($('.weather-page').length > 0) {
        // Function to fetch and display weather data
        async function fetchWeatherData(city, province) {
            // Clear any previous error messages
            $('.weather-info').removeClass('error');

            // Check if data exists in localStorage
            const cachedWeather = localStorage.getItem(`weather_${city}_${province}`);
            if (cachedWeather) {
                const data = JSON.parse(cachedWeather);
                console.log('Using cached weather data:', data);

                // Update UI with cached data
                updateWeatherUI(data);
                return;
            }

            try {
                // fetch weather data from API with error handling and hidden api key
                const response = await fetch(`https://api.weatherapi.com/v1/current.json?q=${city}, ${province}&key=${weather_config.key}`);
                
                // check if response is not ok them throw an error
                if (!response.ok) {
                    throw new Error('Weather data could not be retrieved');
                }

                // Parse the response data
                const data = await response.json();

                // Store data in localStorage
                localStorage.setItem(`weather_${city}_${province}`, JSON.stringify(data));

                // Update UI with fetched data
                updateWeatherUI(data);
            } catch (error) {
                // Handle errors and display error message
                console.error('Error fetching weather data:', error);
                
                // display error message in the UI
                $('.weather > .weather-content > .weather-info').html(`
                    <h1>Error</h1>
                    <h2>Unable to fetch weather data</h2>
                    <h3>Please try again later</h3>
                    <p>${error.message}</p>
                `).addClass('error');
            }
        }

        // Function to update the weather UI
        function updateWeatherUI(data) {
            // Replace the weather data in the UI
            $('.weather > .weather-content > .weather-image').html(`
                <img src="${data.current.condition.icon.replace('64x64', '128x128')}" alt="${data.current.condition.text}">
            `);

            $('.weather > .weather-content > .weather-info').html(`
                <h1>${data.location.name}</h1>
                <h2>${data.current.condition.text}</h2>
                <h3>${data.current.temp_c}°C</h3>
                <p>Humidity: ${data.current.humidity}% | Wind: ${data.current.wind_kph} km/h</p>
                <p>Last Updated: ${data.location.localtime}</p>
            `);
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
    }

    // check if the page is exchange page
    if ($('.exchange-page').length > 0) {
        // prepare the exchange variables for the exchange page
        const $fromCurrency = $('#fromCurrency');
        const $toCurrency = $('#toCurrency');
        const $amount = $('#amount');
        const $convertButton = $('#convert');
        const $result = $('#result');

        // Set default amount to 1
        $amount.val(1);
    
        // Fetch currency data and populate dropdowns
        async function populateCurrencies() {
            // Check if data exists in localStorage
            const cachedRates = localStorage.getItem('exchange_rates');

            // If cached data exists, use it
            if (cachedRates) {
                // Parse the cached data
                const data = JSON.parse(cachedRates);
                // Log the cached data for debugging
                console.log('Using cached exchange rates:', data);

                // Populate the dropdowns with cached data
                populateDropdowns(data);
                return;
            }
        
            // try with error handling
            try {
                // Fetch exchange rates from API with error handling and hidden api key
                const response = await fetch(`https://v6.exchangerate-api.com/v6/${exchange_config.key}/latest/USD`);

                // check if response is not ok them throw an error
                if (!response.ok) {
                    throw new Error('Exchange data could not be retrieved');
                }

                // parse the response data
                const data = await response.json();

                // Store data in localStorage
                localStorage.setItem('exchange_rates', JSON.stringify(data));

                // Populate the dropdowns with fetched data
                populateDropdowns(data);
            } catch (error) {
                // Handle errors and display error message
                console.error('Error fetching exchange rates:', error);
            }
        }

        // Populate dropdowns with currency options
        function populateDropdowns(data) {
            // Get the list of currencies from the data
            const currencies = Object.keys(data.conversion_rates);

            // Save the currently selected values
            const currentFromCurrency = $fromCurrency.val();
            const currentToCurrency = $toCurrency.val();

            // default variables to save options
            const currencyOptions = [];
            currencies.forEach(currency => {
                currencyOptions.push(`<option value="${currency}">${currency}</option>`);
            });

            // Populate the dropdowns
            $fromCurrency.html(`<optgroup label="From Currency">${currencyOptions.join('')}</optgroup>`);
            $toCurrency.html(`<optgroup label="To Currency">${currencyOptions.join('')}</optgroup>`);

            // Restore the previously selected values
            if (currentFromCurrency) {
                $fromCurrency.val(currentFromCurrency);
            } else {
                $fromCurrency.val('CAD'); // Default to CAD if no value is selected
            }

            if (currentToCurrency) {
                $toCurrency.val(currentToCurrency);
            } else {
                $toCurrency.val('USD'); // Default to USD if no value is selected
            }
        }
    
        // Convert currency function
        async function convertCurrency() {
            // try with error handling
            try {
                // getting the values from the dropdowns and amount input
                const fromCurrency = $fromCurrency.val();
                const toCurrency = $toCurrency.val();

                // empty rate variable to save the exchange rate
                let rate;

                // Retrieve the last conversion details from localStorage
                const lastConversion = JSON.parse(localStorage.getItem('last_conversion'));

                // Check if the current conversion matches the last one
                if (lastConversion && lastConversion.fromCurrency === fromCurrency && lastConversion.toCurrency === toCurrency) {
                    console.log('Using saved exchange rate:', lastConversion.rate);
                    rate = lastConversion.rate; // Use the saved exchange rate
                } else {
                    // Fetch the latest exchange rate
                    const response = await fetch(`https://v6.exchangerate-api.com/v6/${exchange_config.key}/latest/${fromCurrency}`);
                    // check if response is not ok them throw an error
                    if (!response.ok) {
                        throw new Error('Exchange data could not be retrieved');
                    }
                    // Parse the response data
                    const data = await response.json();

                    // Store data in localStorage
                    rate = data.conversion_rates[toCurrency];

                    // Save the current conversion details in localStorage
                    localStorage.setItem('last_conversion', JSON.stringify({
                        fromCurrency,
                        toCurrency,
                        rate
                    }));
                }

                // Perform the currency conversion
                const convertedAmount = ($amount.val() * rate).toFixed(2);

                // Display the result
                $result.html(`<div class="exchange-rate">${$amount.val()} ${fromCurrency} = <strong>${convertedAmount} ${toCurrency}</strong></div>`);
            } catch (error) {
                // Handle errors and display error message
                console.error('Error converting currency:', error);
                $result.html('<p>Error converting currency. Please try again.</p>');
            }
        }
    
        // Update exchange rate display
        async function updateExchangeRate() {
            // Empty rate variable to save the exchange rate
            let rate; // Default exchange rate

            try {
                // Fetch the latest exchange rate for the selected currencies
                const response = await fetch(`https://v6.exchangerate-api.com/v6/${exchange_config.key}/latest/${$fromCurrency.val()}`);
                
                // Check if the response is not OK, then throw an error
                if (!response.ok) {
                    throw new Error('Exchange data could not be retrieved');
                }

                // Parse the response data
                const data = await response.json();

                // Dynamically calculate the exchange rate
                const fromRate = data.conversion_rates[$fromCurrency.val()];
                const toRate = data.conversion_rates[$toCurrency.val()];
                
                // Calculate the exchange rate based on the selected currencies
                if (fromRate && toRate) {
                    rate = toRate / fromRate; // Adjust the rate based on the selected currencies
                }

                // Store the latest exchange rates in localStorage for future use
                localStorage.setItem('exchange_rates', JSON.stringify(data));

                // Display the exchange rate
                console.log('Using latest exchange rate:', rate);
            } catch (error) {
                console.error('Error fetching exchange rate:', error);

                // Fallback to cached data if available
                const cachedRates = localStorage.getItem('exchange_rates');
                // Check if cached data exists
                if (cachedRates) {
                    // Parse the cached data
                    const data = JSON.parse(cachedRates);
                    // get the exchange rate from the cached data
                    const fromRate = data.conversion_rates[$fromCurrency.val()];
                    const toRate = data.conversion_rates[$toCurrency.val()];

                    // Calculate the exchange rate based on the selected currencies
                    if (fromRate && toRate) {
                        rate = toRate / fromRate;
                    }
                    // Display the cached exchange rate
                    console.log('Using cached exchange rate as fallback:', rate);
                } else {
                    // If no cached data is available, display an error message
                    $('#exchange-rate-display').html('<p>Error fetching exchange rate</p>');
                    return;
                }
            }

            // Display the exchange rate
            displayExchangeRate(rate);
        }

        // Function to display the exchange rate
        function displayExchangeRate(rate) {
            $('#exchange-rate-display').html(`
                <p>1 ${$fromCurrency.val()} = <strong>${rate.toFixed(4)} ${$toCurrency.val()}</strong></p>
            `);
        }
    
        // Initialize dropdowns and call updateExchangeRate after they are populated
        populateCurrencies().then(() => {
            const lastConversion = JSON.parse(localStorage.getItem('last_conversion'));

            if (lastConversion) {
                // Set the dropdowns to the last conversion values
                $fromCurrency.val(lastConversion.fromCurrency);
                $toCurrency.val(lastConversion.toCurrency);

                // Display the last exchange rate
                displayExchangeRate(lastConversion.rate);
            } else {
                // If no last conversion, update the exchange rate with default values
                updateExchangeRate();
            }
        });
    
        // Event listener for conversion
        $convertButton.on('click', convertCurrency);

        // Modify event listeners to update the exchange rate dynamically
        $fromCurrency.on('change', function () {
            updateExchangeRate(); // Only update the exchange rate
        });

        $toCurrency.on('change', function () {
            updateExchangeRate(); // Only update the exchange rate
        });
    
    }
});