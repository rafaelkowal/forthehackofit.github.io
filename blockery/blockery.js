(function (window) {
  /**
   * getBoundingClientRect()
   * helper function picked from 'Pro Javascript for Web Developers ' 
   * by Nicolas Zakas
   **/
  function getBoundingClientRect(element){
    var scrollTop = document.documentElement.scrollTop;
    var scrollLeft = document.documentElement.scrollLeft;
    if (element.getBoundingClientRect){
      if (typeof arguments.callee.offset != "number"){
        var temp = document.createElement("div");
        temp.style.cssText = "position:absolute;left:0;top:0;";
        document.body.appendChild(temp);
        arguments.callee.offset = -temp.getBoundingClientRect().top -
        scrollTop;
        document.body.removeChild(temp);
        temp = null;
      }
      var rect = element.getBoundingClientRect();
      var offset = arguments.callee.offset;
      return {
        left: rect.left + offset,
        right: rect.right + offset,
        top: rect.top + offset,
        bottom: rect.bottom + offset
      };
    } else {
      var actualLeft = getElementLeft(element);
      var actualTop = getElementTop(element);
      return {
        left: actualLeft - scrollLeft,
        right: actualLeft + element.offsetWidth - scrollLeft,
        top: actualTop - scrollTop,
        bottom: actualTop + element.offsetHeight - scrollTop
      };
    }
  }

  window.addEventListener('load', function(event) {
    'use strict';

    var container = document.getElementById('container'),
        blocks = [].slice.call(document.querySelectorAll('.blocks')),
        boxes = [], 
        count = 0,
        bricks,
        indexes,
        maxCells,
        avWidth,
        colWidth,
        maxCols;

    blocks.forEach(function (i) {
        var box = getBoundingClientRect(i);
        box['topPos'] = 0;
        box['height'] = box['bottom'] - box['top'];
        box['index'] = count;
        boxes.push(box);
        count++;
    });

    /* should probably add a few methods to handle measurements and initial config */

    bricks = _.groupBy(boxes, 'top');
    indexes = _.keys(bricks);
    maxCells = _.size(_.max(bricks, function(b) {return b.length;}));
    avWidth = container.getBoundingClientRect().width;
    colWidth = Math.floor(blocks[0].getBoundingClientRect().width);
    maxCols = Math.floor(avWidth / colWidth);

    for(var i = 0, j = indexes.length; i < j; i++) {
      (function(i) {
        var  pSet = bricks[indexes[i - 1]],
             thisSet = bricks[indexes[i]],
             shortest = _.min(thisSet, 'height'),
             topPos = 0; 

        _(thisSet).forEach( function (b, x) {
            var cssString = " position: absolute;";
                cssString += " left: "+(colWidth * x)+"px;";
            if(pSet) {
              topPos = parseInt(pSet[x]['topPos']);
              b['topPos'] = topPos + b['height'];
            }
            else {
              b['topPos'] = b['height'];
            }

            cssString += " top: "+topPos+"px;";
            blocks[b['index']].style.cssText += cssString;
        });
      })(i);
    }
    container.style.opacity = "1";
  });
})(window);