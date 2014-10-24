(function(){
'use strict';
/* globals Backbone, d3, _ */
/* globals Constants, Logger, Helpers, GraphCell */


var GraphBoard = Backbone.Model.extend(
/** @lends GraphBoard.prototype */
{
    defaults: function(){
        var sin60 = Math.sin(Math.PI / 3);
        var cellRadius = 30;
        return {
            // mostly static properties. Set at init time
            boardOffset: {
                x: 2 * cellRadius * sin60,
                y: 2 * cellRadius * sin60 * sin60,
                r: cellRadius
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

        var layers = this._initSVG(
            options.containerId,
            options.boardData.width,
            options.boardData.height,
            layerNames
        );
        var frontLayer = layers[layers.length - 1];
        this._detectMouseOrTouch(frontLayer);
        this._handleUnexpectedInteraction(frontLayer);
        this._initTmpArrow(frontLayer);
        this._initBoard(options.boardData.board, layers);

        this.set('logger', new Logger(options.containerId));
    },

    /**
     * Draws basic svg with their layers
     * @param {string} containerId  Container where SVG will be added. As in CSS selector
     * @param {int} width - Maximum row size
     * @param {int} height - Number of row the board spans
     * @param {Array} layerNames Array of layer names to be used as id
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

        return layers;
    },

    /**
     * Binds events to detect mouse or touch event to
     * further set it to {@link GraphCell} properties
     */
    _detectMouseOrTouch: function(frontLayer){
        var self = this;

        var el = d3.select(window);
        el.on('touchstart', function(){
            el.on('mousemove', null);
            el.on('touchstart', null);
            GraphCell.touchDetected = true;
        }).on('mousemove', function(){
            el.on('mousemove', null);
            el.on('touchstart', null);
            GraphCell.mouseDetected = true;
        });
    },

    /**
     * There are cases when user is in progress of doing something.
     * Ex. dragging from one cell to another. It helps to avoid those mistakes.
     */
    _handleUnexpectedInteraction: function(frontLayer){
        frontLayer.on('contextmenu',
            function(){ d3.event.preventDefault(); });
        window.addEventListener('blur',
            function(){ GraphCell.rollbackActions.call(GraphCell); });
        window.addEventListener('mouseup',
            function(){ GraphCell.rollbackActions.call(GraphCell); });
        window.addEventListener('touchmove',
            function(e){ e.preventDefault(); });
    },

    /**
     * TODO
     */
    _initTmpArrow: function(frontLayer){
        var arrow = frontLayer.append('svg:polygon')
          .attr('stroke', '#ff0000')
          .attr('stroke-width', 5)
          .attr('points', Constants.tmpArrow)
          .attr('visibility', 'hidden')
          .attr('stroke-linejoin', 'round');
        this.set('tmpArrow', arrow);
    },

    /**
     * Draws initial board data
     * Injects drag methods to get feedback
     */
    _initBoard: function (board, layers){
        var cells = this.get('cells');

        GraphCell.dragStart = _.bind(this._dragStart, this);
        GraphCell.dragOver  = _.bind(this._dragOver,this);
        GraphCell.dragOut   = this._dragOut;
        GraphCell.dragStop  = this._dragStop;

        Helpers.iterBoard(board, function(cell, row, col){
            if (_.isUndefined(cells[row])) { cells[row] = []; }
            cells[row][col] = new GraphCell(
                {userId: cell.user,
                 row: row,
                 col: col,
                 power: cell.count},
                {type: cell.type,
                 layers: layers,
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
     * TODO
     */
    _dragStart: function(cell, row, col){
        //if (cells[row][col])  ???
        this.set('dragSrc', cell);

        GraphCell.rollbackQueue.push([function(){
            this.set('dragSrc', null);
        }, this]);
    },

    /**
     * TODO
     */
    _dragOver: function(cell){
        console.log('dragover');
        // when mouse is up only hovering
        cell.animateHoverIn();
        GraphCell.rollbackQueue.push([function(){
            cell.animateHoverOut();
        }, this]);

        // when mouse is down and dragging
        var srcCell = this.get('dragSrc');
        if (srcCell) {
            // TODO
            //[direction, drag_src] = drag_src_info
            //drag_src.get('el').tmpArrowTo(direction)
        }
    },

    /**
     * TODO
     */
    _dragOut: function(cell){
        console.log('dragout');
        GraphCell.rollbackActions();
        // TODO needs binding context?
        // TODO
    },

    /**
     * TODO
     */
    _dragStop: function(cell){
        // TODO needs binding context?
        // TODO
    }

});
window.GraphBoard = GraphBoard;


})();
