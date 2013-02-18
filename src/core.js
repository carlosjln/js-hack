
window.jsHack={
	version:'1.2.5'
};

(function(w){
	
	/**
	 * This method perform execution test upon the target function and returns a 6 elements
	 *     array where the first 5 are different tests, and the 6th is the calculated average.
	 * @param {function(array)} callback The function to be executed once the test has finished.
	 * @param {number=} opt_max_executions Indicates how many times the function will be tested.
	 */
	Function.prototype.bench_mark = function(callback, opt_max_executions){
		
		var subject = this;
		var result = [];
		var count = 0;
		var test = opt_max_executions == null ? test_for_one_second : test_for_n_runs;
		
		setTimeout( test, 0 );
		
		/**
		 * Measures how many executions can happen in one second
		 */
		function test_for_one_second(){
			var test_fn = subject;
			
			var time_diff = 0;
			var time_limit = 1000;
			var executions_count = 0;
			
			var start = new Date().getTime();
			
			while( time_diff < time_limit ){
				test_fn();
				time_diff = new Date().getTime() - start;
				executions_count++;
			}
			
			result[ result.length ] = executions_count;
			
			if( count++ < 3 )
				setTimeout( arguments.callee, 0 );
			else{
				result[ result.length ] = 'AV: '+ ('return ('+ result.join('+') +')').to_function()()/4;
				
				callback(result);
			}
		}
		
		/**
		 * Measures how much time it takes to execute N amount of times
		 */
		function test_for_n_runs(){
			var test_fn = subject;
			
			var samples = 4;
			var max_executions;
			var start;
					
			while(samples--){
				start = new Date().getTime();
				max_executions = opt_max_executions;
						
				while( max_executions-- ){
					test_fn();
				}
						
				result[ result.length ] = new Date().getTime() - start;
			}
				
			result[ result.length ] = 'AV: '+ ('return ('+ result.join('+') +')').to_function()()/4;
					
			callback(result);
		}
	};
	

	/*
		OBJECT NAMESPACE
	*/
	var obj = w.Obj = {};
	
	/*
		toArray: Transforma una coleccion enumerable en un arreglo
	*/
	obj.toArray = function( object ){
		// verifica que sea un objeto tipo arreglo
		var length = object.length;
		var new_array = [];
		
		if( length === undefined ) return new_array;
		
		// CLONES HTMLColection
		if( ( !Browser.is_IE && object.item && object.namedItem ) || object.callee ){
			return Array.prototype.slice.call( object );
		}
		
		while( length-- ){
			new_array[length] = object[length];
		}
		
		return new_array;
	};
	
	
	/*
		Copia el valor/referencia de las propiedades del objeto/elemento/arreglo "s" hacia en "d"
	*/
	obj.extend = function( destiny, source ){
		for( var property in source ){
			if( source.hasOwnProperty(property) ){
				 destiny[property] = source[property];
			}
		}
		
		return  destiny;
	};
	
	
	/*
		Copia el valor/referencia de las propiedades del objeto/elemento/arreglo "s", que NO existen en "d"
	*/
	obj.merge = function( destiny, source ){
		var is_array = Type.array;
		var is_object = Type.obj;
		var merge = obj.merge;
		
		destiny = destiny ? destiny : {};
		source = source ? source : {};
		
		for( var property in source ){
			var type = Type( source[property] );
			
			switch( type ){
				case 'object':
					if( destiny[property] === undefined ){
						if( is_array( source[property] ) ){
							 destiny[property] = [];
						}else if( is_object( source[property] ) ){
							 destiny[property] = {};
						}
					}
					
					merge( destiny[property], source[property] );
				break;
				
				default:
					if( destiny[property] === undefined ) destiny[property] = source[property];
			}
		}
		return  destiny ;
	};
	
	
	obj.clone = function( object ){
		if(object instanceof Array) return object.slice(0);
		
	    function funcion(){}
	    funcion.prototype = object;
	    
	    return new funcion();
	};

	
	/*
		Type: Retorna el tipo de objeto o elemento
	*/
	w.Type = function( object, opt_compare ){
	
		var type = typeof( object );
		
		if( type == 'object' ){
			if( object === null ){
				type = 'null';
				
			}else if( 'splice' in object && 'join' in object ){
				type='array';
			}
		}
		
		return opt_compare ? type == opt_compare : type;
	};
	
	/*
		TYPEOF
		
		iN: is Number ?
		iU: is Undefined or Null ?
		iB: is Boolean ?
	*/
	Type.array = function( object ){
		return (object instanceof Array);
	};
	
	Type.func = function( object ){
		return typeof( object ) == 'function' && typeof( object.call ) == 'function';
	};
	
	Type.num = Type.number = function( object ){
		return typeof( object ) == 'number';
	};
	
	Type.und = Type.undefined = function( object ){
		return typeof( object ) == 'undefined';
	};
	
	Type.str = Type.string = function( object ){
		return typeof( object ) == 'string';
	};
	
	Type.obj = Type.object = function( object ){
		if( object === null || typeof( object ) == 'undefined' ) return false;
		return ( typeof( object ) == 'object' ) && typeof( object.splice ) == 'undefined' && typeof( object.join ) == 'undefined';
	};
	
	Type.bool = function( object ){
		return object === true || object === false;
	};
	
	Type.regex = function( object ) {
		return object instanceof RegExp;
	};
	
	Type.element = function( object ) {
		if( object === null || typeof( object ) == 'undefined' ) return false;
		return object.nodeName != null;
	};
	
	/* PARSERS NAMESPACE */
	var parse = w.Parse = {};
	
	parse.int = function(a,b){
		return parseInt(a,b?b:10);
	};
	
	parse.string = function(s){
		return s?s.replace(/([\W\d])/ig,' ').replace(/( {2,})/g,' '):'';
	};
	
	parse.currency = function( expression, a ){
		var numbers = expression + '';
		var array = numbers.split('.');
		
		var digits = array[0];
		var decimals = array.length ? '.' + array[1] : '';
		
		var pattern = /(\d+)(\d{3})/;
		
		while( pattern.test(digits) ){
			digits = digits.replace( pattern, '$1' + ',' + '$2' );
		}
		
		return ( a ? a + ' ' : '' ) + digits + decimals;
	};
	/*
		parse.currency(1000)		// "1,000"
		parse.currency(1000,'RD$')	// "RD$ 1,000"
	*/
	
	parse.url = function( url ){
		var anchor = document.createElement("a");
		anchor.href = url;
		
		var search = {};
		anchor.search.replace(/([^?=&]+)(=([^&]*))?/g,
		 	function( $0, $1, $2, $3 ){
		 	 	search[ $1 ] = $3;
		 	 	return $0;
		 	}
		);
		
		var json = {
			href: anchor.href,
			
			protocol: anchor.protocol,
			
			host: anchor.host,
			hostname: anchor.hostname,
			
			port: anchor.port,
			
			path: anchor.pathname,
 	 	 	
 	 	 	query: search,
			bookmark: anchor.hash
		};
		
		return json;
	};
	
})(window);