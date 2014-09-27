(function(){

  var env = process.env['NODE_ENV'] || 'development',
    io = require("socket.io-client"),
    config = require("./config/" + env + ".json"),
//    address = require('address'),
//    mifareUltralight = require('./lib/mifare-ultralight'),
    osc = require('node-osc'),
    opc = require('./lib/opc'),
    HexPlinth = require('./lib/OSC-hex-plinth');

  var socket = io(config.socket.master + config.socket.namespace),
    mac = null,
    location = null;
    last_id = null;
    last_id_timestamp = null;
    read_interval = config.nfc.reader_poll_interval,
    ignore_delay = config.nfc.duplicate_ignore_delay,
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

      plinthClient = new opc(config.opc.host, config.opc.port);
      plinthControl = new HexPlinth({
        server: getOscServer(),
        client: plinthClient,
        config: config,
        length: 113
      });
      plinthControl.draw();
      controlTest(plinthControl);
  }

  function startNodeControl() {

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
      console.error('Node OPC Connection Error :: ' + ex.message);
      setTimeout(startNodeControl, 2000);
    }

  }

  function startReader() {
    var ignore_delay = ignore_delay,
        read_interval = read_interval;
    mifareUltralight.read(function (error, stdout, stderr) {

      try {
          console.log('NFC reader polled...');
          if(error !== null) {
            console.log('node error: ' + error + " at: " + Date.now());
          }

          var ids = stdout.split('\n').map(function(id){

            return id.replace(/.*(\w{14}).*/ig, '$1');
          });
          console.log(ids);
          var id_timestamp = Date.now() / 1000;
	  if(ids.length && ids.length > 0) {
            for(var i=0; i<ids.length; i++) {
              var id = ids[i];
              if(id.length === 14) {
                if(id === last_id && (last_id_timestamp) && ((id_timestamp - last_id_timestamp) < ignore_delay)) {
                  console.log('same tag detected: ignoring ' + id)
                } else {
                  console.log('read tag with id: ' + id);
                  last_id = id;
                  last_id_timestamp = id_timestamp;
                  socket.emit("create", {userId: id, macAddress: mac, location: location});
                }
              } else {
                console.log('received malformed tag: ' + id + " at: " + Date.now());
              }
            }
          }
          if (stderr.replace('\n','')) {
            console.log('exec error: ' + stderr + " at: " + Date.now());
          }
      } catch(e) {
          console.error("UNCAUGHT EXCEPTION: " + e + " at: " + Date.now());
      }

      setTimeout(startReader, read_interval);
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
/*
  address.mac(function(err, address){

    mac = address;
    socket.on('connect', function(){

      console.log('LOG: connecting to socket');
      clearTimeout(reconnect);
      startReader();

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
*/
  process.on('uncaughtException', function (err) {

        console.log('Caught exception: ' + err);

      console.log("retrying..");
      setTimeout(startPlinthControl, 2000);
  });
    try {
      startPlinthControl();
    } catch(ex) {
      console.error('Plinth OPC Connection Error :: ' + ex.message);
      console.log("retrying..");
      setTimeout(startPlinthControl, 2000);
    }
})();
