/*
Title: Il suono del tempo
Date: 15/01/2022
Author: Samuele Albani

The program requires internet connection and sound.

N.B.
WMO Weather interpretation codes (WW)
Code        |	Description
0	          | Clear sky
1, 2, 3	    |  Mainly clear, partly cloudy, and overcast
45, 48	    |  Fog and depositing rime fog
51, 53, 55 	|  Drizzle: Light, moderate, and dense intensity
56, 57	    |  Freezing Drizzle: Light and dense intensity
61, 63, 65	|  Rain: Slight, moderate and heavy intensity
66, 67	    |  Freezing Rain: Light and heavy intensity
71, 73, 75	|  Snow fall: Slight, moderate, and heavy intensity
77	        |  Snow grains
80, 81, 82  | 	Rain showers: Slight, moderate, and violent
85, 86	    |   Snow showers slight and heavy
95 *	      |   Thunderstorm: Slight or moderate
96, 99 *	  |  Thunderstorm with slight and heavy hail
 */
let canvas;

let weatherData;
const api = 'https://archive-api.open-meteo.com/v1/archive?';
const city = 'latitude=45.46&longitude=9.19'; // LONDON
const period = '&start_date=2009-10-01&end_date=2015-12-31';
const weatherVariables = '&hourly=temperature_2m,relativehumidity_2m,weathercode,precipitation,windspeed_10m';

let counter = 0;
let weatherStates = [];
let amps = [];
let latency = false;

let numOfVisibleData;
let offsetX;

let precipitationRange;

let prevState;
let mainOsc;
let noiseOsc;
let cloudOsc;
let amModOsc;
let vibrato;
let reverb;
let cVerb;
let sound;

let backgroundColor;
let myFont;
const daysNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

let emitter;

let interval = 80; //  data reading speed in ms

function preload() {
  soundFormats('wav', 'mp3');
  cVerb = createConvolver('assets/sounds/bx-spring.mp3');
  sound = loadSound('assets/sounds/piano-slamming-close.wav');
  myFont = loadFont(('assets/fonts/CrystalC/CrystalC Regular/CrystalC Regular.otf'));
}

function setup() {
  canvas = createCanvas(720, 1280);
  canvas.parent("sketch-container"); //move our canvas inside this HTML element
  document.oncontextmenu = () => false;


  numOfVisibleData = 50;
  offsetX = width / numOfVisibleData;

  backgroundColor = color(0);
  background(backgroundColor);

  emitter = new Emitter(); // create particle emitter

  setupSounds(); // setup oscillators and sound effects

  weatherAsk(); // API data request
}

function windowResized() {

  if (windowWidth < 600) {
    resizeCanvas(windowWidth, windowWidth);
  } else if (canvas.width != 600) {
    resizeCanvas(600, 600);
  }
  offsetX = width / numOfVisibleData;
}

function draw() {
  if (latency) { // if the system is slow
    fill(255, 0, 0);
    rect(10, 10, 50, 50);
  }

  if (weatherData) { // if data received
    // set the visuals
    setVisualStatus();
    background(backgroundColor);

    // display texts
    displayTextData();

    // display visuals
    displayVisualData();

    // display and update particles
    emitter.update();
    emitter.display();

  } else {
    textAlign(CENTER, CENTER);
    fill(255);
    textSize(30);
    text('LOADING DATA...', width / 2, height / 2);
  }
}


/**----------------------------------------------- */
/// SOUND functions
function setupSounds() {
  /**
   * based on the article "Synthesizing and analyzing sound" by Allison Parrish
   * https://creative-coding.decontextualize.com/synthesizing-analyzing-sound/
  */
  
  /// wind state oscillator
  noiseOsc = new p5.Noise();
  noiseOsc.amp(0.5);
  // effects
  delay1 = new p5.Delay();
  delay2 = new p5.Delay();
  delay1.process(noiseOsc, 0.4, .7, 3300);
  delay2.process(noiseOsc, 0.33, .5, 5300);

  /// cloud state oscillator
  reverb = new p5.Reverb();

  vibrato = new p5.Oscillator();
  vibrato.freq(10);
  vibrato.amp(0.6);
  vibrato.disconnect(); // disconnect from audio output
  vibrato.start();

  amModOsc = new p5.Oscillator();
  amModOsc.freq(4);
  amModOsc.add(1);
  amModOsc.amp(0.2);
  amModOsc.disconnect(); // disconnect from audio output
  amModOsc.start();

  cloudOsc = new p5.Oscillator();
  cloudOsc.setType('sine');
  cloudOsc.amp(amModOsc); // connect amModOsc to amplitude
  cloudOsc.freq(440);
  cloudOsc.freq(vibrato); // connect vibrato to freq

  reverb.process(cloudOsc, 3, 2);
  reverb.drywet(0.5);

  /// apply convolutional reverb to the sample for the storm state
  cVerb.process(sound);

  /// create main oscillator
  mainOsc = new p5.Oscillator();
  mainOsc.setType('sine');
  mainOsc.amp(0.5);
  mainOsc.freq(440);
}

