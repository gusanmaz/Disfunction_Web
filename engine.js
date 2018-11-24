function getTriples(data){
   var dataLen = data.length;
   var dimLen  = data[0].length;
   var triples = numeric.rep([dataLen, dataLen, dimLen], 0);
   
   for(x = 0; x < dataLen; x++){
     for(y = (x+1); y < dataLen; y++){
        for(dim = 0; dim < dimLen; dim++){
           var diff = data[x][dim] - data[y][dim];
           triples[x][y][dim] = triples[y][x][dim] = diff * diff;
        }
    }
  }
  return triples;
}

function getDistMat(triples, weights){
   var dataLen = triples.length;
   var dimLen  = weights.length;
   var distMat = numeric.rep([dataLen, dataLen], 0);
 
   for(x = 0; x < dataLen; x++){
     for(y = (x+1); y < dataLen; y++){
        var dist = 0;
        for(dim = 0; dim < dimLen; dim++){
           var diff2 = triples[x][y][dim];
           dist += (weights[dim] * diff2);
        }
        distMat[x][y] = dist;
        distMat[y][x] = distMat[x][y];
    }
  }
  return distMat;
}

function getMDS(distMat, method){
   var coords = new Object();
   if (method == "pca"){
        var m = distMat.length;
        var sigma = numeric.div(numeric.dot(numeric.transpose(distMat), distMat), m);
        var v = numeric.svd(sigma).V;
        coords.x = v.map(function(value,index){return value[0];});
        coords.y = v.map(function(value,index){return value[1];})
   }
   else{
        u = numeric.svd(distMat).U;
        coords.x = u.map(function(value,index){return value[0];});
        coords.y = u.map(function(value,index){return value[1];});
   }
   return coords;
}

function getUL(set1, set1Len, set2, set2Len, distMat){
   var n = distMat.length;
   var U = numeric.rep([n,n], 1);
   var L = numeric.rep([n,n], 1);
   
   //var set1Len = set1.size;
   //var set2Len = set2.size;
   var LConst = ((n * (n-1)) / ((set1Len * set2Len))) - 1;
   
   for (i = 0; i < n; i++){
       for(j = 0; j< n; j++){
           if ((set1[i] !== undefined) && (set2[j] !== undefined)){
               var x1 = set1[i].x;
               var y1 = set1[i].y;
               var x2 = set2[j].x;
               var y2 = set2[j].y;
               var intendedDist = Math.pow(x1 - x2 ,2) + Math.pow(y1 - y2, 2);
               intendedDist = Math.sqrt(intendedDist);
               
               var x1_old = set1[i].x_old;
               var y1_old = set1[i].y_old;
               var x2_old = set2[j].x_old;
               var y2_old = set2[j].y_old;
               var projectedDist = Math.pow(x1_old - x2_old ,2) + Math.pow(y1_old - y2_old, 2);
               projectedDist = Math.sqrt(projectedDist);
               
               U[j][i] = U[i][j] = intendedDist / projectedDist;
               L[j][i] = L[i][j]  = LConst;
           }
       }
   }
   
   var bundleObj = new Object();
   bundleObj.U = U;
   bundleObj.L = L;
   return bundleObj;
}

function g(triples, wOld, L, U, mode){
   return function (wNew){
       var N = triples.length;
       var wLen = wOld.length;
       var newVal = 0;
       for(dim = 0; dim <wLen; dim++){
           newVal += (- Math.log(wNew[dim]));
       }
       var distSum = 0;
       for(i = 0; i < N; i++){
           for(j = i+1; j< N; j++){
               var distNew = 0;
               var distOld = 0;
               for(dim = 0; dim < wLen ; dim++){
                   var distCached = triples[i][j][dim];
                   distNew += wNew[dim] * distCached;
                   distOld += wOld[dim] * distCached;
               }
               var diffOuter  = distNew - U[i][j] * distOld;
               var diffOuterSq = diffOuter * diffOuter;
               distSum += L[i][j] * diffOuterSq;
           }
           
       }
       if (mode === "false"){
           newVal = 0;
       }
       return distSum + newVal;
   };
}

