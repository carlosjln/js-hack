
(function(w){
	
	/* local hashs */
	var css_props = [];
	var css_alias = [];
	
	css_props.filter = css_alias.filter = null;
	
	/*
		CSS aliases
	*/
	var alias = 'B,BB,BBS,BBW,BC,BL,BLS,BLW,BR,BRS,BRW,BS,BT,BTS,BTW,CI,CL,CO,CU,D,F,FF,FS,FT,FV,FW,FY,H,K,KA,KC,KI,KP,KR,KS,L,LH,LS,LSI,LSP,LST,LT,M,MB,MH,ML,MR,MS,MT,MW,OF,OFX,OFY,OP,P,PB,PBA,PBB,PL,PO,PR,PT,R,SH,SW,T,TA,TD,TI,TL,TO,TT,V,VA,W,WB,WP,WS,Z,ZI'.split(',');
	var values = 'border,border-bottom,border-bottom-style,border-bottom-width,border-collapse,border-left,border-left-style,border-left-width,border-right,border-right-style,border-right-width,border-spacing,border-top,border-top-style,border-top-width,clip,clear,color,cursor,display,float,font-family,font-size,font,font-variant,font-weight,font-style,height,background,background-attachment,background-color,background-image,background-position,background-repeat,khtml-user-select,left,line-height,letter-spacing,list-style-image,list-style-position,list-style-type,list-style,margin,margin-bottom,max-height,margin-left,margin-right,moz-user-select,margin-top,max-width,overflow,overflow-x,overflow-y,opacity,padding,padding-bottom,page-break-after,page-break-before,padding-left,position,padding-right,padding-top,right,min-height,min-width,top,text-align,text-decoration,text-indent,table-layout,text-overflow,text-transform,visibility,vertical-align,width,word-break,white-space,word-spacing,zoom,z-index'.split(',');
	
	var index = alias.length;
	
	var rules_hash = [];
	
	while( index-- ){
		css_props[ alias[index] ] = values[index];
		
		css_alias[ values[index] ] = alias[index];
	}
	
	
	/*
	*	CSS
	*/
	
	
	/* css alias decoding */
	function dec(style, wrap){
		if( !style ) return '';
		
		/* expresion regular para detectar propiedad:valor en CSS */
		var pattern = / *((-*\**[\w]+)+): *([-()\w, .#%=]*)/ig;
		var props = css_props;
		
		style = style.replace( pattern, function( array, name, crap, value, index ){
			name = props[ name.toUpperCase() ] || name;
			
			/*
			switch(name){
				case 'background-image':
					value = 'url('+ IMG.src(value) +')';
				break;
			}
			*/
			
			/* if -value- is numeric and the css property is not -z-index- nor -zoom- then adds the -px- 
			
			if( /^\d+$/.test( value ) && (name != 'z-index' && name != 'zoom') ){
				value += 'px';
			}
			*/
			if( /^\d+$/.test( value ) ){
				switch(name){
					case 'background-image':break;
					
					case 'opacity':
						value = value >= 0 ? value : 0;
						value = (value?value/100:0)+ '; ' +'filter:alpha(opacity='+ (value) +')';
						break;
						
					case 'z-index': break;
					case 'zoom': break;
					
					default: value +='px'
				}
			}
			
			//opacity
			//( && name != 'z-index' && name != 'zoom') ? 'px' : ''
			
			return (index?' ':'')+ name +':'+ value;
		});
		
		return wrap?' style="'+ style +'"':style;
	}
	
	
	/* css alias encoding */
	function enc( style ){
		
		/* expresion regular para detectar propiedad:valor en CSS */
		var pattern = / *((-*\**[\w]+)+): *([-()\w, .#%=]*)/ig;
		var alias = css_alias;
		
		/*
		if( /^\d+px$/.test( value ) ){
			value = value.replace('px','');
		}
		*/

		style = style.replace( pattern, function( array, name, crap, value, index ){
			name = alias[ name.toLowerCase() ] || name;
			
			return (index?' ':'')+ name +':'+ value.replace( /^(\d+)px$/, "\$1" );
		});
		
		return style.replace(/ *((;)|(:))+ *([\w]*)/ig,'$2$3$4');
	}
	
	
	/*
		stylesheets indexing rules
	*/
	function index_rules(){
		var hash = rules_hash;
		
		var sheets = window.document.styleSheets;
		var sheet;
		
		var cssRules = sheets[0].cssRules?'cssRules':'rules';
		
		var i = sheets.length;
		var j;
		var k;
		var name;
		var rules;
		
		/* sheets */
		while( i-- ){
			
			sheet = sheets[i];
			
			rules = sheet[cssRules];
			
			if(rules) {
				j = rules.length;
			
				/* rules */
				while( j-- ){
					name = rules[j].selectorText.toLowerCase().split(/[,| ]+/);
					k = name.length;
				
					/* rule names, split by coma */
					while( k-- ){
						hash[ name[k] ] = rules[j];
					}
				}
			}
			
		}
		
	};
	
	/* indexes the rules on the stylesheets */
	//index_rules();
	
	
	var css = w.CSS = function(){};
	css.dec = dec;
	css.enc = enc;
	css.index_rules = index_rules;
	
	/*
		creates a direct access to the style sheet
	*/
	var style_name = 'jsHack-style-sheet';
	var sheet = w.document.getElementById( style_name );
	
	if( sheet == null ){
		sheet = $.create('style','.jsHack{}');
		sheet.id = style_name;
	}
	
	w.jsHack.stylesheet = sheet;
	
	
	/* private: get rule 
	function get_rule( selector, rules ){
		selector = selector.toLowerCase();
		
		var i = rules.length;
		var j;
		
		while( i-- ){
			classes = rules[i].selectorText.toLowerCase().split(/[,| ]+/);
			j = classes.length;
			
			while( j-- ){
				if( classes[j].trim() == selector ){
					return rules[i];
				}
			}
			
		}
	}
	*/
	
	/* public: get rule */
	css.get_rule = function( selector, reindex ){
		selector = selector.toLowerCase();
		
		var hash = rules_hash;
		/* if the rule we are looking for is already indexed then return it */
		var rule = hash[selector];
		
		/* if its not indexed then we index and try to return it*/
		if( reindex && rule == null ){
			index_rules();
			
			rule = hash[selector];
		}
		
		return rule;
	};
	
	/*
		manages the rules/classNames defined on the style sheets
	*/
	css.add_rule = function( styles ){
		var hash = rules_hash;
		var sheet = jsHack.stylesheet;
		sheet = sheet.sheet || sheet.styleSheet;
		
		var cssRules = sheet.cssRules || sheet.rules;
		
		var length = styles.length;
		var i = length;
		var e;
		var len;
		var name;
		var value;
		
		
		// it's a W3C browser
		if( sheet.insertRule ){
			
			while( i-- ){
				e = styles[ (length - (i+1)) ];
				name = e[0];
				
				// decodes the string in case its used css property aliases
				// dec( e[1] )
				sheet.insertRule( name +'{'+ dec( e[1] ) +'}' , len=cssRules.length);
				hash[ name ] = cssRules[len];
			}
		
		// it's an IE browser
		}else{
		
			while( i-- ){
				e = styles[ (length - (i+1)) ];
				name = e[0];
				
				sheet.addRule( name, dec( e[1] ) );
				
				hash[ name ] = cssRules[ cssRules.length-1 ];
			}
			
		}
	};
	
	
	/* indexes all the rules on the stylesheets */
	index_rules.free();
	
})(window);