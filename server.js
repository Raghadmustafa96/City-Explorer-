'use strict';
const express = require ('express');
require('dotenv').config();

const cors = require('cors');
const pg =require('pg');


const server = express();
server.use(cors());

const superAgent0 =require('superagent');
const PORT = process.env.PORT || 3030;
// const client = new pg.Client(process.env.DATABASE_URL);

const client = new pg.Client({ connectionString: process.env.DATABASE_URL,   ssl: { rejectUnauthorized: false } });


// Route definition
server.get('/', handleHomeRoute);
server.get('/location', handleLocation);
server.get('/weather', handleWeather );
server.get('/parks', handlePark );

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
    console.log(results.rows);
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

  // https://api.weatherbit.io/v2.0/forecast/daily?city=amman&key=01e6b09a24b640dd9610c10e0045bb58
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

  // const parkCode = request.query.parkCode;

  //https://developer.nps.gov/api/v1/parks?parkCode=acad&api_key=lUQX63yCYlb0s2d3kx5hAwScVfNNM4E4ZLNOYbYX

  // let url = `https://developer.nps.gov/api/v1/parks?parkCode=${parkCode}&api_key=${parkKey}`;
  let url = `https://developer.nps.gov/api/v1/parks?q=${cityName}&api_key=${parkKey}`;

  superAgent0.get(url).then(parkData =>{
    // console.log(parkData);
    let parkData0 = parkData.body.data.map(element => {
      const parkObject = new Park(element);
      return parkObject;
    });
    response.send(parkData0);
  }).catch(()=>{
    errorHandler('error in getting data from Api server ',request,response);
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
