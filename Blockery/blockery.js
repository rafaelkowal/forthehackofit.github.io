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
    
    var _floaters = [].slice.call(document.querySelectorAll('.floaters'));
    var blocks = [], count = 0;

    _floaters.forEach(function (i) {
        var _block = getBoundingClientRect(i);
        _block['topPos'] = 0;
        _block['height'] = _block['bottom'] - _block['top'];
        _block['index'] = count;
        blocks.push(_block);
        count++;
    });

    var bricks = _.groupBy(blocks, 'top');
    window.Bricks = bricks;
    var indexes = _.keys(bricks);
    var maxCells = _.size(_.max(Bricks, function(b) {return b.length;}));
    var container = document.getElementById('container');
    var avWidth = container.getBoundingClientRect().width;
    var colWidth = Math.floor(_floaters[0].getBoundingClientRect().width);
    var maxCols = Math.floor(avWidth / colWidth);
    var matrix = [];

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
            _floaters[b['index']].style.cssText += cssString;
        });
      })(i);
    }
    container.style.visibility = "visible";
    container.style.opacity = "1";
  });
})(window);