(function(){

var stage, w, h, loader;
var fps = 120;
var tick_n = 0;

var num_rows = 14;
var num_cols = 15;
var board_offset = {x: 10, y: 51};
var board = [];

var current_cell = 'p0';


function getCell(animation) {
    var spriteSheet =  new createjs.SpriteSheet({
            framerate: fps,
            images: [loader.getResult('edit_cell')],
            frames: {
                regX: 0,
                regY: 0,
                count: 4,
                height: 51,
                width: 49
            },
            animations: {
                empty: 0,
                p1: 1,
                p2: 2,
                p0: 3,
            }
        });
    return new createjs.Sprite(spriteSheet, animation);
}


function init_background(stage) {
    var background = new createjs.Shape();
    background.graphics.beginFill('#fdf6e3').drawRect(0, 0, w, h);
    stage.addChild(background);
}


function init_cell_selectors(stage) {
    var cell_empty = getCell('empty');
    var cell_p1 = getCell('p1');
    var cell_p2 = getCell('p2');
    var cell_p0 = getCell('p0');

    cell_empty.x = 0;
    cell_p1.x = 48;
    cell_p2.x = 96;
    cell_p0.x = 144;

    stage.addChild(cell_empty, cell_p1, cell_p2, cell_p0);

    cell_empty.addEventListener("mousedown", cellChoose);
    cell_p1.addEventListener("mousedown", cellChoose);
    cell_p2.addEventListener("mousedown", cellChoose);
    cell_p0.addEventListener("mousedown", cellChoose);
}


function cellChoose(e) {
    current_cell = e.target.currentAnimation;
}


function init_board(stage) {
    for (var y=0; y<num_rows; y++) {
        for (var x=0; x<num_cols - (y % 2 ? 0 : 1); x++) {
            var cell = getCell('empty');
            cell.addEventListener("mousedown", cellClick);
            cell.x = 48 * x + board_offset.x + (y % 2 ? 0 : 24);
            cell.y = 40 * y + board_offset.y;
            stage.addChild(cell);

            board[y] = board[y] || [];
            board[y][x] = cell;
        }
    }
}


function cellClick(e){
    e.target.gotoAndStop(current_cell);
}


function handleComplete() {
    init_background(stage);
    init_cell_selectors(stage);
    init_board(stage);

    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.framerate = fps;
    createjs.Ticker.addEventListener("tick", tick);
}


function tick(event) {
    stage.update(event);
    tick_n += 1;
}


function generateBoardData(el_output) {
    var data = [];
    var crop = {top: 0, left: 0, bottom: 0, right: 0};

    // crop top
    for (var y=0; y<num_rows; y++) {
        var has_cell = _.some(_.map(board[y], function(cell){ return cell.currentAnimation != 'empty' }));
        if (has_cell) break;
        crop.top += 1;
    }
    // crop bottom
    for (var y=num_rows - 1; y>=0; y--) {
        var has_cell = _.some(_.map(board[y], function(cell){ return cell.currentAnimation != 'empty' }));
        if (has_cell) break;
        crop.bottom += 1;
    }
    // crop left
    for (var x=0; x<num_cols; x++) {
        var has_cell = _.some(_.map(board, function(row){ return row[x] !== undefined && row[x].currentAnimation != 'empty' }));
        if (has_cell) break;
        crop.left += 1;
    }
    // crop right
    for (var x=num_cols - 1; x>0; x--) {
        var has_cell = _.some(_.map(board, function(row){ return row[x] !== undefined && row[x].currentAnimation != 'empty' }));
        if (has_cell) break;
        crop.right += 1;
    }
    if (crop.top + crop.bottom >= num_rows || crop.left + crop.right >= num_cols) {
        return '';
    }

    for (var y=crop.top; y<num_rows - crop.bottom; y++) {
        var row = [];
        if (crop.top % 2 && y % 2 == 0) {
            row.push(null);
        }
        for (var x=crop.left; x<num_cols - (crop.right ? crop.right : (y % 2 ? 0 : 1)); x++) {
            var v = board[y][x].currentAnimation;
            row.push(v == 'empty' ? null : v);
        }
        data.push(row);
    }
    return JSON.stringify(data);
}


stage = new createjs.Stage("canvas");
stage.enableMouseOver(20);

// grab canvas width and height for later calculations:
w = stage.canvas.width;
h = stage.canvas.height;

manifest = [
    {src: "cell.png", id: "cell"},
    {src: "edit_cell.png", id: "edit_cell"},
];

loader = new createjs.LoadQueue(false);
loader.addEventListener("complete", handleComplete);
loader.loadManifest(manifest, true, "./images/");

var link = document.querySelector('#link_live_preview');
link.addEventListener("click", function(e) {
    var board_data = generateBoardData();
    var url = e.target.getAttribute('data-prefix') + 'd=' + encodeURI(board_data);
    e.target.setAttribute('href', url);
});

})();
