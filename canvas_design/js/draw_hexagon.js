'use strict';


var canvas = document.querySelector('canvas');
var ctx = canvas.getContext('2d');


function dotAt(x, y) {
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, 2 * Math.PI);
    ctx.fillStyle = '#ff0000';
    ctx.fill();
}


function drawBackground() {

    ctx.rect(0, 0, canvas.width, canvas.height);
    //ctx.fillStyle = '#fdf6e3';
    ctx.fillStyle = '#ffffff';
    ctx.fill();

}


function polygon(x, y, r, sides, cornerRadius) {

    if (sides < 3) return;

    var points = [];
    var angle = 2 * Math.PI / sides;
    var rotate = -Math.PI / 2;
    for (var i = 0; i < sides; i++) {
        points.push({
            x: x + r * Math.cos(angle * i + rotate),
            y: y + r * Math.sin(angle * i + rotate),
        });
    }

    var pointStart = {
        x: (points[sides - 1].x + points[0].x) / 2,
        y: (points[sides - 1].y + points[0].y) / 2,
    }

    var shape = new Path2D();

    shape.moveTo(pointStart.x, pointStart.y);
    for (var i = 0; i < sides; i++) {
        var point = points[i];
        var pointNext = i < (sides - 1) ? points[i + 1] : points[0];
        shape.arcTo(point.x, point.y, pointNext.x, pointNext.y, cornerRadius);
    }
    shape.lineTo(pointStart.x, pointStart.y);

    return shape;
}


function drawHexagon(x, y, r, cornerRadius, color) {

    dotAt(x, y);

    var hexagon = polygon(x, y, r, 6, cornerRadius);

    //ctx.fillStyle = '#9fbbc1';
    ctx.fillStyle = color;
    ctx.fill(hexagon);

    ctx.strokeStyle = '#000000';
    //ctx.lineWidth = 5;
    //ctx.stroke(hexagon);

}


function redraw() {

    var x1 = parseInt(document.querySelector('#x1').value);
    var y1 = parseInt(document.querySelector('#y1').value);
    var ox = parseInt(document.querySelector('#ox').value);
    var oy = parseInt(document.querySelector('#oy').value);
    var radius = parseInt(document.querySelector('#radius').value);
    var cornerRadius = parseInt(document.querySelector('#rcorner').value);
    var color = document.querySelector('#color').value;

    drawBackground();

    var offset = radius * 1.2;
    for (var y = 0; y < 5; y++) {
        for (var x = 0; x < 5; x++) {
            var k = y % 2 ? 0 : ox / 2;
            drawHexagon(x * ox + radius + k, y * oy + radius, radius, cornerRadius, color);
        }
    }

    //drawHexagon(x1, y1, radius, cornerRadius);

}

redraw();


var elements = document.querySelectorAll('#x1, #y1, #radius, #rcorner, #ox, #oy, #color');

elements.forEach(function(el){

    el.addEventListener('change', function(e){
        redraw();
    });

});
