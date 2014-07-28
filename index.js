(function(){

  var env = process.env['NODE_ENV'] || 'development',
    io = require("socket.io-client"),
    config = require("./config/" + env + ".json"),
    address = require('address'),
    mifareUltralight = require('./lib/mifare-ultralight');

  var socket = io(config.socket.master + config.socket.namespace),
    mac = null,
    location = null;

  function startReader(interval) {
    mifareUltralight.read(function(err, data){
      console.log(data);
      setTimeout(startReader, interval, interval);
    });
  }

  address.mac(function(err, address){
    mac = address;
    socket.on('connect', function(){
      startReader(config.nfc.interval);
      socket.on('read:result', function(data){
        location = data.location;
      });
      socket.on('update:result', function(data){
        if (data.id === mac && data.location) {
          location = data.location;
        }
      });
      socket.emit('read', {macAddress: mac})
    });
  });


})();
