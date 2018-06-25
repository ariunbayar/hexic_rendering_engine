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
    return 'http://' + (location.hostname || '0.0.0.0') + ':8001/game/' + uri + '/?user_id=' + userId;
  };

  d3.json(urlto('start'), function(error, boardData) {
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
      return d3.json(urlto('move')).post(data);
    }, this);
    gameEngine.start();
    cb = function(error, rsp) {
      if (rsp && rsp.responseText !== 'noop') {
        gameEngine.moveReceived.apply(gameEngine, JSON.parse(rsp.responseText));
      }
      return d3.xhr(urlto('get-pending-move'), 'text/plain', cb);
    };
    return cb();
  });

}).call(this);

//# sourceMappingURL=main.js.map
