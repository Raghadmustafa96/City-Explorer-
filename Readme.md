# city_explorer_api

**Author**: Raghad Mustafa

building a stand-alone back end that will interact with a static front end. 
in lab 6, we send requests or routes for the server, and then the server will send a response ( from data on JSON file ).


* The first Route will try to send   /location  request, the server will respond  with this :

        {
            "search_query": "Lynnwood",
            "formatted_query": "Lynnwood, Snohomish County, Washington, USA",
            "latitude": "47.8278656",
            "longitude": "-122.3053932"
        }

* The second Route will try to send   /weather request, the server will respond  with this :

        [
            {
            "forecast": "Few clouds",
            "time": "2020-04-13"
            },
            {
            "forecast": "Few clouds",
            "time": "2020-04-14"
            },
            {
            "forecast": "Scattered clouds",
            "time": "2020-04-15"
            },
            {
            "forecast": "Few clouds",
            "time": "2020-04-16"
            },
            {
            "forecast": "Broken clouds",
            "time": "2020-04-17"
            }
        ]

* The third Route will try to send   /  route not found in server, the server will respond  with this message:

        Error message // The Route not found