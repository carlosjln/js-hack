
(function(w){
	
	/* local hashs */
	var tags_alias = [];
	var html_tags = [];
	var html_props = [];
	var css_props = [];
	
	/*
		here we have some alias for the HTML tag names
		the img & imput tags does not contain anything, so are excluded from this list
	*/
	var alias = 'A,AB,AD,AR,AS,AT,AU,B,BDO,BQ,BR,BS,BT,C,CA,CD,CG,CM,CT,CV,D,DA,DD,DE,DEL,DFN,DL,DT,EB,EM,EV,F,FI,FO,FS,FV,H1,H2,H3,H4,H5,H6,H,HE,HG,HR,HT,I,IM,IN,INS,KBD,KG,L,LG,LI,LK,M,ME,MK,MP,MT,N,NS,O,OB,OG,OL,OU,P,PA,PR,PRE,Q,RB,RP,RT,S,SA,SB,SC,SE,SM,SN,SO,SP,ST,SU,SY,T,TA,TB,TD,TF,TH,TI,TM,TR,UL,V,VR,WBR'.split(',');
	var values = 'a,abbr,address,area,aside,article,audio,body,bdo,blockquote,br,base,button,col,caption,code,colgroup,command,cite,canvas,div,datalist,dd,details,del,dfn,dl,dt,embed,em,eventsource,form,figcaption,footer,fieldset,figure,h1,h2,h3,h4,h5,h6,head,header,hgroup,hr,html,iframe,img,input,ins,kbd,keygen,label,legend,li,link,menu,meta,mark,map,meter,nav,noscript,option,object,optgroup,ol,output,p,param,progress,pre,q,ruby,rp,rt,span,samp,sub,script,select,small,section,source,sup,strong,summary,style,table,textarea,tbody,td,tfoot,thead,title,time,tr,ul,video,var,wbr'.split(',');
	
	//var alias = 'B,BT,C,CD,D,F,FS,H,HT,I,L,LG,O,OG,S,T,TA,TH'.split(',');
	//var values = 'body,button,col,code,div,form,fieldset,head,html,iframe,label,legend,option,optgroup,span,table,textarea,thead'.split(',');
	
	var index = alias.length;
	var value;
	
	while( index-- ){
		value = values[ [index] ];
		tags_alias[ alias[index] ] = value;
		
		html_tags[ value ] = value;
	}
	
	
	/*
		HTML properties
	*/
	
	alias = 'A,AL,AT,BL,BO,CA,CG,CH,CL,CP,C,CP,CS,DC,DI,FO,HE,HR,HS,HV,KD,KP,KU,MD,M,MM,MO,MP,MU,MV,MX,N,OL,RO,RS,RE,R,S,SE,SU,SZ,TA,TB,TI,T,UN,VA,V,VS,W'.split(',');
	values = 'action,align,alt,onblur,border,class,onchange,checked,onclick,colspan,cols,cellpadding,cellspacing,ondblclick,disabled,onfocus,height,href,hspace,hover,onkeydown,onkeypress,onkeyup,onmousedown,method,onmousemove,onmouseout,onmouseup,multiple,onmouseover,maxlength,name,onload,readonly,rowspan,onreset,rows,src,onselect,onsubmit,size,target,tabindex,title,type,unselectable,valign,value,vspace,width'.split(',');
	
	index = alias.length;
	
	while(index--){
		html_props[ alias[index] ] = values[ [index] ];
	}
	
	/*
	*	generates HTML from short markup
	*/
	var htm = w.HTM = function( tag, attributes, style, content, close_tag ){
		
		if( !tag ) return '';
		
		var tags = tags_alias;
		var props = html_props;
		var close = close_tag==null||close_tag?1:0;
		
		/*
		*	if the tag is not found in the hash, then it uses the tag as provided by the user
		*/
		var tag = tags[tag]||tag.toLowerCase();
		
		
		/*
		*	starts the html tag eg: <div
		*/
		var result = '<'+tag;
		
		/*
		*	checks if the image should have or not the closing tag
		*/
		if(tag=='img'||tag=='input'){
			close = 0;
		}
		
		
		/* si se especifico alguna propiedad html */
		if(attributes){
			/*
				divide las propiedades en \n
				
				length,i: longitud del arreglo resultante
				n: posision invertida del cursor
				e: elemento a evaluar
				x: variable temporal para concatenar string
				
				y: nombre de la propiedad
				z: valor asignado a la propiedad "y"
				
				old regex: /\n+/g
				new reged: valida | seguido por letras, seguidas por  = 
			*/
			var attribs = attributes.split(/ *\| *(?=\w+=)/g);
			var length = attribs.length;
			var i = length;
			var index;
			var element;
			var prop;
			var value;
			var tmp = ' ';
			
			
			while( i-- ){
				/* revierte el indice para iterarlo desde el inicio hasta el final */
				index = length-(i+1);
				
				/* regex checks for valid attribute=value combinations */
				element = /^(\w+)=([\w\W]+)?/i.exec( attribs[index] );
				
				/* if the attribute isn't in the hash then it places the raw user's input */
				prop = props[element[1]] || element[1];
				value = element[2] || '';
				
				/*
					if((tag=='img'||'input')&&attributes=='src')b=iif(b.includes('.'),b,gI(b));
					si la propiedad es src entonces utiliza el return source para generar la url de la imagen
				*/
				if( prop == 'src' ) value = Img(value);
				
				tmp += (prop+'="'+ value +'" ');
			}
			tmp = ( tmp.replace(/\s+$/,"") );
			
			result += tmp;
		}
		
		
		/* css */
		if(style){
			result += CSS.dec(style,1);
		}
		
		/* cierra etiqueta > */
		result += '>' + ( content?content:'' );
		
		/* etiqueta de cierre */
		result += close?'</'+tag+'>':'';
		
		return result;
	};
	
	
	htm.aliases = tags_alias;
	htm.tags = html_tags;
	
})(window);