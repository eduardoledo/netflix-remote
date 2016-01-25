// TODO: navegar entre resultados de busqueda y homeScreen
function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}

if (!Array.prototype.unique) {
  Array.prototype.unique = function() {
    'use strict';
    var im = {},
      uniq = [];
    for (var i = 0; i < this.length; i++) {
      var type = (this[i])
        .constructor.name,
        //          ^note: for IE use this[i].constructor!
        val = type + (!/num|str|regex|bool/i.test(type) ? JSON.stringify(this[i]) : this[i]);
      if (!(val in im)) {
        uniq.push(this[i]);
      }
      im[val] = 1;
    }
    return uniq;
  }
}

function nfRemoteUtils(options) {
  this.options = $.fn.extend({}, options);
  this.lastEvent;
  this.events = [
    'profileSelection',
    'browse',
    'search',
    'continuePlaying',
    'loading',
    'playing',
    'pause',
    'extendedPause',
    // 'canChangeProfile'
  ];
  this.init();
};

(function($) {

  nfRemoteUtils.prototype.isPage = function(event) {
    switch (event) {
      case 'profileSelection':
        return $('ul.choose-profile').length > 0;
        break;
      case 'browse':
        return (document.location.pathname.substring(0, 7) == '/title/' || document.location.pathname.substring(0, 7) == '/browse');
        break;
      case 'watching':
        return document.location.pathname.substring(0, 7) == '/watch/';
        break;
      case 'continuePlaying':
        return this.isPage('watching') && $('.continue-playing').length > 0;
        break;
      case 'playing':
        return this.isPage('watching') && $('.player-control-button.player-play-pause.pause').length > 0;
        break;
      case 'loading':
        return this.isPage('watching') && $('.loading-view-v2').length > 0;
        break;
      case 'pause':
        return this.isPage('watching') && $('.player-control-button.player-play-pause.play').length > 0;
        break;
      case 'extendedPause':
        return this.isPage('watching') && $('.playRing').length > 0;
        break;
      case 'search':
        return document.location.pathname.substring(0, 8) == '/search/';
        break;
      case 'canChangeProfile':
        return (this.isPage('browse') || this.isPage('search')) && $('.account-dropdown-button').length > 0;
        break;
      default:
        return false;
    }
  }

  nfRemoteUtils.prototype.getIMDBLink = function(title) {
    return 'http://www.imdb.com/find?s=tt&q=' + title
  }

  nfRemoteUtils.prototype.getEventsList = function() {
    return this.events;
  }

  nfRemoteUtils.prototype.processEvent = function(event) {
    switch (event) {
      case 'profileSelection':
        this.options.socket.emit('event:profileSelection', {
          profiles: this.getProfiles()
        });
        break;
      case 'browse':
        this.options.socket.emit('event:browse', {
          profiles: this.getProfiles(),
          items: this.getItems()
        });
        break;
      case 'continuePlaying':
        this.options.socket.emit('event:continuePlaying', {});
        break;
      case 'playing':
        this.options.socket.emit('event:playing', {
          audio: this.getAudio(),
          subtitles: this.getSubtitles(),
          seasons: this.getSeasons()
        });
        break;
      case 'loading':
        this.options.socket.emit('event:loading', {
          title: $('.description h1').text(),
          episode: $('.description h2').text()
        });
        break;
      case 'pause':
        this.options.socket.emit('event:pause', {
          audio: this.getAudio(),
          subtitles: this.getSubtitles(),
          seasons: this.getSeasons()
        });
        break;
      case 'extendedPause':
        this.options.socket.emit('event:extendedPause', {});
        break;
      case 'search':
        this.options.socket.emit('event:search', {
          profiles: this.getProfiles(),
          items: this.getItems()
        });
        break;
    }
  }

  nfRemoteUtils.prototype.continuePlaying = function() {
    $('.button.continue-playing span.nf-icons.icon-player-play')
      .parents('.button.continue-playing:first')
      .click();
  }

  nfRemoteUtils.prototype.previousEpisode = function() {
    $('.button.continue-playing span.nf-icons.icon-player-prev-episode')
      .parents('.button.continue-playing:first')
      .click();
  }

  nfRemoteUtils.prototype.cancelPlay = function() {
    $('.button.continue-playing span.nf-icons.icon-player-cancel')
      .parents('.button.continue-playing:first')
      .click();

  }

  nfRemoteUtils.prototype.backToBrowsing = function () {
    $('a.player-back-to-browsing').click();
  };

  nfRemoteUtils.prototype.languageChange = function(itemId) {
    var item = $('[data-id="' + itemId + '"]');
    item.click();
    item.blur();
  };

  nfRemoteUtils.prototype.play = function() {
    $('.player-control-button.player-play-pause.play, .playRing').click();
  };

  nfRemoteUtils.prototype.pause = function() {
    $('.player-control-button.player-play-pause.pause').click();
  };

  nfRemoteUtils.prototype.nextEpisode = function() {
    $('.player-next-episode').click();
  };

  nfRemoteUtils.prototype.selectProfile = function(id) {
    $('.account-dropdown-button').click();
    $('li.profile[data-reactid="' + id + '"] a.profile-link').click();
  };

  nfRemoteUtils.prototype.getSeasons = function() {
    var self = this;
    var seasonList = $('#player-menu-episode-selector .season-list-container ul.season-list li.season');
    var selectedSeason = $('#player-menu-episode-selector .episode-list-container h2.seasons-title').text();

    var items = seasonList.map(function(index) {
      var $this = $(this);

      return {
        id: $this.data('season-id'),
        label: $this.text(),
        selected: $this.text() == selectedSeason,
        episodes: self.getEpisodes($this.data('season-id'))
      };
    }).toArray();

    return items;
  }

  nfRemoteUtils.prototype.getEpisodes = function(seasonId) {
    $('button.back-to-seasons').click();
    var listItems = $('#player-menu-episode-selector li.episode-list-item');
    $('#player-menu-episode-selector ul.season-list li.season[data-season-id="' + seasonId + '"]').click();
    sleep(50);

    var items = $(listItems).map(function() {
      var $this = $(this);
      return {
        id: $this.data('episode-id'),
        index: $this.find('.episode-list-index').text(),
        title: $this.find('.episode-list-title').text(),
        image: $this.find('img.episode-list-image').data('img-src'),
        synopsis: $this.find('.episode-list-synopsis').text(),
        selected: $this.hasClass('episode-list-item--expanded')
      };
    }).toArray();

    $('#player-menu-episode-selector').blur();

    return items;
  }

  nfRemoteUtils.prototype.getAudio = function() {
    return $('#player-menu-track-settings ol.player-audio-tracks li')
      .map(function() {
        $this = $(this);
        return {
          id: $this.data('id'),
          label: $this.html(),
          selected: $this.hasClass('player-track-selected')
        };
      }).toArray();
  };

  nfRemoteUtils.prototype.getSubtitles = function() {
    return $('#player-menu-track-settings ol.player-timed-text-tracks li')
      .map(function() {
        $this = $(this);
        return {
          id: $this.data('id'),
          label: $this.html(),
          selected: $this.hasClass('player-track-selected')
        };
      }).toArray();
  };

  nfRemoteUtils.prototype.getProfiles = function() {
    var profileButton = $('.account-dropdown-button');

    if (profileButton && !$('ul.profiles li.profile')) {
      profileButton.click();
    }

    return $('ul.choose-profile li.profile, .account-drop-down ul.profiles li.profile')
      .map(function() {
        $this = $(this);
        var img = $this.find('img.profile-icon')
          .attr('src');
        if (!img) {
          img = $this.find('div.profile-icon')
            .css('background-image')
            .replace('url(', '')
            .replace(')', '')
            .replace('"', '');
        }
        return {
          id: $this.data('reactid'),
          name: $this.find('span.profile-name').text(),
          image: img
        }
      })
      .toArray();
  };

  nfRemoteUtils.prototype.getItems = function() {

    return $('.slider-item').map(function() {
      $this = $(this);
      if ($this) {
        var data;
        try {
          data = $this.find('.ptrack-content')
            .data('ui-tracking-context');
          data = decodeURI(data);
          data = JSON.parse(data);
        } catch (e) {
          data = false;
        }

        var image = $this.find('.video-artwork')
          .css('background-image');
        if (image) {
          image = image.replace('url(', '')
            .replace(')', '')
            .replace(/"/g, '');
        }

        return {
          title: $this.find('.smallTitleCard').attr('aria-label'),
          image: image,
          video_id: data.video_id
        };
      } else {
        return false;
      }
    }).toArray().unique();
  };

  nfRemoteUtils.prototype.doSearch = function(value) {
    document.location.pathname = '/search/' + window.encodeURIComponent(value);
  };

	nfRemoteUtils.prototype.playItem = function (url) {
		document.location.pathname = url;
	};

  nfRemoteUtils.prototype.init = function() {
    var self = this;
    $(document).on('click', 'ol.player-audio-tracks li, ol.player-timed-text-tracks li', function() {
      this.options.socket.emit('event:languageChange', {
        audio: self.getAudio(),
        subtitles: self.getSubtitles(),
        seasons: self.getSeasons()
      });
    });
    $(document).on('click', '#player-menu-episode-selector li.episode-list-item', function() {
      this.options.socket.emit('event:episodeChange', {
        audio: self.getAudio(),
        subtitles: self.getSubtitles(),
        seasons: self.getSeasons()
      });
    });
  };
}(jQuery))
