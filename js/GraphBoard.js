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
                y: 2 * Constants.cellRadius * sin60 * sin60
            },
            board: null,
            /**
             * Available colors for the board
             *     0..N - Colors for users. Includes neutral user
             *     background - Background color for this board
             * @memberof GraphBoard
             */
            boardColors: null,
            cells: [],
            svg: null,
            boundMoveFunc: null,
            mouseDetected: true,
            touchDetected: true,

            // temporary properties
            tmpArrow: null,
            dragSrc: null
        };
    },

    /**
     * @classdesc Does all rendering for GameEngine
     * @augments Backbone.Model
     * @constructs
     * @param {string} options.containerId Container where SVG will be added. As in CSS selector
     * @param {Object} options.width Maximum row size
     * @param {Object} options.height Number of row the board spans
     * @param {int} options.userId Current user id
     */
    initialize: function(attributes, options){
        var layerNames= ['layer3', 'layer2', 'layer1'];

        var graphics = this._initSVG(
            options.containerId,
            options.width,
            options.height,
            layerNames
        );
        var frontLayer = graphics.layers[graphics.layers.length - 1];
        this._detectMouseOrTouch(frontLayer);
        this._handleUnexpectedInteraction(graphics.svg);
        this._initTmpArrow(frontLayer);
        this._initBoard(attributes.board, graphics.layers);
        this._highlightUserCells(attributes.board, options.userId);

        _.bindAll(this, 'dragStart', 'dragOver', 'dragOut', 'dragStop');

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

        this.set('svg', svg[0][0]);

        return {svg: svg, layers: layers};
    },

    /**
     * Binds events to detect mouse or touch event
     * @param {Object} frontLayer Element to catch events on
     */
    _detectMouseOrTouch: function(frontLayer){
        var self = this;

        var el = d3.select(window);
        el.on('touchstart', function(){
            el.on('mousemove', null);
            el.on('touchstart', null);
            self.set('mouseDetected', false);
        }).on('mousemove', function(){
            el.on('mousemove', null);
            el.on('touchstart', null);
            self.set('touchDetected', false);
        });
    },

    /**
     * There are cases when user is in progress of doing something.
     * Ex. dragging from one cell to another. It helps to avoid those mistakes.
     * @param {Object} svg Element to catch events on
     */
    _handleUnexpectedInteraction: function(svg){
        var g = this.constructor;
        svg.on('contextmenu', function(){ d3.event.preventDefault(); });
        svg.on('touchmove',   function(){ d3.event.preventDefault(); });
        window.addEventListener('blur',
            function(){ g.rollbackActions.call(g); });
        window.addEventListener('mouseup',
            function(){ g.rollbackActions.call(g); });
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
     * @param {Board} board The {@link Board} to be drawn
     * @param {Object} layers Layers that each cell to span
     */
    _initBoard: function (board, layers){
        var cells = this.get('cells');

        board.each(function(cell, row, col){
            if (_.isUndefined(cells[row])) { cells[row] = []; }
            cells[row][col] = new GraphCell(
                {gboard: this,
                 userId: cell.user,
                 row: row,
                 col: col,
                 power: cell.count},
                {layers: layers,
                 boardOffset: this.get('boardOffset')}
            );
        }, this);
    },

    /**
     * TODO
     */
    _highlightUserCells: function(board, userId){
        var cells = this.get('cells');
        board.each(function(cell, row, col){
            if (cell.user === userId){
                setTimeout(function() { cells[row][col].highlight(); }, 300);
                setTimeout(function() { cells[row][col].highlight(); }, 600);
                setTimeout(function() { cells[row][col].highlight(); }, 900);
            }
        });
    },

    /**
     * Renders the board at every {@link GameEngine#tick}
     * @param {Board} board Updated board data to render
     */
    render: function(board){
        var cells = this.get('cells');

        board.each(function(cell, row, col){
            cells[row][col].updateIfChanged(cell.user, cell.count, cell.move);
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
     * Runs when dragging is started
     * Applies only when current user is the owner
     * Triggered by a cell
     * @param {GraphCell} cell Cell that the event triggered
     * @param {int} row Row index of the cell
     * @param {int} col Column index of the cell
     */
    dragStart: function(cell, row, col){
        if (!this.get('board').isOwnerOf(row, col)){ return; }

        this.set('dragSrc', cell);
        this.constructor.rollbackQueue.push([function(){
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
    dragOver: function(cell, row, col){
        var srcCell = this.get('dragSrc'),
            hasSrcCell = !!srcCell,
            isOwner = this.get('board').isOwnerOf(row, col);
        var isNeighbour = hasSrcCell && Helpers.isNeighbours(
                srcCell.get('row'), srcCell.get('col'), row, col);

        if (!hasSrcCell && !isOwner){ return; }

        // when mouse is up and only hovering
        if (isOwner || isNeighbour) {
            cell.animateHoverIn();
            this.constructor.rollbackQueue.push([function(){
                cell.animateHoverOut();
            }, this, null, 'dragover']);
        }

        // when mouse is down and dragging
        if (isNeighbour && cell.cid !== srcCell.cid) {
            this._moveTmpArrow(srcCell.get('coord'), cell.get('coord'));
            this.constructor.rollbackQueue.push([function(){
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
    dragOut: function(cell, row, col){
        var srcCell = this.get('dragSrc'),
            isOwner = this.get('board').isOwnerOf(row, col);
        if (!isOwner && !srcCell){ return; }

        this.constructor.rollbackActions('dragover');
    },

    /**
     * Runs when dragging is completely stopped
     * Applies only when current user is the owner
     * Triggered by a cell
     * @param {GraphCell} cell Cell that the event triggered
     * @param {int} row Row index of the cell
     * @param {int} col Column index of the cell
     */
    dragStop: function(cell, row, col){
        var srcCell = this.get('dragSrc'),
            isOwner = this.get('board').isOwnerOf(row, col);
        if (!isOwner && !srcCell){ return; }

        this.constructor.rollbackActions();

        var isNeighbour = Helpers.isNeighbours(
                srcCell.get('row'), srcCell.get('col'), row, col);
        if (isNeighbour) {
            this.get('boundMoveFunc')(
                srcCell.get('row'), srcCell.get('col'),
                row, col);
        }
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
    },

    /**
     * Binds a trigger move function to be called by user interaction
     * @param {function} callback Callback function
     */
    bindMoveFunc: function(callback){
        this.set('boundMoveFunc', callback);
    },

    /**
     * TODO
     */
    animateEnd: function(board){
        var cells = this.get('cells');
        for (var i=0; i < 3; ++i) {
            board.each(function(c, y, x){
                setTimeout(function(){
                    cells[y][x].highlight();
                }, x * 150 + i * 1000);
            });
        }
    }
},
/** @lends GraphBoard */
{

    rollbackQueue: [],
    /**
     * Helps to avoid mis-drawings on the board. Basically meaning to cleanup.
     * There are cases when user is in progress of doing something.
     * Ex. dragging from one cell to another. And a popup opens
     * @param {string} label Process queues with given label
     */
    rollbackActions: function(label){
        var item,
            idx = this.rollbackQueue.length;

        while (idx--) {
            // XXX notice iterating from last element
            // XXX item: [func, context, args, label]
            item = this.rollbackQueue[idx];
            if (label && item[3] !== label){ continue; }

            this.rollbackQueue.splice(idx, 1);

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
