var stage, w, h, loader;
var fps = 60;
var background, blob, trail, stroke, explode, cell1, cell2, cell3;
var decrement1, increment1, blob1;
var decrement2, increment2, blob2;
var decrement3, increment3, blob3;
var jobs = [];

var num_blobs = 90;
var cur_blob = 0;
var blobs = [];
var tick_n = 0;


function getURLParameter(name) {
  return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [null, ''])[1].replace(/\+/g, '%20')) || null;
}


function init(board_data) {
    stage = new createjs.Stage("canvas");
    stage.enableMouseOver(20);

    // grab canvas width and height for later calculations:
    w = stage.canvas.width;
    h = stage.canvas.height;

    //manifest = [
        //{src: "anim1-blob.png",   id: "anim1-blob"},
        //{src: "anim1-stroke.png", id: "anim1-stroke"},
        //{src: "anim1-trail.png",  id: "anim1-trail"},
        //{src: "explode.png", id: "explode"},
    //];
    manifest = [
        {src: "cell.png", id: "cell"},
        {src: "move 3-1_layer1.png", id: "move 3-1_layer1"},
        {src: "move 3-1_layer2.png", id: "move 3-1_layer2"},
        {src: "move 3-1_layer3.png", id: "move 3-1_layer3"},
        {src: "increment_layer1.png",   id: "increment_layer1"},
        {src: "increment_layer2.png",   id: "increment_layer2"},
        {src: "increment_layer3.png",   id: "increment_layer3"},
    ];

    loader = new createjs.LoadQueue(false);
    loader.addEventListener("complete", function(){
        handleComplete(board_data);
    });
    loader.loadManifest(manifest, true, "./images/");
}

function handleComplete(board_data) {
    console.time('handleComplete');
    background = new createjs.Shape();
    background.graphics.beginFill('#fdf6e3').drawRect(0, 0, w, h);
    stage.addChild(background);

    var getSprite = function(id, w, h, count, loop){
        var spriteSheet =  new createjs.SpriteSheet({
                framerate: fps,
                images: [loader.getResult(id)],
                frames: {
                    regX: 0,
                    regY: 0,
                    count: count,
                    height: h,
                    width: w
                },
                animations: {
                    move: [0, count - 1, loop ? "move" : "last"],
                    last: count - 1
                }
            });
        sprite = new createjs.Sprite(spriteSheet, "move");
        sprite.x = 10;
        sprite.y = 10;
        return sprite;
    };

    var layer1 = [];
    var layer2 = [];
    var layer3 = [];

    for (var y=0; y<board_data.length; y++) {
        for (var x=0; x<board_data[y].length; x++) {
            var type = board_data[y][x];
            if (typeof(type) !== 'string') continue;

            var spriteSheet =  new createjs.SpriteSheet({
                    framerate: fps,
                    images: [loader.getResult('cell')],
                    frames: {
                        regX: 21,
                        regY: 22,
                        count: 66,
                        width: 43,
                        height: 45
                    },
                    animations: {
                        p0: 66 - 1,
                        p1: 22 - 1,
                        p2: 43 - 1,
                        hovering_p1: [0, 22 - 1, 'p1'],
                        hovering_p2: [22, 44 - 1, 'p2'],
                    }
                });
            cell = new createjs.Sprite(spriteSheet, board_data[y][x]);
            cell.addEventListener("mousedown", cellClick);
            cell.addEventListener("mouseover", cellMouseover);
            cell.addEventListener("mouseout", cellMouseout);
            cell.x = 34 + 48 * x + (y % 2 ? 0 : 24);
            cell.y = 35 + 40 * y;
            stage.addChild(cell);

            increment1 = getSprite('increment_layer1', 49, 51, 36, false);
            increment2 = getSprite('increment_layer2', 49, 51, 36, false);
            increment3 = getSprite('increment_layer3', 49, 51, 36, false);
            increment1.x = increment2.x = increment3.x = 48 * x + 10 + (y % 2 ? 0 : 24);
            increment1.y = increment2.y = increment3.y = 40 * y + 10;
            increment1.gotoAndStop(0);
            increment2.gotoAndStop(0);
            increment3.gotoAndStop(0);

            layer1.push(increment1);
            layer2.push(increment2);
            layer3.push(increment3);
        }
    }

    increment1 = getSprite('increment_layer1', 49, 51, 121, false);
    increment2 = getSprite('increment_layer2', 49, 51, 121, false);
    increment3 = getSprite('increment_layer3', 49, 51, 121, false);
    increment1.x = increment2.x = increment3.x = 48 + 10;
    increment1.y = increment2.y = increment3.y = 40 + 10;
    increment1.gotoAndStop(0);
    increment2.gotoAndStop(0);
    increment3.gotoAndStop(0);

    decrement1 = getSprite('increment_layer1', 49, 51, 121, false);
    decrement2 = getSprite('increment_layer2', 49, 51, 121, false);
    decrement3 = getSprite('increment_layer3', 49, 51, 121, false);
    decrement1.x = decrement2.x = decrement3.x = 24 + 10;
    decrement1.y = decrement2.y = decrement3.y = 10;
    decrement1.gotoAndStop(120);
    decrement2.gotoAndStop(120);
    decrement3.gotoAndStop(120);

    layer1.push(decrement1, increment1);
    layer2.push(decrement2, increment2);
    layer3.push(decrement3, increment3);

    for (var i=0; i<num_blobs; i++) {
        blobs[i] = {
            blob:   getSprite('move 3-1_layer1', 33, 49, 496, false),
            stroke: getSprite('move 3-1_layer2', 33, 49, 496, false),
            trail:  getSprite('move 3-1_layer3', 33, 49, 496, false),
            };

        layer1.push(blobs[i].blob);
        layer2.push(blobs[i].stroke);
        layer3.push(blobs[i].trail);
        blobs[i].stroke.visible = false;
        blobs[i].trail.visible = false;
        blobs[i].blob.visible = false;
        blobs[i].blob.x = blobs[i].stroke.x = blobs[i].trail.x = 44 + 10;
        blobs[i].blob.y = blobs[i].stroke.y = blobs[i].trail.y = 31;
    }

    stage.addChild.apply(stage, layer3);
    stage.addChild.apply(stage, layer2);
    stage.addChild.apply(stage, layer1);

    stage.addEventListener("stagemousedown", handleAction);

    createjs.Ticker.timingMode = createjs.Ticker.RAF;
    createjs.Ticker.framerate = fps;
    createjs.Ticker.addEventListener("tick", tick);

    console.timeEnd('handleComplete');
}

