(function(){

var canvas = document.getElementById('editor');
var ctx = canvas.getContext('2d');
ctx.fillStyle = "#000";
ctx.fillRect(0, 0, canvas.width, canvas.height);
ctx.fillStyle = "#fff";  // default paint color

var ZOOM = 20;
var drawPixel = function(x, y) {
    var x = Math.floor(x / ZOOM);
    var y = Math.floor(y / ZOOM);

    ctx.fillRect(x * ZOOM, y * ZOOM, 1 * ZOOM, 1 * ZOOM);
}

canvas.addEventListener('mousedown' , function(e){
    if (e.buttons !== 1) return;
    drawPixel(e.offsetX, e.offsetY);
});
canvas.addEventListener('mousemove' , function(e){
    if (e.buttons !== 1) return;
    drawPixel(e.offsetX, e.offsetY);
});


var el_colors = document.querySelectorAll(".colors span");
_.each(el_colors, function(el_color){
    var color = el_color.getAttribute('data-color');
    el_color.style.backgroundColor = color;
    el_color.addEventListener('mousedown', function(e) {
        var el_last = document.querySelector(".colors span.active");
        if (el_last) {
            el_last.className = "";
        }
        ctx.fillStyle = color;
        e.target.className = 'active';
    });
});

})();
