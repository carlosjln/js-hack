
(function(w){
	var doc = document;
	var nav = navigator;
	var user_agent = nav.userAgent;
	var vendor = nav.vendor;
	var platform = nav.platform;
	
	var loaded_documents = [];
	
	var browser = {
		webkit: user_agent.indexOf('AppleWebKit/')>-1,
		gecko: user_agent.indexOf('Gecko')>-1 && user_agent.indexOf('KHTML')===-1,
		
		/* dynamicaly loading scripts and stylesheets */
		// bug: cant call this method directly, it has to be called from within the setTimeout function so that it's free from the current scope
		load:function( url, type, callback ){
			var tag;
			var src = 'src';
			var rel;
			
			// ADDING BASE URL
			if( /^http/i.test(url) == false ){
				url = Browser.url + url;
			}
			
			// PREVENTING TO ADD THE SAME SCRIPT MULTIPLE TIMES
			if( loaded_documents[url] != null ){
				if( callback ) callback.free();
				return loaded_documents[url].element;
			}
			
			if( typeof(type) == 'function' ){
				callback = type;
			}
			
			if( typeof(type) != 'string' ){
				type = url.split('?')[0].file_ext();
			}
			
			if( type == 'js' ){
				tag = 'script';
				rel = type = 'javascript';
				
			}else{
				tag = 'link';
				src = 'href';
				rel = 'stylesheet'
			}
			
			var element = doc.createElement( tag );
			element.setAttribute( "type", "text/" + type );
			element.setAttribute('rel', rel);
			element.setAttribute( src, url );
			
			// POOL OF LOADED FILES
			var data = {
				element: element,
				loaded: false,
				callback: callback
			};
			
			// CALLBACK
			if( callback ){
				element.onreadystatechange = function () {
					var state = this.readyState;
					if ( (state === 'loaded' || state === 'complete') && data.loaded == false ) {
						this.onreadystatechange = null;
						data.loaded = true;
						data.callback();
					}
				};
				
				element.onload = function(){
					if(data.loaded == false){
						data.loaded = true;
						data.callback();
					}
				};
				
				if( type == 'css' ){
					if( browser.name == "firefox" ){
						element.textContent = '@import "' + url + '"';
						
						var foo = setInterval(function() {
							try {
								var css_rules = element.sheet.cssRules;
								
								clearInterval(foo);
								if(callback) callback();
								
							} catch (e){}
						}, 50);  
					}
				}
				
				// safari doesn't support either onload or readystate, create a timer, only way to do this in safari
				/*
				if( browser.webkit && browser.name == 'opera' ){
					
					loaded_timer[url] = setInterval(function() {
						if (/loaded|complete/.test(document.readyState)) {
							clearInterval( loaded_timer[url] );
							callback();
						}
					}, 100);
					
				}
				*/
			}
			
			setTimeout(function(){
				doc.getElementsByTagName('head')[0].insertBefore( element, null );
			},10);
			
			loaded_documents[url] = data;
			
			return element;
		}
	};
	
	w.Browser = browser;
	
	/*
		[ useragent, identity, identitySearch, versionSearch ]
	*/
	var browser_agent = [
		[user_agent, "Chrome"],
		
		[user_agent, "OmniWeb", '', "OmniWeb/"],
		
		[vendor, "Safari", "Apple", "Version" ],
		
		[window.opera, "Opera"],
		
		[vendor, "iCab"],
		
		[vendor, "Konqueror", "KDE"],
		
		[user_agent, "Firefox"],
		
		[vendor, "Camino"],
		
		// for newer Netscapes (6+)
		[user_agent, "Netscape"],
		
		[user_agent, "Explorer", "MSIE"],
		
		[user_agent, "Gecko", "Mozilla", "rv"],
		
		// for older Netscapes (4-)
		[user_agent, "Netscape", "Mozilla"]
	];
	
	var browser_os = [
		[platform, "Windows", "Win"],
		
		[platform, "Mac"],
		
		[user_agent, "iPhone", "iPhone/iPod"],
		
		[platform, "Linux"]
	];
	
	// search browser data returns an array like: [browser/OS name, version]
	function search( array ){
		var len = array.length;
		var index = 0;
		
		var item;
		var user_agent;
		var identity;
		var identity_search;
		var version_search;
		
		while(len--){
			item = array[ index++ ];
			
			// useragent
			user_agent = item[0];
			
			// identity
			identity = item[1];
			
			// identity search
			identity_search = item[2];
			
			// versionSearch
			version_search = item[3];
			
			
			if(user_agent){
				
				if( user_agent.indexOf( identity_search || identity ) >-1 ){
					
					new RegExp( (version_search||identity_search||identity) + "[\\/\\s](\\d+\\.\\d+)" ).test( user_agent );
					
					/* browser/os name, version */
					return [ identity.lcase(), parseFloat(RegExp.$1) ];
				}
			}
		}
		
		return null;
	}
	
	
	// gets the browser name and version
	var data = search( browser_agent );
	
	browser.name = data[0];
	browser.version = data[1];
	
	// gets the operating system's name
	data = search( browser_os );
	browser.OS = data[0];
	
	// an extra property to identify internet explorer
	browser.is_IE = (Browser.name=='explorer');
	
	// GETS THE ABSOLUTE/RELATIVE URL OF THE CURRENT DOCUMENT
	function get_url( relative ){
		var anchor = doc.createElement("a");
		var port;
		
		anchor.href = doc.location;
		port = anchor.port;
		
		var pathname = '';
		if( relative ){
			pathname = anchor.pathname.replace(/^[/]/,'');
			
			if( pathname ) pathname = pathname.substring( 0, pathname.lastIndexOf("/") ) + "/"
		}
		
		return anchor.protocol + '//' + anchor.hostname + (port && port !=0 ? ':' + port : '') + '/' + pathname;
	}
	
	/* get base url: calcula la direcion base del documento, la asigna en una variable global y retorna el resultado */
	browser.get_url = get_url;
	browser.url = get_url();
	
	// GETS THE RELATIVE URL OF THE CURRENT DOCUMENT
	browser.relative_url = get_url( true );
	
	// AVOIDS BACKGROUND IMAGE FLICKERING
	if(browser.is_IE){
		try{
			document.execCommand("BackgroundImageCache", false, true);
		}catch(er){}
	}

})(window);