(function(){
'use strict';
/* globals Backbone */
/* globals Constants, Helpers */


var GraphCell = Backbone.Model.extend(
/** @lends GraphCell.prototype */
{
    defaults: {
        power: 0,
        color: 'black',
        row: 0,  // TODO does it have to be permanent
        col: 0,  // TODO does it have to be permanent
        coord: {x: 0, y: 0},
        hexagon: null,
        text: null
    },

    /**
     * @classdesc Represents a cell
     * @augments Backbone.Model
     * @constructs
     * @param {Object} attributes.color Color for this cell
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
        //_initOverlay()
        //_initArrow()
        //_initTmpArrow()  # TODO move to global
        this.on('change:power', this._changedPower, this);
        this.on('change:color', this._changedColor, this);
        //on('change:direction', @changedDirection, @)

        // XXX apparently they don't update with
        this.updateIfChanged(attributes.color, attributes.power);
        this.trigger('change:color', this, attributes.color);
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
        var coord = this.get('coord');
        coord.x = col * boardOffset.x + boardOffset.r + shiftX;
        coord.y = row * boardOffset.y + boardOffset.r;
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
     * Triggers power and color change only when they needs to update
     * @param {string} color Color to be updated
     * @param {int} power Power to be updated
     */
    updateIfChanged: function(color, power){
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

        // trigger color change
        if (this.get('color') !== color){
            this.set('color', color);
        }
        if (power <= this.constructor.opaquePower && powerChanged){
            this.trigger('change:color', this, color);
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
     * Redraw hexagon and arrow when color is changed
     * @param {GraphCell} model The current instance
     * @param {string} _color Color to be changed to
     */
    _changedColor: function(model, _color){
        var color, opacity;

        opacity =
            Math.min(this.get('power'), this.constructor.opaquePower) /
            this.constructor.opaquePower * (1 - this.constructor.minOpacity) +
            this.constructor.minOpacity;
        color = Helpers.blendColors(
            _color, opacity, this.constructor.background);
        this.get('hexagon').attr('fill', color);
        //this.get('arrow').attr('fill', this.BlendColors(this.get('color'), 1 - opacity, '#fdf6e3'))
    }

},{
    // class properties
    background: 'white',
    opaquePower: 50,
    minOpacity: 0.2
});
window.GraphCell = GraphCell;


})();
