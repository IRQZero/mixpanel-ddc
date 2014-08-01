(function(){

  var env = process.env['NODE_ENV'] || 'development',
    io = require("socket.io-client"),
    config = require("./config/" + env + ".json"),
    address = require('address'),
    mifareUltralight = require('./lib/mifare-ultralight'),
    osc = require('node-osc'),
    opc = require('./lib/opc'),
    HexPlinth = require('./lib/OSC-hex-plinth');

  var socket = io(config.socket.master + config.socket.namespace),
    mac = null,
    location = null;
    last_id = null;
    last_id_timestamp = null;
    debounce_duration = 60,
    oscServer = null,
    plinthClient = null,
    nodeClient = null,
    plinthControl = null,
    nodeControl = null,
    reconnect = 0;

  function getOscServer(){
    if (oscServer) {
      // singleton
      return oscServer;
    }
    if (config.osc.enabled) {
      oscServer = new osc.Server(config.osc.port, config.osc.host);
      return oscServer;
    }
  }

  function controlTest(control) {
    ["Blue", "Green", "Orange", "Magenta", "Purple"].forEach(function(color, idx){
      setTimeout(function(){
        control.fadeToColor(color);
      }, 3000 * idx);
    })
  }

  function startPlinthControl() {
    try {
      plinthClient = new opc(config.opc.host, config.opc.port);
      plinthControl = new HexPlinth({
        server: getOscServer(),
        client: plinthClient,
        config: config,
        length: 113
      });
      plinthControl.draw();
      controlTest(plinthControl);
    } catch(ex) {
      console.error('Error :: ' + ex.message);
    }

  }

  function startNodeControl(){
    try {
      nodeClient = new opc(config.opc.host, config.opc.port);
      nodeControl = new HexPlinth({
        server: getOscServer(),
        client: nodeClient,
        config: config,
        length: 24
      });
      nodeControl.draw();
      controlTest(nodeControl);
    } catch (ex) {
      console.error('Error :: ' + ex.message);
    }

  }

  function startReader(interval) {
    mifareUltralight.read(function (error, stdout, stderr) {
      try {
          console.log('LOG: read received');
          if(error !== null) {
            console.log('node error: ' + error);
          }

          var id = stdout.split('\n').map(function(id){
            return id.replace(/.*(\w{14}).*/ig, '$1');
          }).shift();
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
      } catch(e) {
          console.error("UNCAUGHT EXCEPTION: " + e);
      }

      setTimeout(startReader, interval, interval);
    });
  }

  function fadeToTeam(team) {
    if (plinthControl) {
      plinthControl.fadeToColor(team);
    }
    if (nodeControl) {
      nodeControl.fadeToColor(team);
    }
  }

  function fadeToUser(user, cb) {
    if (plinthControl) {
      plinthControl.fadeToColor(user);
    }
    if (nodeControl) {
      nodeControl.fadeToColor(user);
    }
    setTimeout(cb, 5000);
  }

  function startReconnect () {
    socket.io.reconnect();
    reconnect = setTimeout(startReconnect, 2000);
  }

  address.mac(function(err, address){

    mac = address;
    socket.on('connect', function(){
      console.log('LOG: connecting to socket');
      clearTimeout(reconnect);
      startReader(config.nfc.interval);
      socket.on('read:result', function(data){
        location = data.location;
        if (data.plinth && !plinthControl) {
          console.log("Generating plinth led control");
          startPlinthControl();
        } else if (data.node && !nodeControl) {
          console.log("Generating node led control");
          startNodeControl();
        }
      });
      socket.on('update:result', function(data){
        if (data.id === mac && data.location) {
          location = data.location;
        }
        if (data.plinth && !plinthControl) {
          console.log("Generating plinth led control");
          startPlinthControl();
        } else if (data.node && !nodeControl) {
          console.log("Generating node led control");
          startNodeControl();
        }
      });
      socket.on('team:result', function(data){
        if (data.user && data.macAddress === mac) {
          console.log(data);
          fadeToTeam(data.user);
        } else if (data.team) {
          fadeToTeam(data.team);
        }
      });

      socket.on('stop', function(){
        console.log('LOG: stopping the socket');
        if (plinthControl) {
          plinthControl.stop();
        }
        if (nodeControl) {
          nodeControl.stop();
        }
      });

      socket.on('start', function(data){
        console.log('LOG: starting the socket');
        if (data.plinth) {
          if (!plinthControl){
            startPlinthControl();
          } else {
            plinthControl.draw();
          }
        }
        if (data.node) {
          if (!nodeControl) {
            startNodeControl();
          } else {
            nodeControl.draw();
          }
        }
      });

      socket.emit('read', {macAddress: mac});
    });
    socket.on('disconnect', function(){
      console.log('LOG: disconnected');
      startReconnect();
    });
  });

})();