function gradient(triples, wOld, L, U, mode){
    return function(wNew){
        var dimLen = wNew.length;
        var N      = triples.length;
        var gArr = [];
        for(var dim = 0; dim < dimLen; dim++){
            var sum = 0;
            for(var i = 0; i < N; i++){
               for(var j = i+1; j< N; j++){
                   var term = L[i][j] * (triples[i][j][dim] * 
                              (wNew[dim] - U[i][j] * wOld[dim]));
                   sum += term;
               }
           }
           gArr[dim] = sum + (-1 / wNew[dim]);
           if (mode === "false"){
              gArr[dim] = sum;
           }
    }
    return gArr;
};}

function getBarChartCoords(boundingBox, frameWFac, frameHFac, topSpaceFac, spaceFac, dataSize){
   var x = boundingBox.x; 
   var y = boundingBox.y2;
   var w = boundingBox.width;
   var h = boundingBox.height;
   
   var innerH = h * (1 - (2 * frameHFac + topSpaceFac));
   var innerW = w * (1 - (2 * frameWFac));
   var barW   = (innerW / dataSize) * (1 - spaceFac);
   var spaceW = (innerW/ dataSize) * spaceFac;
   var barSpaceW = barW + spaceW;
   
   var coords = {};
   coords.innerH = innerH;
   coords.innerW = innerW;
   coords.barW   = barW;
   coords.spaceW = spaceW;
   coords.barSpaceW = barSpaceW;
   return coords;
}

