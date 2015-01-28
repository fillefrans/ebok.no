/*!
 * jQuery Carousel Gallery 1.3
 * Alban Xhaferllari
 * albanx@gmail.com
 * www.albanx.com
 * Codecanyon sell license
 */
"use strict";	
(function($){
	/**************************************************************************************
	 * Some utilities function used for detecting html5 support, I do not use Modernize
	 * since we do not need more function that this here
	 **************************************************************************************/
	function styleSupport( prop ) 
	{
	    var vendorProp;
	    var supportedProp = null;
	    // capitalize first character of the prop to test vendor prefix
	    var capProp 	= prop.charAt(0).toUpperCase() + prop.slice(1);
	    var prefixes 	= [ "Moz", "Webkit", "O", "ms" ];
	    var div 		= document.createElement( "div" );

	    if ( prop in div.style ) 
	    {
	    	//browser supports standard CSS property name
	    	supportedProp = prop;
	    } 
	    else 
	    {
	    	//otherwise test support for vendor-prefixed property names
	    	for ( var i = 0; i < prefixes.length; i++ ) 
	    	{
	    		vendorProp = prefixes[i] + capProp;
	    		if ( vendorProp in div.style )
	    		{
	    			supportedProp = vendorProp;
	    			break;
	    		}
	    	}
	    }
	    // avoid memory leak in IE
	    div = null;    
	    return supportedProp;
	}
	
	function whichTransitionEvent()
	{
	    var el = document.createElement('div');
	    var transitions = {
	      'transition':'transitionend',
	      'OTransition':'oTransitionEnd',
	      'MSTransition':'msTransitionEnd',
	      'MozTransition':'transitionend',
	      'WebkitTransition':'webkitTransitionEnd'
	    };

	    for(var t in transitions){
	        if( el.style[t] !== undefined ){
	        	el = null;
	            return transitions[t];
	        }
	    }
	    el = null;
	    return false;
	}
	/**********************************************************************************************/
	
	
	//Wait the image loading functions
	function invalidImg(img)
	{
		return (img.width === undefined || ( img.complete !== undefined && !img.complete ));
	}

	// add reflection
	function addReflection(img, settings) 
	{
		var reflHeight = settings.reflectionHeight, opacity= settings.reflectionOpacity;
		var elem = img;
		if(elem.tagName!='IMG') elem = $(img).find('img').get(0);
		
		if(reflHeight<=0 || isNaN(reflHeight) || elem.tagName!='IMG') return false;
		
        if(!!window.CanvasRenderingContext2D)
        {
        	var reflect = document.createElement("canvas");
			reflect.setAttribute('width', img.width);
			reflect.setAttribute('height', reflHeight);
			reflect.style.position 	= 'absolute';
			var cntx = reflect.getContext('2d');
			try
			{
				cntx.save();
				cntx.translate(0, elem.height-1);
				cntx.scale(1, -1);				
				cntx.drawImage(elem, 0, 0, elem.width, elem.height);				
				cntx.restore();
				cntx.globalCompositeOperation = 'destination-out';
				var gradient = cntx.createLinearGradient(0, 0, 0, reflHeight);
				gradient.addColorStop(0, 'rgba(255, 255, 255, ' + (1 - opacity) + ')');
				gradient.addColorStop(1, 'rgba(255, 255, 255, 1.0)');
				cntx.fillStyle = gradient;
				cntx.fillRect(0, 0, elem.width, reflHeight);
				$(reflect).appendTo(img.parentNode);
				return reflect;
			} 
			catch(e) 
			{
				return false;
			}		
		}//not recomended in IE to heavy
        else if (elem.filters !==undefined) 
        {
        	var reflect = document.createElement("img");
        	$(reflect).appendTo(img.parentNode);
           	reflect.src = elem.src;
           	reflect.style.position 	= 'absolute';
           	reflect.style.filter = "flipv progid:DXImageTransform.Microsoft.Alpha(opacity=" + (opacity * 100) + ", style=1, finishOpacity=0, startx=0, starty=0, finishx=0, finishy=" + (reflHeight / img.height * 100) + ")";
           	
           	return reflect;
        }
        
		return false;
	}
	
    var globalSettings = 
    {
    	radiusX:			500,			//set the radius X of eclipse 0 for automatic calculation
    	radiusY:			0,			//set the radius Y of eclipse
    	radiusZ:			0,			//set the radius Z of eclipse in css3 3d mode
    	positionX:			'center',	//set position of eclipse
    	positionY:			'center',
    	spacing:			20,			//spacing in px betwen items
    	showTitle:			true,		//set if to show titles if they are set
    	titleX:				'left',		//default title position, if not set in setup of the tag
    	titleY:				'top',
    	
    	reflectionHeight:	100,		//set reflection height
    	reflectionOpacity:	0.6,		//set reflection opacity
    	reflectionMargin:	2,			//set distance betwen the reflection and element
    	
    	animationSpeed:		34,			//animation speed, lower values make animation smother 
    	autoPlay:			0,			//set autoplay direction -1, 0, 1
    	autoPlayInterval:	2000,		//set autoplay interval 
    	step:				2,			//set the speed switch betwen image during animation 1-10,
    	orientation:		'H', 		//V-H vertical - horizontal rotation
    	
    	navigation:			true,		//show navigation true always, mouse over only on mouseover
    	navigationX:		'center',	//set navigation X position: left, right, center, or in pixels
    	navigationY:		'bottom',	//set navigation Y position: top, bottom, center, or in pixels
    	
		sensivity:			50,			//set the sensivity of drag in pixels
    	mode:				'3d',		//set mode 2d simlulates, or real 3d when browsers supports it
    	perspective:		1000,		//set 3d perspective, set in base of caruosel size
    	scale:				0.5,		//set the 2d perspective scale items
    	items:				'img',		//set the type of items to be used, or class, normally images but also divs
    	titleItems:			'span,a,div',	//set the class of elements to be used as title
		overflow:			'hidden',		//set the overflow for rotating images: hidden / visible
		rotateX:			0,			//set the stage rotation value in degree for having a better 3d view in css3
		keyboardArrows:		true,		//if true use left/right keyboard arrows for rotating in h mode, up/down in vertical mode
		responsive:			true,		//if true the stage will scale to fit window size if it is bigger and images will scale to fit
										// stage size if they are more	
		centerImg:			null,		//set an image at the center of the stage
		centerImgX:			null,		//set the position of the center image, null means it will be center automatically
		centerImgY:			null		// same
    };
    
	
    
	var TouchCarousel = function($this, settings)
	{
		this.settings	= settings;
		this.items		= $this.children().css({ position:'absolute'});
		
		//add this top container for resolving z-index problem on safari and for using rotateX property
		this.topCont	= $this.wrapInner('<div class="ax-top-wrapper" />').children(); //container that rotates X
		this.cont		= this.topCont.wrapInner('<div class="ax-wrapper" />').children();//main container that contains images
		
		this.numItems	= this.items.length;
		this.maindiv	= $this;
		this.orW		= $this.width();
		this.orH		= $this.height();
		
		this.radiusX	= settings.radiusX;
		this.radiusY	= settings.radiusY;
		this.radiusZ	= settings.radiusZ;//only in 3d mode is used
		this.radiusZVP	= 0;//the radius of the view point
		this.posX		= settings.positionX;
		this.posY		= settings.positionY;
		this.currIndex 	= 0;
		this.ptimer 	= null;
		this.aptimer 	= 0;
		this.fromx 		= Math.PI/2;
		this.stopx 		= Math.PI/2;
		this.step		= settings.step/10;
		this.elDelta 	= 2*Math.PI/this.numItems;// divide 360° degree circle in equal part for each element
		this.down		= false;
		this.playing	= true;
		this.touchy 	= ('ontouchstart' in window) ? true: false;
		
		
		//Detect css3 props at init
		this.css3Props	= {
			perspect: styleSupport('perspective'), 
			backFace: styleSupport('backfaceVisibility'), 
			transDur: styleSupport('transitionDuration'), 
			transOri: styleSupport('transformOrigin'),
			transEnd: whichTransitionEvent(),
			transFor: styleSupport('transform'), 
			transSty: styleSupport('transformStyle')
		};
		
		if(settings.mode == '3d')
		{
			this.topCont.css(this.css3Props.transSty, 'preserve-3d');
			this.cont.css(this.css3Props.transSty, 'preserve-3d');
		}
		
		// Fix preventing link bug on some touch devices
		this.cont.children('a[href]').each(function(){
			var alink = $(this);
			alink.data('tc-href', alink.attr('href'));
			alink.data('tc-target', alink.attr('target'));
			alink.attr('href', '#');
			alink.bind('click', function(e) {				
				e.preventDefault();	
				var linkData = $(this).data('tc-href');							
				var linkTarget = $(this).data('tc-target');								
				if(!linkTarget || linkTarget.toLowerCase() === '_self') {
					window.location.href = linkData;
				} else {
					window.open(linkData);
				}				
			});
		});
		
		//wait images to load before set up all
		var images 	= $this.find('img');//only images need loading
		
		$this.append('<div class="ax-loader" />');
		this.waitLoad(images);
	};
	
	
	TouchCarousel.prototype = 
	{
		resize: function()
		{
			var me = this;
			me.radiusZVP 	= me.radiusZ;
			//see if feets the screen, if not reduce
			if($(window).width() < me.radiusZ*2 )
			{
				//calculate with prospective the radiusZ of the viewpoint, not very exact
				me.radiusZVP = me.settings.perspective* ( me.radiusZ*2/ ( $(window).width()-30) - 1);
			}
			
			if(me.settings.mode == '3d')
			{
				var axis2 = me.settings.orientation == 'H' ? 'X':'Z';
				me.cont.css(me.css3Props.transFor, '  translateZ(-'+me.radiusZVP+'px) rotate'+axis2+'('+me.settings.rotateX+'deg)');
			}
			
			if($(window).width() < me.width )
			{
				me.width = $(window).width()-20;
				me.maindiv.css({width:me.width});
			}
			else if($(window).width()>me.orW)
			{
				me.width = me.orW;
				me.maindiv.css({width:me.orW});
			}
			
			
			if($(window).height() < me.height )
			{
				me.height = $(window).height()-20;
				me.maindiv.css({height:me.height});
			}
			else if($(window).height()>me.orH)
			{
				me.height = me.orH;
				me.maindiv.css({height:me.orH});
			}
			
			
			me.setPosition();
			me.setNavPos();

		},
		
		init: function()
		{
			var settings 	= this.settings;
			var	maindiv		= this.maindiv;

			//maindiv.css({overflow:'hidden'});
			
			//get the widht and the height max of elements
			var item_w = 0;
			var item_h = 0;
			this.items.each(function(){
				var el 	= $(this);
				var elW = el.outerWidth();
				var elH = el.outerHeight();
				var item = $(this).children(settings.items);
				if(item.length>0)
				{
					elW 	= item.outerWidth();
					elH 	= item.outerHeight();
				}
				
				item_w = elW>item_w ? elW:item_w;
				item_h = elH>item_h ? elH:item_h;
			});
			//------
			this.item_w = item_w;
			this.item_h = item_h;
			
			if(settings.mode == '3d')
			{
				this.topCont.css({width:item_w});
				this.cont.css({width:item_w, height:item_h});
			}
			
			if(settings.navigation) this.createNav();
			
			this.width 	= maindiv.width();
			this.height = maindiv.height();
			
			//calculate translate z
			this.radiusZ 	= Math.round(  (item_w+settings.spacing) / (2 * Math.tan(this.elDelta/2 ) ) );

			this.resize();
			
			//responsive
			$(window).resize(this, function(e){
				e.data.resize();
			});

			var stageW 	= this.width ;
			var stageH 	= this.height;
			
			this.items.each(function(i){
				
				var el 	= $(this);
				
				el.css({width:item_w, height:item_h});
				
				var item 	= $(this).children(settings.items);
				if(item.length>0)
				{
					item.css({width:item_w, height:item_h});
				}
				
				var data 	= {};
				var delta 	= 0;
				data.width 	= item_w;			
				data.height = item_h;		
				data.order	= i;	
				
				//find titles and set the positions
				data.titles	= el.children(settings.titleItems).addClass('ax-title').css('max-width', stageW-20).each(function(){
					var title 	= $(this);
					var left	= 0;
					var top		= 0;
					var tW		= title.outerWidth();
					var tH		= title.outerHeight();
					switch(settings.titleX)//set default title position
					{
						case 'center': 	left = (stageW-tW)/2; break;
						case 'left': 	left = 5; break;
						case 'right':	left = stageW-tW; break;
						default:		left = settings.titleX;
					}
						
					switch(settings.titleY)
					{
						case 'center':	top = delta+(stageH-tH)/2; break;
						case 'top':		top = delta+5; break;
						case 'bottom':	top = stageH-tH+5; break;
						default:		top = delta+settings.titleY;
					}
					
					delta+=tH;
					//force width of title to itselft due to a Chrome webkit bug on fiting width to content
					title.data('pos', [left, top]).css('width', tW).appendTo(maindiv).css('left', '-1500px');//append to main parent for avoiding 3d css rotation
				});
				
				if(settings.mode == '2d')
					data.reflection = addReflection(this, settings);
				
				el.data('ax-data', data);
			});
			
			
			if(settings.centerImg)
			{
				var me = this;
				var image = new Image();
				image.onload = function()
				{
					var ix = settings.centerImgX ? settings.centerImgX:(me.width-this.width)/2;
					$('<img src="'+settings.centerImg+'" />').css({position:'absolute', left:ix, top:settings.centerImgY, 'z-index':70}).appendTo(me.cont);
				};
				image.src = settings.centerImg;
			}

			this.bindEvents();
			
			if(settings.mode == '2d')
				this.play2d();
			else
				this.set3d();
			
			//title animation
			this.toggleTitle();
			
			//remove the loader
			$('.ax-loader', maindiv).remove();
		},
		
		setPosition: function()
		{
			var settings = this.settings;
			switch(settings.positionX)
			{
				case 'center':	this.posX = (this.width-this.item_w)/2;break;
				case 'left':	this.posX = 0;break;
				case 'right':	this.posX = this.width;break;
				default:		this.posX = settings.positionX;
			}

			switch(settings.positionY)
			{
				case 'center':	this.posY = (this.height-this.item_h)/2;break;
				case 'top':		this.posY = 0;break;
				case 'bottom':	this.posY = this.height;break;
				default:		this.posY = settings.positionY;
			}
			
			if(settings.mode=='3d')
				this.topCont.css({left:this.posX, top:this.posY});
			else
			{
				this.topCont.css({left:0, top:0, width:'100%', height:'100%'});
				this.cont.css({left:0, top:0, width:'100%', height:'100%'});
			}
		},
		
		createNav: function()
		{
			//left button rotate
			$('<a class="ax-nav-common arrow-left" />').appendTo(this.maindiv).bind('click', this, function(e){
				e.data.rotate(1);
				return false;
			});
			//right button rotate 
			$('<a class="ax-nav-common arrow-right" />').appendTo(this.maindiv).bind('click', this, function(e){
				e.data.rotate(-1);
				return false;
			});

			//navigation buttons
			var navCont = $('<div class="ax-nav-common ax-controls" />').appendTo(this.maindiv);
			for(var i = 0;i < this.items.length; i++)
			{
				navCont.append('<a class="ax-nav"></a>');
			}
			
			navCont.children('a.ax-nav:eq('+ this.currIndex +')').addClass('ax-active');

			navCont.children('.ax-nav').bind('click', this, function(ev){
				if( $(this).hasClass('ax-active') ) return false;//on image current do nothing
				var next = navCont.children('.ax-nav').index(this);
				ev.data.goTo( next );
			});
			
			//play/pause button touchstart?
			$('<a class="ax-pause" />').appendTo(navCont).bind('click', this, function(e){
				var me = $(this);
				if(me.hasClass('ax-play'))//start play
				{
					e.data.playing=true;
					me.removeClass('ax-play').addClass('ax-pause');
				}
				else//set pause
				{
					e.data.playing=false;
					me.removeClass('ax-pause').addClass('ax-play');
					clearInterval(e.data.aptimer);
				}
				return false;
			});
			this.navCont = navCont;
			
			this.setNavPos();
		},
		
		setNavPos: function()
		{
			if(this.settings.navigation)
			{
				switch(this.settings.navigationX)
				{
					case 'center':	this.navCont.css({ left:( this.width-this.navCont.width() ) / 2 });	break;
					case 'left':	this.navCont.css({ left: 5 });break;
					case 'right':	this.navCont.css({ right: 5 });break;
					default:		this.navCont.css({ top:this.settings.navigationX });
				}
	
				switch(this.settings.navigationY)
				{
					case 'center':	this.navCont.css({ top:( this.height-this.navCont.height() ) / 2 });break;
					case 'top':		this.navCont.css({ top:5 });	break;
					case 'bottom':	this.navCont.css({ bottom:5 });	break;
					default:		this.navCont.css({ top:this.settings.navigationY });
				}
			}
		},
		
		bindEvents: function()
		{
			var settings = this.settings;

			//Bind keyboard arrows
			if(settings.keyboardArrows)
			{
		        $(document).bind('keydown.ax', this, function(e){
		        	if(settings.orientation == 'V')
		        	{
		        		if(e.keyCode.toString() === '40') {  e.data.rotate(-1); return false;}
		        		if(e.keyCode.toString() === '38') {  e.data.rotate(1); return false; }
		        	}
		        	else
		        	{
		        		if(e.keyCode.toString() === '39') {  e.data.rotate(-1); return false; }
		        		if(e.keyCode.toString() === '37') {  e.data.rotate(1); return false;  }
		        	}
		        });
			}
			
			if(settings.navigation == 'mouseover')
			{
				$('.arrow-left, .arrow-right, .ax-controls', this.maindiv).hide();
				this.maindiv.hover(function(){
					$('.arrow-left, .arrow-right, .ax-controls', this).show();
				}, function(){
					$('.arrow-left, .arrow-right, .ax-controls', this).hide();
				});
			}
			
			//Bind mouse wheel, a small bind function no need plugins
			if ( this.maindiv[0].addEventListener )
			{
				this.maindiv[0].addEventListener('DOMMouseScroll', this.mwheel, false );
				this.maindiv[0].addEventListener('mousewheel', this.mwheel, false );
			}
			else
			{
				this.maindiv[0].onmousewheel = this.mwheel;
			}
		
			//Bind Mousedown
			this.maindiv.bind('mousedown.ax touchstart.ax', this, function(e){
				var TC = e.data;
				TC.cont.addClass('ax-grabing');
				clearInterval(TC.aptimer);
				TC.down 	= true;		//can move on mouse down
				if(TC.touchy)
				{
					e.pageX = e.originalEvent.touches[0].pageX;
					e.pageY = e.originalEvent.touches[0].pageY;
				}

				TC.startX 	= (settings.orientation == 'V')? -e.pageY:e.pageX;
				if(!TC.touchy) return false;
				
			}).bind('mousemove.ax touchmove.ax', this, function(e){
				var TC = e.data;
				e.preventDefault();
				if(TC.down)
				{
					if(TC.touchy)//jquery does not get touch position event
					{
						e.pageX = e.originalEvent.touches[0].pageX;
						e.pageY = e.originalEvent.touches[0].pageY;
					}
					
					var stopX = (settings.orientation == 'V')? -e.pageY : e.pageX ;
					if( Math.abs(TC.startX-stopX) > settings.sensivity)
					{
						clearInterval(TC.aptimer);
						var next = (TC.startX-stopX<0)?-1:1;
						TC.rotate(next);
						TC.startX = stopX;
					}
				}
				//return false; //FIXME is needed?
			}).bind('mouseover.ax', this, function(e){//Stop auto play
				clearInterval(e.data.aptimer);
			}).bind('mouseout.ax', this, function(e){
				if(e.data.playing)//if it is not paused with button 
					e.data.autoPlay();
			});

			//MouseUp
			$(document).bind('mouseup.ax touchend.ax', this, function(e){
				e.data.cont.removeClass('ax-grabing');
				e.data.down = false;
			});
		},
		
		mwheel: function(e)
		{
			if (!e) e = window.event;
			e.preventDefault ? e.preventDefault() : e.returnValue = false;
			var delta = ( e.wheelDelta )? e.wheelDelta/120:-e.detail/3;
			
			$(this).data('TC').rotate(delta);
			return false;
		},
		
		
		goTo: function(to)
		{
			clearInterval(this.aptimer);
			var diff = to - this.currIndex;
			if (2*Math.abs(diff) > this.numItems) 
			{
				diff += (diff > 0) ? -this.numItems : this.numItems;//rotate left or right
			}
			this.rotate(-diff);
		},
		
		
		stop: function()
		{
			this.toggleTitle();
			clearTimeout(this.ptimer);
			this.ptimer = null;
			console.log('stop');
		},
		
		
		rotate: function(dir)
		{
			var settings 	= this.settings;

			this.currIndex 	= (this.currIndex - dir) % this.numItems;
			this.currIndex 	= (this.currIndex < 0)? this.currIndex + this.numItems : this.currIndex;
			this.stopx 		+= this.elDelta*dir;

			if(settings.navigation)//update navigation
			{
				this.navCont.children('.ax-nav').removeClass('ax-active');
				this.navCont.children('.ax-nav:eq('+ this.currIndex +')').addClass('ax-active');
			}

			console.log(this.ptimer);
			if(this.ptimer !== null){
				this.stop();
				//return;	// avoid multiple call of play until finish, just update pos				
			}

			var	TC = this;
			this.ptimer = setTimeout( function(){ TC.play(); }, settings.animationSpeed);
			
		},
		
		
		autoPlay:function()
		{
			var settings=this.settings;
			if ( settings.autoPlay !== 0 )
			{
				var	TC = this;
				this.aptimer = setInterval( function(){ 
					TC.rotate(settings.autoPlay);	
				}, settings.autoPlayInterval );
			}
		},
		
		
		set3d: function()
		{
			//add 3d css
			var settings	= this.settings;
			var pre 		= settings.perspective;
			var css3		= this.css3Props; 
			var TC			= this;
			var axis		= this.settings.orientation == 'H' ? 'Y':'X';	//rotate axis
			//set the prespective
			this.topCont.css(css3.perspect, pre);
			
			//set the animation duration
			this.cont.css(css3.transDur, settings.animationSpeed*20 +'ms');

			//set each item in the angle and position
			this.items.each(function(i){
				$(this).css(css3.transFor, 'rotate'+axis+'('+(TC.elDelta*i)+'rad) translateZ('+(TC.radiusZ)+'px) ' );
			});
		},
		
		
		play3d: function()
		{
			var	step	= this.fromx - this.stopx;//rotate step
			var axis	= this.settings.orientation == 'H' ? 'Y':'X';	//rotate axis
			var axis2	= axis == 'X' ?'Z':'X';
			//just set the stage 
			this.cont.css(this.css3Props.transFor, 'translateZ(-'+this.radiusZVP+'px) rotate'+axis2+'('+this.settings.rotateX+'deg) rotate'+axis+'('+step+'rad) ').one(this.css3Props.transEnd, this, function(e){
				e.data.stop();
			});
		},
		
		
		play2d: function()
		{
			var settings 	= this.settings;
			var	f 			= this.stopx - this.fromx;				
			var	d 			= Math.abs(f);
			this.fromx 		+= f * this.step;
			if ( d < 0.001 )	this.fromx = this.stopx; 
			var	ang 		= this.fromx;	  
			
			this.cont[0].style.display = 'none';
			for (var i = 0; i < this.numItems ;i++)
			{
				var $img	= $(this.items[i]);
				var data 	= $img.data('ax-data');
				var sin		= Math.sin(ang);
				var cos		= Math.cos(ang);
				var scale 	= (sin*(1-settings.scale)+1+settings.scale)/2;
				var newW	= scale * data.width;
				var newH	= scale * data.height;
				
				//this scales radius too
				var x		= this.posX + (cos * this.radiusX )*scale;//eclipse equation x = a* cos(t), y = b*sin(t)
				var y		= this.posY + (sin * this.radiusY )*scale;
			
				if(settings.orientation == 'V')
				{
					var tmp = x;
					x = y;
					y = tmp;
				}
				$img.css({ left:x, top:y, zIndex:100*scale>>0, width:newW, height:newH}).children().css({ width:newW, height:newH });				

				if (data.reflection)//add reflection, not reccomended on mobile and IE
				{
					var refstyle 	= data.reflection.style;
					var refH		= settings.reflectionHeight * scale;
					var refY		= y + $img.outerHeight() + settings.reflectionMargin*scale;
					refstyle.left 	= x + 'px';
					
					refstyle.top 	=  refY + 'px';
					refstyle.width 	= $img.outerWidth() + 'px';			
			  
					if (data.reflection.tagName == 'IMG')
					{
						refstyle.filter.finishy = refH/$img.outerHeight()*100;	
					}
					else
					{
						refstyle.height = refH + 'px';													
					}
				}
				ang += this.elDelta;
			}		
			this.cont[0].style.display = 'block';

			if ( d >= 0.001 || this.down)
			{
				var TC = this;
				this.ptimer = setTimeout(function(){	TC.play();	}, settings.animationSpeed);
			}
			else
			{
				this.stop();
			}
		},
		
		
		play: function()
		{
			if(this.settings.mode == '2d')
			{
				this.play2d();
			}
			else
			{
				this.play3d();
			}
		},
		
		
		toggleTitle: function()
		{
			//stop current running animation
			$('.ax-title', this.maindiv).clearQueue().stop(true,true).css({left:-2000, top:-2000});
						
			//get current image titles and animate them
			var data 	= $(this.items[this.currIndex]).data('ax-data');
			var titles 	= data.titles;
			if(titles!==undefined)
			{
				titles.each(function(i){
					var el 		= $(this);
					var easing 	= el.data('easing');
					var start	= el.data('start');
					var stop	= el.data('stop');
					var pos  	= el.data('pos');
					
					var delay		= isNaN(el.data('delay')) ? 1 : parseInt(el.data('delay'));
					var duration	= isNaN(el.data('duration')) ? 800 : parseInt(el.data('duration'));
					var start_css 	= eval("("+start+")");
					var end_css		= eval("("+stop+")");
					
					if(start!==undefined && stop!==undefined)
					{
						el.css({'left':pos[0], 'top':pos[1]}).css(start_css).delay(delay).animate(end_css, duration, easing);
					}
					else
					{
						el.css({'left':pos[0], 'top':pos[1]});
					}
				});
			}
		},
		
		//wait image loading
		waitLoad: function(images)
		{
			var me = this;
			for(var i = 0; i<images.length; i++)
			{
				if( this.isInvalidImg(images[i]) )
				{
					setTimeout(function(){ me.waitLoad(images); }, 150);
					return false;
				}
			}
			this.init();
		},
		
		isInvalidImg: function(img)
		{
			return (img.width === undefined || ( img.complete !== undefined && !img.complete ));
		},
		
		
		options:function(opt, val)
		{
			if(val!==undefined && val!==null)
			{
				this.settings[opt] = val;
			}
			else
			{
				return this.settings[opt];
			}
		}
	};
	
	var methods =
	{
		init : function(options)
		{
    	    return this.each(function() 
    	    {
				var settings = $.extend({}, globalSettings, options);
				var TC = $(this).data('TC');
				
				if(TC !== undefined && TC !== null) return; //touch carousel already applied
				
				//if not supported css 3d then switch to simulate 3d mode
				if(styleSupport('perspective') === undefined || styleSupport('perspective') === null)  settings.mode = '2d';
				
				var $this = $(this).css({ position:'relative', overflow:settings.overflow }).addClass('ax-carousel').data('author','http://www.albanx.com/');
				$this.data('TC', new TouchCarousel($this, settings) );
    	    });
		},
		enable:function()
		{
			return this.each(function()
			{
				//var $this = $(this);
			});
		},
		disable:function()
		{
			return this.each(function()
			{
				//var $this = $(this);
			});
		},
		destroy : function()
		{
			return this.each(function()
			{
				
			});
		},
		option : function(option, value)
		{
			return this.each(function(){
				var TC = $(this).data('TC');
				return TC.options(option, value);
			});
		}
	};


		
	$.fn.carousel3d = function(method, options)
	{
		if(methods[method])
		{
			return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
		}
		else if(typeof method === 'object' || !method)
		{
			return methods.init.apply(this, arguments);
		}
		else
		{
			$.error('Method ' + method + ' does not exist on jQuery.carousel3d');
		}
	};

})(jQuery);

