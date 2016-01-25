(function($) {
  var port = 8889;
  var socket = io('127.0.0.1:' + port);
  var $nf = new nfRemoteUtils({socket: socket});
  var lastEvent;

  $(document).ready(function() {

    setInterval(function() {

      $($nf.getEventsList()).each(function() {
        var event = String(this);
        if ($nf.isPage(event)) {
          if (lastEvent !== event || event === 'loading') {
            lastEvent = event;
            $nf.processEvent(String(this));
          }
          return false;
        }
      });
    }, 500);

    socket.on('event:profileChange', $nf.selectProfile);
    socket.on('event:continuePlaying', $nf.continuePlaying);
    socket.on('event:previousEpisode', $nf.previousEpisode);
    socket.on('event:cancelPlay', $nf.cancelPlay);
    socket.on('event:languageChange', $nf.languageChange);
    socket.on('event:play', $nf.play);
    socket.on('event:pause', $nf.pause);
    socket.on('event:nextEpisode', $nf.nextEpisode);
    socket.on('event:search', $nf.doSearch);
    socket.on('event:backToBrowsing', $nf.backToBrowsing);
    socket.on('document:ready', function () {
      lastEvent = '';
    });
    socket.on('event:playItem', $nf.playItem);

  });
}(jQuery))
