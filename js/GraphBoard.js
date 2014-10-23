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
            svg: null,  // TODO how long do we need to hold this object
            touchDetected: false,
            mouseDetected: false,
            boardOffset: {
                x: 2 * cellRadius * sin60,
                y: 2 * cellRadius * sin60 * sin60,
                r: cellRadius
            },
            colors: null,
            cells: [],
            rollbackQueue: []
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
     *      boardData.userId - Current user id as in boardData.board  TODO
     *      boardData.colors - Available colors for the board<br>
     *          0..N - Colors for users. Includes neutral user
     *          background - Background color for this board
     */
    initialize: function(attributes, options){
        var layerNames= ['layer3', 'layer2', 'layer1'];
        var boardData = options.boardData;
        this.set('colors', boardData.colors);

        var layers = this._initSVG(
            options.containerId,
            boardData.width,
            boardData.height,
            layerNames
        );
        this._detectMouseOrTouch();
        this._handleUnexpectedInteraction();
        this._initBoard(boardData.board, layers);

        this.set('logger', new Logger(options.containerId));
    },

    /**
     * Draws basic svg with their layers
     * @param {string} containerId  Container where SVG will be added. As in CSS selector
     * @param {Object} boardData
     * @param {int} boardData.width - Maximum row size
     * @param {int} boardData.height - Number of row the board spans
     * @param {Array} layers Array of layer names to be used as id
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

        this.set('svg', svg);

        return layers;
    },

    /**
     * Binds events to detect mouse or touch event to further set it to
     * touchDetected, mouseDetected properties
     */
    _detectMouseOrTouch: function(){
        var svg = this.get('svg');
        var self = this;

        svg.on('touchstart', function(){
            svg.on('mousemove', null);
            svg.on('touchstart', null);
            self.set('touchDetected', true);
        }).on('mousemove', function(){
            svg.on('mousemove', null);
            svg.on('touchstart', null);
            self.set('mouseDetected', true);
        });
    },

    /**
     * There are cases when user is in progress of doing something.
     * Ex. dragging from one cell to another. It helps to avoid those mistakes.
     */
    _handleUnexpectedInteraction: function(){
        var self = this;
        this.get('svg').on('contextmenu', function(){ d3.event.preventDefault(); });
        window.addEventListener('blur', function(){ self.rollbackActions.call(self); });
        window.addEventListener('mouseup', function(){ self.rollbackActions.call(self); });
        window.addEventListener('touchmove', function(e){ e.preventDefault(); });
    },

    /**
     * Draws initial board data having each cell as a neutral cell
     */
    _initBoard: function (board, layers){
        var colors = this.get('colors');
        var cells = this.get('cells');

        // TODO think of multiple instances of GraphBoard are running
        // who has different background colors
        GraphCell.background = colors.background;

        Helpers.iterBoard(board, function(cell, row, col){
            if (_.isUndefined(cells[row])) { cells[row] = []; }
            cells[row][col] = new GraphCell(
                {color: colors[cell.user],
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
        var colors = this.get('colors');
        var cells = this.get('cells');

        Helpers.iterBoard(board, function(cell, row, col){
            cells[row][col].updateIfChanged(colors[cell.user], cell.count);
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
     * Helps to avoid mis-drawings on the board. Basically meaning to cleanup.
     * There are cases when user is in progress of doing something.
     * Ex. dragging from one cell to another.
     */
    rollbackActions: function(){
        // TODO make this method private
        var item;
        var queue = this.get('rollbackQueue');

        // TODO improve rollback design
        while (true) {
            item = queue.shift();
            if (_.isUndefined(item)) {
                break;
            }

            // XXX item: [func, context, args]
            if (item[2]) {
                item[0].apply(item[1], item[2]);
            } else {
                item[0].call(item[1]);
            }
        }
    }

});
window.GraphBoard = GraphBoard;


})();
