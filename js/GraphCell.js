(function(){
'use strict';
/* globals Backbone, _, d3 */
/* globals Constants, Helpers */


var GraphCell = Backbone.Model.extend(
/** @lends GraphCell.prototype */
{
    defaults: {
        gboard: null,
        power: 0,
        userId: null,
        row: 0,
        col: 0,
        coord: null,
        hexagon: null,
        arrow: null,
        text: null,
        move: null
    },

    /**
     * @classdesc Represents a cell
     * @augments Backbone.Model
     * @constructs
     * @param {Object} attributes.userId User for this cell
     * @param {Object} attributes.power Power for the cell
     * @param {int} attributes.row Board row index
     * @param {int} attributes.col Board column index
     * @param {Array} options.layers Layer elements. First layer is in the back
     * @param {int} options.boardOffset Pre-calculated offset between cells
     */
    initialize: function(attributes, options){
        var coord = this._initCoord(
            attributes.row,
            attributes.col,
            options.boardOffset
        );
        this._initHexagon(options.layers[0], coord);
        this._initText(options.layers[0], coord);
        this._initArrow(options.layers[1], coord);
        this._initOverlay(options.layers[2], coord);

        this.on('change:power', this._changedPower, this);
        this.on('change:userId', this._changedUserId, this);
        this.on('change:move', this._changedMove, this);

        // trigger manually to update the changes as they are already changed
        this.updateIfChanged(attributes.userId, attributes.power, null);
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
        coord.x = col * boardOffset.x + Constants.cellRadius + shiftX;
        coord.y = row * boardOffset.y + Constants.cellRadius;
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
     * Draws an arrow on given layer and coord.
     * @param {d3.select} layer Layer element as a response of d3.select()
     * @param {Object} coord Current cell coordinate {x: <x>, y: <y>}
     */
    _initArrow: function(layer, coord){
        var arrow = layer.append('svg:path')
            .attr('d', Constants.arrow)
            .attr('transform', 'translate(' + coord.x + ',' + coord.y + ')')
            .attr('fill', this.get('gboard').get('boardColors').background)
            .attr('visibility', 'hidden');
      this.set('arrow', arrow);
    },

    /**
     * Triggers power and user change only when they needs to update
     * @param {string} userId User to be updated
     * @param {int} power Power to be updated
     */
    updateIfChanged: function(userId, power, move){
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

        // trigger move change
        if (move && move.row !== null && move.col !== null){
            this.set('move', move.row + '_' + move.col);
        }else{
            this.set('move', null);
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
            this.get('gboard').get('boardColors')[userId],
            opacity,
            this.get('gboard').get('boardColors').background
        );

        this.get('hexagon').attr('fill', color);
        //this.get('arrow').attr('fill', this.BlendColors(this.get('color'), 1 - opacity, '#fdf6e3'))
    },

    /**
     * Rotates move arrow to specified direction
     * @param {GraphCell} model The current instance
     * @param {string} move Destination cell location
     */
    _changedMove: function(model, move){
        if (move === null){
            this.get('arrow').style('visibility', 'hidden');
            return;
        }

        var coordSrc = this.get('coord'),
            _loc = move.split('_'),
            coordDest = this.get('gboard').get('cells')[_loc[0]][_loc[1]].get('coord');

        var t = d3.transform(),
            delta = {y: coordDest.y - coordSrc.y, x: coordDest.x - coordSrc.x};
        t.translate = [coordSrc.x, coordSrc.y];
        t.rotate = Math.atan2(delta.y, delta.x) * 180 / Math.PI;

        this.get('arrow')
            .style('visibility', 'visible')
            .attr('transform', t.toString());
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
        // TODO bind only when mouse or touch is detected
        // TODO touch requires these to run upon detection
        overlay.on('mousedown', function(){ self._mouseDown.call(self);  });
        overlay.on('mouseup',   function(){ self._mouseUp.call(self);    });
        overlay.on('mouseover', function(){ self._mouseOver.call(self);  });
        overlay.on('mouseout',  function(){ self._mouseOut.call(self);   });
        overlay.on('touchstart',function(){ self._touchStart.call(self); });
        overlay.on('touchmove', function(){ self._touchMove.call(self);  });
        overlay.on('touchend',  function(){ self._touchEnd.call(self);   });
    },

    /**
     * Called when mouse is clicked down
     */
    _mouseDown: function(){
        var gboard = this.get('gboard');
        if (!gboard.get('mouseDetected')) { return; }

        gboard.dragStart(this, this.get('row'), this.get('col'));
    },

    /**
     * Triggered when mouse button is up
     */
    _mouseUp: function(){
        var gboard = this.get('gboard');
        if (!gboard.get('mouseDetected')) { return; }

        gboard.dragStop(this, this.get('row'), this.get('col'));
    },

    /**
     * Triggered when mouse went over this cell
     */
    _mouseOver: function(){
        var gboard = this.get('gboard');
        if (!gboard.get('mouseDetected')) { return; }

        gboard.dragOver(this, this.get('row'), this.get('col'));
    },

    /**
     * Triggered when mouse got out of the cell
     */
    _mouseOut: function(){
        var gboard = this.get('gboard');
        if (!gboard.get('mouseDetected')) { return; }

        gboard.dragOut(this, this.get('row'), this.get('col'));
    },

    /**
     * Triggered when user touched the cell
     */
    _touchStart: function(){
        var gboard = this.get('gboard');
        if (!gboard.get('touchDetected')) { return; }

        gboard.dragStart(this, this.get('row'), this.get('col'));
    },

    /**
     * Triggered when user moved over the touching cell
     * TODO optimize
     */
    _touchMove: function(){
        var gboard = this.get('gboard');
        if (!gboard.get('touchDetected')) { return; }

        var coordArray = d3.mouse(gboard.get('svg')),
            x = coordArray[0],
            y = coordArray[1],
            radius = Constants.cellRadius * 0.9,
            cells, _coord;

        cells = this.constructor.getNeighbours(
            gboard.get('cells'),
            this.get('row'), this.get('col'));
        cells.push(this);

        for (var i=0,l=cells.length; i < l; ++i) {
            _coord = cells[i].get('coord');
            if (Helpers.isPointInsideHexagon(_coord, radius, x, y)){
                if (cells[i].get('_is_hovered')){ continue; }
                cells[i].set('_is_hovered', true);
                gboard.dragOver(
                    cells[i], cells[i].get('row'), cells[i].get('col'));
            }else{
                if (cells[i].get('_is_hovered') !== true){ continue; }
                cells[i].set('_is_hovered', false);
                gboard.dragOut(
                    cells[i], cells[i].get('row'), cells[i].get('col'));
            }
        }
    },

    /**
     * Triggered when user takes his hand away
     */
    _touchEnd: function(){
        var gboard = this.get('gboard');
        if (!gboard.get('touchDetected')) { return; }

        var coordArray = d3.mouse(gboard.get('svg')),
            cell = null,
            x = coordArray[0],
            y = coordArray[1],
            coord = this.get('coord'),
            row = this.get('row'),
            col = this.get('col'),
            radius = Constants.cellRadius * 0.9;

        if (Helpers.isPointInsideHexagon(coord, radius, x, y)){
            cell = this;
        }else{
            var cells = this.constructor.getNeighbours(
                    gboard.get('cells'), row, col);
            for (var i=0,l=cells.length; i < l; ++i){
                var _coord = cells[i].get('coord');
                if (Helpers.isPointInsideHexagon(_coord, radius, x, y)){
                    cell = cells[i];
                }
            }
        }

        if (cell) {
            if (cell.get('_is_hovered')){
                cell.set('_is_hovered', false);
                gboard.dragOut(cell, cell.get('row'), cell.get('col'));
            }
            gboard.dragStop(cell, cell.get('row'), cell.get('col'));
        }
    },

    /**
     * Animates this cell as mouse is hovering above
     */
    animateHoverIn: function(){
        var hexagon = this.get('hexagon');
        var t = d3.transform(hexagon.attr('transform'));
        t.scale = [1.08, 1.08];
        hexagon.attr('transform', t.toString());
    },

    /**
     * Animates this cell as mouse went out
     */
    animateHoverOut: function(){
        var hexagon = this.get('hexagon');
        var t = d3.transform(hexagon.attr('transform'));
        t.scale = [1, 1];
        hexagon.attr('transform', t.toString());
    }

},{

    opaquePower: 250,
    minOpacity: 0.2,

    /**
     * Get neighbours of a cell to detect if touchmove is
     * hovering over its neighbours.
     * Used heavily by touchmove event
     * @param {int} row Row index to get its neighbours
     * @param {int} col Column index to get its neighbours
     * @return {Array} Array of {@link GraphCell}
     */
    getNeighbours: function(cells, row, col){
        var hasCellAt = function(_cells, _row, _col){
            if (!_.isUndefined(_cells[_row])){
                return !_.isUndefined(_cells[_row][_col]);
            }
            return false;
        };

        var neighbours = [],
            shift = row % 2 ? 0 : 1;

        if (hasCellAt(cells, row-1, col-1+shift)){
            neighbours.push(cells[row-1][col-1+shift]);
        }
        if (hasCellAt(cells, row-1, col+shift)){
            neighbours.push(cells[row-1][col+shift]);
        }
        if (hasCellAt(cells, row, col+1)){
            neighbours.push(cells[row][col+1]);
        }
        if (hasCellAt(cells, row+1, col+shift)){
            neighbours.push(cells[row+1][col+shift]);
        }
        if (hasCellAt(cells, row+1, col-1+shift)){
            neighbours.push(cells[row+1][col-1+shift]);
        }
        if (hasCellAt(cells, row, col-1)){
            neighbours.push(cells[row][col-1]);
        }
        return neighbours;
    }

});
window.GraphCell = GraphCell;


})();
