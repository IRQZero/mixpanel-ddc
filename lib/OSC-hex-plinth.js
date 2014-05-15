#!/usr/bin/env node

// Simple red/blue fade with Node and opc.js
var osc = require('node-osc');
var oscServer = new osc.Server(3333, '10.0.1.200');

var OPC = new require('./opc')
var client = new OPC('localhost', 7890);

//color pallets for teams
var current = [128.0, 128.0, 128.0, 15]; //holds the currently displayed pallet color
var fadeTo = [128.0, 128.0, 128.0, 15]; //holds the value to be faded too

var current = [128.0, 128.0, 128.0]; //holds the currently displayed pallet color
var too = [128.0, 128.0, 128.0]; //holds the value to be faded too

var toggles = [
    [18.25, 75.48, 116.74, 15], //team 1
    [26.53, 111.62, 45.21, 15], // team 2
    [128.0, 63.2, 21.46, 15], // team 3
    [128.0, 0.0, 89.67, 15], // team 4
    [61.79, 38.16, 79.78, 15] // team 5
];

// Parameters, set via OSC
var Ored = 128;
var Ogreen = 128;
var Oblue = 128;
var width = 96;
var speed = 0.005;
var brightness = 255;
var rate1 = 0.1;
var rate2 = 0.2;
var densaty = 0.2;

var tog1 = 0;
var tog2 = 0;
var tog3 = 0;
var tog4 = 0;

// var tog21 = 0;
// var tog22 = 0;
// var tog23 = 0;
// var tog24 = 0;
// var tog25 = 0;

var toggleMap = {
    '/2/push1': 0,
    '/2/push2': 1,
    '/2/push3': 2,
    '/2/push4': 3,
    '/2/push5': 4,
}

oscServer.on('message', function (msg, rinfo) {
    // Show the message, for debugging
    // console.log(msg);
    // First page, color
    if (msg[0] == '/1/fader1') fadeTo[0] = msg[1]*128.0;
    if (msg[0] == '/1/fader2') fadeTo[1] = msg[1]*128.0;
    if (msg[0] == '/1/fader3') fadeTo[2] = msg[1]*128.0;
    if (msg[0] == '/1/fader4') densaty = msg[1]*0.5;
    if (msg[0] == '/1/fader5') speed = msg[1]*0.050;
    
    if (msg[0] == '/1/toggle1') tog1 = msg[1];
    if (msg[0] == '/1/toggle2') tog2 = msg[1];
    if (msg[0] == '/1/toggle3') tog3 = msg[1];
    if (msg[0] == '/1/toggle4') tog4 = msg[1];
    
    // if (msg[0] == '/2/toggle1') tog21 = msg[1];
    // if (msg[0] == '/2/toggle2') tog22 = msg[1];
    // if (msg[0] == '/2/toggle3') tog23 = msg[1];
    // if (msg[0] == '/2/toggle4') tog24 = msg[1];
    // if (msg[0] == '/2/toggle5') tog25 = msg[1];
    
    var color = toggles[toggleMap[msg[0]]];
   
    if (color != null) {
        fadeTo[0] = color[0];
        fadeTo[1] = color[1];
        fadeTo[2] = color[2];
        fadeTo[3] = color[3];
    } 
    
                if(tog1 == 1) {
            console.log('-------------------------------------------------------------------------');
            console.log('red ');
            console.log(Ored);
            console.log('green');
            console.log(Ogreen);
            console.log('blue');
            console.log(Oblue);
            console.log('width');
            console.log(width);
        }


    // XY pad, oscillator rates
    if (msg[0] == '/3/xy') {
        speed = msg[1]*0.050;
        width = msg[2]*128;
    }
});


function draw() {
    var millis = new Date().getTime();

    for (var pixel = 0; pixel < 113; pixel++)
    {
        var t = pixel * densaty + millis * speed;
        var red = current[0] + width * Math.sin(t);
        var green = current[1] + width * Math.sin(t + 0.1);
        var blue = current[2] + width * Math.sin(t + 0.3);

        client.setPixel(pixel, red, green, blue);
    }
    client.writePixels();
    fade();
}


setInterval(draw, 10);


function gama(too, bright) {

  too /=255.0;
  return too*bright;
}

function fade() {
    if(current[0] > fadeTo[0]) current[0]--;
    if(current[0] < fadeTo[0]) current[0]++;
    if(current[1] > fadeTo[1]) current[1]--;
    if(current[1] < fadeTo[1]) current[1]++;
    if(current[2] > fadeTo[2]) current[2]--;
    if(current[2] < fadeTo[2]) current[2]++;
    // if(current[3] > fadeTo[3]) current[3]--;
    // if(current[3] < fadeTo[3]) current[3]++;
}