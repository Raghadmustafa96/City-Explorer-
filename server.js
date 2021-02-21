'use strict';

const express = require ('express');
require('dotenv').config();

//CORS: Cross Origin Resource Sharing
const cors = require('cors');

const server = express();
server.use(cors());

const PORT = process.env.PORT || 3030;
// 3000 localhost port
// 3030 if .env file have some problem
// Heroku port

server.listen(PORT, ()=>{
  console.log(`Listening on PORT ${PORT}`);
});

// when try to handle any route localhost:3000/ server will respond with 'go to home'
server.get('/',(request,response)=>{
  response.send('go to home');
});

// when try to request or route /location [localhost:3000/location] server will respond with the data from location.json file
server.get('/location',(request,response)=>{
  const locationData = require('./data/location.json');
  const locationObj = new Location(locationData);
  response.send(locationObj);
});

function Location (locationData) {
  this.search_query = 'Lynnwood';
  this.formatted_query= locationData[0].display_name;
  this.latitude = locationData[0].lat;
  this.longitude = locationData[0].lon;
}

// when try to request or route /weather [localhost:3000/weather] server will respond with the data from weather.json file
server.get('/weather',(request,response)=>{
  const allDataWeather = require('./data/weather.json');
  const weatherData = [];
  allDataWeather.data.forEach(element => {
    const weatherObject = new Weather(element);
    weatherData.push(weatherObject);
  });
  response.send(weatherData);
});

function Weather (WeatherData) {
  this.forecast = WeatherData.weather.description ;
  this.time = WeatherData.datetime;
}

// when try to request or route something not related to server [localhost:3000/dfghhj] server will respond  with this message
server.use('*',(req,res)=>{
  res.status(404).send('Error message // The Route not found');
});
