(function(){
'use strict';
/* globals Backbone, _ */
/* globals GraphBoard, Board, Helpers */
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
        logger: null,

        // tick specific
        tps: 60,  // ticks per second
        board: null,
        tickId: 1,
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
        var board = new Board({
            cells : options.boardData.board,
            userId: options.boardData.userId
        });
        var graphic = new GraphBoard(
            {board: board, boardColors: options.boardData.colors},
            {containerId: options.containerId,
             width: options.boardData.width,
             height: options.boardData.height}
        );
        this.set('graphic', graphic);
        this.set('board', board);
        this.set('userId', options.boardData.userId);
        this.set('logger', graphic.getLogger());
    },

    /**
     * Start ticking
     */
    start: function(){
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
        this.get('board').process(tick);
        this.set('tickId', tick + 1);
        if (!isCatchingUp && !this.get('isFrameScheduled')) {
            var frameInterval = 1000 / this.get('fps'),
                runDuration = +new Date() - timeStarted,
                nextFrameAt = frameInterval - runDuration % frameInterval,
                self = this;
            setTimeout(function(){
                self.set('isFrameScheduled', true);
                self.get('graphic').render(self.get('board'));
                self.set('isFrameScheduled', false);
            }, nextFrameAt);
        }

        intervalFix = +new Date() - timeStarted - tick * tickInterval;
        //if (intervalFix < 0) { intervalFix = 0; }  // Running fast? Thats OK

        if (intervalFix > this.get('syncFailOffset')) {
            this.get('logger').log('Game out of sync');
            return;
        }

        isCatchingUp = intervalFix > tickInterval;
        fn = _.bind(this.tick, this, isCatchingUp);
        setTimeout(fn, tickInterval - intervalFix);
    },

    /**
     * Runs when another user move was received
     */
    moveReceived: function(fy, fx, ty, tx, tickId){
        var board = this.get('board');
        console.log('move received', fy, fx, ty, tx, tickId);
        board.move(fy, fx, ty, tx);
    },

    /**
     * Binds trigger function
     * @param {function} callback Called when a move is triggered
     */
    onMoveTrigger: function(callback, context){
        var self = this;
        this.get('graphic').bindMoveFunc(function(fy, fx, ty, tx){
            callback.call(context, fy, fx, ty, tx, self.get('tickId'));
        });
    }

});
window.GameEngine = GameEngine;


})();
