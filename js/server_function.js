// TODO supposed to be on the server side
var _initBoard = function(size, userId) {
    var board = [];
    for (var y=0; y<size; y++) {
        board[y] = [];
        for (var x=0; x<size; x++) {
            board[y].push({
                type: 'cell',
                count: 10,
                user: 0
            });
        }
    }
    board[0][0].count = 50;
    board[0][0].user = 1;
    board[size - 1][size - 1].count = 50;
    board[size - 1][size - 1].user = 2;

    return {
        board: board,
        width: size,
        height: size,
        userId: userId,
        colors: {0: '#C8C8C8', 1: '#447786', 2: '#F72700', background: '#FDF6E3'}
    };
};

/* globals d3 */


// TODO move to separate places
/** @lends Helpers */
var Helpers = {

    /**
     * Iterates over the board by moving through rows and columns.
     * Makes sure context exists
     * @param {Object} board NxM array of boards
     * @param {function} callback Callback function to run for every cell
     * @param {*} context Context within the callback function (this)
     */
    iterBoard: function(board, callback, context){
        for (var y = board.length - 1; y >= 0; y--) {
            for (var x = board[y].length - 1; x >= 0; x--) {
                callback.call(context, board[y][x], y, x);
            }
        }
    },

    /**
     * Blends two colors to avoid any opacity overlay issues
     * @param {string} fgColor Color to be placed in front
     * @param {string} fgOpacity Transparency for front color
     * @param {string} bgColor Background as an opaque color
     * @return {d3.rgb} Resulting opaque color
     */
    blendColors: function(fgColor, fgOpacity, bgColor){
        var fg = d3.rgb(fgColor);
        var bg = d3.rgb(bgColor);

        return d3.rgb(
            Math.round(fg.r * fgOpacity + bg.r * (1 - fgOpacity)),
            Math.round(fg.g * fgOpacity + bg.g * (1 - fgOpacity)),
            Math.round(fg.b * fgOpacity + bg.b * (1 - fgOpacity))
        );
    }

};
