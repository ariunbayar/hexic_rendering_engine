(function() {
  var urlto, user_id;

  window.sound = function() {
    var s;
    s = new Audio('/166184__drminky__retro-coin-collect.wav');
    return s.play();
  };

  user_id = location.hash.substr(1);

  urlto = function(uri) {
    return 'http://localhost:80/hexic_srv/' + uri + '?user_id=' + user_id;
  };

  d3.json(urlto('start.php'), function(error, boardData) {
    var cb, game_engine;
    if (error) {
      return console.log(error);
    }
    game_engine = new GameEngine({}, {
      containerId: '#svg',
      boardData: boardData
    });
    window.game_engine = game_engine;
    game_engine.onMoveTrigger(function() {
      var data;
      data = JSON.stringify(Array.prototype.slice.call(arguments));
      return d3.json(urlto('move.php')).post(data);
    }, this);
    game_engine.start();
    cb = function(error, rsp) {
      if (rsp && rsp.responseText !== 'noop') {
        game_engine.moveReceived.apply(game_engine, JSON.parse(rsp.responseText));
      }
      return d3.xhr(urlto('get_pending_move.php'), 'text/plain', cb);
    };
    return cb();
  });

}).call(this);

//# sourceMappingURL=main.js.map
