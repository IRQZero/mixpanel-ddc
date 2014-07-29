(function(){

  var env = process.env['NODE_ENV'] || 'development',
    io = require("socket.io-client"),
    config = require("./config/" + env + ".json"),
    address = require('address'),
    mifareUltralight = require('./lib/mifare-ultralight'),
    osc = require('node-osc'),
    opc = new require('./lib/opc'),
    HexPlinth = require('./lib/OSC-hex-plinth');

  var socket = io(config.socket.master + config.socket.namespace),
    mac = null,
    location = null;
    last_id = null;
    last_id_timestamp = null;
    debounce_duration = 5,
    oscServer = null,
    client = null,
    pixelControl = null;

  try {
    if (config.osc.enabled) {
      oscServer = new osc.Server(config.osc.port, config.osc.host);
    }
    client = new opc(config.opc.host, config.opc.port);
    pixelControl = new HexPlinth({
      server: oscServer,
      client: client,
      config: config
    });
    pixelControl.draw();
  } catch(ex) {
    console.error(ex.message);
    console.error("HexPlinth failed to generate an OPC client. STUBBING fadeTo for socket testing");
    pixelControl = {
      fadeTo: function(color) {
        console.log("fadeTo call received with " + color);
      }
    }
  }

  function startReader(interval) {
    mifareUltralight.read(function (error, stdout, stderr) {
      if(error !== null) {
        console.log('node error: ' + error);
      }

      var id = stdout.replace('\n','');
      var id_timestamp = Date.now() / 1000;

      if(id) {
        if(id.length === 14) {
          if(id === last_id && (last_id_timestamp) && ((id_timestamp - last_id_timestamp) < debounce_duration)) {
            console.log('same tag detected: ignoring ' + id)
          } else {
            console.log('read tag with id: ' + id);
            last_id = id;
            last_id_timestamp = id_timestamp;
            socket.emit("create", {userId: id, macAddress: mac, location: location});
          }
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
      socket.on('team:result', function(data){
        if (data.name) {
          pixelControl.fadeToColor(data.name);
        }
      })
      socket.emit('read', {macAddress: mac})
    });
  });

})();
