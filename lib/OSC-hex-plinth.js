function HexPlinth (params) {
  this.server = params.server;
  this.client = params.client;
  this.config = params.config;

  this.current = [128.0, 128.0, 128.0];
  this.fadeTo =  [128.0, 128.0, 128.0];
  if (this.config.osc.enabled) {
    this.enableServer();
  }
};

HexPlinth.prototype = {
  width: 96,
  speed: 0.005,
  density: 0.2,
  teams: {
    Blue: [18.25, 75.48, 116.74, 15], //team 1
    Green: [26.53, 111.62, 45.21, 15], // team 2
    Orange: [128.0, 63.2, 21.46, 15], // team 3
    Magenta: [128.0, 0.0, 89.67, 15], // team 4
    Purple: [61.79, 38.16, 79.78, 15] // team 5
  },
  fade: function () {
    [0,1,2].forEach(this.fadeColor, this)
  },
  fadeColor: function(index){
    if (this.current[index] > this.fadeTo[index]){
      this.current[index]--;
    } else if (this.current[index] < this.fadeTo[index]) {
      this.current[index]++;
    }
  },
  getTime: function(millis, pixel) {
    return pixel * this.density + millis * this.speed;
  },
  getRed: function(sin){
    this.current[0] + this.width * Math.sin(sin);
  },
  getGreen: function(sin){
    this.current[1] + this.width * Math.sin(sin);
  },
  getBlue: function(sin){
    this.current[2] + this.width * Math.sin(sin);
  },
  draw: function () {
    var millis = new Date().getTime(),
      t = 0;

    for (var pixel = 0; pixel < 113; pixel++) {

      t = this.getTime(millis, pixel);
      this.client.setPixel(pixel, this.getRed(t), this.getGreen(t + 0.1), this.getBlue(t + 0.3));

    }

    this.client.writePixels();

    this.fade();

    setTimeout(this.draw.bind(this), this.config.interval);
    if (millis % 5000 === 0) {
      console.log(this.getRed(t), this.getGreen(t + 0.1), this.getBlue(t + 0.3));
      console.log('drawing');
    }
  },
  serverCommands: {
    "/1/fader1": function(value){
      this.fadeTo[0] = value * 128.0;
    },
    "/1/fader2": function(value){
      this.fadeTo[1] = value * 128.0;
    },
    '/1/fader3': function(value){
      this.fadeTo[2] = value * 128.0;
    },
    '/1/fader4': function(value){
      this.density = value * 0.5;
    },
    '/1/fader5': function(value){
      this.speed = value * 0.050;
    },
    '/2/push1': function(value){
      this.fadeToColor('Blue');
    },
    '/2/push2': function(value){
      this.fadeToColor('Green');
    },
    '/2/push3': function(value){
      this.fadeToColor('Orange');
    },
    '/2/push4': function(value){
      this.fadeToColor('Magenta');
    },
    '/2/push5': function(value){
      this.fadeToColor('Purple');
    },
    '/3/xy': function(speed, width){
      this.speed = speed * 0.050;
      this.width = width * 128
    }
  },
  fadeToColor: function(color) {

    var result = this.teams[color];

    this.fadeTo[0] = result[0];
    this.fadeTo[1] = result[1];
    this.fadeTo[2] = result[2];

  },
  enableServer: function(){
    this.server.on('message', function (msg, rinfo) {
      var command = msg.shift(),
        serverHandler = this.serverCommands[command];

      if (typeof serverHandler === 'function') {
        serverHandler.apply(this, msg);
      }
    });
  }
};

module.exports = HexPlinth;
