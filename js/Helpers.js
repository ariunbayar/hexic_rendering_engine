/* globals d3 */


/** @lends Helpers */
var Helpers = {

    /**
     * Blends two colors to avoid any opacity overlay issues
     * @param {string} fgColor Color to be placed in front
     * @param {string} fgOpacity Transparency for front color
     * @param {string} bgColor Background as an opaque color
     * @return {d3.rgb} Resulting opaque color
     */
    blendColors: function(fgColor, fgOpacity, bgColor){
        if (fgOpacity === 0){ return bgColor; }

        var fg = d3.rgb(fgColor);
        var bg = d3.rgb(bgColor);

        return d3.rgb(
            Math.round(fg.r * fgOpacity + bg.r * (1 - fgOpacity)),
            Math.round(fg.g * fgOpacity + bg.g * (1 - fgOpacity)),
            Math.round(fg.b * fgOpacity + bg.b * (1 - fgOpacity))
        );
    },

    /**
     * Determines if two cells are adjacent
     * @param {int} row1 Row index of first cell
     * @param {int} col1 Col index of first cell
     * @param {int} row2 Row index of second cell
     * @param {int} col2 Col index of second cell
     * @return {bool} True if they are adjacent
     */
    isNeighbours: function(row1, col1, row2, col2){
        var shift = row1 % 2 ? 0 : 1;
        return row1 - 1 === row2 && col1 - 1 + shift === col2 ||
               row1 - 1 === row2 && col1     + shift === col2 ||
               row1     === row2 && col1 + 1         === col2 ||
               row1 + 1 === row2 && col1     + shift === col2 ||
               row1 + 1 === row2 && col1 - 1 + shift === col2 ||
               row1     === row2 && col1 - 1         === col2;
    },

    /**
     * Assesses if given x and y is inside a hexagon at coord with given radius
     * Used heavily by touchmove event
     * @param {Object} coord Center point of a hexagon
     * @param {int} radius Radius of a hexagon
     * @param {int} x Horizontal coordinate of testing point
     * @param {int} y Vertical coordinate of testing point
     * @return {bool} True if point is inside hexagon
     */
    isPointInsideHexagon: function(coord, radius, x, y){
        var _vert = radius / 2;
        var _hori = radius * Math.sqrt(3) / 2;
        var q2x = Math.abs(x - coord.x);
        var q2y = Math.abs(y - coord.y);
        if (q2x > _hori || q2y > _vert*2){ return false; }
        var m = 2 * _vert * _hori - _vert * q2x - _hori * q2y;
        return m >= 0;
    }
};
