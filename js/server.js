'use strict';
var express = require('express');
var _ = require('lodash');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var os = require('os');
var ifaces = os.networkInterfaces();
var util = require('util');

var port = 8889;
var lastEvent;

var IP = 'localhost'

Object.keys(ifaces).forEach(function(ifname) {
  var alias = 0;

  ifaces[ifname].forEach(function(iface) {
    if ('IPv4' !== iface.family || iface.internal !== false) {
      // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
      return;
    }

    if (alias >= 1) {
      // this single interface has multiple ipv4 addresses
      console.log(ifname + ':' + alias, iface.address);
    } else {
      // this interface has only one ipv4 adress
      IP = iface.address;
    }
    ++alias;
  });
});

var events = [
  'event:profileSelection',
  'event:browse',
  'event:search',
  'event:continuePlaying',
  'event:playing',
  'event:loading',
  'event:play',
  'event:pause',
  'event:extendedPause',
  'event:languageChange',
  'event:episodeChange',
  'event:nextEpisode',
  'event:backToBrowsing',
  'event:profileChange',
  'event:playItem',
  'document:ready'
];

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/client/index.html');
});

app.use(express.static('client'));

io.on('connection', function(socket) {

  function forward(event, payload) {
    socket.broadcast.emit(event, payload);
    console.log(event, util.inspect(payload, {showHidden: false, depth: null}));
  }
  // partially apply forward() handlers with events
  events.forEach(function(event) {
    socket.on(event, forward.bind(this, event));
  });
});


  http.listen(port, function() {
    console.log('Listening on: ' + IP + ':' + port);
  });

function log(text){
  $('#logs').append(text + '<br />');
}
