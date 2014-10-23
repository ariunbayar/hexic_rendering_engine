(function(){
'use strict';
/* globals Backbone, _ */
/* globals GraphBoard, Helpers */
/* globals _initBoard */


var GameEngine = Backbone.Model.extend(
/** @lends GameEngine.prototype */
{
    defaults: {
        userId: null,

        // graphics
        graphic: null,
        fps: 25,  // frames per second
        isFrameScheduled: false,

        // tick specific
        tps: 60,  // ticks per second
        board: null,
        tickId: 0,
        timeStarted: null,
        syncFailOffset: 2000  // milliseconds
    },

    /**
     * Initializes game engine
     *
     * @classdesc Creates a game for playing
     * @augments Backbone.Model
     * @constructs
     * @param {string} options.containerId Container where SVG will be added. As in CSS selector
     * @param {Object} options.boardData
     *      Initial board information<br>
     *      boardData.board - The board itself<br>
     *      boardData.width - Maximum row size<br>
     *      boardData.height - Number of row the board spans<br>
     *      boardData.userId - Current user id as in boardData.board<br>
     *      boardData.colors - Available colors for the board<br>
     *          0..N - Colors for users. Includes neutral user
     *          background - Background color for this board
     */
    initialize: function(attributes, options){
        var graphic = new GraphBoard({}, options);

        this.set('graphic', graphic);
        this.set('board', options.boardData.board);
        this.set('userId', options.boardData.userId);
        this.set('logger', graphic.getLogger());
        // Here we go
        this.set('timeStarted', +new Date());
        this.tick();
    },

    /**
     * Runs at every interval specified by GameEngine.tps
     * Triggered by {@link initialize} method
     * @param {bool} isCatchingUp
     *      Defines if current game is running slow and
     *      trying to catch up the timer
     */
    tick: function(isCatchingUp){
        var tps           = this.get('tps'),
            tick          = this.get('tickId'),
            tickInterval  = 1000 / tps,
            timeStarted   = this.get('timeStarted'),
            intervalFix, fn;

        // do processing and rendering
        this.processBoard(tick);
        if (!isCatchingUp && !this.get('isFrameScheduled')) {
            var frameInterval = 1000 / this.get('fps'),
                runDuration = +new Date() - timeStarted,
                nextFrameAt = frameInterval - runDuration % frameInterval,
                self = this;
            setTimeout(function(){
                self.set('isFrameScheduled', true);
                //console.log('render');
                self.get('graphic').render(self.get('board'));
                self.set('isFrameScheduled', false);
            }, nextFrameAt);
        }

        intervalFix = +new Date() - timeStarted - tick * tickInterval;
        if (intervalFix < 0) { intervalFix = 0; }  // Running fast? Thats OK

        if (intervalFix > this.get('syncFailOffset')) {
            this.get('logger').log('Game out of sync');
            return;
        }

        isCatchingUp = intervalFix > tickInterval;
        fn = _.bind(this.tick, this, isCatchingUp);
        setTimeout(fn, tickInterval - intervalFix);
    },

    /**
     * Heavy actions to increment and calculate attacks for the board
     * It has to run for every tick. Missing one will result sync failure
     * @param {int} tick Current tick
     */
    processBoard: function(tick){
        var board = this.get('board');

        var incrBy = tick % this.get('tps') ? 0 : 1;
        incrBy = 1;

        Helpers.iterBoard(board, function(cell, y, x){
            if (cell.user) {
                cell.count += incrBy;
            }
        }, this);

        this.set('tickId', this.get('tickId') + 1);
    },

    /**
     * Runs when another user move was received
     */
    move: function(){
        // TODO
    }

});
window.GameEngine = GameEngine;


})();
