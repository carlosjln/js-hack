
(function(w){
	
	var extend = Obj.extend;
	
	extend(Function.prototype,{
		
		/*
			Permite llamar a una funcion y especificar a que objeto va a hacer referencia el contexto "this"
			dentro de la funcion
		*/
		bind:function(context, args){
			var t = this;
			
			context = Type.obj(context)?context:t;
			args = Type.array(args)?args:[args];
			
			return function(){
				return t.apply( context, args.concat( Obj.toArray(arguments) ));
			};
		},
		
		delay:function(time, args, context){
			var t = this;
			
			if( Type.obj(args) ){
				context = args;
				args = [];
			}
			
			context = Type.obj(context)?context:null;
			args = Type.array(args)?args:[args];
			
			return setTimeout(
				function(){
					return t.apply(context, args);
				}, time*1000
			);
		},
		
		free:function(args, context){
			return this.delay(0.01, args, context );
		},
		
		repeat:function(interval, args, context){
			var t = this;
			
			interval = interval*1000;
			
			if( Type.obj(args) ){
				context = args;
				args = [];
			}
			
			args = Type.array(args)?args:[args];
			context = Type.obj(context)?context:null;
			
			var stop = false;
			
			t.stop = function(){
				stop = true;
			};
			
			function curry(){
				t.apply( context, args);
				if( stop == false ) setTimeout( curry, interval );
			};
			
			setTimeout( curry, interval );
			
			return t;
		}
		
	});
	
	
	/* ARRAY */
	extend(Array.prototype,{
		
		/*
			f: function(currentElement, position, array, arrayLenght )
			r: replace // reemplaza el valor del elemento actual por el valor retornado por dicha funcion
		*/
		each:function(f,r){
			var t=this,i=t.length,L=i,n;
			
			if(r){
				while(i--){
					n=L-(i+1);
					t[n]=f(t[n],n,t,L);
				}
			}else{
				while(i--){
					n=L-(i+1);
					f(t[n],n,t,L);
				}
			}
			
		    return t;
		},
		
		/*
			f: filter (can be an array or a function)
			c: context
		*/
		filter:function( filter, context ){
			/*
				t : this (self array)
				tl: this.length
				i : decreasing counter
				
				ra: return array
				e : elemento actual
			*/
			var t = this;
			var length = t.length;
			var index = 0;
			var result=[];
			var item;
			
			/* si el filtro es una funcion */
			if( Type.func(filter) ){
				while( length-- ){
					item = t[ index++ ];
					if( filter.call(context,item) ) result[result.length] = item;
				}
			
			/* si el filtro es un arreglo */
			}else{
				
				/*
					fl: filter length (array)
					j : decreasing counter for the filter array
					
					n : posision invertida del cursor
					y : include element?
					
				*/
				
				filter = filter instanceof Array ? filter : [filter];
				
				var filter_length = filter.length,exclude_array_length,n,include=1;
				while( length-- ){
					item = t[ index++ ];
					
					include = true;		// variable para determinar si se incluye o no el elemento actual
					exclude_array_length = filter_length;	// retoma la longitud del arreglo a excluir
					
					while( exclude_array_length-- ){
						if( filter[exclude_array_length] === item ) include = 0;
						
						if(!include)break;
					}
					
					if(include) result[result.length] = item;
				}
			}
			
			return result;
		},
		
		compact: function(){
			return this.filter(['',undefined,null])
		},
		
		to_string: function(spliter){
			return this.join( spliter?spliter:'' );
		}
	});
	
	
	/* STRING */
	extend(String.prototype,{
		/*
			indexOf: determina la posicion de s
		*/
		index:function(s){
			return this.indexOf(s);
		},
		
		/*
			includes: determina si por lo menos uno de los elementos separados por coma existe en el contexto buscado
			ej: "Hola mundo".inc('mundo,waka')
		*/
		inc:function(s){
			var S=String(s),a=S.split(','),i=-1;
			while(a[++i])
				if(this.indexOf(a[i])>-1){
					return true;
				}
			
			return false;
		},
		
		/* upper case */
		ucase: function(){
			return this.toUpperCase();
		},
		
		/* lower case */
		lcase: function(){
			return this.toLowerCase();
		},
		
		/* reverse: reversa el orden del string
			idea: si la longitud del texto < 64, el metodo tradicional es más rapido
		*/
		reverse: function(){
			return this.split('').reverse().join('')
		},
		
		trim:function(d){
			var	s=this.replace(/^\s\s*/, '');
			
			if(d)s=s.replace(/\s+/g,' ');
			
			var w=/\s/,i=s.length;
			
			while (w.test(s.charAt(--i)));
			
			return s.slice(0,i+1);
		},
		
		/* retorna la extencion del nombre del archivo */
		file_ext:function(){
			var t=this.reverse(),b=t.split( /\\/g )[0],c=b.indexOf(".");
			
			if(c>=0){
			    return b.substring(0,c).reverse();
			}
			
			return false
		},
		
		/*
			ENCODE HTML ENTITIES (BOOLEAN)
			THE PARAMETER DICTATES IF ENCODING THE HTML RESERVED CHARS " & < > '
		*/
		encode_ent:function(r){
			return this.replace(/./g,
			    function(s){
			        var i=s.charCodeAt(0);
			        if( ((r)?(i!=34&&i!=39&&i!=38&&i!=60&&i!=62):1)&&((i>31&&i<96)||(i>96&&i<127)) ){
			            return s;
			        }else{
			            return '&#'+i+';';
			        }
			    }
			);
		},
		decode_ent:function(){
			return this.replace(/&#(\d)+;/g,
			    function(s,d,f){
			        var s=String.fromCharCode(s.replace(/[#&;]/g,''));
			        return s;
			    }
			);
		},
		
		
		/*  */
		encode_url:function(){
			return encodeURIComponent(this)
		},
		
		decode_url: function(){
			return decodeURIComponent(this)
		},
		
		
		/*
			REMOVES HTML TAGS FROM THE STRING
			OR REPLACES THE HTML TAGS WITH THE STRING IN PARAMETER R
		*/
		clear:function( exp, replace ){
			var s=this;
			
			if( replace === undefined ) replace = '';
			
			if( exp == 'html' ){
				s=s.replace(/&(lt|gt|#60|#62);/g,function(strMatch,p1){return (p1=='lt'||p1=='#60')?'<':'>';});
				s=s.replace(/<\/?[^>]+(>|$)/g, replace );
				
			}else if( exp.test ){
				s=s.replace( exp, replace);
			}
			
			s=s.replace(/ {2,}/g,' ');
			return s;
		},
		
		is_html:function(){
			return /^<(\w)+(\b[^>]*)\/?>(.*?)(<\w+\/?>)?$/i.test( this );
		},
		
		is_email:function(){
			var regex = /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
			return regex.test(this);
		},
		
		/*
			iP: isPhone?
		*/
		is_phone:function(){
			var regex=/^((\()?([0-9]{3})(\))?)(-| )?([0-9]{3})(-| )?([0-9]{4})$/;
			
			if( arguments[0]) return regex;
			
			return regex.test(this);
		},
		
		
		/*
			gP: getPhone
			f: format [1,2]
			default = 8298638524
			1: (999)-999-9999
			2: 999.999.9999
		*/
		get_phone:function(f){
			var t = this;
			var regex = t.is_phone(1);
			var r = false;
			
			if( t.is_phone()){
				var m = regex.exec();
				
				switch(f){
					case 1:r='('+m[3]+')'+'-'+m[6]+'-'+m[8]; break;
					case 2:r=m[3]+'.'+m[6]+'.'+m[8]; break;
					
					default:r=m[3]+''+m[6]+''+m[8];
				}
			}
			
			return r;
		},
		
		padd_left: function(length, str){
			return new Array(length+1).join(str)+this
		},
		padd_right: function(length, str){
			return this+new Array(length+1).join(str)
		},
		
		to_function: function(){
			return new Function('A','B','C','D','E', this);
		},
		
		to_json: function(){
			return ( 'return ('+ this +')' ).to_function()();
		},
		
		feed:function( source, action ){
			var template = this;
			
			var is_array = source instanceof Array;
			var array = is_array? source : [source];
			
			var body = [];
			
			var i = array.length;
			var element;
			
			var regexp = /{{([a-z\-_]+[0-9]*)}}/ig;
			
			var header = array[0];
			
			if( action == 'json' || Type.obj(source) ){
				
				while(i--){
					element = array[ i ];
					
					body[ i ] = template.replace( regexp,
						function(holder, name, index, string){
							// return (element[name] + "") || '{{}}';
							return element[name] || '{{}}';
						}
					);
				}
				
			}else{
				
				if(i){
					i--;
					while(i--){
						element = array[ i+1 ];
						
						body[ i ] = template.replace( regexp,
							function(holder, name, index, string){
								// return (element[ header[name] ] + "") || '';
								return (element[ header[name] ] + "") || '';
							}
						);
					}
				}
			}
			
			// REMOVES OPTIONAL BRACKETS AND UN REPLACED HOLDERS
			var clean_a = /\[\[(.+){{}}(.+)\]\]/ig;
			var clean_b = /{{}}/ig;
			var clean_c = /\[\[(.+)\]\]/ig;
			
			i = body.length;
			while(i--){
				body[ i ] = body[ i ].replace( clean_a, "" ).replace( clean_b, "" ).replace( clean_c, "$1" );
			}
			
			return is_array? body : body[0];
		}
	});

})(window);