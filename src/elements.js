
(function ( w ) {

	/*
	$.plug methods array
	*/
	var methods_array = [];
	var methods_elements = [];

	/*
	BUSQUEDA DE ELEMENTOS
	*/
	/*
	SELECTOR SIMPLE ( tag, tag#id, #id )
	$('#bbb')
	$('input#bbb')
	$('input.ff')
	$('input[className=submit]')
	$('div > a.active')
			
	m: match
	t: tag name
	o: operador # . [ >
	v: value
			
	r: result
	_r: sub result
	p: property
			
	st: string type
	*/

	function find( parent, id, depth ) {

		var html = parent.innerHTML;
		if ( !html ) return null;

		html = html.lcase();

		var regexp = "id=(\"?|'?)" + id.lcase() + "(\"?|'?)";

		var element;
		var nodes = parent.childNodes;
		var lenght = nodes.length;
		var i = lenght;
		var result = [];

		if ( RegExp( regexp, 'i' ).exec( html ) == null ) return null;

		// direct child nodes scan
		while ( i-- ) {
			element = nodes[lenght - ( i + 1 )];

			if ( element.id == id ) result[result.length] = element;
		}

		// sub-nodes scan
		if ( depth == 0 ) {
			var i = lenght;

			while ( i-- ) {
				element = find( nodes[lenght - ( i + 1 )], id, depth );

				if ( element ) result = result.concat( element );
			}
		}

		return result.length ? result : null;
	}

	function set_methods( elements ) {
		var me = methods_elements;
		var me_len = me.length;

		var ma = methods_array;
		var ma_len = ma.length;
		
		// if the selector is an array veryfies it has the last method
		if ( Type.array( elements ) ) {
			if ( ma_len && elements.hasOwnProperty( ma[ma_len - 1][0] ) ) {
				return elements;
			}
		}

		// arreglo con los resultados de la busqueda
		var array = elements instanceof Array ? elements : ( elements ? [elements] : [] )
		var i = array.length;

		var j = me_len;

		var element;
		var method;

		while ( i-- ) {
			element = array[i];

			j = me_len;
			if ( !j ) continue;
			while ( j-- ) {
				method = me[j];
				element[method[0]] = method[1];
			}
		}

		i = ma_len;
		while ( i-- ) {
			method = ma[i];
			array[method[0]] = method[1];
		}

		return array;
	}

	/* SELECTOR */
	var selector = function ( selector, parent ) {

		if ( !selector ) return null;

		var doc = w.document;
		var result = selector;

		parent = ( parent === undefined ) ? doc : parent;

		if ( Type.str( selector ) ) {

			var _result;
			var matches;

			var _find = find;

			// #element
			if ( matches = /^#([\w-]+)$/i.exec( selector ) ) {

				if ( parent === doc ) {
					result = parent.getElementById( matches[1] );
				} else {
					result = find( parent, matches[1], 0 );
				}

				// complex selector
			} else {
				result = parent instanceof Array ? parent : [parent];

				var array = selector.split( /((?: *> *)|(?: +))/ );

				var slice;
				var temp;

				var tag;
				var operator;
				var property;
				var value;

				var search_depth = 0;

				var length = array.length;
				var i = length;
				var j;
				var len;

				var to_array = Obj.toArray;

				while ( i-- ) {
					slice = array[length - ( i + 1 )].trim();

					if ( slice == '>' || slice == '' ) {
						if ( slice == '>' ) {
							search_depth = 1;
						} else {
							search_depth = 0;
						}
						continue;
					}

					matches = /^([a-zA-Z]*)?([[#.: ])?([\w- ]+)?(=?)?([\w- ]+)?(?:\])?$/i.exec( slice );

					/*
					se termina la ejecucion si:
					- si el contexto actual no es compatible con la expresion
					- si r=null debido a que su elemento padre no existe
					*/
					if ( matches == null || result.length == 0 ) break;

					tag = matches[1];
					if ( tag ) {
						tag = tag.lcase();
					} else {
						tag = "*";
					}

					operator = matches[2];
					value = matches[3];

					// tag search
					if ( tag ) {

						// reset sub result
						_result = [];
						len = result.length;
						j = len;

						// scans all nodes recursively
						if ( search_depth == 0 ) {
							while ( j-- ) {
								temp = result[len - ( j + 1 )].getElementsByTagName( tag );
								_result = _result.concat( to_array( temp ) );
							}

							// scans only the direct childNode
						} else {
							var _i;
							var _len;
							var _res;
							var _el;

							while ( j-- ) {
								temp = result[len - ( j + 1 )].childNodes;

								_res = [];
								_len = temp.length;
								_i = _len;
								while ( _i-- ) {
									_el = temp[_len - ( _i + 1 )];

									if ( _el.nodeName.lcase() == tag ) {
										_res[_res.length] = _el;
									}
								}

								_result = _result.concat( _res );
							}
						}

						result = _result;
					}

					// dependiendo del operador determina que propiedad se va a utilizar para la comparacion
					//if(operator=='#') property = 'id';
					property = operator == '#' ? 'id' : undefined;

					if ( operator == ':' ) property = 'name';
					
					if ( operator == '.' ) property = 'className';
					
					if ( operator == '[' ) property = value;
					
					if ( operator == '[' ) value = matches[5];


					// reset sub result
					_result = [];
					len = result.length;
					j = len;


					// para los casos en los cuales se especifica etiqueta y propiedad
					// ej: div#msg - div.class1 class2 - div[height=100]
					if ( tag && property ) {

						// rxp: expresion regular para machear el "nombre completo" de una clase
						var property_value;
						var class_regexp = RegExp( "(^| )(?:" + value + ")( |$)", "i" );

						while ( j-- ) {
							temp = result[len - ( j + 1 )];
							property_value = temp[property] || temp.getAttribute( property );

							// si se utiliza el operador . entonces se verifica si alguno de los parametros en v existe en la propiedad className
							if ( ( property_value == value ) || ( operator == '.' && class_regexp.test( property_value ) ) ) {
								_result[_result.length] = temp;
							}
						}

						temp = null;

						result = _result;


						// ej: div > #msgbox
						// de lo contrario, si es el operador # se retorna un elemento en especifico
					} else if ( value ) {

						while ( j-- ) {
							temp = _find( result[j], value, search_depth );
							if ( temp ) _result = _result.concat( temp );
						}

						result = _result;

					}
				}
			}

			//console.log( 'slice:\t\t', slice );
			//console.log( 'matches:\t', matches );
			//console.log( 'tag:\t\t', tag );

			//console.log( 'operator:\t', operator );
			//console.log( 'property:\t', property );
			//console.log( 'value:\t\t', value );
		}

		if ( result == null || result.length == 0 ) {
			return null;
		}

		set_methods( result );
		return result;
	};

	// selector wrapper
	var $ = ( function ( element, parent ) {
		return selector( element, parent );
	} );


	function createDocumentFragment( content, callback ) {
		var document_fragment = document.createDocumentFragment();
		var content_holder;
		var index;
		var nodes;

		if ( content ) {
			content_holder = document.createElement( 'div' );
			content_holder.innerHTML = content;

			/*
			si se especifica una funcion callback entonces se utiliza este metodo para agregar los elementos
			sin bloquear el browser
			*/
			if ( callback ) {
				(function () {
					if ( content_holder.firstChild ) {
						document_fragment.appendChild( content_holder.firstChild );
						setTimeout( arguments.callee, 0 );
					} else {
						callback( document_fragment );
					}
				} )();

				/* si NO hay callback entonces se hace una iteracion y se retorna directamente */
			} else {
				nodes = content_holder.childNodes;
				index = nodes.length;

				while ( index-- ) {
					document_fragment.insertBefore( nodes[index], document_fragment.firstChild );
				}
			}

		}

		return document_fragment;
	};

	/* DOCUMENT.CREATE_ELEMENT*/
	$.create = function ( element, arg1, arg2, arg3 ) {
		var dom;
		var doc = document;
		
		if ( element.is_html() ) {
			arg2 = arg1;
			arg1 = element;
			element = 'doc';
		}

		if ( element == 'document' || element == 'doc' ) {
			dom = createDocumentFragment( arg1, arg2 );
			
		} else if ( element == 'textnode' ) {
			dom = doc.createTextNode( arg1 );

		} else {
			dom = doc.createElement( element );
		}

		if ( element == 'option' ) {
			// sets the value
			dom.setAttribute( 'value', String( arg2 || arg1 ) );
			
			// sets the caption
			dom.insertBefore( document.createTextNode( arg1 ), null );
			
			// sets if default selected
			if ( arg3 ) dom.setAttribute( 'selected', 'selected' );
		}

		if ( 'script style'.indexOf( element ) > -1 ) {

			setTimeout( function () {
				doc.getElementsByTagName( 'head' )[0].insertBefore( dom, null );

				if ( element == 'style' ) {
					if ( dom.styleSheet ) {
						// IE
						dom.styleSheet.cssText = arg1;
					} else {
						// the world
						dom.insertBefore( doc.createTextNode( arg1 ), null );
					}

				} else {
					if ( Browser.is_IE ) {
						dom.text = content;
					} else {
						dom.insertBefore( doc.createTextNode( arg1 || ' ' ), null );
					}
				}

				dom.setAttribute( "type", "text/" + ( element == 'style' ? 'css' : 'javascript' ) );

			}, 10 );
		}

		return $( dom );
	};


	$.plug = ( function ( name, type, method ) {
		// si el segundo argumento es una funcion entonces se toma esa funcion en la variable type
		if ( type instanceof Function ) {
			method = type;
			type = "element";
		}

		var array;
		var obj = [name, method];

		/* ELEMENT METHOD */
		if ( "all element".indexOf( type ) > -1 ) {
			array = methods_elements;
			array[array.length] = obj;
		}

		/* ARRAY METHOD */
		if ( "all array".indexOf( type ) > -1 ) {
			array = methods_array;
			array[array.length] = obj;
		}
	} );


	// GENERATE UNIQUE IDENTIFIER
	var guid = 0;
	function GUID( e ) {
		if ( e == null ) return null;

		var x = '__::UID::__';
		return e[x] = e[x] || ++guid; ;
	}
	$.GUID = GUID;

	/*
	PLUGINGS INTERNOS
	*/

	/*
	Lee o modifica una propiedad
		
	lee : $('#msg').attr('height');
	fija: $('#msg').attr('height',150);
	*/
	$.plug( 'attr', 'all', function ( name, value ) {
		var t = this;
		var isArray = t instanceof Array;

		if ( value !== undefined ) {
			var array = isArray ? t : [t];
			var i = array.length
			var element;

			while ( i-- ) {
				element = array[i];

				if ( element[name] ) {
					element[name] = value;
				} else {
					element.setAttribute( name, value );
				}
			}

			return t;
		}

		return isArray ? null : t[name] || t.getAttribute( name );
	} );

	/* clear inner content */
	$.plug( 'empty', 'all', function () {
		var t = this, a = t.nodeName ? [t] : t, j = a.length, e, n, i;

		if ( Browser.is_IE ) {
			while ( j-- ) a[j].innerHTML = '';

		} else {
			while ( j-- ) {
				e = a[j];
				n = e.childNodes;
				i = n.length;

				while ( i-- ) {
					e.removeChild( n[0] );
				}
			}
		}

		return t;
	} );

	/* unload element */
	$.plug( 'unload', 'all', function () {
		var t = this;

		if ( t == null ) return null;

		var elements = t.nodeName ? [t] : t;
		var j = elements.length;
		var element;
		var parent;

		while ( j-- ) {
			element = elements[j];

			parent = element.parentNode;
			if ( parent ) parent.removeChild( element );
		}

		return t;
	} );

	/*
	insert([Int posicion], element, element,... )
	eg: insert('adf', HTMLObject, ...)
	*/
	$.plug( 'insert', function ( elements, position ) {

		var t = this;
		var array = elements instanceof Array ? elements : [elements];
		var length = array.length;
		var i = length;

		var nodes;

		var reference = null;

		var element;
		var doc = createDocumentFragment();

		if ( position !== undefined ) {
			nodes = t.childNodes;

			var tmp = [];
			var len = nodes.length;
			var j = len;
			var node;

			while ( j-- ) {
				node = nodes[len - ( j + 1 )];

				if ( node.nodeType == 1 || ( node.nodeType == 3 && node.textContent.trim() != '' ) ) {
					tmp[tmp.length] = node;
				}
			}
			nodes = tmp;

			if ( position > -1 && position <= nodes.length ) reference = nodes[position];
		}

		/* si el elemento es un array */
		while ( i-- ) {
			element = array[i];

			if ( !element ) continue;

			if ( !element.nodeType ) element = document.createTextNode( element );

			doc.insertBefore( element, doc.firstChild );
		}

		t.insertBefore( doc, reference );

		return t;
	} );

	/*
	writes HTML
	s: string
	p: position [undefined writes, 0 inserts before, 1 inserts after]
	*/
	$.plug( 'write', 'all', function ( s, p ) {
		var t = this, a = t.nodeName ? [t] : t, j = a.length, e, v;

		while ( j-- ) {
			e = a[j];
			v = e.innerHTML;
			e.innerHTML = p == undefined ? s : ( p == 0 ? s + v : v + s );
		}

		document.close();
		return t;
	} );

	/* agregar clases */
	$.plug( 'Class', 'all', function ( c ) {
		var t = this;

		var F = function ( element, Class ) {
			var classes = element.className;

			//Class = Class?Class:'';

			var matches = /^([-+*]?)(.+)/.exec( Class );
			var action = matches[1];
			Class = matches[2];

			/* si la accion es agregar y la clase no existe */
			if ( action == '+' && classes.indexOf( Class ) == -1 ) {
				classes += ( classes ? ' ' : '' ) + Class;

				/* elimina la clase indicada */
			} else if ( action == '-' ) {
				classes = classes.replace( new RegExp( Class, 'ig' ), '' ).trim( 1 );

			} else if ( action == '*' ) {

				if ( classes.indexOf( Class ) > -1 ) {
					classes = classes.replace( new RegExp( Class, 'ig' ), '' ).trim( 1 );
				} else {
					classes += ( classes ? ' ' : '' ) + Class;
				}

				/* retorna true si el nombre de la clase existe dentro de las clases definidas en dicho elemento */
			} else if ( Class ) {
				return classes.indexOf( Class ) > -1;

				/* retorna todas las clases que tiene el elemento */
			} else {
				return classes;
			}

			element.className = classes;
			return element;
		};

		if ( t instanceof Array ) {
			var j = t.length;
			while ( j-- ) {
				F( t[j], c );
			}
			return t;

		} else {
			return F( t, c );
		}

	} );

	$.plug( 'show', 'all', function ( c ) {
		var t = this, a = t.nodeName ? [t] : t, j = a.length;

		while ( j-- ) {
			a[j].style.display = c || '';
		}

		return t;
	} );

	$.plug( 'hide', 'all', function () {
		var t = this, a = t.nodeName ? [t] : t, j = a.length;

		while ( j-- ) {
			a[j].style.display = 'none';
		}

		return t;
	} );

	/*
	CSS
	st: style text
	m : merge?
	*/
	$.plug( 'css', 'all', function ( st, m ) {

		/*
		gv: get value
		*/
		var t = this;
		var gv = /^(\w*)(-*)(\w*)(-*)(\w*)$/.test( st );
		var m = m === undefined ? 1 : m;

		st = gv ? st : CSS.dec( st );

		/*
		e : element
		so: style object
		ns: new style
		m : merge?
		*/
		var F = function ( e, ns, m ) {
			var so = e.style;

			/*
			ds: delete spaces, limpia los espacios entre ;: las letras y al final
			cs: current style
			ns: new style
			P : css pattern regular expression
			*/
			var ds = / *((;)|(:))+ *([\w]*)/ig;
			var cs = so.cssText.replace( ds, '$2$3$4' );
			var P = / *((-*\**[\w]+)+): *([-()\w, .#%]*)/ig;

			// REMOVES SPACES BETWEEN PROPERTIES SO THAT IT MATCHES THE REGEXP BELOW
			ns = ns.replace( ds, '$2$3$4' );

			if ( cs && cs.split( '' ).reverse()[0] != ';' ) {
				cs += ';';
			}

			/* si m==1 se combinan ambos estilos */
			if ( m == 1 ) {
				var R = function ( a, b ) {

					var v = a;

					/* crea una expresion regular que busca la propiedad actual en el css nuevo */
					var p = RegExp( "(^|;)+(" + b + "): *([-()\\w, .#%=]*)", "ig" );

					/* reemplaza la propiedad encontrada por '' y asigna el valor a la variable global */
					ns = ns.replace( p, function ( t, x, y, z ) {
						if ( z == '-' ) {
							v = '';
						} else {
							v = y + ':' + z;
						}

						return '';
					} );

					return v;
				};

				ns = cs.replace( P, R ) + ns;
			}

			so.cssText = ns; //.replace( /;;/g, ';' );

			return e;
		};

		/* si es un arreglo y se ha especificado el nuevo estilo, se itera entre los elementos y cambia el style */
		if ( t instanceof Array && st ) {
			var j = t.length;
			while ( j-- ) {
				F( t[j], st, m );
			}
			return t;

		} else {

			/* variable de retorno */
			var r = null, D = document;

			if ( st == "inline" ) {

				/* retorna el estilo inline actual del elemento */
				r = t.style.cssText;

				/* si se especifica algun valor en el parametro style */
			} else if ( st != "" ) {

				/* valida si solo se especifica el nombre de la propiedad css */
				if ( gv ) {

					st = st.replace( /([-]+)(\w)/g, function ( a, b, c ) {
						return c.ucase();
					} );

					if ( st == "width" ) {
						r = t.offsetWidth;

					} else if ( st == "height" ) {
						r = t.offsetHeight;

					} else {
						if ( t.currentStyle ) {
							//runtimeStyle
							r = t.currentStyle[st];
							//console.log(r);
						} else if ( window.getComputedStyle ) { /* FireFox */
							//r=D.defaultView.getComputedStyle(t,'').getPropertyValue(st);
							r = D.defaultView.getComputedStyle( t, '' )[st];
						}

						//if(t.nodeName=='INPUT') console.log( st + ":" + r );
						/* reemplaza el valor px, en caso de que sea una dimension: ej: 500px */
						if ( r ) {
							r = r.replace( /^(\d*.?\d*)px$/, '$1' );
							r = isNaN( r ) ? r : Math.ceil( parseFloat( r ) );
						}
					}

					/* asumimos que de lo contrario se introdujo propiedad: valor */
				} else {
					r = F( t, st, m );
				}

			} else {
				r = t;
			}

			return r;
		}

	} );


	/*
	SF: serialize form
		
	z: empty space
	e: element
		
	o: current object
	n: name
	*/
	$.plug( 'serialize', function () {
		var t = this;
		var empty = '';
		var amp = '&';

		var element;
		var element_id;
		var type;
		var id;
		var value;

		var concat = empty;
		var query = empty;
		var i;
		var array;

		var encrypt;
		
		array = $( 'select', t );
		if ( array ) {
			i = array.length;
			while ( i-- ) {
				element = array[i];
				
				element_id = element.id || element.name || '';
				if( element_id == '' ) continue;
				
				query += ( query != empty ? amp : empty ) + element_id + '=' + element.value.encode_url();
			}
		}

		array = $( 'input', t );
		if ( array ) {
			i = array.length;
			while ( i-- ) {
				element = $( array[i] );

				element_id = element.id || element.name || '';
				if( element_id == '' ) continue;
				
				concat = query != empty ? amp : empty;
				type = element.type.lcase()
				id = element.id || element.name;
				value = element.value.encode_url();

				if ( 'checkbox,radio'.inc( type ) ) {
					query += concat + id + '=' + ( element.checked ? value : empty );

				} else {
					encrypt = window[element.attr( 'data-encrypt' )];

					if ( type == 'password' && encrypt ) {
						try {
							value = encrypt( value );
						} catch ( er ) { }
					}

					query += concat + id + '=' + value;
				}
			}
		}

		array = $( 'textarea', t );
		if ( array ) {
			i = array.length;
			while ( i-- ) {
				element = array[i];
				
				element_id = element.id || element.name || '';
				if( element_id == '' ) continue;
				
				query += ( query != empty ? amp : empty ) + ( element.id || element.name ) + '=' + element.value.replace( /\n/ig, '<br>' ).encode_url();
			}
		}

		return query;
	} );

	$.plug( 'Index', function ( skip ) {
		var t = this;
		var nodes = t.parentNode.childNodes;
		var element;
		var lenght = nodes.length;
		var j = lenght
		var index = -1;

		while ( j-- ) {
			element = nodes[lenght - ( j + 1 )];

			if ( skip && element.nodeType == 3 && element.textContent.trim() == '' ) continue;

			index++;

			if ( element == t ) return index;
		}

		return -1;
	} );


	$.plug( 'next', function ( tag ) {
		var t = this;
		var nodes = t.parentNode.childNodes;
		var element;

		var lenght = nodes.length;
		var j = lenght - ( t.Index() + 1 );

		// IF ITS THE LAST NODE
		if ( j == 0 ) return null;

		while ( j-- ) {
			element = nodes[lenght - ( j + 1 )];

			if ( element.nodeType == 1 && ( tag ? element.nodeName.lcase() == tag : 1 ) ) return $( element );
		}

		return null;
	} );


	$.plug( 'prev', function ( tag ) {
		var t = this;
		var nodes = t.parentNode.childNodes;
		var element;

		var j = t.Index();

		// IF ITS THE FIRST NODE
		if ( j == 0 ) return null;

		while ( j-- ) {
			element = nodes[j];
			if ( element.nodeType == 1 && ( tag ? element.nodeName.lcase() == tag : 1 ) ) return $( element );
		}

		return null;
	} );

	$.plug( 'get', 'all', function ( selector ) {
		return $( selector, this );
	} );

	$.plug( 'parent', function ( selector ) {
		var t = this;
		var parent = t.parentNode;

		if ( selector == undefined ) return $( this.parentNode );

		var elements = $( selector );
		elements = elements instanceof Array ? elements : [elements];
		var length = elements.length;
		var i;

		while ( parent ) {
			i = length;
			while ( i-- ) {
				if ( elements[i] == parent ) return parent;
			}

			parent = parent.parentNode;
		}

		return null;
	} );

	$.plug( 'child', function ( index ) {
		var child = Obj.toArray( this.childNodes );

		if ( isNaN( index ) == false ) {
			child = $( child[index] );
		}

		return child;
	} );

	w.$ = $;

} )( window );