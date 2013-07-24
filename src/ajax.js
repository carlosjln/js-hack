
(function(w){
	var count = 0;
	
	var get_transport = w.XMLHttpRequest ? function(){ return new XMLHttpRequest() } : function(){ return new ActiveXObject("Microsoft.XMLHTTP") };
	
	var CACHE = [];
	
	// CLEAR TIME OUT
	function clear_timeout( my ){
		clearTimeout( my.timeout );
	}
	
	// TIMEOUT HANDLER
	function abort( my, reason ){
		my.timeoutReached = reason == "timeout";
		my.transport.abort();
	}
	
	// START TIMER
	function start_timer( my ){
		var timeout = my.instance.options.timeout;
		
		if( timeout != null ){
			my.timeout = setTimeout( function(){ abort(my, "timeout") } , (timeout*1000) );
		}
		
	}
	
	// GET ERROR
	function get_error( number, message ){
		var msg = null;
		
		// CUSTOM ERROR
		if( number == 0 ) msg = message;
		if( number == 1 ) msg = "JavaScript error";
		if( number == 2 ) msg = "Timeout expired";
		if( number == 3 ) msg = "Invalid JSON";
		if( number == 4 ) msg = "Error on complete";
		if( number == 5 ) msg = "Error on fail'";
		if( number == 6 ) msg = "Request aborted";
		
		if( number == 204 ) msg = "No Content";
		if( number == 400 ) msg = "Bad Request";
		if( number == 401 ) msg = "Unauthorized";
		if( number == 403 ) msg = "Forbidden";
		if( number == 404 ) msg = "File Not Found";
		if( number == 500 ) msg = "Server side error";
		
		if( number > 0 && msg == '' ) msg = "Unknown error";
		
		return {
			number: Parse.int(number),
			message: msg
		};
	}
	
	// ON ERROR
	function on_error( my, number, message ){
		
		var error = get_error( number, message );
		
		// AUTO RETRY n TIMES
		var t = my.instance;
		var retries = my.retries;
		
		var options = t.options;
		var options_on_error = options.on_error;
		var retry = options.retry;
		var max = retry.max;
		var countdown = retry.delay * (retries+1);
		
		var icons = options.screen.icons;
		
		var screen = my.screen;
		
		if( options.debug && message && number ) error.message += ": " + message;
		
		if( screen != null ){
			var screen_message = screen.message;
			var icon = screen_message.icon;
			var text = screen_message.text;
			
			// SETS THE RETRY ICON
			icon.src = Img(icons.retry, false);
		}
		
		var space = '&nbsp;';
		
		function fn_retry(){
			if( countdown-- > 0 ){
				if( screen ){
					text.write_html( (retry.message + space + ( Math.ceil(countdown+1) )).replace(/ /g,space) );
					screen_message.center();
				}
				
				my.timeout = setTimeout( arguments.callee, 1000);
			}else{
				clear_timeout( my );
				
				my.retries++;
				t.request( options.url, options );
			}
		}
		
		if( max !=0 && retries < max && error.number > 6 ){
			fn_retry();
			
		}else{
			
			if( (screen || error.number == 6) && !$.isEmpty(options_on_error) ){
				hide_screen( my );
			}
			
			if( typeof(options_on_error) == 'function' ){
				options_on_error( error, my.instance );
				
			}else{
				
				if( screen ){
					icon.src = Img( icons.error, false )
					text.write_html( error.message.replace( / /g, space ) );
					
					var a = $.create('a').css('C:red;TD:underline;CU:pointer;ML:5').write_html('retry');
					a.handle('click', function(e){
						e.cancel();
						t.request( options.url, options );
						this.unload();
					});
					message.insert( a ).center();
				}
				
			}
		}
		
	}
	
	function build_loading_screen( my ){
		/*
			<div style="width:800px; height:300px; position:relative;">
				<div style="width:800px; height:300px; -webkit-border-radius: 3px; -moz-border-radius: 3px; border-radius: 3px; background-color:#646464; opacity:0.3; filter:alpha(opacity=50)">
				</div>
				<div style="padding:7px; margin:-25px 0 0 -50px; font-size: 14px; line-height: 16px; position:absolute; top:50%; left:50%; display: -moz-inline-stack; display: inline-block; zoom: 1; *display: inline; -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px; background-color:white;">
					<img src="Images/jshack/Icon-Loading-Gray.gif" style="float:left; margin-right:7px;">
					<span style="float:left">Loading...</span>
				</div>
			</div>
		*/
		var my_instance = my.instance;
		
		var id = "ajax:screen:" + my_instance.id;
		
		// IF THE TARGET ELEMENT IS A <SELECT> TAG
		if( my.target_type == 'select' ){
			var select_option = $.create( 'option', my_instance.options.screen.message, '{loading}' );
			select_option.id = id;
			select_option.selected = true;
			return select_option;
			
		// IF THE TARGET ELEMENT IS ANYTHING ELSE
		}else{
			// var empty = "";
			// var html = empty;
			
			// var options_screen = my_instance.options.screen;
			// var has_custom_mask = ( options_screen.width != empty || options_screen.height != empty );
			// var show_mask = options_screen.show_mask;
			// var option_element;
			// var prefix = 'ajax-select';
			
			var create = $.create;
			
			var screen = create( 'div' ).css("PO:relative;");
			var background = create( 'div' ).css("KC:#646464; OP:30; -webkit-border-radius: 3px; -moz-border-radius: 3px; border-radius: 3px;");
			var message = create( 'div' ).css("W:auto; LH:16; FS:13; FF: Verdana,arial,helvetica,clean,sans-serif; P:7; PO:absolute; CO:#252525; D:-moz-inline-stack; D:inline-block; Z:1; *display: inline; KC:white; -webkit-border-radius: 4px; -moz-border-radius: 4px; border-radius: 4px;");
			
			var icon = create( 'img' ).css("F:left; MR:7;");
			var text = create( 'span' ).css("F:left");
			
			screen.id = id;
			
			screen.insert([ background, message.insert([ icon, text ]) ]);
			
			// REFERENCES
			screen.background = background;
			screen.message = message;
			message.icon = icon;
			message.text = text;
			
			// CENTRALIZES THE INNER CONTAINER 
			message.center = function(){
				var t = this;
				var parent_node = t.parentNode;
				var show_mask = parent_node.show_mask;
				
				if(!show_mask) t.css("M:-; PO:-");
				
				var width = t.css('width');
				var height = t.css('height');
				
				if( show_mask ){
					width = Math.ceil( isNaN(width)?0:width / 2 );
					height = Math.ceil( isNaN(height)?0:height / 2 );
					
					// CALCULATES THE MARGIN CORRECTIONS FOR A PERFECT HORIZONTAL AND VERTICAL ALIGN
					t.css( "PO:absolute; T:50%; L:50%; P:7; M:-"+ (height) +"px 0 0 -"+ (width) +"px;" );
					
				}
			};
			
			return screen;
		}
		
	}
	
	function show_screen( my ){
		
		// LOADING SCREEN REFERENCES
		var my_instance = my.instance;
		
		var empty = "";
		var options = my_instance.options;
		
		var screen = options.screen;
		var style = screen.style;
		var showMask = screen.show_mask;
		
		var target = $( screen.target || options.target );
		my.target = target;
		
		if( target == null || screen.show == false ) return null;
		
		// DETERMINES IF THE RENDER ELEMENT IS A <SELECT> TAG IN ORDER TO SHOW THE LOADING SCREEN OR JUST PLACE THE LOADING MESSAGE INSIDE AN <OPTION> TAG
		my.target_type = target.nodeName.lcase();
		
		if( my.screen == undefined ){
			my.screen = build_loading_screen( my );
		}else{
			hide_screen( my );
		}
		
		var screen_element = my.screen;
		
		// IF THE TARGET ELEMENT IS A <SELECT> TAG
		if( my.target_type == 'select' ){
			target.empty().insert( screen_element );
			
		}else{
			// SETS THE STYLE BEFORE INSERTING IT ON THE DOM
			var background = screen_element.background.css( style.background );
			var message = screen_element.message.css( style.message );
			var icon = message.icon.css( style.icon );
			var text = message.text.css( style.text );
			
			// CSS OVERWRIDE
			var display_inline = 'D:-moz-inline-stack; D:inline-block; Z:1; *display: inline;';
			message.css( display_inline );
			
			var width = 0;
			var height = 0;
			
			if( target && screen.show ){
				// WRITES THE MESSAGE TO DISPLAY
				icon.src = Img( screen.icons.loading, false );
				text.write_html( screen.message );
				
				screen_element.show_mask = showMask;
				
				if( showMask ){
					width = screen.width || target.css('width');
					
					// SETS THE STYLE FOR THE LOADING SCREEN CONTAINER AND THE BACKGROUND
					var min_height = target.css('minHeight');
					height = target.css('height');
					height = screen.height || ( height == 'auto' && min_height != empty ? min_height : height );
					
					screen_element.css( 'W:'+ width +'; H:'+ height +'; PO:relative;' );
					screen_element.background.css('W:'+ width +'; H:'+ height +';' + style.background);
					
				}else{
					screen_element.css( display_inline );
					background.style.display = 'none';
				}
				
				// INSERTS THE ELEMENT INTO THE LIVE DOCUMENT
				target.empty().insertBefore( screen_element, null );
				
				message.center();
			}
		}
		
		return screen_element;
	}
	
	function hide_screen( my ){
		if( my.screen ){
			my.screen.unload();
		}
	}

	/*
		0: request not initialized 
		1: server connection established
		2: request received 
		3: processing request 
		4: request finished and response is ready
	*/
	function on_ready_state_change( my, cached_response ){
		var my_instance = my.instance;
		var transport = my.transport;
		
		// var empty = "";
		var ready_state = transport.readyState;
		var options = my_instance.options;
		// var screen = options.screen;
		// var show_screen = screen.show;
		var status;

		if( cached_response != undefined ) {
			return  process_on_complete( my, options, cached_response );
		}
		
		// transport.onreadystatechange = null;
		
		if( ready_state != 4 ) return null;
		
		try{
			status = transport.status;
		}catch(e){
			return null;
		}
		
		// CLEARING TIMEOUT
		clear_timeout( my );
		my_instance.is_busy = false;
		
		if( status != 200 ){
			// STATUS = 0 MEANS THAT THE REQUEST WAS ABORTED
			if( status == 0 ){
				if( my.timeoutReached ){
					status = 2;
				}else{
					status = 6;
				}
			}
			
			on_error( my, status );
			
			return null;
		}
		
		// VARIABLES
		var response_text = transport.responseText;
		// var xml;
		var cache = CACHE;
		var final_url = my.final_url;
		// var unload_screen = true;
		// var json;
		
		// COLLECTS ALL THE HEADERS SENT FROM THE SERVER
		my.headers = transport.getAllResponseHeaders();
		
		var response = {
			get_headers:function(){
				var headers = my.headers.split(/[\t\n\r\f\v]{1,}/);
				var i = headers.length;
				var item;
				var match;
				var obj = {};
					
				while(i--){
					if( item = headers[i] ){
						match = /([\w-]+)(:)(.+)/i.exec( item );
						obj[ match[1] ] = match[3].trim();
					}
				}
				
				return obj;
			},
			
			text: response_text
		};
		
		// XML
//		try{
//			xml = transport.responseXML;
//			xml = xml? xml : undefined;
//		}catch(e){}
		
		// ERROR RESPONSE
//		if(/^(Error:)([0-9]{3,})$/i.test( response_text ) && show_screen ){
//			_onError( my, RegExp.$2 );
//			return;
//		}
		
		// IF IF JAVASCRIPT CODE HAS BEEN SENT THEN EXECUTE IT UPON ARRIVAL
		if( options.javascript ){
			try{
				response.javascript = response_text.to_function();
			}catch(e){
				on_error( my, 0, "Javascript error: " + e.message );
				return null;
			}
			
		} else if( options.json ){
			try{
				response.json = ( 'return ('+ response_text +')' ).to_function()();
			}catch(e){
				on_error( my, 3, e.message );
				return null;
			}
			
		}
		
		// IF CACHE RESPONSE IS ENABLED THEN IT STORES THE -PROCESSED- RESPONSE
		if(options.cache_response){
			cache[ final_url ] = response;
			// if( cache[ final_url ] == undefined ){}
		}
		
		process_on_complete( my, options, response );
	};

	function process_on_complete( my, options, response ) {
		var on_success = options.on_success;
		var target = $(options.target);
		
		if(target){
			// IF THE TARGET ELEMENT IS A <SELECT> TAG
			if(my.target_type == 'select'){
				
				var array = response.text.split(',');
				var i = array.length;
				var index = 0;
				var item;
				var create = $.create;
				
				target.empty();
				
    			while( i-- ){
    				item = array[index++].decode_ent().split('|');
    				target.insert( create( 'option', item[0], item[1] ) );
    			}
			}else{
				target.write_html( response.text );
			}
		}
		
		hide_screen( my );
		
		// CALLBACK
		if( typeof( on_success ) == 'function' ){
			try{
				on_success(response);
			}catch(e){
				on_error( my, 4, e.message );
				return;
			}
		}
	}
	
	
	var settings = {};
	var default_settings = {
		url:'',
		
		method: 'GET',
		
		// DATA TO BE SENT ON THE QUERY STRING OR VIA POST
		post: '',
		
		// FILE THAT WILL RECIEVE ALL THE REQUESTS DONE BY AJAX
		proxy: '',
		
		// ID OR REFERENCE TO THE ELEMENT WHERE THE CONTENT WILL BE INSERTED ONCE IT HAS ARRIVED, ALSO THE LOADING SCREEN MIGHT BE SHOWN HERE IF A RENDER IS NOT SPECIFIED UNDER THE SCREEN OPTIONS
		target: '',
		
		relative_url: true,
		
		headers: [],
		
		// tiempo limite en espera del resultado de la peticion
		timeout: 120,
		
		javascript: false,
		json: false,
		xml: false,
		
		// DETERMINES IF WE MUST AVOID URL CACHING
		avoid_url_cache: false,
		
		// DETERMINES WHETHER THE RESPONSE WILL BE CACHEND UPON ARIVAL
		cache_response: false,
		
		// CALLBACKS
		on_error: '',
		on_success: '',
		
		// RETRY
		retry: {
			// INDICATES THE AMOUNT OF TIMES TO RETRY A FAILED REQUEST, A VALUE OF 0 (ZERO) WILL INDICATE NO RETRY
			max: 0,
			
			// INDICATES THE DELAY TIME BETWEEN EACH RETRY
			delay: 1,
			
			// MESSAGE TO SHOW WHEN RETRYING A REQUEST
			message: 'Retrying in...'
		},
		
		// LOADING SCREEN
		screen: {
			width: '',				// ancho de la pantalla
			height: '',				// altura de la pantalla
			//align:'center',		// alineacion del contenido en la pantalla
			
			show: false,				// determina si se muestra o no
			show_mask: false,			// determina si se muestra o no la pantalla modal
			
			icons: {
				loading: 'jshack/icon-loading.gif',
				error: 'jshack/icon-error.gif'
				// timeout:'jshack/icon-timeout.gif',
				// retry:'jshack/icon-retry.gif'
			},
			
			message: 'Loading...',
			
			// ELEMENT WHERE THE LOADING SCREEN WOULD BE PLACED (NOT THE CONTENT RETURNED, ONLY THE SCREEN)
			target: '',
			
			style:{
				background: "",
				message: "",
				icon: "",
				text: ""
			}
		}
	};
	

	function request( url, options, my ){
		
		var ajax = Ajax;
		
		var file_extension = (url?url:'').file_ext();
		
		var my_instance = my.instance;
		
		// IF NO URL IS SPECIFIED THEN RETURNS THE CURRENT INSTANCE
		if( url === undefined ) return my_instance;
		
		// ABORTS THE CURRENT TRANSACTION IN ORDER TO AVOID BUGS
		if ( my_instance.is_busy ) abort( my );
		
		// ENSURES THAT THE "OPTION" ARGUMENT IS NOT UNDEFINED
		options = options || {};
		options.url = url;
		
		// MERGES THE GENERAL SETTINGS INTO THE OPTIONS SPECIFIED BY THE USER
		Obj.merge( options, settings );
		
		// VARIABLES
		var method = options.method.ucase();
		var post_method = 'POST';
		var get_method = 'GET';
		
		var timestamp;
		
		// ADDS THE TIME STAMP IF THE URL AND ITS CONTENT IS NOT MEANT TO BE CACHED
		if( options.avoid_url_cache == true && options.cache_response == false ){
			timestamp = ':ts:=' + $.time();
			options.avoid_url_cache = false;
		}
		
		// CREATES A REFERENCE TO THE "OPTIONS" OBJECT ON THE REQUEST INSTANCE
		my_instance.options = options;
		
		// VARIABLES
		var empty = "";
		
		var target_url = options.relative_url ? Browser.relative_url : Browser.url;
		var proxy = options.proxy;
		var transport = my.transport;
		var post_data = options.send;
		
		// IF A PROXY IS USED THEN SETS THE FILTER STRING
		var proxy_filter = proxy? 'U='+ url.encode_url() +'&M='+(method==post_method?1:0) : empty;
		
		var target_file;
		
		// IF THE URL STARTS WITH THE PROTOCOL THEN BASE URL IS CLEARED
		if( /^http/i.test(url) ) target_url = empty;
		
		// IF WE ARE USING A PROXY, THEN IT SENDS THE FILTER'S PARAMETERS TOGETHER WITH THE USER-SPECIFIED PARAMETERS
		if( proxy_filter ) post_data = proxy_filter + (proxy_filter&&post_data? '&' : '') + post_data;
		
		// TARGET FILE IS SET TO THE (PROXY OR URL) WITH THE TIME STAMP
		target_file = ( proxy || url ) + ( timestamp? '?'+timestamp : empty );
		
		// DETERMINES WHETER TO USE ? OR & BEFORE ADDING THE TIME STAMP AND THE POST DATA
		target_file = target_url + ( (method == get_method) && post_data? target_file + (timestamp?'&':'?') + post_data : target_file );
		
		// VARIABLES
		var cache = CACHE;
		var final_url = target_file + ( post_data && method != get_method? (target_file.index('?')>-1?'&':'?') + post_data : empty );
		var cached_response = cache[final_url];
		var headers = options.headers;
		var i = headers.length;
		var header;
		
		my.final_url = final_url;
		
		// CALLS THE "ON READY STATE CHANGE" METHOD DIRECTLY BECAUSE THE CONTENT IS ALREADY CACHED
		if( options.cache_response && cached_response != undefined ){
			on_ready_state_change( my, cached_response );
			return my_instance;
		}
		
		// BUILDS AND SHOWS THE LOADING SCREEN
		show_screen( my );
		
		// STARTS TIMEOUT CONTROL
		start_timer( my );
		my.timeoutReached = false;
		my_instance.is_busy = true;
		
		transport.open( method, target_file, true );
		
		transport.onreadystatechange = function(){
			on_ready_state_change( my );
		};
		
		// SETS ALL HEADERS SENT TO THE SERVER
		while( i-- ){
			header = headers[i].split(':');
			transport.setRequestHeader( header[0], header[1] );
		}
		
		if( method == post_method ){
			transport.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
		}
		
		/*
			r.setRequestHeader('Content-length', pd.length);
			r.setRequestHeader('Accept-Charset','UTF-8'); 
			r.setRequestHeader('Connection', 'close');
		*/
		
		transport.send( post_data );
		
		return my_instance;
	};
  	
	var Ajax = w.Ajax = function(){
		var t = this;
		if( this == window ) return;
		
		var my = {
			// CREATES A UNIQUE INSTANCE OF THE HTTP REQUEST
			transport: get_transport(),
			
			instance: t,
			retries: 0
		};
		
		t.id = ++count;
		
		// CONTAINS THE CURRENT STATUS OF THE HTTP REQUEST INSTANCE [free, busy]
		t.is_busy = false;

		t.abort = function(){
			abort(my);
		};
		
		t.request = function(url, options){
			return request(url, options, my );
		};
		
		return t;
	};
	
	Ajax.count = function(){
		return count;
	};
	
	Ajax.setup = function( options ){
		Obj.merge( settings, options || default_settings );
	};
	
	Ajax.reset = function(){
		Obj.extend( settings, default_settings );
	};
	
  	Ajax.setup();
  	
})(window);