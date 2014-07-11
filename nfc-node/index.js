/*
 *  each NFC Node is a socket.io client that performs two actions upon receiving NFC Data
 *  1. backs up NFC data to local mongo instance
 *  2. emits an event to the central server containing the newest data that has not been confirmed sent
 */

/* 
    0. broadcast identity via mdns
    1. connect to db if not connected
      1.a. change lights according to state
    2. connect to central socket.io server if not connected
      2.a. change lights according to state
    3. when NFC data is received
      3.a. store data in mongo FiLo
      3.b. change lights according to state
    4. on server "report" event, send oldest unconfirmed NFC record from mongo db
      4.a. 

 */

var io = require('socket.io')();
var mdns = require('mdns');

mdns.createAdvertisement(mdns.udp('ddc') , app.address().port ).start();

io.sockets.emit('an event sent to all connected clients');
io.emit('an event sent to all connected clients');