function handleAction() {
}

function cellMouseover(e){
    if (['p1', 'hovering_p1'].indexOf(e.target.currentAnimation) !== -1) {
        e.target.gotoAndPlay('hovering_p1');
    }
    if (['p2', 'hovering_p2'].indexOf(e.target.currentAnimation) !== -1) {
        e.target.gotoAndPlay('hovering_p2');
    }
}
function cellMouseout(e){
}

function cellClick(e){
    if (['p1', 'hovering_p1'].indexOf(e.target.currentAnimation) !== -1) {
        e.target.gotoAndPlay('hovering_p1');
    }
    if (['p2', 'hovering_p2'].indexOf(e.target.currentAnimation) !== -1) {
        e.target.gotoAndPlay('hovering_p2');
    }
    if (cur_blob >= num_blobs) return;

    blobs[cur_blob].stroke.gotoAndPlay('move');
    blobs[cur_blob].trail.gotoAndPlay('move');
    blobs[cur_blob].blob.gotoAndPlay('move');
    blobs[cur_blob].stroke.visible = true;
    blobs[cur_blob].trail.visible = true;
    blobs[cur_blob].blob.visible = true;
    decrement1.gotoAndStop(decrement1.currentFrame - 1);
    decrement2.gotoAndStop(decrement2.currentFrame - 1);
    decrement3.gotoAndStop(decrement3.currentFrame - 1);

    jobs.push({
        tick: tick_n + 495,
        fn: function blobDstReached(blob) {
            blob.stroke.visible = false;
            blob.trail.visible = false;
            blob.blob.visible = false;
            increment1.gotoAndStop(increment1.currentFrame + 1);
            increment2.gotoAndStop(increment2.currentFrame + 1);
            increment3.gotoAndStop(increment3.currentFrame + 1);
        },
        args: [blobs[cur_blob]]
    });

    cur_blob += 1;
}

function tick(event) {
    stage.update(event);
    tick_n += 1;

    var _jobs = [];
    _.each(jobs, function(job){
        if (job.tick <= tick_n) {
            job.fn.apply(null, job.args);
        } else {
            _jobs.push(job);
        }
    });
    jobs = _jobs;


    if (tick_n % 150 == 0) {
        if (increment1.currentFrame < 120) {
            increment1.gotoAndStop(increment1.currentFrame + 1);
            increment2.gotoAndStop(increment2.currentFrame + 1);
            increment3.gotoAndStop(increment3.currentFrame + 1);
        }
        if (decrement1.currentFrame < 120) {
            decrement1.gotoAndStop(decrement1.currentFrame + 1);
            decrement2.gotoAndStop(decrement2.currentFrame + 1);
            decrement3.gotoAndStop(decrement3.currentFrame + 1);
        }
    }
}

console.time('init');

var board_data = getURLParameter('d');
board_data = JSON.parse(board_data);
init(board_data);

console.timeEnd('init');
