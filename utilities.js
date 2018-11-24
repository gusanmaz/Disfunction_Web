Array.prototype.contains = function(obj) {
    return this.indexOf(obj) > -1;
  };
  
Array.prototype.sum = function(){
    var sum = 0;
    for (var ind = 0; ind < this.length; ind++){
        sum += this[ind];
    }
    return sum;
};
  
Array.prototype.normalize = function(to){
    var sum = this.sum();
    var factor = to / sum;
    for (var ind = 0; ind < this.length; ind++){
        this[ind] = this[ind] * factor;
    }
    return this;
};

function scale(scaleObj, num){
    var srcMax = scaleObj.srcMax;
    var srcMin = scaleObj.srcMin;
    var dstMax = scaleObj.dstMax;
    var dstMin = scaleObj.dstMin;
    var srcRan = srcMax - srcMin;
    var dstRan = dstMax - dstMin;
    return dstMin + ((num - srcMin) / srcRan) * dstRan;
}

function unscale(scaleObj, num){
    var srcMax = scaleObj.srcMax;
    var srcMin = scaleObj.srcMin;
    var dstMax = scaleObj.dstMax;
    var dstMin = scaleObj.dstMin;
    var srcRan = srcMax - srcMin;
    var dstRan = dstMax - dstMin;
    return (((num - dstMin) /dstRan) * srcRan) + srcMin;
}


/* Returns an array of colors in HSB format as a string RaphaelJS recognizes. 
 * All colors getPalette would have same saturation and brigtness value but
 * differ in hue value. Brighness and saturation values of colors are determined 
 * by sat and brg paramaters it takes. Hue range of returned colors are 
 * determined by from from and to parameters of the getPalette.  */

function getPalette(size, from, to, sat, brg){
    var palette = [];
    for(var ind = 0; ind < size; ind++){
        var hue = from + (to - from) * ((ind) / (size - 1)); 
        palette[ind] = "hsb(" + hue + "," + sat + "," + brg + ")";
    }
    return palette;
}

/*Converts HSB string recognized by RaphaelJS into an object from which each 
 * hue, satuation and brightness values for the colour could be obtained as 
 * float values easily */

function getHSB(colStr){
    var hsbRegExp = /hsb\((.*),(.*),(.*)\)/;
    var hsbArr    = hsbRegExp.exec(colStr);
    var hsbObj    = {};
    hsbObj.h = hsbArr[1];
    hsbObj.s = hsbArr[2];
    hsbObj.b = hsbArr[3];
    return hsbObj;
}

function addSaturation(colStr, val){
    hsbObj  = getHSB(colStr);
    var hue = hsbObj.h;
    var sat = parseFloat(hsbObj.s) + val;
    var brg = hsbObj.b;
    return "hsb(" + hue + "," + sat + "," + brg + ")";
}

function addBrightness(colStr, val){
    hsbObj  = getHSB(colStr);
    var hue = hsbObj.h;
    var sat = hsbObj.s;
    var bri = hsbObj.b + val;
    return "hsb(" + hue + "," + sat + "," + brg + ")";
}

