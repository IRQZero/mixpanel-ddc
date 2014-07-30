var exec = require('child_process').exec,
    fs = require('fs');

function defaultReadCallback(err, data) {
    if (err) { throw err; }
    console.log(data);
}

// callback(err, data)
// data is stream of ndef bytes from the tag
function read(callback) {

    var errorMessage = "",
        readMifareClassic = exec("mifare-ultralight-info", callback);
}


module.exports = {
    read: read
};
