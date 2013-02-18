
(function(w){
	var methods = {};
	
	var form = function( form ){
		var wrap = Obj.clone( methods );
		wrap.form = typeof( form ) == 'string'? $( '#'+form ) : form;
		
		return wrap;
	};
	
	form.plug=(function(name, method){
		methods[ name ] = function(){
			return method.apply( this.form, Obj.toArray(arguments) );
		};
	});
	
	w.Form = form;
	
})(window);