

/*
	investigar el funcinoamiento adecuado para los diferentes navegadores
	en los eventos: keypress, keydown y keyup
*/
(function(w){
	
	var doc = w.document;
	var handlers = [];
	var event_hash = [];
	
	var $ = w.$;
	
	function getUniqueKey( element, evt, handler ){
		var GUID = $.GUID;
		return '{'+ GUID(element) +':'+ evt +':'+ GUID(handler) +'}';
	}
	
	// ALIAS
	function alias( event_name ){
		if( event_name == 'mouseenter' ){
			event_name = 'mouseover';
		}
		
		if( event_name == 'mouseleave' ){
			event_name = 'mouseout';
		}
		
		if( event_name == 'mousewheel' && Browser.gecko){
			event_name = 'DOMMouseScroll';
		}
		
		return event_name;
	}
	
	// PARSE EVENTS
	function parse( e ){
		
		var target = ( e.target || e.srcElement ) || doc;
		var related_target;
		
		var _which = e.which;
		var _charcode = e.charCode;
		var _keycode = e.keyCode;
		var _type = e.type;

		var key_array = {
			8:'BACKSPACE',
			9:'TAB',
			10:'ENTER',
			13:'ENTER',
			
			20:'CAPSLOCK',
			
			27:'ESC',
			33:'PAGEUP',
			34:'PAGEDOWN',
			35:'END',
			36:'HOME',
			
			37:'LEFT',
			38:'UP',
			39:'RIGHT',
			40:'DOWN',
			
			45:'INSERT',
			46:'DELETE'
		};
		
		var capslock = false;
		
		var key_code = _which? _which : _keycode;
		var key_value = '';
		
		var meta_key;
		
		if( e.altKey ){
			meta_key = 'ALT';
		}else if( e.ctrlKey || e.metaKey ){
			meta_key = 'CTRL';
		}else if( e.shiftKey || _charcode == 16){
			meta_key = 'SHIFT';
		}else if( key_code == 20 ){
			meta_key = 'CAPSLOCK';
		}
		
		
		// IE
		if ( _which === undefined && _charcode === undefined ){
			key_code = _keycode;
			
		// OTHER BROWSERS
		}else{
			
			// IF _wich ARE DIFFERENT FROM ZERO, THEN IT IS A LETTER, ELSE IS AN SPECIAL CHARACTER
			key_code = _which != 0 && _charcode != 0 ? _which : _keycode;
		}
		
		key_value = key_code > 31? String.fromCharCode( key_code ) : '';
		
		// IF SHIFT KEY IS NOT IN ACTION AND THE KEY CODE RETURNS 'A-Z'
		// OR SHIFT KEY IS IN ACTION BUT THE KEY CODE RETURNS 'a-z'.		
		if( key_code > 96 && key_code < 123 && meta_key == 'SHIFT' || key_code > 64 && key_code < 91 && meta_key != 'SHIFT' ){
			capslock = true;
		}
		
		// A BIT OF CORRECTION TO THE BUGS OF KEYDOWN AND KEYUP EVENTS
		if( _type == 'keydown' || _type == 'keyup'){
			
			if( key_value == 'CAPSLOCK'){
				capslock = !capslock;
			}
			
			if( key_code > 64 && key_code < 91 && meta_key != 'SHIFT' ){
				key_code = key_code+32;
				key_value = String.fromCharCode( key_code );
			}
		}
		
		// ACTION KEYS
		if( key_array[key_code] ) key_value = key_array[key_code];
		
		
		// ALIAS
		if( _type == 'DOMMouseScroll' ){
			_type = 'mousewheel';
		}
		
		// WHEEL SCROLL DIRECTION CORRECTION
		var delta = 0;
		
		if( _type == 'mousewheel' ){
			delta = e.detail ? e.detail * -1 : e.wheelDelta / 40;;
			delta = delta>0?1:-1;
		}
		
		// IF TARGET ELEMENT IS A TEXT NODE THEN IT ASUME ITS PARENT NODE
		target = target.nodeType === 3 ? target.parentNode : target;

		var obj = {
			target: target,
			
			fromElement: (e.fromElement || e.originalTarget),
			
			toElement: e.toElement||target,		// RECEPTOR ELEMENT (onDrag)

			type: _type,
			
			pageX: e.pageX,
			pageY: e.pageY,
			
			keyCode: key_code,
			keyValue: key_value,
			metaKey: meta_key,
			
			delta: delta,
			
			capslock: capslock,
			
			button: e.button,
			
			// CANCEL EVENT
			cancel: function(){
				var F = false;
				
				if( e == undefined ) return F;
				
				if( e.preventDefault ){
			        e.cancelBubble = true;
			        e.stopPropagation();
			        e.preventDefault();
			        
			    }else if( doc.all ) {
			        e.cancelBubble = true;
			        e.returnValue = F;
			    }
			    
			    return F;
			},
			
			// PREVENTS THE DEFAULT ACTION BEHAVIOR ON THE ELMENT
			preventDefault: function(){
				
				if(e.preventDefault){
			        e.preventDefault();
			        
			    }else if(doc.all) {
			        e.returnValue = false;
			    }
			}
		};
		
		// CALCULATES pageX AND pageY
		if ( e.pageX == null && e.clientX != null){
			var r = document;
			var d = r.documentElement;
			var b = r.body;
			
			obj.pageX = e.clientX + (d && d.scrollLeft || b && b.scrollLeft || 0) - (d && d.clientLeft || b && b.clientLeft || 0);
			obj.pageY = e.clientY + (d && d.scrollTop  || b && b.scrollTop  || 0) - (d && d.clientTop  || b && b.clientTop  || 0);
		}
		
		// MAP .relatedTarget TO EITHER .toElement OR .fromElement
		if( e.relatedTarget == null){
			if( _type == 'mouseover' ) obj.relatedTarget = e.fromElement;
			
			if( _type == 'mouseout') obj.relatedTarget = e.toElement;
		}

		
		return obj;
	}
	
	
	// ACTIONS => ADD, REMOVE, TRIGGER
	function Event( action, elements, events, handler, args ){
		events = events.trim().split(' ');
		
		args = args instanceof Array? args : [args];
		
		
		var elements_array = elements instanceof Array? elements : [elements];
		var i = elements_array.length;
		var iIndex = 0;
		var element;
		
		var jLength = events.length;
		var jIndex;
		var j;
		
		var _event;
		var key;
		var wrapper;
		
		var action_fn = function(){};
		
		if( action ==  "add"){
			action_fn = function(element, _event, handler){
				if( element.addEventListener ){
					element.addEventListener( _event, handler, false );
					
				}else if(element.attachEvent){
					element.attachEvent( 'on'+_event, handler );
				}
			};
			
		}else if( action == "remove" ){
			action_fn = function(element, _event, handler, key){
				// console.log( element, " ", _event, " ", handler, " ", key );
				
				if( element.removeEventListener ){
					element.removeEventListener( _event, handler, false );
					
				}else if(element.detachEvent){
					element.detachEvent( 'on'+_event, handler );
				}
				
				delete handlers[key];
			};
			
		}else if( action == "trigger" ){
			
			action_fn = function(element, _event){
				// IE
			    if( doc.createEventObject ){
					var evt = doc.createEventObject();
			    	element.fireEvent( 'on'+_event, evt);
			    
				// OTHERS
			    }else{
					var evt = document.createEvent("HTMLEvents");
					evt.initEvent(_event, true, true ); // event type,bubbling,cancelable
					element.dispatchEvent(evt);
			    }
			}
		}
		
		while( i-- ){
			element = elements_array[ iIndex++ ];
			
			// RESET ITERATOR
			j = jLength;
			jIndex = 0;
			
			while( j-- ){
				
				_event = alias( events[ jIndex++ ] );
				
				if( action == "trigger" ){
					action_fn( element, _event);
					continue;
				}
				
				// GETS THE UNIQUE COMBINED KEY FROM ELEMENT:EVENT:HANDLER
				key = getUniqueKey( element, _event, handler );
				
				wrapper = handlers[ key ];
				
				if( wrapper == undefined && action ==  "add" ){
					wrapper = handlers[ key ] = function(e){
						e = parse( e || window.event );
						
						// return handler.apply( e.target, [e].concat(args) );
						return handler.apply( element, [e].concat(args) );
					};
					
					handlers[ key ] = wrapper;
				}
				
				if( wrapper ){
					action_fn( element, _event, wrapper, key );
				}
			}
			
		}
		
		return elements;
	};
	
	
	//	PLUG EVENT HANDLERS
	$.plug( 'handle','all',function( events, handler, args ){
		Event( 'add', this, events, handler, args );
		return this;
	});
	
	$.plug( 'unhandle','all',function( events, handler ){
		Event( 'remove', this, events, handler );
		return this;
	});

	$.plug( 'trigger','all',function( events ){
		Event( 'trigger', this, events );
		return this;
	});
	
})(window);