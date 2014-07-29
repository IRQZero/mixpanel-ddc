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
    mifareUltralight.read(function (error, stdout, stderr) {
        if(error !== null) {
          console.log('node error: ' + error);
        }
        var id = stdout.replace('\n','');
        if(id) {
          if(id.length === 14) {
            console.log('reading: ' + id);
            socket.emit("create", {userId: id, macAddress: mac, location: location});
          } else { 
            console.log('received malformed tag: ' + id); 
          }
        }
        if (stderr.replace('\n','')) {
          console.log('exec error: ' + stderr);
        }
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
