(function(){
'use strict';
/* globals Backbone, _, d3 */
/* globals Constants, Helpers */


var GraphCell = Backbone.Model.extend(
/** @lends GraphCell.prototype */
{
    defaults: {
        power: 0,
        userId: null,
        row: 0,
        col: 0,
        coord: null,
        hexagon: null,
        text: null
    },

    /**
     * @classdesc Represents a cell
     * @augments Backbone.Model
     * @constructs
     * @param {Object} attributes.userId User for this cell
     * @param {Object} attributes.power Power for the cell
     * @param {int} attributes.row Board row index
     * @param {int} attributes.col Board column index
     * @param {Object} options.type One of: Cell
     * @param {Array} options.layers Layer elements. First layer is in the back
     * @param {int} options.boardOffset Pre-calculated offset between cells
     */
    initialize: function(attributes, options){
        if (options.type !== 'cell'){ return; }

        var coord = this._initCoord(
            attributes.row,
            attributes.col,
            options.boardOffset
        );
        this._initHexagon(options.layers[0], coord);
        this._initText(options.layers[0], coord);
        //this._initArrow(options.layers[1]);
        this._initOverlay(options.layers[2], coord);

        this.on('change:power', this._changedPower, this);
        this.on('change:userId', this._changedUserId, this);
        //on('change:direction', @changedDirection, @)

        // trigger manually to update the changes as they are already changed
        this.updateIfChanged(attributes.userId, attributes.power);
        this.trigger('change:userId', this, attributes.userId);
        this.trigger('change:power', this, attributes.power);
    },

    /**
     * Finds center location for current cell
     * @param {int} row Board row index
     * @param {int} col Board column index
     * @param {int} boardOffset Pre-calculated offset between cells
     */
    _initCoord: function(row, col, boardOffset){
        var shiftX = (row % 2) ? 0 : (boardOffset.x / 2);
        var coord = {};
        coord.x = col * boardOffset.x + boardOffset.r + shiftX;
        coord.y = row * boardOffset.y + boardOffset.r;
        this.set('coord', coord);
        return coord;
    },

    /**
     * Draws a visible hexagon on given layer and coord
     * @param {Object} layer Layer element as a response of d3.select()
     * @param {Object} coord Current cell coordinate {x: <x>, y: <y>}
     */
    _initHexagon: function(layer, coord){
        var hexagon = layer.append('svg:path')
            .attr('d', Constants.hexagon)
            .attr('transform', 'translate(' + coord.x + ',' + coord.y + ')');
        this.set('hexagon', hexagon);
    },

    /**
     * Draws a text element on given layer and coord,
     * filling with given power
     * @param {Object} layer Layer element as a response of d3.select()
     * @param {Object} coord Current cell coordinate {x: <x>, y: <y>}
     * @param {int} power Number to show within text
     */
    _initText: function(layer, coord, power){
        var text = layer.append('text')
          .attr('x', coord.x)
          .attr('y', coord.y)
          .attr('text-anchor', 'middle')
          .attr('alignment-baseline', 'central')  // XXX problem with firefox
          .attr('font-family', 'Pathway Gothic One, sans-serif')
          .attr('font-size', '.8em')
          .attr('fill', 'white');

        this.set('text', text);
    },

    /**
     * Triggers power and user change only when they needs to update
     * @param {string} userId User to be updated
     * @param {int} power Power to be updated
     */
    updateIfChanged: function(userId, power){
        var newPower,
            oldPower = this.get('power'),
            powerChanged;

        // trigger power change
        if (power > 1000){
            newPower = Math.floor(power / 100) / 10 + 'K';
        }else{
            newPower = power;
        }
        powerChanged = oldPower !== newPower;
        if (powerChanged) {
            this.set('power', newPower);
        }

        // trigger user change
        if (this.get('userId') !== userId){
            this.set('userId', userId);
        }
        if (power <= this.constructor.opaquePower && powerChanged){
            this.trigger('change:userId', this, userId);
        }
    },

    /**
     * Redraw when power is modified
     * @param {GraphCell} model The current instance
     * @param {string|int} power Power to display in UI. `50` or `1.2K`
     */
    _changedPower: function(model, power){
        this.get('text').text(power);
    },

    /**
     * Redraw hexagon and arrow when user is changed
     * @param {GraphCell} model The current instance
     * @param {string} userId User to be changed to
     */
    _changedUserId: function(model, userId){
        var color, opacity;

        opacity =
            Math.min(this.get('power'), this.constructor.opaquePower) /
            this.constructor.opaquePower * (1 - this.constructor.minOpacity) +
            this.constructor.minOpacity;
        color = Helpers.blendColors(
            this.constructor.boardData.colors[userId],
            opacity,
            this.constructor.boardData.colors.background
        );
        this.get('hexagon').attr('fill', color);
        //this.get('arrow').attr('fill', this.BlendColors(this.get('color'), 1 - opacity, '#fdf6e3'))
    },

    /**
     * Mouse/Touch event capture element that overlays on all other elements
     * @param {Object} layer Layer to be drawn which is d3.select() object
     * @param {Object} coord Current cell coordinate {x: <x>, y: <y>}
     */
    _initOverlay: function(layer, coord){
        var translate, overlay, self = this;

        translate = 'translate(' + coord.x + ',' + coord.y + ')';
        overlay = layer.append('svg:path')
            .attr('d', Constants.hexagon)
            .attr('opacity', 0)
            .attr('transform', translate + ' scale(1.04, 1.04)');

        // XXX Benchmark referencing self vs _.bind?
        overlay.on('mousedown', function(){ self._mouseDown.call(self);  });
        overlay.on('mouseup',   function(){ self._mouseUp.call(self);    });
        overlay.on('mouseover', function(){ self._mouseOver.call(self);  });
        overlay.on('mouseout',  function(){ self._mouseOut.call(self);   });
        overlay.on('touchstart',function(){ self._touchStart.call(self); });
        overlay.on('touchmove', function(){ self._touchMove.call(self);  });
        overlay.on('touchend',  function(){ self._touchEnd.call(self);   });
    },

    /**
     * TODO
     */
    _mouseDown: function(){
        if (!this.constructor.mouseDetected) { return; }

        this.constructor.dragStart(this, this.get('row'), this.get('col'));
    },

    /**
     * TODO
     */
    _mouseUp: function(){
        if (!this.constructor.mouseDetected) { return; }

        this.constructor.dragStop(this, this.get('row'), this.get('col'));
    },

    /**
     * TODO
     */
    _mouseOver: function(){
        if (!this.constructor.mouseDetected) { return; }

        this.constructor.dragOver(this, this.get('row'), this.get('col'));
    },

    /**
     * TODO
     */
    _mouseOut: function(){
        if (!this.constructor.mouseDetected) { return; }

        this.constructor.dragOut(this,  this.get('row'), this.get('col'));
    },

    /**
     * TODO
     */
    _touchStart: function(){
        if (!this.constructor.touchDetected) { return; }
        // TODO
    },

    /**
     * TODO
     */
    _touchMove: function(){
        if (!this.constructor.touchDetected) { return; }
        // TODO
    },

    /**
     * TODO
     */
    _touchEnd: function(){
        if (!this.constructor.touchDetected) { return; }
        // TODO
    },

    animateHoverIn: function(){
        var hexagon = this.get('hexagon');
        var t = d3.transform(hexagon.attr('transform'));
        t.scale = [1.08, 1.08];
        hexagon.attr('transform', t.toString());
    },

    animateHoverOut: function(){
        var hexagon = this.get('hexagon');
        var t = d3.transform(hexagon.attr('transform'));
        t.scale = [1, 1];
        hexagon.attr('transform', t.toString());
    }

},{

    boardData: null,

    opaquePower: 50,
    minOpacity: 0.2,

    touchDetected: false,  // @see GraphBoard._detectMouseOrTouch
    mouseDetected: false,  // @see GraphBoard._detectMouseOrTouch

    dragStart: null, // XXX to be overriden by {@link GraphBoard}
    dragOver : null, // XXX to be overriden by {@link GraphBoard}
    dragOut  : null, // XXX to be overriden by {@link GraphBoard}
    dragStop : null, // XXX to be overriden by {@link GraphBoard}

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
window.GraphCell = GraphCell;


})();
