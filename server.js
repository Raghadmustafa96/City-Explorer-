'use strict';
const express = require ('express');
require('dotenv').config();

const cors = require('cors');
const pg =require('pg');


const server = express();
server.use(cors());

var superAgent0 =require('superagent');

let client = '';
const PORT = process.env.PORT || 3030;

if(PORT == 3000 || PORT == 3030){
  client = new pg.Client(process.env.DATABASE_URL);
} else {
  client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
}

// Routes
server.get('/', handleHomeRoute);
server.get('/location', handleLocation);
server.get('/weather', handleWeather );
server.get('/parks', handlePark );
server.get('/yelp', handleYelp );
server.get('/movies', handleMovie );
server.use('*', notFoundRoute );
server.use(errorHandler);


// constructor
function Location (city , locationData) {
  this.search_query = city;
  this.formatted_query= locationData.display_name;
  this.latitude = locationData.lat;
  this.longitude = locationData.lon;
}

function Weather (WeatherData) {
  this.forecast = WeatherData.weather.description ;
  this.time = WeatherData.datetime;
}

function Park (parkData) {
  this.name = parkData.name ;
  this.address = parkData.address;
  this.fee = parkData.fee;
  this.description = parkData.description;
  this.url = parkData.url;
}

function Yelp (yelpData){
  this.name = yelpData.name;
  this.image_url = yelpData.image_url;
  this.price = yelpData.price;
  this.rating = yelpData.rating;
  this.url = yelpData.url;
}

function Movie (movieData){
  this.title = movieData.title;
  this.overview = movieData.overview;
  this.average_votes = movieData;
  this.total_votes = movieData.vote_count;
  this.image_url =`https://image.tmdb.org/t/p/w500${movieData.poster_path}`;
  this.popularity = movieData.popularity;
  this.released_on = movieData.popularity;
}


// function
function handleHomeRoute (request,response){
  response.send('go to home');
}

function handleLocation(request,response){
  const NameOfCity = request.query.city;

  let SQL = 'SELECT search_query FROM locations;';
  let sqlV = [];
  let allCity = [];

  client.query(SQL).then(results => {
    sqlV = results.rows;
    allCity = sqlV.map(element => {
      return element.search_query;
    });

    if (!allCity.includes(NameOfCity)) {
      let key = process.env.LocationKey;
      let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${NameOfCity}&format=json`;

      superAgent0.get(url).then(data => {
        const location = new Location(NameOfCity, data.body[0]);
        let SQL = 'INSERT INTO locations VALUES ($1,$2,$3,$4) RETURNING *;';
        let safeValues = [location.search_query, location.formatted_query, location.latitude, location.longitude];

        client.query(SQL, safeValues)
          .then((result) => {
            response.send(result.rows);
          });

        console.log('from API');
        response.send(location);
      }).catch(()=>{
        errorHandler('error in getting data from Api server ',request,response);
      });
    } else {
      let SQL = `SELECT * FROM locations WHERE search_query = '${NameOfCity}';`;
      client.query(SQL)
        .then(result=>{
          console.log('from dataBase');
          response.send(result.rows[0]);
        });
    }
  });
}

function handleWeather(request,response){
  let weatherKey = process.env.weatherKey;
  const cityName = request.query.search_query;

  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${weatherKey}`;

  superAgent0.get(url).then(weatherData =>{
    let weatherData0 = weatherData.body.data.map(element => {
      const weatherObject = new Weather(element);
      return weatherObject;
    });
    response.send(weatherData0);
  }).catch(()=>{
    errorHandler('error in getting data from Api server ',request,response);
  });
}

function handlePark(request,response){
  let parkKey = process.env.parkKey;
  const cityName = request.query.search_query;
  let url = `https://developer.nps.gov/api/v1/parks?q=${cityName}&api_key=${parkKey}`;

  superAgent0.get(url).then(parkData =>{
    let parkData0 = parkData.body.data.map(element => {
      const parkObject = new Park(element);
      return parkObject;
    });
    response.send(parkData0);
  }).catch(()=>{
    errorHandler('error in getting data from Api server ',request,response);
  });
}

function handleYelp(request,response){
  const cityName = request.query.search_query;
  const page = request.query.page;
  let yelp_key = process.env.yelpKey ;
  const numberPerPage = 5;
  const startIndex = ((page -1) * numberPerPage +1);

  let url = `https://api.yelp.com/v3/businesses/search?location=${cityName}&limit=${numberPerPage}&offset=${startIndex}`;

  let yelps = [];
  superAgent0.get(url).set('Authorization', `Bearer ${yelp_key}`)
    .then(yelpData =>{

      yelps = yelpData.body.businesses.map(element => {
        const yelpObject = new Yelp(element);
        return yelpObject;
      });
      response.send(yelps);
    });
}

//https://api.themoviedb.org/3/search/movie?api_key=<<api_key>>&query=whiplash&language=de-DE&region=

function handleMovie(request,response){
  const cityName = request.query.search_query;
  let movie_key = process.env.movieKey;

  let url = `https://api.themoviedb.org/3/search/movie?api_key=${movie_key}&query=${cityName}&language=de-DE&region=DE`;
  let movies = [];

  superAgent0.get(url).then(movieData =>{
    movies = movieData.body.results.map(element => {
      const movieObject = new Movie(element);
      return movieObject;
    });
    response.send(movies);
  });
}

function notFoundRoute(req,res){
  res.status(404).send('Error message // The Route not found');
}

function errorHandler(error,req,res){
  res.status(500).send(error);
}

client.connect().then(()=>{
  server.listen(PORT, ()=>{
    console.log(`Listening on PORT ${PORT}`);

  });

});


// Finally the End   ^_^  >_<