function playSample() {
  sound.rate(random(0.99, 3));
  sound.setVolume(5);
  sound.play();
}

/**
 * this function trigger the sound every 80ms
 * 
 * this solution checks and fixes latency
 * based on https://stackoverflow.com/a/29972322
 */
let expected = Date.now() + interval;
setTimeout(step, interval);
function step() {
  let dt = Date.now() - expected; // the drift (positive for overshooting)
  if (dt > interval) { // if system is too slow
    console.log('latency!');
    latency = true;
  } else {
    latency = false;
  }

  if (weatherData) { // if weather data received

    // change note when the weather state changes
    if (prevState != weatherStates[counter]) { 
      mainOsc.freq(midiToFreq(random(50, 127)));
    }

    mainOsc.amp(amps[counter]); // apply amplitude according temperature

    // switch between instruments according current weather status
    switch (weatherStates[counter]) {
      case 6:
        noiseOsc.start();
        mainOsc.stop();
        setTimeout(switchOffNoiseOsc, random(300, 1300));
        break;

      case 0:
      case 1:
      case 4:
        cloudOsc.start();
        break;

      case 2:
        playSample();
        if (cloudOsc.started) {
          cloudOsc.stop();
        }
        if (mainOsc.started) {
          mainOsc.stop();
        }
        break;

      default:
        if (cloudOsc.started) {
          cloudOsc.stop(); // stop if started in order to retrigger the cloudOsc every step while playing
        }
        break;
    }
    prevState = weatherStates[counter];
    counter = (counter + 1) % weatherStates.length;
  }
  expected += interval;
  setTimeout(step, Math.max(0, interval - dt)); // take into account drift
}

/* stop the noise oscillator and restart the main oscillator */
function switchOffNoiseOsc() { 
  noiseOsc.stop();
  mainOsc.start();
}
///[end] SOUND functions


/**----------------------------------------------- */
/// API functions
/*
  API system based on the series of tutorials 
  by Daniel Shiffman entitled "10: Working with data" 
  https://youtu.be/6mT3r8Qn1VY
*/

/* this function requires data from open-meteo.com */
function weatherAsk() {
  let url = api + city + period + weatherVariables;
  loadJSON(url, gotData);
}

/* the function to execute on data received  */
function gotData(data) {
  weatherData = data;
  initNotes();
  mainOsc.start();
}

/* 
  this function creates arrays of frequencies and 
  amplitudes from data received
*/
function initNotes() {
  // find ranges of temperature and precipitation (useful for map functions)
  let rangeTemp = {
    min: getMin(weatherData.hourly.temperature_2m),
    max: getMax(weatherData.hourly.temperature_2m)
  }
  precipitationRange = {
    min: 0,
    max: getMax(weatherData.hourly.precipitation),
  }

  // iterate through data and transform values in amplitudes and states
  for (let i = 0; i < weatherData.hourly.time.length; i++) {

    // temperature defines amplitude modulation
    let temp = weatherData.hourly.temperature_2m[i];
    fill(255);
    let amp = map(temp, rangeTemp.min, rangeTemp.max, 0, 1);
    amps.push(amp);

    // weather condition (on weathercode) defines the state
    // based on WMO Weather interpretation codes (WW)
    // (see legend on top of the program)
    let weatherCode = weatherData.hourly.weathercode[i];
    let windSpeed = weatherData.hourly.windspeed_10m[i];
    let state;
    if (windSpeed > 30) {
      state = 6; // windy
    } else if (weatherCode === 0) {
      state = 3; // sun
    } else if (weatherCode > 0 && weatherCode <= 3) {
      state = 1; // cloudy
    } else if (weatherCode >= 45 && weatherCode <= 48) {
      state = 0; // fog
    } else if (weatherCode >= 51 && weatherCode <= 65
      || weatherCode >= 80 && weatherCode <= 82) {
      state = 4; // rain
    } else if (weatherCode >= 66 && weatherCode <= 77) {
      state = 5; // snow
    } else if (weatherCode >= 85 && weatherCode <= 99) {
      state = 2; // storm
    } else {
      console.log('not filtered - index:', i, ' value:', weatherCode);
    }
    weatherStates.push(state);
  }
}
///[end] API 


