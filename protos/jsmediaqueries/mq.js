(function(window) {
  /* JavaScript Media Queries */
  var debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  if (matchMedia) {
  	var smq = window.matchMedia("(max-width: 420px)"),
        mmq = window.matchMedia("(min-width: 421px)"),
        lmq = window.matchMedia("(min-width: 861px)");

    var picTags = [].slice.call(document.getElementsByClassName('pictag'));
    
    var mediaMatch = debounce(function(e) {
      if(smq.matches) {
        swapSrc("sm");
      }
      if(mmq.matches) {
        swapSrc("md");
      }
      if(lmq.matches) {
        swapSrc("lg");
      }
      console.log("called");
    }, 1000);

    mediaMatch();

    window.addEventListener('resize', mediaMatch, false);
  }


  function swapSrc(size) {
    var _size = size ? size : "sm";
    picTags.forEach(function(tag) {
      var _data = tag.dataset;
      console.log(_data);
      tag.src = _data.path+'/'+_data[_size];
    });
  }
})(window);