// Generated by CoffeeScript 1.4.0
(function() {
  var RenderEngine;

  RenderEngine = (function() {

    RenderEngine.prototype.colors = {
      red: "#F72700",
      blue: "#447786",
      gray: "#C8C8C8"
    };

    function RenderEngine(container_id, width, height, user_id) {
      this.board = [];
      this.svg = Graphics.createSVG(container_id, width, height);
      this.user_id = user_id;
    }

    RenderEngine.prototype.updateBoard = function(board_users, board_powers, board_moves) {
      var color, d, direction, directions, fx, fy, has_cell_at, neighbours, pos, power, shift, tx, ty, user_id, x, y, _i, _len, _ref, _ref1;
      directions = {};
      for (y in board_users) {
        if (!(y in this.board)) {
          this.board[y] = [];
        }
        for (x in board_users[y]) {
          user_id = board_users[y][x];
          power = board_powers[y][x];
          color = this._getColor(user_id);
          if (!(x in this.board[y])) {
            this.board[y][x] = this._newCellAt(x, y, color);
          }
          this.board[y][x].set('color', color);
          this.board[y][x].set('power', power);
          this.board[y][x].set('enabled', user_id === this.user_id);
          d = this.board[y][x].get('direction');
          if (d) {
            directions["" + y + "_" + x] = d;
          }
        }
      }
      for (_i = 0, _len = board_moves.length; _i < _len; _i++) {
        _ref = board_moves[_i], fx = _ref[0], fy = _ref[1], tx = _ref[2], ty = _ref[3];
        direction = this._getDirection(fx, fy, tx, ty);
        if (direction) {
          this.board[fy][fx].set('direction', direction);
          delete directions["" + fy + "_" + fx];
        }
      }
      for (pos in directions) {
        _ref1 = pos.split('_'), y = _ref1[0], x = _ref1[1];
        this.board[y][x].set('direction', 0);
      }
      has_cell_at = function(y, x) {
        if (y in board_users) {
          return x in board_users[y];
        }
        return false;
      };
      for (y in board_users) {
        for (x in board_users[y]) {
          y = parseInt(y);
          x = parseInt(x);
          shift = y % 2 ? 0 : 1;
          neighbours = [];
          if (has_cell_at(y - 1, x - 1 + shift)) {
            neighbours[1] = this.board[y - 1][x - 1 + shift];
          }
          if (has_cell_at(y - 1, x + shift)) {
            neighbours[2] = this.board[y - 1][x + shift];
          }
          if (has_cell_at(y, x + 1)) {
            neighbours[3] = this.board[y][x + 1];
          }
          if (has_cell_at(y + 1, x + shift)) {
            neighbours[4] = this.board[y + 1][x + shift];
          }
          if (has_cell_at(y + 1, x - 1 + shift)) {
            neighbours[5] = this.board[y + 1][x - 1 + shift];
          }
          if (has_cell_at(y, x - 1)) {
            neighbours[6] = this.board[y][x - 1];
          }
          this.board[y][x].set('neighbours', neighbours);
        }
      }
    };

    RenderEngine.prototype._getDirection = function(fx, fy, tx, ty) {
      var shift;
      shift = fy % 2 ? 0 : 1;
      if (ty === fy - 1 && tx === fx - 1 + shift) {
        return 1;
      }
      if (ty === fy - 1 && tx === fx + shift) {
        return 2;
      }
      if (ty === fy && tx === fx + 1) {
        return 3;
      }
      if (ty === fy + 1 && tx === fx + shift) {
        return 4;
      }
      if (ty === fy + 1 && tx === fx - 1 + shift) {
        return 5;
      }
      if (ty === fy && tx === fx - 1) {
        return 6;
      }
      return 0;
    };

    RenderEngine.prototype._newCellAt = function(x, y, color) {
      return new Cell({
        svg: this.svg,
        color: color,
        coord: {
          x: x,
          y: y
        },
        renderengine: this
      });
    };

    RenderEngine.prototype._getColor = function(user_id) {
      var i, num_users;
      if (!('_colors_assigned' in this)) {
        this._colors_assigned = {};
        this._colors_left = [this.colors.blue, this.colors.red];
      }
      if (user_id === 0) {
        return this.colors.gray;
      }
      if (user_id in this._colors_assigned) {
        return this._colors_assigned[user_id];
      }
      if (this._colors_left.length) {
        return this._colors_assigned[user_id] = this._colors_left.shift();
      }
      num_users = ((function() {
        var _results;
        _results = [];
        for (i in this._colors_assigned) {
          _results.push(i);
        }
        return _results;
      }).call(this)).length + 1;
      throw new Error("not enough colors for " + num_users + " users");
    };

    RenderEngine.prototype.move = function(fx, fy, tx, ty) {
      return console.log(fx, fy, tx, ty, this);
    };

    return RenderEngine;

  })();

  this.Engine = RenderEngine;

}).call(this);
