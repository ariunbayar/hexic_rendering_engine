var
    ZOOM = 10;

var canvas = document.getElementById('output');
var ctx = canvas.getContext('2d');
ctx.fillStyle = "#1a237e";
ctx.fillRect(0, 0, canvas.width, canvas.height);


var utils = {
    iter2d: function iter2d(arr, fn) {
        for (var y=0; y<arr.length; y++) {
            for (var x=0; arr[y] && x<arr[y].length; x++) {
                if (arr[y][x] === undefined) continue;
                if (fn.call(this, x, y, arr[y][x]) === false) {
                    x = arr[y].length - 1;
                    y = arr.length - 1;
                }
            }
        }
    },
    pixelAt: function pixelAt(x, y, color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * ZOOM, y * ZOOM, 1 * ZOOM, 1 * ZOOM);
    },
};


function Blob() {

    /********************************************************************************
     *
     * Explanation of a graphic defined in JS array
     *
     *     var blob = [" *** ",
     *                 " *0* ",
     *                 " *** "]
     *
     * " " - empty space, is a no drawing pixel
     * "*" - asterisk, is a pixel to draw
     * "0" - zero, is also a pixel to draw, and it also represents the center point
     *
     *******************************************************************************/
    this.stroke_center = null;
    this.stroke_per_pixel = null;
    this.graph_center = null;
    this.graph = null;
    this.graph_fill = null;
    this.graph_stroke = null;
    this.color_center =  '#ffffff';
    this.color_fill =  '#e91e63';
    this.color_stroke = '#ffffff';

    this.getCenter = function getCenter(arr) {
        var center;
        this.iter2d(arr, function(x, y, value){
            if (value == "0") {
                center = {x: x, y: y};
                return false;
            }
        });
        return center;
    }

    this.setStrokePerPixel = function setStrokePerPixel(stroke) {
        this.stroke_per_pixel = stroke;
        this.stroke_center = this.getCenter(this.stroke_per_pixel);
        if (this.graph !== null)
            this.build();
    }

    this.setGraph = function setGraph(graph) {
        this.graph = graph;
        if (this.stroke_per_pixel !== null)
            this.build();
    }

    this.iter2d = function iter2d(arr, fn) {
        utils.iter2d.call(this, arr, function (x, y, value) {
            if (value != " ") {
                return fn.call(this, x, y, value);
            }
        });
    }

    this.build = function build() {
        var x, y, shift, fill, stroke;
        fill = []
        stroke = [];

        this.iter2d(this.graph, function(x1, y1, value1){
            x = this.stroke_center.x + x1;
            y = this.stroke_center.y + y1;
            fill[y] = fill[y] || [];
            fill[y][x] = value1;

            this.iter2d(this.stroke_per_pixel, function(x2, y2, value2){
                x = x1 + x2;
                y = y1 + y2;

                stroke[y] = stroke[y] || [];
                stroke[y][x] = value1;
            });
        });
        this.iter2d(this.graph, function(x1, y1, value1){
            x = this.stroke_center.x + x1;
            y = this.stroke_center.y + y1;
            stroke[y] = stroke[y] || [];
            stroke[y][x] = " ";
        });
        this.graph_fill = fill;
        this.graph_stroke = stroke;
        this.graph_center = this.getCenter(this.graph_fill);
    }

    this.drawAt = function drawAt(blob_x, blob_y) {
        blob_x -= this.graph_center.x;
        blob_y -= this.graph_center.y;
        this.iter2d(this.graph_fill, function drawBlobPixel(x, y, value) {
            if (value == "0") {
                utils.pixelAt(blob_x + x, blob_y + y, this.color_center);
            } else {
                utils.pixelAt(blob_x + x, blob_y + y, this.color_fill);
            }
        });
        this.iter2d(this.graph_stroke, function drawBlobPixel(x, y, value) {
            utils.pixelAt(blob_x + x, blob_y + y, this.color_stroke);
        });
    }

    this.clear = function clear(blob_x, blob_y) {
        var height = this.graph_stroke.length;
        var width = this.graph_stroke[Math.floor(this.graph_stroke.length / 2)].length;
        ctx.fillStyle = "#1a237e";
        ctx.fillRect((blob_x - Math.floor(width / 2)) * ZOOM, (blob_y - Math.floor(height / 2)) * ZOOM, width * ZOOM, height * ZOOM);
    }
}


function drawBlobBuild() {
    var blob;

    blob = new Blob();
    blob.setGraph([
            " *** ",
            "*****",
            "**0**",
            "*****",
            " *** ",
        ]);
    blob.setStrokePerPixel([
            " *** ",
            "*****",
            "**0**",
            "*****",
            " *** ",
        ]);

    blob.drawAt(5, 5);
}

drawBlobBuild();
