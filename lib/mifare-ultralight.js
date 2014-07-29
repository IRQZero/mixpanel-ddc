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
        readMifareClassic = exec("mifare-ultralight-info | cut -d' ' -f 4 | head -n 1", callback);
}


module.exports = {
    read: read
};
