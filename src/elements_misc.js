
(function(w){
	
	$.time=function(){
		return new Date().getTime();
	};
	
	$.isEmpty = function(v){
		if( v === undefined || v === null ) return true;
		
		if( v['join'] ){
			return v.length == 0?true:false;
		}
		
		if( typeof(v) == 'string' ){
			return v.trim() == '';
		}
		
		return false;
	};
	
	$.insert = function( element ){
		var regexp;
		var tags = HTM.tags;
		var tag;
		var create = $.create;
		var child_nodes;
		
		if( typeof(element) == 'string' ){
			// HTML string
			// /^<(\w)+(\b[^>]*)\/?>(.*?)(<\w+\/?>)?$/i.test( element )
			
			if( element.is_html() ){
				element = create('document', element);
				
			// HTML tag
			}else if( tags[element] ){
				element = create(element);
				
			}else{
				element = create('textnode', element);
			}
			
		}
		
		/*
			action = 1 when calling insert.after
		*/
		var method = function( reference, action ){
			reference = reference.nodeType?reference:$(reference);
			
			if( reference ){
				// IF THE ACTION IS SET THEN IT INSERTS AFTER THE REFERENCE
				reference = action?reference.nextSibling : reference;
				
				var parent = reference.parentNode;
				
				// IF THE REFERENCE IS A DISCONECTED DOM, IT CREATES A DOC FRAGMENT AS ITS PARENT
				if( !parent ){
					parent = document.createDocumentFragment();
					parent.insertBefore( reference, parent.firstChild)
				}
				
				// IF ITS A DOCUMENT FRAGMENT
				if( element.nodeType == 11 ){
					element = Obj.toArray(element.childNodes);
				}
				
				var array = element instanceof Array?element:[element];
				var length = array.length;
				var i = length;
				var item;
				var item_parent;
				
				while( i-- ){
					item = array[ length - (i+1) ];
					
					item_parent = item.parentNode;
					if( item_parent ){
						item_parent.removeChild(item);
					}
					
					parent.insertBefore( item, reference );
				}
				
				return element;
			}
			
			return false;
		};
		
		return {
			after: function( reference ){
				return method(reference, 1);
			},
			
			before: function(reference){
				return method(reference);
			}
		};
		
	};


	$.domify = function( html ){
		var div = w.document.createElement('div');
		div.innerHTML = html;
		
		var element = div.firstChild;
		div.removeChild(element);
		
		div = null;
		
		return $(element);
	};
	
})(window);