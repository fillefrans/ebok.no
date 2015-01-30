
// ==ClosureCompiler==
// @output_file_name default.js
// @compilation_level SIMPLE_OPTIMIZATIONS
// @language ECMASCRIPT5
// ==/ClosureCompiler==

document.addEventListener("DOMContentLoaded", function() {
    var 
      partial   = null,
      data      = null,
      date      = new Date(),
      startTime = date.getTime(),
      pos       = null,
      category  = null,
      perspective = 800,
      radiusX   = 200,
      radiusZ   = 360,
      centerX   = 180,
      centerZ   = -100,
      centerY   = 0,
      startX    = 0,
      startY    = 0,
      currentAngle = 269,
      desiredAngle = 270,
      previousItem  = null,
      selectedItem = null,
      _currentItem = 0,
      upperMost = null,
      angleStep = 0,
      highestZ  = 0,
      lowestZ   = null,
      maxZ      = 0,
      _active   = false,
      prevBtn   = document.getElementById("ebokPrev"),
      nextBtn   = document.getElementById("ebokNext"),
      select    = document.getElementById("ebokCombo"),
      carousel  = document.getElementById("ebokCarousel"),
      books     = document.getElementById("ebokList"),
      mover     = document.getElementById("ebokMover"),
      items     = [],
      xhr       = new XMLHttpRequest();


    if (typeof dhtml === "undefined" || (!dhtml) || typeof dhtml.getVar != "function") {
      console.error("AdForm DHTML Api not loaded! Shimming ... ");
    }


    // document.getElementById("touchTarget").addEventListener("click", preventDef, true);
    document.getElementById("ebokContent").addEventListener("click", preventDef, true);
    document.getElementById("ebokMain").onclick = null;
    document.getElementById("ebokMain").addEventListener("click", function(e) {
      if (e.target instanceof HTMLDivElement && e.target.id != "touchTarget") {
        window.open(dhtml.getVar("clickTAG", "https://ebok.no/"), "new_window");
      }
      else {
        if (e.target instanceof HTMLImageElement && e.target.alt.indexOf("/") === 0) {
        }
        else {
        }
      }
    }, true);


// The template for our book items

 partial = '<div class="ebokListItem"><div class="ebokPlayButton" style="opacity:0.5;position:absolute; top:112px; left: 50px; z-index: 200000;"><span style="display:none;color:black; font: bold 24px sans-serif;">{i}</span><a id="{clickTagSample}" class="clicktagged" href="http://ebok.no{sample_url}" ><img class="playBtn" src="play.svg" width="40" height="40"></a></div><img src="{image_url}x150.jpg" width="150" height="150" alt="{name} - {simple_authors}"><div class="ebokBuyButton"><a id="{clickTagBuy}" class="clicktagged" href="http://ebok.no{absolute_url}">{price},- Kjøp nå!</a></div></div>';


    pos = carousel.getBoundingClientRect();
    pos.width = pos.right - pos.left;
    pos.middle = pos.left + (pos.width/2);

    // requestAnimationFrame un-prefixer/polyfill from https://gist.github.com/paulirish/1579671
    (function() {
        var lastTime = 0;
        var vendors = ['webkit', 'moz'];
        for(var x = 0; x < vendors.length && !window.requestAnimationFrame; ++x) {
            window.requestAnimationFrame = window[vendors[x]+'RequestAnimationFrame'];
            window.cancelAnimationFrame =
              window[vendors[x]+'CancelAnimationFrame'] || window[vendors[x]+'CancelRequestAnimationFrame'];
        }

        if (!window.requestAnimationFrame)
            window.requestAnimationFrame = function(callback, element) {
                var currTime = new Date().getTime();
                var timeToCall = Math.max(0, 16 - (currTime - lastTime));
                var id = window.setTimeout(function() { callback(currTime + timeToCall); },
                  timeToCall);
                lastTime = currTime + timeToCall;
                return id;
            };

        if (!window.cancelAnimationFrame)
            window.cancelAnimationFrame = function(id) {
                clearTimeout(id);
            };
    }());


    function GetVendorPrefix(arrayOfPrefixes) {

       var tmp = document.createElement("div");
       var result = "";

       for (var i = 0; i < arrayOfPrefixes.length; ++i) {

         if (typeof tmp.style[arrayOfPrefixes[i]] != 'undefined') {
            return arrayOfPrefixes[i];
         }
         else {
            result = null;
         }
       }
       return result;
    }



    var transformPrefix = GetVendorPrefix(["transform", "msTransform", "MozTransform", "WebkitTransform", "OTransform"]);
    var transitionPrefix = GetVendorPrefix(["transition", "msTransition", "MozTransition", "WebkitTransition", "OTransition"]);
    var animationPrefix = GetVendorPrefix(["animation", "msAnimation", "MozAnimation", "WebkitAnimation", "OAnimation"]);


    function nextItem (e) {
      var
        fromItem = _currentItem;

      if (e && e.preventDefault) 
        e.preventDefault();
  
      if (!(items && items.length)) {
        return false;
      }
      // should have been set in _init(), so that's not right
      if (!angleStep) {
        return false;
      }
      _currentItem++;
      moveToItem(_currentItem);
    }

    function prevItem (e) {
      e.preventDefault();

      _currentItem--;
      if (_currentItem < 0) {
        _currentItem += items.length;
      }
      moveToItem(_currentItem);
    }


    function setTopmost(item) {
      var
        item = item || null;

      if (topMost) {
        setInactiveBook(topMost);
      }
      setActiveBook(item);
    }

    /**
     * Move this angle to the front of the screen
     * @param   {angle}  angle  Angle, in degrees
     * @return  {void}         
     */
    function moveToAngle(angle) {
      // a quick type check
      if (typeof angle == "number") {
        if (angle < 0) {
          // angle += 360;
        }
        desiredAngle = angle ;
        _active = true;
        // start the animation
        animate();
        return true;
      }
      return false;
    }


    /**
     * Move this item to the front of the screen
     * @param   {integer}  item  The item to move to
     * @return  {void}         
     */
    function moveToItem(item) {
      var
        myAngle = 0, myItem = 0;
      // a quick type check
      if (typeof item == "number") {
        myItem = item;
        if (myItem<0) {
          myItem += items.length;
        }
        myAngle = (270+ (myItem * angleStep));

        if (myAngle>360 && Math.abs((myAngle-desiredAngle) > (2*angleStep))) {
          myAngle-=360;
        }

        desiredAngle = myAngle;
        _active = true;
        // start the animation
        animate();
        return true;
      }
      return false;
    }

    window.moveToItem = moveToItem;

    function _init () {
        moveToItem(5);
    }



    function setActiveBook(bookNo) {
      var
        book        = items[bookNo] || null,
        bookButton  = null,
        playButton  = null;


      if (!book) {
        console.error("No Book!");
      }

      bookButton = book.getElementsByClassName("ebokBuyButton").item(0) || false;
      playButton = book.getElementsByClassName("ebokPlayButton").item(0) || false;

      if(!book && !bookButton) {
        console.error("setActiveBook() - missing book or element (" + book + ", " + bookButton + ")!");
        return false;
      }

      // then show the new front item
      bookButton.style.display    = "block";
      bookButton.style.visibility = "visible";
      bookButton.style.opacity    = 1;

      playButton.style.opacity = 1;
    }


    function setInactiveBook(bookNo) {
      var
        book = items[bookNo] || null,
        bookButton  = null,
        playButton  = null;

      if (!book) {
        console.error("No Book!");
      }

      bookButton = book.getElementsByClassName("ebokBuyButton").item(0) || false;
      playButton = book.getElementsByClassName("ebokPlayButton").item(0) || false;

      if(!book && !bookButton) {
        console.error("setActiveBook() - missing book or element (" + book + ", " + bookButton + ")!");
        return false;
      }

      // then hide the former front item
      bookButton.style.opacity    = 0;
      bookButton.style.visibility = "hidden";

      playButton.style.opacity = 0.005;

    }


    function animate () {
      var 
        angle, pos, x, z, angleDelta, highestZ = 0;

      if(_active) {
        requestAnimationFrame(animate);
      }
      else {
        return;
      }

      angle = currentAngle;

      if (angle == desiredAngle) {
        _active = false;
        return;
      }

      angleDelta = (desiredAngle - currentAngle)/20;

      if (Math.abs(angleDelta) < 0.01) {
        currentAngle = desiredAngle;
        _active = false;
      }
      else {
        currentAngle += angleDelta;
      }

      if (!(items && items.length)) {
        _active = false;
        console.error("not items or items.length")
        return false;
      }

        angleStep = 360/items.length;
        items.forEach(function(p,i,a) {
          var
            offset = 360*(i/items.length),
            pos = getPos((currentAngle + offset)),
            zIndex = Math.ceil((pos.z + 1440));

          p.style.zIndex = zIndex;
          if (lowestZ === null) {
            lowestZ = zIndex;
          }
          else if (zIndex < lowestZ) {
            lowestZ = zIndex;
          }
          if (zIndex > highestZ) {
            highestZ = zIndex;
            if (maxZ<highestZ)
              maxZ = highestZ;
            topMost  = i;
            p.style.opacity = 1;
          }
          else {
            p.style.opacity = 0.8;
          }

          p.style[transformPrefix] = "translateY(" + centerY +"px) translateZ(" + pos.z + "px)" + "translateX(" + pos.x + "px)";

        });
      if (topMost != upperMost) {
        if (upperMost === null) {
          upperMost = topMost;
          setActiveBook(topMost);
          return;
        }

        setInactiveBook(upperMost);
        upperMost = topMost;
        setActiveBook(topMost);
      }
    }


    function getPos(angle) {
      return {
          x : centerX + radiusX * Math.cos(angle * Math.PI / 180),
          z : centerZ + radiusZ * Math.sin(angle * Math.PI / 180)
      }
    }

    function updatePosition() {
      pos = carousel.getBoundingClientRect();
      pos.width = pos.right - pos.left;
      pos.middle = pos.left + (pos.width/2);
    }


    function addClickTags() {
      var
        clickTAGvalue,
        clickTarget       = dhtml.getVar('landingPageTarget', '_blank'),
        clickTagElements  = document.getElementsByClassName("clicktagged") || null;


      if (clickTagElements && clickTagElements.length) {
        for (var i = 0; i < clickTagElements.length;i++) {
          var clickTAG = clickTagElements[i].id;
          if (clickTAG) {
            clickTAG = dhtml.getVar(clickTAG, clickTagElements[i].href);
            clickTagElements[i].href = clickTAG;
          }
        }
      }
    }

    function showData() {
      if (!data) {
        return false;
      }
    }


   function removeChildren(elem) {
      var 
        element   = elem || document.getElementById("ebokList"),
        removed   = 0;
      // clear element's children

      if (!element) {
        console.error("No element in removeChildren()");
        return false;
      }
      while (element.firstChild) {
        element.removeChild(element.firstChild);
        removed++;
      }
      return removed;
    }


    function showCategory(arr) {
      var
        // max number of books to retrieve for each category
        maxCount  = 10,
        itemCount = 0,
        fragment  = document.createDocumentFragment(),
        container = document.getElementById("ebokList");
 
      // clear the items array
      if (items.length) {
        // for(;items.pop();){}
        while (items.length>0) {
          items.pop();
        }
      }
      arr.forEach(function (p,i,a) {
        var 
          listItem = document.createElement("li"),
          chunk    = {
            // restore names of array-packed variables
            // so we can use them in our partials and templates
            'simple_authors'  : p[0],
            'name'            : p[1],
            'image_url'       : p[2],
            'sample_url'      : p[3],
            'absolute_url'    : p[4],
            'price'           : p[5],
            'slug'            : p[6], //"slug", new param
            'id'              : p[6], //copy of slug, because bugs (in template.render)
            'clickTagSample'  : p[7], 
            'clickTagBuy'     : p[8], 
            'i'               : i // for debugging purposes
          };
        if (listItem && itemCount < maxCount) {
          listItem.style.class = "ebokListItem";
          listItem.innerHTML = template.render(partial, chunk);
          fragment.appendChild(listItem);
          itemCount++;
          items.push(listItem);
        }
      });

      removeChildren(container);
      container.appendChild(fragment);

      addClickTags();
      // set initial positions
      if (!window.ebokFirstRun) {
        window.ebokFirstRun = true;
        moveToItem(5);
      }
      else {
        _init();
        setTimeout(nextItem, 100);
      }
    }


    function onCategoryChange(el) {
      var
        catName = this.options[this.selectedIndex].value;
      category = data[catName];
      if (!!category) {
        showCategory(category);
      }
    }



    xhr.onload = function () {
      try {
        data = JSON.parse(this.responseText);
        if (!!data) {
          prevBtn.addEventListener("click", prevItem, true);
          nextBtn.addEventListener("click", nextItem, true);
          // load initial category, hardcoded here for simplicity
          showCategory(data['barnebker']);
        }
        else {
          console.error("data : ", data);
        }
      }
      catch (e) {
        console.error("caught exception " + e.name + " : " + e.message + " in xhr.onload()");
      }
    };

    xhr.open("get", "data.json", true);
    xhr.send();

    select.addEventListener("change", onCategoryChange,   true);


    /**
     * The simplest template renderer in the world
     * @todo Rewrite to omit the (for .. in) construct
     */
    var template = {

      render : function (template, data) {
        var
          template = template || null,
          defaults = {
          },
          data = data || {};

        // check inputs
        if ( !data || typeof data != "object" ){
          console.error("NOT OBJECT, OR EMPTY OBJECT");
          return template + "<div>data==[] or !isArray(data)</div>";
        } 
        if (template === null) {
          console.error("NO TEMPLATE");
          return JSON.stringify({error : "no template"});
        }

        // add defaults to data
        for (var i in defaults) {
          if(typeof data[i] === "undefined") {
            data[i] = defaults[i];
          }
        }

        // render
        for (var key in data) {
          template = template.replace(new RegExp("\{(" + key + "[^}]?)\}"), data[key]);
          template = template.replace(new RegExp("\{(" + key + "[^}]+)\}"), data[key]);
        }
        return template;
      }
    };

});
