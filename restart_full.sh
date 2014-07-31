#! /bin/bash

screen -S reader_server -p 0 -X quit
export NODE_ENV=production; screen -S reader_server -d -m nice --adjustment=-20 node index.js; sleep 1