/**----------------------------------------------- */
/// UTILITIES functions
/* this function returns the max value of an array */
function getMax(arr) {
  let len = arr.length;
  let max = -Infinity;

  while (len--) {
    max = arr[len] > max ? arr[len] : max;
  }
  return max;
}

/* this function returns the min value of an array */
function getMin(arr) {
  let len = arr.length;
  let min = Infinity;

  while (len--) {
    min = arr[len] < min ? arr[len] : min;
  }
  return min;
}
///[end] UTILITIES


/**----------------------------------------------- */
/// VISUALS functions
/* 
  this function defines the colour  of the background 
  and the emission of particles 
*/
function setVisualStatus() {
  switch (weatherStates[counter]) {
    case 0: // fog
      backgroundColor = color(170);
      break;
    case 1: // cloudy
      backgroundColor = color(140);
      break;
    case 2: // storm
      backgroundColor = color(50);
      break;
    case 3: // sun
      backgroundColor = color(0, 170, 200);
      break;
    case 4: // rain
      backgroundColor = color(70);
      let numRainPart = map(weatherData.hourly.precipitation[counter], 0, precipitationRange.max, 0, 2);
      emitter.emitRain(numRainPart);
      break;
    case 5: // snow
      backgroundColor = color(180);
      if (frameCount % 15 == 0) { // this limits the emission of particles
        emitter.emitSnow(0.1);
      }
      break;
    case 6: // windy
      backgroundColor = color(0);
      break;
  }
}

/* 
  this function creates strings and displays texts
 */
function displayTextData() {
  textFont(myFont);
  textAlign(LEFT);

  // texts
  let d = new Date(weatherData.hourly.time[counter]);
  let year = d.getFullYear().toString().substr(-2);
  let day = nf(d.getDate(), 2); // day number formatted with 2 number
  let dayName = daysNames[d.getDay()];
  let monthNum = nf(d.getMonth() + 1, 2); // month number formatted with 2 number
  let hours = nf(d.getHours(), 2);// hours formatted with 2 number
  let minutes = '00';

  let timeText = hours + ':' + minutes;
  let smallTextSize = height / 20;
  let mediumTextSize = height / 14;
  let bigTextSize = smallTextSize * 2.5;
  let marginLeftText = width / 30;
  let marginBelowText = height / 20;

  push();

  /// first row
  // first line
  translate(0, /* marginBelowText + */ mediumTextSize);
  noStroke();
  fill(0);
  textSize(mediumTextSize);
  text(timeText, marginLeftText, 0);
  text('LONDON', width / 2 - marginLeftText, 0);
  // second line
  translate(0, mediumTextSize);
  text(dayName, marginLeftText, 0);
  let dateText = day + '.' + monthNum + '.' + year;
  text(dateText, width / 2 - marginLeftText, 0);

  /// second row
  // titles
  translate(0, marginBelowText + smallTextSize);
  textSize(smallTextSize);
  text('RAIN (mm)', marginLeftText, 0);
  text('TEMP (celsius)', width / 2 - marginLeftText, 0);
  // values
  translate(0, bigTextSize);
  textSize(bigTextSize);
  let rainText = weatherData.hourly.precipitation[counter];
  text(rainText, marginLeftText, 0); //360
  let tempText = weatherData.hourly.temperature_2m[counter];
  text(tempText, width / 2 - marginLeftText, 0);

  /// third row
  // titles
  translate(0, smallTextSize + marginBelowText);
  textSize(smallTextSize);
  text('WIND (km/h)', marginLeftText, 0);
  text('HUMIDITY (%)', width / 2 - marginLeftText, 0);
  // values
  translate(0, bigTextSize);
  textSize(bigTextSize);
  let humidiyText = weatherData.hourly.relativehumidity_2m[counter];
  text(humidiyText, width / 2 - marginLeftText, 0);
  let windText = weatherData.hourly.windspeed_10m[counter];
  text(windText, marginLeftText, 0);

  pop();
}

/* 
  this function draws the level of 
  the temperature and the states 
*/
function displayVisualData() {
  stroke(0);
  line(0, height - height/3, width, height -  height/3);
  for (let i = 0; i < numOfVisibleData; i++) {
    const thisIndex = (i + counter) % weatherStates.length;

    // temperatures
    let yAmp = map(amps[thisIndex], 0, 1, height - height/13, height - height/3);
    stroke(255);
    strokeWeight(5);
    point(i * offsetX, yAmp);

    // notes
    stroke(255, 0, 0);
    let yNote = map(weatherStates[thisIndex], 0, 6,height - height/13, height - height/3);
    point(i * offsetX, yNote);
  }
}
///[end] VISUALS