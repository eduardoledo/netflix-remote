/**
 * [description]
 * @return {[type]} [description]
 */
;
(function() {
  'use strict';
  var lastEvent;

  var api = window.netflixController = {}
  var socket = api.socket = io()

  var lastTime = (new Date()).getTime()

  function reconnect() {
    socket = io({
      forceNew: true
    })
  }

  function fillSelect(select, data) {
    var $select = $(select);

    $select.find('option').remove().end();
    $(data).each(function() {
      var option = $('<option>');
      option.val(this.id).html(this.label);
      $select.append(option);
      if (this.selected) {
        $select.val(this.id);
      }
    });
  }

  function updateSeasons(seasons) {
    var ul = $('#seasons');
    ul.empty();
    $(seasons).each(function() {
      var season = this;
      var li = $('<li>')
        .data('id', season.id)
        .data('selected', season.selected);
      var title = $('<a>');
      title.html(season.label);
      li.append(title);
      ul.append(li);
      var episodes = $('<ul>');
      li.append(episodes);

      $(season.episodes).each(function() {
        var episode = this;
        var li = $('<ul>')
          .data('id', episode.id)
          .data('selected', episode.selected);
        var title = $('<a>')
          .html(episode.title);
        li.append(title);
        episodes.append(li);
      });
    });
  }

  function checkLastEvent(event) {
    var result = (lastEvent !== event);
    if (result) {
      lastEvent = event;
    }

    return result;
  }

  function hideAll() {
    $('.loading, .playing, #profiles, #browse').hide();
  }

  function playItem(e) {
    e.preventDefault();
    var $this = $(this);
    socket.emit('event:playItem', $this.data('url'));
  }

  setInterval(function() {
    var currentTime = (new Date()).getTime()
      // if the timeout is longer than 3000ms, the device has
      // fallen asleep and woken up.
    if (currentTime - lastTime >= 3000) {
      reconnect()
    }
    lastTime = currentTime
  }, 1000)

  $(document).ready(function() {
    $(document).on('click', 'button#play', function(e) {
      e.preventDefault();
      socket.emit('event:play', {});
    });
    $(document).on('click', 'button#pause', function(e) {
      e.preventDefault();
      socket.emit('event:pause', {});
    });
    $(document).on('click', 'button#next-episode', function(e) {
      e.preventDefault();
      socket.emit('event:nextEpisode', {});
    });
    $(document).on('click', 'button#back-to-browsing', function(e) {
      e.preventDefault();
      socket.emit('event:backToBrowsing', {});
    });
    socket.emit('document:ready', {});
  });

  // search event
  $('#search').on('submit', function(e) {
    e.preventDefault()
    socket.emit('event:search', e.target.searchField.value)
    e.target.searchField.blur()
  });

  $('#cmbAudio, #cmbSubtitles').on('change', function(e) {
    e.preventDefault();
    socket.emit('language:change', $(this).val());
  });

  socket.on('player:episodes', function(data) {
    var selected;
    var container = $('#seasons-accordion').find('li')
      .remove()
      .end();

    $(data.seasons).each(function(index) {
      var item = this;
      var title = $('<a>')
        .html(this.label)
        .addClass('toggle');
      var season = $('<li>');
      season.append(title);
      container.append(season);

      var episodes = $('<ul>')
        .addClass('inner');

      if (item.selected) {
        selected = title;
      }

      season.append(episodes);
      $(item.episodes).each(function() {
        var subItem = this;
        var episode = $('<li>');
        var title = $('<a>')
          .data('episode-id', subItem.id)
          .html(subItem.title)
          .addClass('toggle');
        var body = $('<div>')
          .addClass('inner');
        var image = $('<img>').attr('src', this.image)
          .addClass('episode-image');
        var synopsis = $('<p>').html(this.synopsis);

        episode.append(title);
        episode.append(body);
        body.append(image);
        body.append(synopsis);
        episodes.append(episode);
      });
    });
    accordion();
    selected.click();
  });

  socket.on('event:browse', function(payload) {
    hideAll();
    var container = $('#browse');
    container.show();
    if (checkLastEvent('event:browse')) {
      container.empty();
      $(payload.items).each(function() {
        if (this.title && this.video_id) {
          var item = $('<div>')
            .data('url', '/watch/' + this.video_id)
            .addClass('video-item')
            .click(playItem);
          var img = $('<img>')
            .attr('src', this.image)
            .attr('title', this.title);
          container.append(item);
          item.append(img);
        }
      });
    }
  });

  socket.on('event:playing', function(payload) {
    hideAll();
    $('.playing').show();
    $('#play').hide();
    $('#pause').show();
    if (checkLastEvent('event:playing')) {
      fillSelect($('#audio'), payload.audio);
      fillSelect($('#subtitles'), payload.subtitles);
      updateSeasons(payload.seasons);
    }
  });

  socket.on('event:pause', function(payload) {
    hideAll();
    $('.playing').show();
    $('#play').show();
    $('#pause').hide();
    if (checkLastEvent('event:pause')) {
      fillSelect($('#audio'), payload.audio);
      fillSelect($('#subtitles'), payload.subtitles);
      updateSeasons(payload.seasons);
    }
  });

  socket.on('event:loading', function(payload) {
    hideAll();
    var container = $('.loading');
    container.empty()
      .show()
      .append($('<h1>').html(payload.title))
      .append($('<h2>').html(payload.episode));
  });

  socket.on('event:profileSelection', function(payload) {
    if (checkLastEvent('event:profileSelection')) {
      var profiles = $('#profiles');
      profiles.empty();
      $(payload.profiles).each(function() {
        var profile = $('<div>')
          .data('id', this.id)
          .addClass('profile');


        profile.append($('<a>').html(this.name));
        profile.append($('<img>').attr('src', this.image.replace(/"/g, '')));
        profiles.append(profile);
        $(profile).click(function(e) {
          e.preventDefault();
          var id = $(this).data('id');
          socket.emit('event:profileChange', id);
        });
      });
    }
  });

}())
