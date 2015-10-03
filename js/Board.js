(function(){
'use strict';
/* globals Backbone, _ */


// TODO optimize
var Board = Backbone.Model.extend(
/**
 * @lends Board.prototype
 */
{
    defaults: {
        cells: null,
        userId: 0
    },

    /**
     * Initializes a new Board
     * Making each cell as:
     * * count - Number of power for that cell
     * * user - Current game user id
     * * move - Represents a move to another cell
     *         format: [<has_move>, <row>, <col>]
     * * candidates - Shows incoming count per user to this cell
     *         format: [<user>: <count>, ...]
     *
     * @classdesc Holds board data and functions for calculation
     * @property {array} cells Contains two dimensional array of cells. Each containing:
     *      type - Whether is gonna be a cell or for other uses
     *      count - Number of power for that cell
     *      user - Current game user id
     *      move - Represents a move to another cell
     *          format: [<has_move>, <row>, <col>]
     *      candidates - Shows incoming count per user to this cell
     *          Used temporarily while calculating fights on a cell
     *          format: [\<user\>: <count>, ...]
     * @augments Backbone.Model
     * @constructs
     */
    initialize: function(attrs, options){
        // TODO optimize. Under strict userId standard, it can be optimized
        var userIds = (function(){
            var userIds = [];
            this.each(function(cell){
                if (userIds.indexOf(cell.user) === -1){
                    userIds.push(cell.user);
                }
            });
            return userIds;
        }).call(this);
        this.each(function(cell, row, col){
            // move format: [<has_move>, <row>, <col>]
            cell.move = [0, 0, 0];
            cell.candidates = _.reduce(userIds, function(memo, userId){
                memo[userId] = 0;
                return memo;
            }, []);
        }, this);
    },

    /**
     * Iterates over the board by moving through rows and columns.
     * Makes sure context persists
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
     * Specifies a move on originating cell as following format:
     *      [<has_move>, <row>, <col>]
     * Or removes the move if origin and destination are same
     * @param {int} fy Originating column index
     * @param {int} fx Originating row index
     * @param {int} ty Destination column index
     * @param {int} tx Destination row index
     */
    move: function(fy, fx, ty, tx){
        var cells = this.get('cells');
        var isRemoval = fy === ty && fx === tx;

        if (isRemoval) {
            cells[fy][fx].move[0] = 0;
        }else{
            cells[fy][fx].move[0] = 1;
            cells[fy][fx].move[1] = ty;
            cells[fy][fx].move[2] = tx;
        }
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
     * Increment user cells by 3 per second
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
     *      move - Represents a move to another cell
     *          format: [<has_move>, <row>, <col>]
     *      candidates - Shows incoming count per user to this cell
     *          format: [<user>: <count>, ...]
     * Each cells will be decremented by {@link Board#_getDecrementOf}
     * to populate candidates for destination cell
     */
    _pickCandidates: function(){
        var cells = this.get('cells');
        this.each(function(cell, y, x){
            if (cell.move[0] === 1){
                // extract the move out count
                var movingCount = this._getDecrementOf(cell);
                if (movingCount === 0) { return; }

                // apply subtraction on source cell
                cell.count -= movingCount;
                // populate candidates on destination cell
                var destCell = cells[cell.move[1]][cell.move[2]];
                destCell.candidates[cell.user] += movingCount;
            }

            // current user as one of its candidates
            cell.candidates[cell.user] += cell.count;
        }, this);
    },

    /**
     * Choose winner and reset candidates
     * Candidates format: [<user>: <count>, ...]
     * @return {object|bool} False if there was no candidate
     */
    _electCandidateAndReset: function(candidates){
        // XXX one could merge map and sort functions by looking at source at
        // http://underscorejs.org/docs/underscore.html
        var numCandidates = 0;
        var tuples = _.map(candidates, function(c, u){
            if (c !== 0){ numCandidates++; }
            candidates[u] = 0;
            return [u, c];
        });
        if (numCandidates === 0) { return false; }
        var s = _.sortBy(tuples, function(v){ return -v[1]; });
        return {user: s[0][0], count: s[0][1] - s[1][1]};
    },

    /**
     * Candidates will be fought to decide winner on destination cell
     */
    _fightCandidates: function(){
        this.each(function(cell, y, x){
            var winner = this._electCandidateAndReset(cell.candidates);
            if (winner === false) {
                return;  // avoid extra processing
            }

            // remove move if taken over. Format: [<has_move>, <row>, <col>]
            if (cell.user !== winner.user){
                cell.move[0] = 0;
            }
            cell.user = winner.user;
            cell.count = winner.count;
        }, this);
    },

    /**
     * Decrements a cell power being a candidate as a mover
     * @return {int} Decrement amount
     */
    _getDecrementOf: function(cell){
        if (cell.count < 2) { return 0; }
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

},
/** @lends Board */
{
    /**
    * Trottles cell increment rather than move in from other cell
    * @default
    */
    cellLimit: 250,
    /**
     * Defines user id for a neutral user
     * @default
     */
    neutralUser: 0

});
window.Board = Board;


})();
