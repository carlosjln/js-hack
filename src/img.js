

(function(w){
	
	var _methods = {};
	var _path = 'images/';
	var _ext = '.png';
	
	var img = w.Img = function(images,relative){
		relative = relative===undefined?true:relative;
		
		var default_extension = _ext;
		var baseUrl = Browser[relative?'relativeUrl':'url'];
		var path =  _path;
		//var methods = _methods
		
		if( images === undefined || images == '' || images == '/' ){
			images = (images == '/'?'/':'') + 'clear'+default_extension;
		}
		
		var array = images instanceof Array?images.slice(0):[images];
		
		var i = array.length;
		var index;
		var img;
		
		while( i-- ){
			img = array[i];
			index = img.reverse().indexOf('.');
			
			/* si no tiene punto o esta despues de la 4ta posicion, entonces le agrega la extencion .gif */
			if( index > 4 || index == -1){
				img += default_extension;
			}
			
			/* si no tiene el slash es porque no tiene ningun folder, asi que utiliza el predeterminado */
			if( img.toLowerCase().indexOf('images') != 0 && img.charAt(0) != '/' ){
				img = path + img;
			}
			
			if( img.toLowerCase().indexOf('http') != 0 ){
				img = baseUrl + img.replace(/^(\/)/,'');
			}
			
			array[i] = img;
		}
		
		if( typeof(images)=='string' ){
			return array[0];
		}
		
		/*
		for( var name in methods){
			if( methods.hasOwnProperty(name) ){
				array[name] = methods[name];
			}
		}
		*/
		
		var wrap = Obj.clone( _methods );
		wrap.images = array;
		
		return wrap;
	};
	
	img.setPath = function(str){
		_path = str;
	};
	
	img.setExt = function(str){
		_ext = str;
	};
	
	img.plug=(function(name, method){
		_methods[ name ] = function(){
			return method.apply( this.images.slice(0), Obj.toArray(arguments) );
		};
	});
	
	
	// PRELOAD PLUGIN
	var preload = function( callback ){
		var images = this;
		callback = typeof(callback) == 'function'?callback:function(){};
		
		var length = images.length;
		var i = length;
		var index;
		var current;
		
		var IMG = {
			loaded:0,
			failed:0,
			processed:0,
			completed: false,
			count: length
		};
		
		var div_preload = $('#jsh-img-preloaded');
		
		if( div_preload == null ){
			div_preload = $( $.create('<div id="jsh-img-preloaded"></div>').childNodes[0] );
			div_preload.css('display:none');
			$(document.body).insert( div_preload );
		}
		
		if( div_preload.childNodes.length > 50 ){
			div_preload.empty();
		}
		
		/*
			EVENT HANDLERS
		*/
		function _onLoad(images){
			var t = this;
			
			t.bLoaded = true;
			images.loaded++;
			// t.alt = 'loaded ' + (images.loaded++);
			
			onComplete(t);
		}
		
		function _onError(images){
			var t = this;
			
			t.bError = true;
			//t.alt = 'not loaded';
			images.failed++;
			
			onComplete(t);
		}
		
		function _onAbort(images){
			var t = this;
			t.bAbort = true;
			onComplete(t);
		}
		
		function onComplete(img, images){
			var t = IMG;
			var empty = function(){};
			
			t.processed++;
			t.completed = !(t.processed < t.count);
			
			img.onload = empty;
			img.onerror = empty;
			img.onabort = empty;
			
			callback( t, img );
			
			if( t.completed == false ){
				_preload();
			}
		}
		
		function _preload(){
			var array = images;
			var length = array.length;
			var i = length;
			
			var index;
			var image;
			
			var img = IMG;
			
			while(i--){
				index = length - (i+1);
				
				image = array[index];
				
				if(image.bLoaded||image.bError||image.bAbort){
					continue;
				}
				
				image.onload = function(){
					_onLoad.call(this, img);
				};
				image.onerror = function(){
					_onError.call(this, img);
				};
				image.onabort = function(){
					_onAbort.call(this, img);
				};
				
				image.bLoaded = false;
				
				/*
				if(image.complete == true){
					 image.onload();
				}
				*/
				
				image.src = image._src;
				delete image._src;
				
				div_preload.insert( image );
				
				break;
			}
		}
		
		/*
			pre-proceso de imagenes
		*/
		if( IMG.processed == 0 ){
			var browser = Browser;
			var newImage = ( (browser.is_IE && (browser.version == 6 || browser.version == 7)) || ' firefox,safari'.indexOf( browser.name ) || browser.webkit );
			
			while( i-- ){
				index = length - (i+1);
				
				current = newImage? new Image(): document.createElement('img');
				current._src = images[ index ];
				
				images[index] = current;
			}
			
		}
		
		_preload();
	};
	
	img.plug('preload', preload);
	
	
	
})(window);