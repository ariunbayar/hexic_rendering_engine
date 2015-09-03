(function() {
    'use strict';
    /* globals GameEngine, _, d3 */

  var urlto, userId;

  window.sound = function() {
    var s;
    s = new Audio('/166184__drminky__retro-coin-collect.wav');
    return s.play();
  };

  userId = location.hash.substr(1);

  urlto = function(uri) {
    return 'http://localhost:80/hexic_srv/' + uri + '?user_id=' + userId;
  };

  d3.json(urlto('start.php'), function(error, boardData) {
    var cb, gameEngine;
    if (error) {
      return console.log(error);
    }
    gameEngine = new GameEngine({}, {
      containerId: '#svg',
      boardData: boardData
    });
    window.gameEngine = gameEngine;
    gameEngine.onMoveTrigger(function() {
      var data;
      data = JSON.stringify(Array.prototype.slice.call(arguments));
      return d3.json(urlto('move.php')).post(data);
    }, this);
    gameEngine.start();
    cb = function(error, rsp) {
      if (rsp && rsp.responseText !== 'noop') {
        gameEngine.moveReceived.apply(gameEngine, JSON.parse(rsp.responseText));
      }
      return d3.xhr(urlto('get_pending_move.php'), 'text/plain', cb);
    };
    return cb();
  });

}).call(this);

//# sourceMappingURL=main.js.map