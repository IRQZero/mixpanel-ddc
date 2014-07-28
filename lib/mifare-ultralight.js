var spawn = require('child_process').spawn,
    fs = require('fs'),
    fileName = 'ndef.bin'; // TODO use temp files

function defaultCallback(err) {
    if (err) { throw err; }
}

function defaultReadCallback(err, data) {
    if (err) { throw err; }
    console.log(data);
}

// callback(err, data)
// data is stream of ndef bytes from the tag
function read(callback) {

    var errorMessage = "",
        readMifareClassic = spawn('mifare-ultralight', ['r', fileName]);

    if (!callback) { callback = defaultReadCallback; }

    readMifareClassic.stdout.on('data', function (data) {
        process.stdout.write(data + "");
    });

    readMifareClassic.stderr.on('data', function (data) {
        errorMessage += data;
        // console.log('stderr: ' + data);
    });

    readMifareClassic.on('close', function (code) {
        if (code === 0 && errorMessage.length === 0) {
            fs.readFile(fileName, function (err, data) {
                callback(err, data);
                fs.unlinkSync(fileName);
            });
        } else {
            callback(errorMessage);
        }
    });
}


module.exports = {
    read: read
};