/*
 * jQuery Easing v1.3 - http://gsgd.co.uk/sandbox/jquery/easing/
 */

// t: current time, b: begInnIng value, c: change In value, d: duration
jQuery.easing['jswing'] = jQuery.easing['swing'];

jQuery.extend( jQuery.easing,
{
	def: 'easeOutQuad',
	swing: function (x, t, b, c, d) {
		//alert(jQuery.easing.default);
		return jQuery.easing[jQuery.easing.def](x, t, b, c, d);
	},
	easeInQuad: function (x, t, b, c, d) {
		return c*(t/=d)*t + b;
	},
	easeOutQuad: function (x, t, b, c, d) {
		return -c *(t/=d)*(t-2) + b;
	},
	easeInOutQuad: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t + b;
		return -c/2 * ((--t)*(t-2) - 1) + b;
	},
	easeInCubic: function (x, t, b, c, d) {
		return c*(t/=d)*t*t + b;
	},
	easeOutCubic: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t + 1) + b;
	},
	easeInOutCubic: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t + b;
		return c/2*((t-=2)*t*t + 2) + b;
	},
	easeInQuart: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t + b;
	},
	easeOutQuart: function (x, t, b, c, d) {
		return -c * ((t=t/d-1)*t*t*t - 1) + b;
	},
	easeInOutQuart: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t + b;
		return -c/2 * ((t-=2)*t*t*t - 2) + b;
	},
	easeInQuint: function (x, t, b, c, d) {
		return c*(t/=d)*t*t*t*t + b;
	},
	easeOutQuint: function (x, t, b, c, d) {
		return c*((t=t/d-1)*t*t*t*t + 1) + b;
	},
	easeInOutQuint: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return c/2*t*t*t*t*t + b;
		return c/2*((t-=2)*t*t*t*t + 2) + b;
	},
	easeInSine: function (x, t, b, c, d) {
		return -c * Math.cos(t/d * (Math.PI/2)) + c + b;
	},
	easeOutSine: function (x, t, b, c, d) {
		return c * Math.sin(t/d * (Math.PI/2)) + b;
	},
	easeInOutSine: function (x, t, b, c, d) {
		return -c/2 * (Math.cos(Math.PI*t/d) - 1) + b;
	},
	easeInExpo: function (x, t, b, c, d) {
		return (t==0) ? b : c * Math.pow(2, 10 * (t/d - 1)) + b;
	},
	easeOutExpo: function (x, t, b, c, d) {
		return (t==d) ? b+c : c * (-Math.pow(2, -10 * t/d) + 1) + b;
	},
	easeInOutExpo: function (x, t, b, c, d) {
		if (t==0) return b;
		if (t==d) return b+c;
		if ((t/=d/2) < 1) return c/2 * Math.pow(2, 10 * (t - 1)) + b;
		return c/2 * (-Math.pow(2, -10 * --t) + 2) + b;
	},
	easeInCirc: function (x, t, b, c, d) {
		return -c * (Math.sqrt(1 - (t/=d)*t) - 1) + b;
	},
	easeOutCirc: function (x, t, b, c, d) {
		return c * Math.sqrt(1 - (t=t/d-1)*t) + b;
	},
	easeInOutCirc: function (x, t, b, c, d) {
		if ((t/=d/2) < 1) return -c/2 * (Math.sqrt(1 - t*t) - 1) + b;
		return c/2 * (Math.sqrt(1 - (t-=2)*t) + 1) + b;
	},
	easeInElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; s=p/4; }
		else s = p/(2*Math.PI) * Math.asin (c/a);
		return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
	},
	easeOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d)==1) return b+c;  if (!p) p=d*.3;
		if (a < Math.abs(c)) { a=c; s=p/4; }
		else s = p/(2*Math.PI) * Math.asin (c/a);
		return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
	},
	easeInOutElastic: function (x, t, b, c, d) {
		var s=1.70158;var p=0;var a=c;
		if (t==0) return b;  if ((t/=d/2)==2) return b+c;  if (!p) p=d*(.3*1.5);
		if (a < Math.abs(c)) { a=c; s=p/4; }
		else s = p/(2*Math.PI) * Math.asin (c/a);
		if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )) + b;
		return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*d-s)*(2*Math.PI)/p )*.5 + c + b;
	},
	easeInBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*(t/=d)*t*((s+1)*t - s) + b;
	},
	easeOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158;
		return c*((t=t/d-1)*t*((s+1)*t + s) + 1) + b;
	},
	easeInOutBack: function (x, t, b, c, d, s) {
		if (s == undefined) s = 1.70158; 
		if ((t/=d/2) < 1) return c/2*(t*t*(((s*=(1.525))+1)*t - s)) + b;
		return c/2*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) + b;
	},
	easeInBounce: function (x, t, b, c, d) {
		return c - jQuery.easing.easeOutBounce (x, d-t, 0, c, d) + b;
	},
	easeOutBounce: function (x, t, b, c, d) {
		if ((t/=d) < (1/2.75)) {
			return c*(7.5625*t*t) + b;
		} else if (t < (2/2.75)) {
			return c*(7.5625*(t-=(1.5/2.75))*t + .75) + b;
		} else if (t < (2.5/2.75)) {
			return c*(7.5625*(t-=(2.25/2.75))*t + .9375) + b;
		} else {
			return c*(7.5625*(t-=(2.625/2.75))*t + .984375) + b;
		}
	},
	easeInOutBounce: function (x, t, b, c, d) {
		if (t < d/2) return jQuery.easing.easeInBounce (x, t*2, 0, c, d) * .5 + b;
		return jQuery.easing.easeOutBounce (x, t*2-d, 0, c, d) * .5 + c*.5 + b;
	}
});