
(function ( w ) {

	var form = w.Form;
	var config = {};

	//	DEFAULT SETTINGS SETUP
	function setup( settings ) {

		var default_settings = {
			messages: {
				//	Select
				E1: "You must select an option [from the \"{input}\" field]",
				E2: "You must select more than {min} options [on the \"{input}\" field]",
				E3: "You can't select more than {max} options [on the \"{input}\" field]",

				//	Input text
				E4: "You must provide a valid e-mail address",
				E5: "You must provide a valid phone number",

				E6: "The field [{input}] must be at least {min} (character:characters)",
				E7: "The field [{input}] must be less than {max} (character:characters)",

				E8: "The field [{input}] contains invalid value",

				E9: "Password do not match.",

				//	Input radio
				E10: "You must select an option [from the \"{input}\" field]",

				//	Input checkbox
				E11: "You must check the [\"{input}\"] field",

				E12: "You must check more than {min} options [on the \"{input}\" field]",
				E13: "You can't check more than {max} options [on the \"{input}\" field]",

				E14: "You must select a file to upload [on the \"{input}\" field]",
				E15: "You have selected an unsuported file extension [on the \"{input}\" field]"
			}
		};

		//	Form > Config > Validate
		config = Obj.merge( settings || {}, default_settings );
	}

	//	FORM VALIDATOR
	var validator = function ( callback, highlight ) {
		var form_wrapper = {
			form: this
		};

		form_wrapper.callback = callback;

		//	COPIES THE DEFAULT CONFIG
		form_wrapper.config = Obj.merge( {}, config );

		//	var color = highlight||'#FCA49A';
		var color = highlight || '-';

		//	DEFAULT HIGHLIGHT COLOR
		form_wrapper.default_highlight_color = color;

		//	PREVIOUS HIGHLIGHT COLOR
		form_wrapper.previous_highlight_color = color;

		//	HIGHTLIGHT COLORS
		form_wrapper.highlight_color = color;

		//	TODO: MAKE THIS BETTER, THERE SHOULD BE A STRAIGHT WAY TO DETERMINE IF THE INPUT IS A DOM ELEMENT OR AS TRING OR AN ARRAY OF ANY TYPE
		var form_validate = function ( Input, arg1, arg2, arg3 ) {
			var t = this;
			
			var form = $( t.form );
			if ( form == null ) return { Number: 0, Message: "The <Form> element was not specified." };
			
			Input = Type.str(Input) ? Input.split( ':' ) : Input;
			if ( Input == null ) return false;

			var elements = Input instanceof Array ? Input : [Input];

			var valid_type = arg1;
			var min_length = arg2;
			var max_length = arg3;
			
			var input_value;
			var confirm_value;

			var input_title;
			var input_value_length;

			var nodename;
			var input_type;
			var parent;
			
			//	FINDS THE INPUT ON THE CURRENT FORM
			var input;
			if( Type.element( elements[0] ) ) {
				input = elements[0];
			}else {
				input = $( elements[0], form );
				if( input ) input = input[0];
			}
			
			var confirm;
			if( Type.element( elements[1] ) ) {
				confirm = elements[1];
			}else {
				confirm = $( elements[1], form );
				if( confirm ) confirm = confirm[0];
			}
			
			parent = $( input.parentNode );

			input_value = input.value.trim();
			input_value_length = input_value.length;
			input_title = input.title ? input.title : '';

			nodename = input.nodeName.lcase();


			if ( nodename == 'select' || nodename == 'textarea' ) {
				input_type = nodename;
			} else {
				input_type = input.type.lcase();
			}

			//	If a password confirm field was specified
			if ( confirm ) {
				confirm = $( '#' + confirm, t.form );

				if ( Type.array( confirm ) ) {
					confirm = confirm[0];
					confirm_value = confirm.value.trim();
				} else {
					confirm = null;
				}
			}

			var is_select_input = ( input_type == 'select' );
			var is_textarea = ( input_type == 'textarea' );
			var is_text_input = ( input_type == 'text' );
			var is_file_input = ( input_type == 'file' );
			var is_radio_input = ( input_type == 'radio' );
			var is_checkbox_input = ( input_type == 'checkbox' );
			var is_password_input = ( input_type == 'password' );

			var error_number = 0;
			var error_message = '';
			var error_messages = config.messages;
			var highlight = t.highlight_color;

			var callback = t.callback;
			var fields = [];
			var event_name;

			var error = {
				number: 0,
				fields: []
			};

			if ( is_select_input ) {
				min_length = arg1;
				max_length = arg2;
				
				error_number = validate_select( input, min_length, max_length );
			}

			if ( is_file_input ) {
				error_number = validate_file( input, arg1 );
			}

			if ( is_radio_input ) {
				error = validate_radio( input );
			}

			if ( is_checkbox_input ) {
				min_length = arg1;
				max_length = arg2;
				
				error = validate_checkbox( input, min_length, max_length );
			}
			
			if( error && error.number ) {
				error_number = error.number;
				fields = error.fields;
			}
			
			if ( is_text_input || is_textarea ) {
				error_number = validate_text( input, valid_type );
			}


			if ( error_number == 0 && ( is_text_input || is_password_input || is_textarea ) ) {

				// Error #8: user must type a valid value
				if ( valid_type instanceof RegExp && valid_type.test( input_value ) == false ) {
					error_number = 8;
				}

				if ( error_number == 0 && ( min_length || max_length ) ) {
					// Error #6: user must type at least [min_length] character(s)
					if ( min_length > input_value_length ) error_number = 6;

					// Error #7: user must type less than [min_length] character(s)
					if ( input_value_length > max_length ) error_number = 7;
				}

				// If there is a password confirm field then we form validate the confirm field and throw the corresponding error
				if ( confirm && error_number == 0 ) {
					if ( input_value != confirm_value ) {
						var validate_confirm = new Form( t.form ).validator( null, highlight );
						var result = validate_confirm( confirm.id, valid_type, min_length, max_length );
						var result_num = result.number;

						// result_num == 6 is omited so that the user gets that message
						if ( result_num == 0 || result_num == 7 || result_num == 8 ) {
							input.value = '';
							if ( confirm ) confirm.value = '';

							// Error #9: user confirm password do not match
							error_number = 9;
						} else {
							error_number = result_num;
							error_message = result.message;
							input = result.fields[0];
						}
					}
				}
			}


			if ( error_number && error_message == '' ) {
				error_message = error_messages['E' + error_number];
			}

			if ( error_message ) {
				// replaces the optional blocks within [] and the space before and after the block
				error_message = error_message.replace( /( *)\[(.+)\]( *)/ig, input_title ? '$1$2$3' : ' ' );

				// replaces the string "{input}" by the value specified in the "title" attribute of the element
				error_message = error_message.replace( /{input}/gi, input_title );

				// replaces the string "{min}" by the minimum amount of characters or elements required
				if ( min_length ) {
					error_message = error_message.replace( /{min}/gi, min_length );
				}

				// replaces the string "{max}" by the maximum amount of characters or elements required
				if ( max_length ) {
					error_message = error_message.replace( /{max}/gi, max_length );
				}

				// replaces the place holder for single or plural word when notifying errors that use the min_value
				if ( error_number == 6 || error_number == 7 ) {
					error_message = error_message.replace( /\((\w+):(\w+)\)/ig, ( error_number == 6 ? min_length : max_length ) > 1 ? '$2' : '$1' );
				}
				// this regular expresion searches for the pattern "(single:plural)" and replaces it by the first word
				// which must be singular, or if max_length is greater than 1, then it uses the second word, which must be in plural
			}

			if ( fields.length == 0 ) {
				fields = [input];
			}

			// Updating the error object
			error = {
				number: error_number,
				message: error_message,
				fields: fields
			};
			
			var return_value = error;
			
			// If a highlight color is set then it is used in the input's background color or on its parent element
			if ( highlight && fields.length ) {
				var length = fields.length;
				var empty_evnt = {};
				var method;
				var element;

				if ( is_checkbox_input || is_radio_input ) {

					while ( length-- ) {
						element = fields[length];

						method = error_number ? ( element.error || on_error ) : ( element.clear || on_clear )
						method.call( element, empty_evnt, form_wrapper );
					}

				} else {
					method = error_number ? ( input.error || on_error ) : ( input.clear || on_clear );
					method.call( input, empty_evnt, form_wrapper );
				}

				if ( is_text_input || is_password_input || is_textarea ) {
					event_name = 'keypress';

				} else if ( is_select_input ) {
					event_name = 'change';

				} else {
					event_name = 'click';
				}

				// If there's any error then it sets the event
				if ( error_number ) {
					fields.each( function ( item ) {
						item.handle( event_name, on_focus, form_wrapper );
					} );
				}
			}

			if ( error_message ) {

				if ( callback == alert ) {
					callback( error_message );

				} else if ( Type.func( callback ) ) {
					callback( error );
				}

				if ( callback != undefined ) return_value = true;

				if ( parent.css( 'display' ) !== 'none' && input.type != "file" ) {
					input.focus();
				}

			} else {

				if ( Type.func( callback ) && callback != alert ) {
					callback( error );
				}

				if ( callback != undefined ) return_value = false;
			}


			return return_value;
		};

		var validate_wrap = function ( input, arg1, arg2, arg3 ) {
			return form_validate.call( form_wrapper, input, arg1, arg2, arg3 );
		};

		validate_wrap.highlight = function ( color ) {
			if ( color == 'on' ) {
				color = t.previous_highlight_color;

			} else if ( color == 'off' ) {
				color = '';
				t.previous_highlight_color = t.highlight_color ? t.highlight_color : '';

			} else if ( color == 'default' ) {
				color = t.default_highlight_color;
			}

			form_wrapper.highlight_color = color;
		};

		validate_wrap.setup = setup;

		return validate_wrap;

	};

	//	EVENT HANDLERS
	function on_error( evnt, form_wrapper, action ) {
		var t = $( this );
		var style = 'KC:' + ( action ? '-' : form_wrapper.highlight_color );

		var parent_node = $( t.parentNode );
		var grand_parent = $( parent_node.parentNode );

		if ( grand_parent.nodeName.lcase() == 'fieldset' ) {
			$( grand_parent ).css( style );

		} else if ( 'fieldset,label'.indexOf( parent_node.nodeName.lcase() ) > -1 ) {
			parent_node.css( style );

		} else {
			t.css( style );
		}
	}

	function on_clear( evnt, form_wrapper ) {
		on_error.call( this, evnt, form_wrapper, '-' );
	}

	function on_focus( evnt, form_wrapper ) {
		var family = this.family ? this.family : [this];
		var i = family.length;
		var c = 0;
		while ( i-- ) {
			on_error.call( family[c++], evnt, form_wrapper, '-' );
		}
	}


	//	<SELECT> VALIDATOPM
	function validate_select( input, min_length, max_length ) {
		var value = input.value.trim();
		var error_number = 0;

		//	verifies if the selected options is the first element and if it's value is "{select}"
		if ( input.multiple == false && input.selectedIndex == 0 && value == "{select}" ) {
			// Error #1: user must choose an option from the select element
			error_number = 1;
		}

		if ( input.multiple && ( min_length || max_length ) ) {

			var options = input.options;
			var length = options.length;
			var elements_count = 0;

			while ( length-- ) {
				if ( options[length].selected ) elements_count++;
			}

			// Error #2: user must choose at least [min_length] options
			if ( min_length > elements_count ) error_number = 2;

			// Error #3: user can NOT choose more than [max_length] options
			if ( elements_count > max_length ) error_number = 3;
		}

		return error_number;
	}

	//	<INPUT:FILE> VALIDATION
	function validate_file( input, extentions ) {
		extentions = extentions.replace( / /g, '' ).replace( /,/g, ' ' );

		var files = [];
		var length;

		// By default we assume the user selected a wrong file extension
		// Error #15: user have selected an unsuported file extension
		var error_number = 15;

		if ( input.files && input.files[0] ) {

			length = input.files.length;
			while ( length-- ) {
				files[length] = input.files[length].fileName.file_ext();
			}

		} else {
			var file_extension = ( input.value ? input.value : '' ).file_ext();
			files = file_extension ? [file_extension].compact() : [];
		}

		length = files.length;

		// Error #14: user must selecte a file to upload
		if ( length == 0 ) {
			error_number = 14;
		}

		while ( length-- ) {
			if ( extentions.indexOf( files[length] ) > -1 ) {
				error_number = 0;
				break;
			}
		}

		return error_number;
	}

	//	<INPUT:RADIO> VALIDATION
	function validate_radio( input ) {
		//	Searches for the other input radios that belong to the same group name
		var form = input.parent( 'form' );
		var fields = Obj.toArray( form ? form.attr( input.name ) : [] );

		var length = fields.length;
		var j = length;

		// Error #10: user must choose an option from the radio group
		var error_number = 10;
		var element;

		while ( j-- ) {
			element = fields[length - ( j + 1 )];
			element.family = fields;

			if ( element.checked ) {
				error_number = 0;
				break;
			}
		}

		return error_number ? { number: error_number, fields: fields} : null;
	}

	//	<INPUT:CHECKBOX> VALIDATION
	function validate_checkbox( input, min_length, max_length ) {
		var error_number = 0;
		var parent = $( input.parentNode );

		var grand_parent = $( parent.parentNode );
		var selector = 'input[type=chekcbox]';
		var fields = parent.get( selector );
		fields = fields ? fields : [input];

		// If [group.length == 1] meaning that only one checkbox was found withing that parent
		// and the grand parent itsa fieldset, then we search for all the checkboxes within the fieldset
		if ( fields.length == 1 && grand_parent.nodeName.lcase() == 'fieldset' ) {
			fields = grand_parent.get( selector );
			fields = fields ? fields : [input];
		}

		/* SI REQUIERE CANTIDAD MINIMA/MAXIMA DE OPCIONES SELECCIONADAS */
		if ( min_length || max_length ) {

			var length = fields.length;
			var j = length;
			var count = 0;

			while ( j-- ) {
				if ( fields[length - ( j + 1 )].checked ) count++;
			}

			// Error #12: user must check at least [min_length] checkbox(es)
			if ( min_length > count ) error_number = 12;

			// Error #13: user can NOT check more than [max_length] checkbox(es)
			if ( count > max_length ) error_number = 13;

		} else {
			// Error #11: user must check the fielx
			if ( input.checked == false ) error_number = 11;
		}

		return error_number ? { number: error_number, fields: fields} : null;
	}

	//	<INPUT:TEXT> & <TEXTAREA> VALIDATION
	function validate_text( input, valid_type ) {
		var value = input.value.trim();
		var error_number = 0;

		// Error #4: user must type a valid email address
		if ( valid_type == 'email' && value.is_email() == false ) {
			error_number = 4;
		}

		// TODO: CONSIDER CREATING ONE FOR FAX NUMBERS
		
		// Error #5: user must type a valid phone number
		if ( valid_type == 'phone' && value.is_phone() == false ) {
			error_number = 5;
		}

		return error_number;
	}

	//	FORM VALIDATOR SETUP
	form.validator = {
	};

	form.validator.setup = setup;

	form.plug( 'validator', validator );

	setup();

} )( window );