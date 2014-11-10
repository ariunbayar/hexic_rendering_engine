(function(){
'use strict';
/* globals Backbone, _ */


// TODO optimize
var Board = Backbone.Model.extend(
/** @lends Board.prototype */
{
    defaults: {
        cells: null,
        userId: 0
    },

    /**
     * Initializes a new Board
     *
     * @classdesc Holds board data and functions for calculation
     * @augments Backbone.Model
     * @constructs
     */
    initialize: function(attributes, options){
        this.each(function(cell, y, x){
            cell.move = {row: null, col: null};
            cell.candidates = {};
        }, this);
    },

    /**
     * Iterates over the board by moving through rows and columns.
     * Makes sure context exists
     * @param {Object} board NxM array of boards
     * @param {function} callback Callback function to run for every cell
     * @param {*} context Context within the callback function (this)
     */
    each: function(callback, context){
        var cells = this.get('cells');
        for (var y = cells.length - 1; y >= 0; y--) {
            for (var x = cells[y].length - 1; x >= 0; x--) {
                if (cells[y][x].type === 'cell'){
                    callback.call(context, cells[y][x], y, x);
                }
            }
        }
    },

    /**
     * Determines if current user is the owner of given cell
     * @param {int} row Row index of the cell
     * @param {int} col Column index of the cell
     * @return {bool} Assessment if current user is owner
     */
    isOwnerOf: function(row, col){
        return this.get('cells')[row][col].user === this.get('userId');
    },

    /**
     * Adds a new move
     * @param {int} fy Originating column index
     * @param {int} fx Originating row index
     * @param {int} ty Destination column index
     * @param {int} tx Destination row index
     */
    move: function(fy, fx, ty, tx){
        var cells = this.get('cells');
        cells[fy][fx].move.row = ty;
        cells[fy][fx].move.col = tx;
        // TODO a stop move
    },

    /**
     * Heavy actions to increment and calculate attacks for the board
     * It has to run for every tick. Missing one will result sync failure
     * @param {int} tick Current tick for the game
     */
    process: function(tick){
        this._increment(tick);
        this._pickCandidates();
        this._fightCandidates();
    },

    /**
     * Increment user cells by 10 at every 10 seconds
     * @param {int} tick Current tick for the game
     */
    _increment: function(tick){
        var incrBy = 1;
        if (tick % 20) { return; }

        this.each(function(cell, y, x){
            if (cell.user === this.constructor.neutralUser) { return; }
            if (cell.count >= this.constructor.cellLimit) { return; }
            cell.count += incrBy;
        }, this);
    },

    /**
     * Decrements cells and collect power candidates
     * Each cell contains following values:
     *      count - Number of power for that cell
     *      user - Current game user id
     *      move.row, move.col - Represents a move to another cell
     *      candidates - Shows incoming count per user to this cell
     * Each cells will be decremented by {@link Board#_getDecrementOf}
     * to populate candidates for destination cell
     * Resulting candidates format: {<user>: <count> ...}
     */
    _pickCandidates: function(){
        var cells = this.get('cells');

        this.each(function(cell, y, x){
            if (cell.move.row !== null && cell.move.col !== null){
                var destCell = cells[cell.move.row][cell.move.col];

                // extract the move out count
                var movingCount = this._getDecrementOf(cell);
                if (movingCount === 0) { return; }

                // apply subtraction on source cell
                cell.count -= movingCount;

                // populate candidates on destination cell
                if (!(cell.user in destCell.candidates)){
                    destCell.candidates[cell.user] = movingCount;
                }else{
                    destCell.candidates[cell.user] += movingCount;
                }
            }

            // current user as one of its candidates
            if (!(cell.user in cell.candidates)){
                cell.candidates[cell.user] = cell.count;
            }else{
                cell.candidates[cell.user] += cell.count;
            }
        }, this);
    },

    /**
     * Candidates will be fought to decide winner on destination cell
     * Required candidates format: {<user>: <count> ...}
     */
    _fightCandidates: function(){
        this.each(function(cell, y, x){
            if (!_.size(cell.candidates)) { return; }
            var winner, secondHighestCount = 0;

            winner = _.reduce(cell.candidates, function(w, count, user){
                delete cell.candidates[user];
                if (count > w.count){
                    secondHighestCount = w.count;
                    return {user: user, count: count};
                }else if (count === w.count){
                    // intentional incident of candidates
                    secondHighestCount = w.count;
                    return {user: this.constructor.neutralUser, count: count};
                }else{
                    secondHighestCount = Math.max(count, secondHighestCount);
                    return w;
                }
            }, {user: 0, count: 0}, this);

            winner.user = +winner.user;
            // remove any move if taken over
            if (cell.user !== winner.user) {
                cell.move.row = null;
                cell.move.col = null;
            }
            cell.user = winner.user;
            cell.count = winner.count - secondHighestCount;
        }, this);
    },

    // TODO useless?
    _cellAt: function(cells, x, y){
        return cells[y][x];
    },

    /**
     * TODO
     */
    _getDecrementOf: function(cell){
        return Math.ceil(Math.log2(cell.count));
    },

    /**
     * TODO
     */
    setSnapshot: function(jsonData){
        var data = JSON.parse(jsonData);
        this.set('cells', data.cells);
        this.set('userId', data.userId);
    },

    /**
     * TODO
     */
    getSnapshot: function(){
        return JSON.stringify({
            cells: this.get('cells'),
            userId: this.get('userId')
        });
    }

    // TODO winner

},{

    cellLimit: 250,
    neutralUser: 0

});
window.Board = Board;


})();
