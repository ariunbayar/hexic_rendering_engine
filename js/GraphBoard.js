(function(){
'use strict';
/* globals Backbone, d3, _ */
/* globals Constants, Logger, Helpers, GraphCell */


var GraphBoard = Backbone.Model.extend(
/** @lends GraphBoard.prototype */
{
    defaults: function(){
        var sin60 = Math.sin(Math.PI / 3);
        return {
            // mostly static properties. Set at init time
            boardOffset: {
                x: 2 * Constants.cellRadius * sin60,
                y: 2 * Constants.cellRadius * sin60 * sin60,
            },
            boardData: null,
            cells: [],

            // dynamic or at least part of it
            tmpArrow: null,
            dragSrc: null
        };
    },

    /**
     * @classdesc Does all rendering for GameEngine
     * @augments Backbone.Model
     * @constructs
     * @param {string} options.containerId Container where SVG will be added. As in CSS selector
     * @param {Object} options.boardData
     *      Initial board information<br>
     *      boardData.board - The board itself<br>
     *      boardData.width - Maximum row size<br>
     *      boardData.height - Number of row the board spans<br>
     *      boardData.userId - Current user id as in boardData.board
     *      boardData.colors - Available colors for the board<br>
     *          0..N - Colors for users. Includes neutral user
     *          background - Background color for this board
     */
    initialize: function(attributes, options){
        var layerNames= ['layer3', 'layer2', 'layer1'];

        this.set('boardData', options.boardData);
        GraphCell.boardData = options.boardData;

        var graphics = this._initSVG(
            options.containerId,
            options.boardData.width,
            options.boardData.height,
            layerNames
        );
        var frontLayer = graphics.layers[graphics.layers.length - 1];
        this._detectMouseOrTouch(frontLayer);
        this._handleUnexpectedInteraction(graphics.svg);
        this._initTmpArrow(frontLayer);
        this._initBoard(options.boardData.board, graphics);

        this.set('logger', new Logger(options.containerId));
    },

    /**
     * Draws basic svg with their layers
     * @param {string} containerId  Container where SVG will be added. As in CSS selector
     * @param {int} width - Maximum row size
     * @param {int} height - Number of row the board spans
     * @param {Array} layerNames Array of layer names to be used as id
     * @return {Object} SVG element and its layers as an object
     */
    _initSVG: function(containerId, width, height, layerNames){
        var boardOffset = this.get('boardOffset');
        var svgPadding = 5;  // XXX fixes cutting around svg boundary

        var svg = d3.select(containerId).append('svg')
            .attr('width',  (width  + 0.5) * boardOffset.x + svgPadding)
            .attr('height', (height + 0.5) * boardOffset.y + svgPadding)
            .attr('style', Constants.nonSelectForSVG);

        var layers = [];
        for (var i=0, len=layerNames.length; i < layerNames.length; ++i) {
            layers.push(svg.append('g').attr('id', layerNames[i]));
        }

        return {svg: svg, layers: layers};
    },

    /**
     * Binds events to detect mouse or touch event to
     * further set it to {@link GraphCell} properties
     * @param {Object} frontLayer Element to catch events on
     */
    _detectMouseOrTouch: function(frontLayer){
        var self = this;

        var el = d3.select(window);
        el.on('touchstart', function(){
            el.on('mousemove', null);
            el.on('touchstart', null);
            GraphCell.mouseDetected = false;
        }).on('mousemove', function(){
            el.on('mousemove', null);
            el.on('touchstart', null);
            GraphCell.touchDetected = false;
        });
    },

    /**
     * There are cases when user is in progress of doing something.
     * Ex. dragging from one cell to another. It helps to avoid those mistakes.
     * @param {Object} svg Element to catch events on
     */
    _handleUnexpectedInteraction: function(svg){
        svg.on('contextmenu', function(){ d3.event.preventDefault(); });
        svg.on('touchmove',   function(){ d3.event.preventDefault(); });
        window.addEventListener('blur',
            function(){ GraphCell.rollbackActions.call(GraphCell); });
        window.addEventListener('mouseup',
            function(){ GraphCell.rollbackActions.call(GraphCell); });
    },

    /**
     * Initialize a temporary arrow, appears only when user is dragging.
     * @param {Object} frontLayer Element to draw element on
     */
    _initTmpArrow: function(frontLayer){
        var arrow = frontLayer.append('svg:polygon')
          .attr('stroke', '#ffff00')
          .attr('stroke-width', 5)
          .attr('points', Constants.tmpArrow)
          .attr('visibility', 'hidden')
          .attr('stroke-linejoin', 'round');
        this.set('tmpArrow', arrow);
    },

    /**
     * Draws initial board data
     * Injects drag methods to get feedback
     * @param {Object} board The board to be drawn
     * @param {Object} layers Layers that each cell to span
     */
    _initBoard: function (board, graphics){
        var cells = this.get('cells');

        GraphCell.dragStart = _.bind(this._dragStart, this);
        GraphCell.dragOver  = _.bind(this._dragOver,  this);
        GraphCell.dragOut   = _.bind(this._dragOut,   this);
        GraphCell.dragStop  = _.bind(this._dragStop,  this);
        GraphCell.svg = graphics.svg[0][0];
        GraphCell.cells = cells;

        Helpers.iterBoard(board, function(cell, row, col){
            if (_.isUndefined(cells[row])) { cells[row] = []; }
            cells[row][col] = new GraphCell(
                {userId: cell.user,
                 row: row,
                 col: col,
                 power: cell.count},
                {type: cell.type,
                 layers: graphics.layers,
                 boardOffset: this.get('boardOffset')}
            );
        }, this);
    },

    /**
     * Renders the board at every {@link GameEngine#tick}
     * @param {Array} board Updated board data to render
     */
    render: function(board){
        var cells = this.get('cells');

        Helpers.iterBoard(board, function(cell, row, col){
            cells[row][col].updateIfChanged(cell.user, cell.count);
        }, this);
    },

    /**
     * Graphic element should contain a logger
     * to display technical issues to the user
     * @return {Logger} The single instance of the {@link Logger} instance
     */
    getLogger: function(){
        return this.get('logger');
    },

    /**
     * Determines if current user is the owner of given cell
     * @param {int} row Row index of the cell
     * @param {int} col Column index of the cell
     * @return {bool} Assessment if current user is owner
     */
    _isOwner: function(row, col){
        var boardData = this.get('boardData');
        return boardData.board[row][col].user === boardData.userId;
    },

    /**
     * Runs when dragging is started
     * Applies only when current user is the owner
     * Triggered by a cell
     * @param {GraphCell} cell Cell that the event triggered
     * @param {int} row Row index of the cell
     * @param {int} col Column index of the cell
     */
    _dragStart: function(cell, row, col){
        if (!this._isOwner(row, col)){ return; }

        this.set('dragSrc', cell);
        GraphCell.rollbackQueue.push([function(){
            this.set('dragSrc', null);
        }, this]);
    },

    /**
     * Runs when dragging went over a cell
     * Applies only when current user is the owner
     * Triggered by a cell
     * @param {GraphCell} cell Cell that the event triggered
     * @param {int} row Row index of the cell
     * @param {int} col Column index of the cell
     */
    _dragOver: function(cell, row, col){
        var srcCell = this.get('dragSrc'),
            hasSrcCell = !!srcCell,
            isOwner = this._isOwner(row, col);
        var isNeighbour = hasSrcCell && Helpers.isNeighbours(
                srcCell.get('row'), srcCell.get('col'), row, col);

        if (!hasSrcCell && !isOwner){ return; }

        // when mouse is up and only hovering
        if (isOwner || isNeighbour) {
            cell.animateHoverIn();
            GraphCell.rollbackQueue.push([function(){
                cell.animateHoverOut();
            }, this, null, 'dragover']);
        }

        // when mouse is down and dragging
        if (isNeighbour && cell.cid !== srcCell.cid) {
            this._moveTmpArrow(srcCell.get('coord'), cell.get('coord'));
            GraphCell.rollbackQueue.push([function(){
                this._moveTmpArrow(null);
            }, this, null, 'dragover']);
        }
    },

    /**
     * Runs when dragged out of a cell
     * Applies only when current user is the owner
     * Triggered by a cell
     * @param {GraphCell} cell Cell that the event triggered
     * @param {int} row Row index of the cell
     * @param {int} col Column index of the cell
     */
    _dragOut: function(cell, row, col){
        var srcCell = this.get('dragSrc');
        if (!this._isOwner(row, col) && !srcCell){ return; }

        GraphCell.rollbackActions('dragover');
    },

    /**
     * Runs when dragging is completely stopped
     * Applies only when current user is the owner
     * Triggered by a cell
     * @param {GraphCell} cell Cell that the event triggered
     * @param {int} row Row index of the cell
     * @param {int} col Column index of the cell
     */
    _dragStop: function(cell, row, col){
        var srcCell = this.get('dragSrc');
        if (!this._isOwner(row, col) && !srcCell){ return; }

        GraphCell.rollbackActions();
        // TODO trigger move action
        console.log(srcCell.get('row'), srcCell.get('col'), row, col);
    },

    /**
     * Allows tmp arrow to appear on board for src and dest coord.s
     * @param {Object} coordSrc Source coordinate on the board
     * @param {Object} coordDest Destination coordinate on the board
     */
    _moveTmpArrow: function(coordSrc, coordDest){
        if (coordSrc === null){
            this.get('tmpArrow').style('visibility', 'hidden');
            return;
        }

        var t = d3.transform(),
            delta = {y: coordDest.y - coordSrc.y, x: coordDest.x - coordSrc.x};
        t.translate = [coordSrc.x, coordSrc.y];
        t.rotate = Math.atan2(delta.y, delta.x) * 180 / Math.PI;

        this.get('tmpArrow')
            .style('visibility', 'visible')
            .attr('transform', t.toString());
    }

});
window.GraphBoard = GraphBoard;


})();
