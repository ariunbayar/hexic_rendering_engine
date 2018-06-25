(function(){

var border = [
    " *** ",
    "*****",
    "*****",
    "*****",
    " *** ",
];
var border1 = [
    "***",
    "***",
    "***",
];
var layer1 = document.getElementById('layer1');
var layer2 = document.getElementById('layer2');
var layer3 = document.getElementById('layer3');
var img = document.getElementById('uploader');
img.addEventListener('change', handleImage, false);


function handleImage(e){
    var reader = new FileReader();
    reader.onload = function(event){
        var img = new Image();
        img.onload = function(){
            layer1.width  = layer2.width  = layer3.width  = img.width;
            layer1.height = layer2.height = layer3.height = img.height;
            layer1.getContext('2d').drawImage(img, 0, 0);

            drawBorder(layer1, layer2, border, '#e91e63');
            drawBorder(layer2, layer3, border1, '#ffffff');
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(e.target.files[0]);
}


function drawBorder(src, dst, border, color) {
    console.time("generateBorder");

    var ctx_src = src.getContext('2d');
    var ctx_dst = dst.getContext('2d');

    var offset = {
        x: Math.floor(border[0].length / 2),
        y: Math.floor(border.length / 2),
        };

    ctx_dst.fillStyle = color;
    for (var y=0; y<src.height; y++) {
        for (var x=0; x<src.width; x++) {
            var imgData = ctx_src.getImageData(x, y, 1, 1);
            if (imgData.data[3] == 255) {
                for (var i=0; i<border.length; i++) {
                    for (var j=0; j<border[i].length; j++) {
                        if (border[i][j] == '*') {
                            //ctx_dst.fillRect(x + j - offset.x, y + i - offset.y, 1, 1);
                        }
                    }
                }
            }
        }
    }

    console.timeEnd("generateBorder");
}

})();