function main(){
  var f = document.getElementById("ds");
  var reader = new FileReader();
  var csvData = "";
  //var dataEl = document.getElementById("csvdata");
  //dataEl.setAttribute("value", "kalue");
  //console.log(dataEl.getAttribute("value"));
  
  reader.onload = function(e) {
    //var dataEl = document.getElementById("csvdata");
    //dataEl.setAttribute("value", e.target.result);
    console.log(e.target.result);
    csvData = e.target.result;
    //console.log(dataEl.getAttribute("value"));
    //this.result = e.target.result;
    //csvData = e.target.result;
    //console.log(csvData);
    //return e.target.result;
  };
  
  /*reader.onload = (function(theFile) {
        return function(e) {
          // Render thumbnail.
          var span = document.createElement('span');
          span.innerHTML = ['<img class="thumb" src="', e.target.result,
                            '" title="', escape(theFile.name), '"/>'].join('');
          document.getElementById('list').insertBefore(span, null);
        };
      })(f);*/
  
  /*reader.onerror = function(event) {
    console.error("File could not be read! Code " + event.target.error.code);
  };*/
  
  //reader.readAsText(f.files[0]);
  //csvData = reader.result;
  
  // Removing the button
  var button  = document.getElementById("runBtn");
  document.body.removeChild(button);
  var uploadField = document.getElementById("ds");
  document.body.removeChild(uploadField);
 
  var data = winedata;
  //var data   = numeric.parseCSV(csvData);
  
  var dataLen = data.length;
  var dimLen  = data[0].length;
  
  var classMembers = [];
  var point2Class  = [];
  var cName2cId    = [];
 
  for(i = 0; i < dataLen; i++){
     if (!classMembers.contains(data[i][0])){
         classMembers[classMembers.length] = data[i][0];
         cName2cId[data[i][0]] = classMembers.length - 1;
     }
     point2Class[i] = cName2cId[data[i][0]];
     data[i].splice(0,1);
  }
 
  dimLen--;
 
  var weights, coords, distMat, triples;

  var mapW = 500, mapH = 500;
  var defDataRad = 7, bigDataRad = 10;
  var defBtnRad  = 15, bigBtnRad = 25;
  
  var mapBgCol     = "rgb(30,30,30)";
  var barCol       = "hsb(0.4, 0.4, 0.6)";
  var barHoverCol  = addSaturation(barCol, 0.5);
  var classPalette = getPalette(classMembers.length, 0, 0.4, 0.5, 0.8);
  
  var btnPalette   = getPalette(5, 0.0, 0.8, 0.9, 0.4);
  var set1Col      = btnPalette[0];
  var set2Col      = btnPalette[1];
  var noSetCol     = btnPalette[2];
  var runCol       = btnPalette[3];
  var modeCol       = btnPalette[4];
  
  var set1HoverCol      = addSaturation(set1Col,  -0.6);
  var set2HoverCol      = addSaturation(set2Col,  -0.6);
  var noSetHoverCol     = addSaturation(noSetCol, -0.6);
  var runHoverCol       = addSaturation(runCol,   -0.6);
  var modeHoverCol       = addSaturation(modeCol,   -0.6);
 
  var scaleX = new Object();
  scaleX.dstMin = 0 + bigDataRad;
  scaleX.dstMax = mapW - bigDataRad;
 
  var scaleY = new Object();
  scaleY.dstMin = 0 + bigDataRad;
  scaleY.dstMax = mapH - bigDataRad;
 
  var selectionAt = "run";
  var logMode     = "true";
  //var set1Circles = new Map();
  //var set2Circles = new Map();
  var set1Circles = new Array(dataLen);
  var set2Circles = new Array(dataLen);
  var set1CirclesLen = 0;
  var set2CirclesLen = 0;
  //console.log(set1Circles[0]);
  //console. 
  var mapPaper = Raphael(20,20,500,500);
  mapPaper.rect(0,0, 500, 500)
          .attr({fill: mapBgCol})
          .data("i", -1);
       
  var btnPaper = Raphael(20,520,500,100);
  
  var barGraphPaper = Raphael(540, 20, 700, 200);
  var barGraphRect = 
      barGraphPaper.rect(0,0, 700, 200)
                   .attr({fill: "white", stroke: "white"})
                   .data("i", -1);
           
  var barCoords = getBarChartCoords(barGraphRect.getBBox(), 
                          0.02, 0.02, 0.05, 0.15, dimLen);
  
  btnPaper.circle(30,30,defBtnRad)
                .attr({fill: set1Col})
                .click(btnClickHandler)
                .hover(btnIn, btnOut)
                .data("btn", "set1")
                .data("defCol", set1Col)
                .data("hoverCol", set1HoverCol);
 
  btnPaper.circle(80,30,defBtnRad)
                .attr({fill: set2Col})
                .click(btnClickHandler)
                .hover(btnIn, btnOut)
                .data("btn", "set2")
                .data("defCol", set2Col)
                .data("hoverCol", set2HoverCol);
  
  btnPaper.circle(130,30,defBtnRad)
                .attr({fill: noSetCol})
                .click(btnClickHandler)
                .hover(btnIn, btnOut)
                .data("btn", "noSet")
                .data("defCol", noSetCol)
                .data("hoverCol", noSetHoverCol);
 
  btnPaper.circle(180,30,defBtnRad)
                .attr({fill: runCol})
                .click(btnClickHandler)
                .hover(btnIn, btnOut)
                .data("btn", "run")
                .data("defCol", runCol)
                .data("hoverCol", runHoverCol);
        
  btnPaper.circle(230,30,defBtnRad)
                .attr({fill: modeCol})
                .click(switchMode)
                .hover(btnIn, btnOut)
                .data("btn", "mode")
                .data("mode", "true")
                .data("defCol", modeCol)
                .data("hoverCol", modeHoverCol);
        
  //while (csvData.length === 0){};      
  //var data2   = numeric.parseCSV(csvData);
  //btnPaper.text(50, 15 , "Set 1");
  //btnPaper.text(180, 15 , "Set 2");
  //btnPaper.text(100, 60 , "Set1                      Set2      Restore Point Run!         Log Mode");
  btnPaper.text(30, 70 , "Set 1").attr({"font-size": 15}); 
  btnPaper.text(80, 70 , "Set 2").attr({"font-size": 15});
  btnPaper.text(130, 70 , "Restore").attr({"font-size": 15});
  btnPaper.text(180, 70 , "Run!").attr({"font-size": 15});
  btnPaper.text(240, 70 , "Log Mode").attr({"font-size": 15});
 
  function renderRawData(){
    weights = numeric.rep([dimLen],(1/dimLen));
    triples = getTriples(data);
    distMat = getDistMat(triples,weights);
    coords  = getMDS(distMat, "pca");
   
    scaleX.srcMin = Math.min.apply(null, coords.x);
    scaleX.srcMax = Math.max.apply(null, coords.x);
    scaleY.srcMin = Math.min.apply(null, coords.y);
    scaleY.srcMax = Math.max.apply(null, coords.y);
   
    for(i = 0; i < coords.x.length; i++){
       var cx = scale(scaleX, coords.x[i]);
       var cy = scale(scaleY, coords.y[i]);

      mapPaper
        .circle(cx,cy,defDataRad)
        .attr({
           fill:  classPalette[point2Class[i]],
           title: "point:" + i + " class: " + point2Class[i] })
       .drag(move, start, up)
       .hover(pointIn, pointOut)
       .click(restorePoint)
       .data("i", i);
   }
   
   // Drawing Bar Chart
   var rectCoords = barGraphRect.getBBox();
   var x = rectCoords.x; 
   var y = rectCoords.y2;
   var maxW = Math.max.apply(null, weights);
   
   for(i = 0; i < weights.length; i++){
       var rx = x + (barCoords.barSpaceW * i) + barCoords.spaceW;
       var ry = y - ((weights[i] / maxW) * barCoords.innerH);

      barGraphPaper
        .rect(rx,ry, barCoords.barW, ((weights[i] / maxW) * barCoords.innerH))
        .attr({
           fill: barCol })
           //,title: "Weights[" + i +"] = " + weights[i].toFixed(4) })
       .hover(barIn, barOut)
       .data("i", i);
   }
   
  }
 
 
  function renderData(){
   /*if ((set1Circles.size === 0) || (set2Circles.size === 0)){
       window.alert("You must move at least one data point from both sets before clicking Run!");
       return;
   }*/
   if ((set1CirclesLen === 0) || (set2CirclesLen === 0)){
       window.alert("You must move at least one data point from both sets before clicking Run!");
       return;
   }
      
   var bundleUL = getUL(set1Circles, set1CirclesLen, set2Circles, set2CirclesLen, distMat);
   var U = bundleUL.U;
   var L = bundleUL.L;
   
   //set1Circles = new Map();
   //set2Circles = new Map();
   set1Circles = new Array(dataLen);
   set2Circles = new Array(dataLen);
   
   
     
   var gFun = g(triples, weights, L, U, logMode);
   var udef;
   var gradientFun = gradient(triples, weights, L, U, logMode);
   var ob  = numeric.uncmin(gFun, weights, udef, gradientFun, 1000, udef, udef);
   var newW  = ob.solution;
   console.log(ob.iterations);
   
   weights = newW.normalize(1);
   console.log(weights);
   
   distMat = getDistMat(triples,weights);
   coords  = getMDS(distMat, "pca");
   
   scaleX.srcMin = Math.min.apply(null, coords.x);
   scaleX.srcMax = Math.max.apply(null, coords.x);
   scaleY.srcMin = Math.min.apply(null, coords.y);
   scaleY.srcMax = Math.max.apply(null, coords.y);
   
   mapPaper.forEach(function (el) {
      var ind = el.data("i");
      if (ind !== -1){
        var xCoord = scale(scaleX, coords.x[ind]);
        var yCoord = scale(scaleY, coords.y[ind]);
        var anim = Raphael.animation({cx: xCoord, cy: yCoord, 
                      fill: classPalette[point2Class[ind]]}, 1e3);
        el.animate(anim);
     }
   });
   
   // Drawing Bar Chart
   var rectCoords = barGraphRect.getBBox();
   var x = rectCoords.x; 
   var y = rectCoords.y2;
   var maxW = Math.max.apply(null, weights);
   
   barGraphPaper.forEach(function (el) {
      var ind = el.data("i");
      
      if (ind !== -1){
       //el.atrr({title: "WWWeights[" + ind +"] = " + weights[ind].toFixed(4)});
       var rx = x + (barCoords.barSpaceW * ind) + barCoords.spaceW;
       var ry = y - ((weights[ind] / maxW) * barCoords.innerH);

       var anim = Raphael.animation({x: rx, y: ry}, 1e3);
       el.animate(anim); 
       //el.atrr({title: "Weights[" + ind +"] = " + (weights[ind]).toFixed(4)});
   }
  });
 }

  var start = function (){
       // storing original coordinates
       this.ox = this.attr("cx");
       this.oy = this.attr("cy");      
   };
           
  function move (dx, dy){
    if ((selectionAt === "set1") || (selectionAt === "set2")){
        var nowX = this.ox + dx;
        var nowY = this.oy + dy;
        this.attr({cx: nowX, cy: nowY });
        var i = this.data("i");
        var pointCoords = new Object();
        pointCoords.x  = nowX;
        pointCoords.y  = nowY;
        pointCoords.x_old = scale(scaleX, coords.x[i]);
        pointCoords.y_old = scale(scaleY, coords.y[i]);

        //set1Circles.delete(i);
        //set2Circles.delete(i);
        
        if (typeof set1Circles[i] !== "undefined"){
            set1Circles[i] = "undefined";
            set1CirclesLen--;
        }
        
        if (typeof set2Circles[i] !== "undefined"){
            set2Circles[i] = "undefined";
            set2CirclesLen--;
        }
        

        if (selectionAt === "set1"){
            this.attr({fill: set1Col});
            //set1Circles.set(i, pointCoords);
            set1Circles[i] = pointCoords;
            set1CirclesLen++;
        }
        if (selectionAt === "set2"){
            this.attr({fill: set2Col});
            //set2Circles.set(i, pointCoords);
            set2Circles[i] = pointCoords;
            set2CirclesLen++;
        }
    }
  }

   var up = function (){          
   };
 
  
  function btnClickHandler(e){
     selectionAt = this.data("btn");
     btnPaper.forEach(function (el) {
         if (el.data("btn") !== "mode"){
            el.attr({"stroke-width": 1, "r": defBtnRad});
        }
     });
     this.attr({"stroke-width": 2, "r": bigBtnRad});
     if (selectionAt === "run"){
         renderData();
         btnPaper.forEach(function (el) {
            el.attr({"stroke-width": 1, "r": defBtnRad});
     });
     }
  }
  
  function pointIn(el){
      this.attr({r : bigDataRad});
  };
  
  function pointOut(el){
      this.attr({r : defDataRad});
  };
  
  function barIn(el){
      this.attr({fill : barHoverCol});
  };
  
  function barOut(el){
      this.attr({fill : barCol});
  };
  
  function btnIn(el){
      this.attr({fill : this.data("hoverCol")});
  };
  
  function btnOut(el){
      this.attr({fill : this.data("defCol")});
  };
  
  function switchMode(el){
      var mode = this.data("mode");
      if (mode === "false"){
         this.data("mode", "true");
         this.attr({"r": defBtnRad});
         logMode = "true";
     }
     if (mode === "true"){
         this.data("mode", "false");
         this.attr({"r": bigBtnRad});
         logMode = "false";
     }
     
  };
  
  function restorePoint(el){
    if (selectionAt === "noSet"){
      var i = this.data("i");
      //var coords1 = set1Circles.get(i);
      //var coords2 = set2Circles.get(i);
      var coords1 = set1Circles[i];
      var coords2 = set2Circles[i];
      var coords;
      if ((typeof coords1 === "undefined") && (typeof coords2 === "undefined")){
          window.alert("Point you want to restore doesn't belong to set 1 or set 2!");
          return;
      }
      else if (typeof coords1 === "undefined"){
           //coords = set2Circles.get(i);
           coords = set2Circles[i];
           //set2Circles.delete(i);
           if (typeof set2Circles[i] !== "undefined"){
            set2Circles[i] = "undefined";
            set2CirclesLen--;
           }
      }
      else{
          //coords = set2Circles.get(i);
           coords = set1Circles[i];
           //set2Circles.delete(i);
           if (typeof set1Circles[i] !== "undefined"){
            set1Circles[i] = "undefined";
            set1CirclesLen--;
           }
      }
      var anim = Raphael.animation({cx: coords.x_old, cy: coords.y_old, fill: classPalette[point2Class[i]]}, 1e3);
      this.animate(anim);
    }
  }
 
  window.onload = renderRawData();
 
}
