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
        tickId: 0,
        timeStarted: null,
        syncFailOffset: 5000,  // milliseconds

        // snapshot
        maxSnapshot: 12,
        snapshotPerTick: 10,
        // format: [{data: <board_data>, tickId: <tick_id>} ... ]
        snapshots: []
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
             height: options.boardData.height,
             userId: options.boardData.userId}
        );
        this.set('graphic', graphic);
        this.set('board', board);
        this.set('userId', options.boardData.userId);
        this.set('logger', graphic.getLogger());
        this.set('timeStarted', +new Date());
    },

    /**
     * Start ticking
     */
    start: function(){
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
            board         = this.get('board'),
            intervalFix, fn;

        // do processing
        board.process(tick);
        this.set('tickId', tick + 1);

        // do the snapshots
        if (tick % this.get('snapshotPerTick') === 0){
            var snapshots = this.get('snapshots');
            if (snapshots.length >= this.get('maxSnapshot')){
                snapshots.shift();
            }
            snapshots.push({data: board.getSnapshot(), tickId: tick});
        }

        // do the rendering
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
     * TODO
     */
    moveReceived: function(fy, fx, ty, tx, tickId){
        var board = this.get('board');
        if (this._setTickTo(tickId)){
            board.move(fy, fx, ty, tx);
        }else{
            this.get('logger').log('Game out of sync!');
        }
    },

    /**
     * Binds trigger function
     * @param {function} callback Called when a move is triggered
     * TODO
     */
    onMoveTrigger: function(callback, context){
        var self = this;
        this.get('graphic').bindMoveFunc(function(fy, fx, ty, tx){
            callback.call(context, fy, fx, ty, tx, self.get('tickId'));
        });
    },

    /**
     * TODO
     */
    _setTickTo: function(tickId){
        var snapshots = this.get('snapshots');
        var idx, len = snapshots.length;
        for (idx=0; idx<len; ++idx) {
            if (snapshots[idx].tickId > tickId){ break; }
        }
        if (idx == 0){ return false; }

        snapshots.splice(idx);
        var snapshot = snapshots[idx - 1];
        var board = this.get('board');
        var _tickId = snapshot.tickId;

        board.setSnapshot(snapshot.data);
        while (tickId > _tickId){
            board.process(_tickId);
            _tickId++;
        }
        this.set('tickId', _tickId);
        return true;
    }

});
window.GameEngine = GameEngine;


})();
