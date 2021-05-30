jQuery( document ).ready( function( $ ) {

	/* padding top */

	var page_padding_top;
	if ( typeof hb_booking_form_data !== 'undefined' ) {
		page_padding_top = hb_booking_form_data.page_padding_top;
	} else {
		page_padding_top = hb_payment_confirmation_padding_top;
	}

	var adminbar_height = 0;
	if ( $( '#wpadminbar' ).length ) {
		adminbar_height = $( '#wpadminbar' ).height();
		page_padding_top = parseInt( page_padding_top ) + adminbar_height;
	}

	/* end padding top */

	/* ------------------------------------------------------------------------------------------- */

	/* id and for attributes */

	if ( ( typeof hb_booking_form_data !== 'undefined' ) && ( hb_booking_form_data.is_admin != 'yes' ) ) {
		var form_nb = 1;
		$( '.hbook-wrapper' ).each( function() {
			$( this ).find( 'label' ).each( function() {
				var new_attr_for = 'hb-form-' + form_nb + '-' + $( this ).attr( 'for' );
				$( this ).attr( 'for', new_attr_for );
			});
			$( this ).find( 'input, select, textarea' ).each( function() {
				var attr_id = $( this ).attr( 'id' );
				if ( attr_id ) {
					var new_attr_id = 'hb-form-' + form_nb + '-' + attr_id;
					$( this ).attr( 'id', new_attr_id );
				}
			});
			form_nb++;
		});
	}

	/* end id and for attributes */

	/* ------------------------------------------------------------------------------------------- */

	/* booking search */

	$( '.hb-booking-search-form' ).submit( function() {
		var $form = $( this ),
			$booking_wrapper = $form.parents( '.hbook-wrapper' );
		$form.find( 'input[type="submit"]' ).blur();
		if ( ! $form.hasClass( 'submitted' ) ) {
			$booking_wrapper.find( '.hb-booking-details-form, .hb-admin-booking-details-form' ).hide();
			$form.find( '.hb-search-error' ).slideUp();
			var check_in = $form.find( '.hb-check-in-date' ).val(),
				check_out = $form.find( '.hb-check-out-date' ).val(),
				adults = $form.find( 'select.hb-adults' ).val(),
				children = $form.find( 'select.hb-children' ).val(),
				admin_accom_id = $form.find( '.hb-accom' ).val(),
				people_and_date_validation;
			if ( ! children || $form.hasClass( 'hb-search-form-no-children' ) ) {
				$form.find( 'select.hb-children' ).val( 0 );
				children = 0;
			}
			if ( $form.hasClass( 'hb-search-form-no-people' ) ) {
				$form.find( 'select.hb-adults' ).val( 1 );
				adults = 1;
			}
			if ( ! adults ) {
				$form.find( 'select.hb-adults option:nth-child(2)' ).prop( 'selected', true );
				adults = $form.find( 'select.hb-adults' ).val();
			}
			if ( ! admin_accom_id ) {
				admin_accom_id = '';
			}
			var booking_rules = $booking_wrapper.data( 'booking-rules' );
			people_and_date_validation = validate_people_and_check_dates( check_in, check_out, adults, children, booking_rules );
			if ( ! people_and_date_validation.success ) {
				search_show_error( $form, people_and_date_validation.error_msg );
			} else {
				disable_form_submission( $form );
				$form.find( '.hb-check-in-hidden' ).val( date_to_string( people_and_date_validation.check_in ) );
				$form.find( '.hb-check-out-hidden' ).val( date_to_string( people_and_date_validation.check_out ) );
				if ( $form.data( 'search-only' ) == 'yes' || $form.data( 'booking-details-redirection' ) == 'yes' ) {
					return true;
				}
				$form.find( '.hb-search-no-result' ).slideUp();
				$form.find( '.hb-booking-searching' ).slideDown();
				$.ajax({
					url: hb_booking_form_data.ajax_url,
					type: 'POST',
					timeout: hb_booking_form_data.ajax_timeout,
					data: {
						'action': 'hb_get_available_accom',
						'check_in': $form.find( '.hb-check-in-hidden' ).val(),
						'check_out': $form.find( '.hb-check-out-hidden' ).val(),
						'adults': $form.find( 'select.hb-adults' ).val(),
						'children': $form.find( 'select.hb-children' ).val(),
						'results_show_only_accom_id': $form.find( '.hb-results-show-only-accom-id' ).val(),
						'page_accom_id': $booking_wrapper.data( 'page-accom-id' ),
						'current_page_id': $booking_wrapper.data( 'current-page-id' ),
						'exists_main_booking_form': $booking_wrapper.data( 'exists-main-booking-form' ),
						'force_display_thumb': $booking_wrapper.data( 'force-display-thumb' ),
						'force_display_desc': $booking_wrapper.data( 'force-display-desc' ),
						'chosen_options': $form.find( '.hb-chosen-options' ).val(),
						'chosen_accom_num': $form.find( '.hb-chosen-accom-num' ).val(),
						'is_admin': hb_booking_form_data.is_admin,
						'admin_accom_id': admin_accom_id
					},
					success: function( response ) {
						search_show_response( response, $form, $booking_wrapper );
					},
					error: function( jqXHR, textStatus, errorThrown ) {
						$form.find( '.hb-booking-searching' ).hide();
						enable_form_submission( $form );
						search_show_error( $form, hb_text.connection_error );
						console.log( jqXHR );
						console.log( textStatus );
						console.log( errorThrown );
					}
				});
			}
		}
		return false;
	});

	function validate_people_and_check_dates( check_in, check_out, adults, children, booking_rules ) {

		if ( ( check_in == '' ) && ( check_out == '' ) ) {
			return { success: false, error_msg: hb_text.no_check_in_out_date };
		} else if ( check_in == '' ) {
			return { success: false, error_msg: hb_text.no_check_in_date };
		} else if ( check_out == '' ) {
			return { success: false, error_msg: hb_text.no_check_out_date };
		} else if ( adults != parseInt( adults, 10 ) && children != parseInt( children, 10 ) ) {
			return { success: false, error_msg: hb_text.no_adults_children };
		} else if ( adults != parseInt( adults, 10 ) ) {
			return { success: false, error_msg: hb_text.no_adults };
		} else if ( children != parseInt( children, 10 ) ) {
			return { success: false, error_msg: hb_text.no_children };
		}
		var check_in_date,
			check_out_date;
		try {
			check_in_date = $.datepick.parseDate( hb_date_format, check_in );
		} catch( e ) {
			check_in_date = false;
		}
		try {
			check_out_date = $.datepick.parseDate( hb_date_format, check_out );
		} catch( e ) {
			check_out_date = false;
		}
		if ( ! check_in_date && ! check_out_date ) {
			return { success: false, error_msg: hb_text.invalid_check_in_out_date };
		} else if ( ! check_in_date ) {
			return { success: false, error_msg: hb_text.invalid_check_in_date };
		} else if ( ! check_out_date ) {
			return { success: false, error_msg: hb_text.invalid_check_out_date };
		}

		if ( hb_booking_form_data.is_admin == 'yes' ) {
			if ( check_out_date <= check_in_date ) {
				return { success: false, error_msg: hb_text.check_out_before_check_in };
			}
			return { success: true, check_in: check_in_date, check_out: check_out_date };
		}

		if ( hb_min_date != '0' ) {
			var min_date = hb_date_str_2_obj( hb_min_date ),
				txt_min_date = $.datepick.formatDate( hb_date_format, min_date );
			if ( check_in_date < min_date ) {
				return { success: false, error_msg: hb_text.check_in_date_before_date.replace( '%date', txt_min_date ) };
			}
		}
		if ( hb_max_date != '0' ) {
			var max_date = hb_date_str_2_obj( hb_max_date ),
				txt_max_date = $.datepick.formatDate( hb_date_format, max_date );
			max_date.setDate( max_date.getDate() + 1 );
			if ( check_out_date > max_date ) {
				return { success: false, error_msg: hb_text.check_out_date_after_date.replace( '%date', txt_max_date ) };
			}
		}

		var yesterday = new Date();
		yesterday.setDate( yesterday.getDate() - 1 );
		yesterday.setHours( 23, 59, 59 );
		if ( check_in_date < yesterday ) {
			return { success: false, error_msg: hb_text.check_in_date_past };
		} else if ( check_out_date <= check_in_date ) {
			return { success: false, error_msg: hb_text.check_out_before_check_in };
		}

		var check_in_day = day_of_week( check_in_date ),
			check_out_day = day_of_week( check_out_date ),
			nb_nights = date_diff( check_out_date, check_in_date ),
			check_in_date_season = hb_get_season_id( check_in_date ),
			check_out_date_season = hb_get_season_id( check_out_date );

		if ( booking_rules.allowed_check_in_days != 'all' ) {
			var allowed_check_in_days = booking_rules.allowed_check_in_days.split( ',' );
			if ( allowed_check_in_days.indexOf( check_in_day ) < 0 ) {
				var allowed_days = day_name_list( allowed_check_in_days );
				return { success: false, error_msg: hb_text.check_in_day_not_allowed.replace( '%check_in_days', allowed_days ) };
			}
		}
		if ( booking_rules.allowed_check_out_days != 'all' ) {
			var allowed_check_out_days = booking_rules.allowed_check_out_days.split( ',' );
			if ( allowed_check_out_days.indexOf( check_out_day ) < 0 ) {
				var allowed_days = day_name_list( allowed_check_out_days );
				return { success: false, error_msg: hb_text.check_out_day_not_allowed.replace( '%check_out_days', allowed_days ) };
			}
		}
		if (
			booking_rules.seasonal_allowed_check_in_days[ check_in_date_season ] &&
			booking_rules.seasonal_allowed_check_in_days[ check_in_date_season ].split( ',' ).indexOf( check_in_day ) < 0
		) {
			return { success: false, error_msg: hb_text.check_in_day_not_allowed_seasonal };
		}
		if (
			booking_rules.seasonal_allowed_check_out_days[ check_out_date_season ] &&
			booking_rules.seasonal_allowed_check_out_days[ check_out_date_season ].split( ',' ).indexOf( check_out_day ) < 0
		) {
			return { success: false, error_msg: hb_text.check_out_day_not_allowed_seasonal };
		}
		if ( booking_rules.seasonal_minimum_stay[ check_in_date_season ] ) {
			if ( nb_nights < booking_rules.seasonal_minimum_stay[ check_in_date_season ] ) {
				return { success: false, error_msg: hb_text.minimum_stay_seasonal };
			}
		} else if ( nb_nights < booking_rules.minimum_stay ) {
			return { success: false, error_msg: hb_text.minimum_stay.replace( '%nb_nights', booking_rules.minimum_stay ) };
		}
		if ( booking_rules.seasonal_maximum_stay[ check_in_date_season ] ) {
			if ( nb_nights > booking_rules.seasonal_maximum_stay[ check_in_date_season ] ) {
				return { success: false, error_msg: hb_text.maximum_stay_seasonal };
			}
		} else if ( nb_nights > booking_rules.maximum_stay ) {
			return { success: false, error_msg: hb_text.maximum_stay.replace( '%nb_nights', booking_rules.maximum_stay ) };
		}
		if ( booking_rules.conditional_booking_rules.length ) {
			for ( var i = 0; i < booking_rules.conditional_booking_rules.length; i++ ) {
				var rule = booking_rules.conditional_booking_rules[ i ];
				if ( rule.check_in_days.indexOf( check_in_day ) > -1 ) {
					if ( rule.check_out_days.indexOf( check_out_day ) < 0 ) {
						if ( rule['all_seasons'] == 1 ) {
							return {
								success: false,
								error_msg: hb_text.check_out_day_not_allowed_for_check_in_day
									.replace( '%check_in_day', day_name( check_in_day ) )
									.replace( '%check_out_days', day_name_list( rule.check_out_days.split( ',' ) ) )
							};
						} else if ( rule['seasons'].split( ',' ).indexOf( check_in_date_season ) > -1 ) {
							return { success: false, error_msg: hb_text.check_out_day_not_allowed_for_check_in_day_seasonal };
						}
					}
					if ( nb_nights < rule.minimum_stay ) {
						if ( rule['all_seasons'] == 1 ) {
							return {
								success: false,
								error_msg: hb_text.minimum_stay_for_check_in_day
									.replace( '%nb_nights', rule.minimum_stay )
									.replace( '%check_in_day', day_name( check_in_day ) )
							};
						} else if ( rule['seasons'].split( ',' ).indexOf( check_in_date_season ) > -1 ) {
							return { success: false, error_msg: hb_text.minimum_stay_for_check_in_day_seasonal };
						}
					}
					if ( nb_nights > rule.maximum_stay ) {
						if ( rule['all_seasons'] == 1 ) {
							return {
								success: false,
								error_msg: hb_text.maximum_stay_for_check_in_day
									.replace( '%nb_nights', rule.maximum_stay )
									.replace( '%check_in_day', day_name( check_in_day ) )
							};
						} else if ( rule['seasons'].split( ',' ).indexOf( check_in_date_season ) > -1 ) {
							return { success: false, error_msg: hb_text.maximum_stay_for_check_in_day_seasonal };
						}
					}
				}
			}
		}
		return { success: true, check_in: check_in_date, check_out: check_out_date };
	}

	function day_of_week( date ) {
		var day = date.getDay();
		if ( day == 0 ) {
			day = 6;
		} else {
			day = day - 1;
		}
		return day + '';
	}

	function day_name( day ) {
		if ( day == 6 ) {
			day = 0;
		} else {
			day++;
		}
		return hb_day_names[ day ];
	}

	function day_name_list( days ) {
		var days_name = [];
		for ( var i = 0; i < days.length; i++ ) {
			days_name.push( day_name( days[ i ] ) );
		}
		return days_name.join( ', ' );
	}

	function date_diff( check_out_date, check_in_date ) {
		return Math.round( ( check_out_date - check_in_date ) / 1000 / 60 / 60 / 24 );
	}

	function date_to_string( date ) {
		var y = date.getFullYear();
		var m = date.getMonth() + 1;
		m = m + '';
		if ( m.length == 1 ) {
			m = '0' + m;
		}
		var d = date.getDate();
		d = d + '';
		if ( d.length == 1 ) {
			d = '0' + d;
		}
		return y + '-' + m + '-' + d;
	}

	function search_show_error( $form, msg ) {
		if ( $form.find( '.hb-search-error' ).is( ':visible' ) ) {
			$form.find( '.hb-search-error' ).slideUp( function() {
				$( this ).html( msg ).slideDown();
			});
		} else {
			$form.find( '.hb-search-error' ).html( msg ).slideDown();
		}
	}

	function search_show_response( response_text, $form, $booking_wrapper ) {
		$form.find( '.hb-booking-searching' ).hide();
		enable_form_submission( $form );
		try {
			var response = JSON.parse( response_text );
		} catch ( e ) {
			$form.find( '.hb-search-error' ).html( 'An error occured. ' + response_text ).slideDown();
			return false;
		}
		if ( ! response.success ) {
			if ( response.msg ) {
				$form.find( '.hb-search-no-result' ).html( response.msg ).slideDown();
			} else {
				$form.find( '.hb-search-error' ).html( response_text ).slideDown();
			}
		} else {
			$form.find( '.hb-chosen-check-in-date span' ).html( $form.find( '.hb-check-in-date' ).val() );
			$form.find( '.hb-chosen-check-out-date span' ).html( $form.find( '.hb-check-out-date' ).val() );
			$form.find( '.hb-chosen-adults span' ).html( $form.find( 'select.hb-adults' ).val() );
			$form.find( '.hb-chosen-children span' ).html( $form.find( 'select.hb-children' ).val() );
			$form.find( '.hb-chosen-accom span' ).html( $form.find( '.hb-accom option:selected' ).text() );
			$form.find( '.hb-search-fields-and-submit' ).slideUp( function() {});
			$form.find( '.hb-searched-summary' ).slideDown();
			$booking_wrapper.find( '.hb-accom-list' ).html( response.mark_up );
			if ( ( $form.find( '.hb-accom' ).length ) && ( $form.find( '.hb-accom' ).val() != 'all' ) ) {
				set_selected_accom( $booking_wrapper, $form.find( '.hb-accom' ).val() );
			}
			if ( $booking_wrapper.data( 'results-show-only-accom-id' ) != '' ) {
				var accom_id = $booking_wrapper.data( 'results-show-only-accom-id' );
				if ( $booking_wrapper.find( '.hb-accom-id-' + accom_id ).length != 0 ) {
					$booking_wrapper.find( '.hb-search-result-title-section' ).hide();
					$booking_wrapper.find( '.hb-accom' ).hide();
					$booking_wrapper.find( '.hb-accom-id-' + accom_id ).show();
					set_selected_accom( $booking_wrapper, accom_id );
				}
			}
			$booking_wrapper.find( '.hb-accom-list' ).slideDown();
			if ( typeof window['hbook_show_accom_list'] == 'function' ) {
				window['hbook_show_accom_list']();
			}
			hb_format_date();
			resize_price_caption();
		}
	}

	function change_search( $booking_wrapper ) {
		$booking_wrapper.data( 'results-show-only-accom-id', '' );
		$booking_wrapper.find( '.hb-chosen-options' ).val( '' );
		$booking_wrapper.find( '.hb-chosen-accom-num' ).val( '' );
		$booking_wrapper.find( '.hb-accom-list' ).slideUp();
		$booking_wrapper.find( '.hb-booking-details-form, .hb-admin-booking-details-form' ).slideUp();
		$booking_wrapper.find( '.hb-coupon-code' ).val( '' );
		$booking_wrapper.find( '.hb-pre-validated-coupon-id' ).val( '' );
		$booking_wrapper.find( '.hb-coupon-amount' ).html( '0' );
		$booking_wrapper.find( '.hb-coupon-msg, .hb-coupon-error' ).slideUp();
		$booking_wrapper.find( '.hb-searched-summary' ).slideUp( function() {
			$booking_wrapper.find( '.hb-search-fields-and-submit' ).slideDown();
		});
	}

	$( '.hb-change-search-wrapper input' ).click( function( e ) {
		e.preventDefault();
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		change_search( $booking_wrapper );
	});

	$( '.hbook-wrapper' ).on( 'click', '.hb-other-search', function() {
		var $form = $( this ).parents( '.hb-booking-search-form' );
		$form.data( 'search-only', 'yes' );
		$form.submit();
		return false;
	});

	/* end booking search */

	/* ------------------------------------------------------------------------------------------- */

	/* accom selection */

	$( '.hb-accom-list' ).on( 'click', '.hb-view-price-breakdown', function() {
		var $self = $( this );
		$self.blur();
		$self.parents( '.hb-accom' ).find( '.hb-price-breakdown' ).slideToggle( function() {
			if ( $( this ).is( ':visible' ) ) {
				$self.find( '.hb-price-bd-hide-text' ).show();
				$self.find( '.hb-price-bd-show-text' ).hide();
			} else {
				$self.find( '.hb-price-bd-hide-text' ).hide();
				$self.find( '.hb-price-bd-show-text' ).show();
			}
		});
		return false;
	});

	$( '.hb-accom-list' ).on( 'click', '.hb-view-accom input', function( e ) {
		e.preventDefault();
		$( this ).blur();
		window.open( $( this ).data( 'accom-url' ), '_blank' );
	});

	$( '.hb-accom-list' ).on( 'click', '.hb-select-accom input', function( e ) {
		e.preventDefault();
		$( this ).blur();
		var accom_id = $( this ).parents( '.hb-accom' ).data( 'accom-id' ),
			$booking_wrapper = $( this ).parents( '.hbook-wrapper' ),
			$form = $booking_wrapper.find( '.hb-booking-search-form' );
		if ( $form.attr( 'action' ) == '#' ) {
			set_selected_accom( $booking_wrapper, accom_id );
		} else {
			$form.data( 'booking-details-redirection', 'yes' );
			$form.find( '.hb-results-show-only-accom-id' ).val( accom_id );
			$form.submit();
		}
	});

	function set_selected_accom( $booking_wrapper, accom_id ) {
		$booking_wrapper.find( '.hb-accom' ).removeClass( 'hb-accom-selected' );
		$booking_wrapper.find( '.hb-accom-id-' + accom_id ).addClass( 'hb-accom-selected' );
		$booking_wrapper.find( '.hb-coupon-code' ).val( '' );
		$booking_wrapper.find( '.hb-coupon-amount' ).html( '0' );

		var discount_amount = 0;
		var discount_amount_type = 'fixed';
		if ( $booking_wrapper.find( '.hb-accom-selected .hb-price-breakdown-global-discount' ).length ) {
			discount_amount = $booking_wrapper.find( '.hb-accom-selected .hb-global-discount-amount' ).html();
			discount_amount_type = $booking_wrapper.find( '.hb-accom-selected .hb-global-discount-type' ).html();
		}
		$booking_wrapper.find( 'input[name="hb-global-discount-amount"]' ).val( discount_amount );
		$booking_wrapper.find( 'input[name="hb-global-discount-amount-type"][value="' + discount_amount_type + '"]' ).prop( 'checked', true );

		calculate_options_price( $booking_wrapper );
		calculate_total_price( $booking_wrapper );
		set_summary_info( $booking_wrapper );
		set_details_form_info( $booking_wrapper, accom_id );
		$booking_wrapper.find( '.hb-policies-error, .hb-confirm-error, .hb-option, .hb-select-accom-num-form, .hb-select-accom-id-num' ).hide();
		$booking_wrapper.find( '.hb-booking-details-form, .hb-admin-booking-details-form' ).slideDown();
		resize_forms();
		if (
			$booking_wrapper.find( '.hb-select-accom-' + accom_id + '-num' ).length &&
			( $booking_wrapper.find( '.hb-select-accom-' + accom_id + '-num input' ).length > 1 )
		) {
			$booking_wrapper.find( '.hb-select-accom-num-form' ).slideDown();
			$booking_wrapper.find( '.hb-select-accom-' + accom_id + '-num' ).slideDown();
		}
		if ( hb_booking_form_data.is_admin == 'yes' ) {
			if ( $booking_wrapper.find( '.hb-accom-id-' + accom_id ).hasClass( 'hb-accom-available' ) ) {
				$( '#hb-resa-customer-details-wrap, .hb-confirm-area' ).slideDown();
				$( '.hb-accom-not-available-msg' ).slideUp();
			} else {
				$( '#hb-resa-customer-details-wrap, .hb-confirm-area' ).slideUp();
				$( '.hb-accom-not-available-msg' ).slideDown();
			}
		}
		if ( $booking_wrapper.find( '.hb-option-accom-' + accom_id ).length ) {
			$booking_wrapper.find( '.hb-options-form' ).slideDown();
			$booking_wrapper.find( '.hb-option-accom-' + accom_id ).slideDown();
		} else {
			$booking_wrapper.find( '.hb-options-form' ).slideUp();
		}

		var target;
		if ( $booking_wrapper.data( 'status' ) == 'external-payment-cancel' ) {
			target = '.hb-payment-info-wrapper';
		} else {
			if (
				$booking_wrapper.find( '.hb-select-accom-' + accom_id + '-num' ).length &&
				( $booking_wrapper.find( '.hb-select-accom-' + accom_id + '-num input' ).length > 1 )
			) {
				target = '.hb-select-accom-num-form';
			} else if ( $booking_wrapper.find( '.hb-option-accom-' + accom_id ).length ) {
				target = '.hb-options-form';
			} else {
				if ( hb_booking_form_data.is_admin != 'yes' ) {
					target = '.hb-booking-details-form';
				} else {
					target = '.hb-admin-booking-details-form';
				}
			}
		}
		setTimeout( function() {
			var top = $booking_wrapper.find( target ).offset().top;
			if ( hb_booking_form_data.is_admin != 'yes' ) {
				top -= page_padding_top;
			} else {
				top -= adminbar_height;
			}
			$( 'html, body' ).animate({ scrollTop: top });
		}, 800 );
	}

	$( '.hb-accom-list' ).on( 'change', '.hb-select-accom-num-form input', function() {
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		set_summary_info( $booking_wrapper );
	});

	/* end accom selection */

	/* ------------------------------------------------------------------------------------------- */

	/* options selection */

	$( '.hb-accom-list' ).on( 'click', '.hb-option', function() {
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		verify_option_max( $booking_wrapper );
		calculate_options_price( $booking_wrapper );
		calculate_total_price( $booking_wrapper );
	});

	$( '.hb-accom-list' ).on( 'keyup', '.hb-option input', function() {
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		verify_option_max( $booking_wrapper );
		calculate_options_price( $booking_wrapper );
		calculate_total_price( $booking_wrapper );
	});

	function verify_option_max( $booking_wrapper ) {
		$booking_wrapper.find( '.hb-option' ).each( function() {
			if ( $( this ).hasClass( 'hb-quantity-option' ) && $( this ).find( 'input' ).attr( 'max' ) ) {
				if ( parseInt( $( this ).find( 'input' ).val() ) > parseInt( $( this ).find( 'input' ).attr( 'max' ) ) ) {
					$( this ).find( 'input' ).val( $( this ).find( 'input' ).attr( 'max' ) );
				}
			}
		});
	}

	function calculate_options_price( $booking_wrapper ) {
		var accom_id = $booking_wrapper.find( '.hb-accom-selected' ).data( 'accom-id' ),
			options_price = 0;

		$booking_wrapper.find( '.hb-option' ).each( function() {
			if ( $( this ).hasClass( 'hb-option-accom-' + accom_id ) ) {
				if ( $( this ).hasClass( 'hb-quantity-option' ) ) {
					if ( $( this ).find( 'input' ).val() < 0 ) {
						$( this ).find( 'input' ).val( 0 );
					}
					options_price += parseFloat( $( this ).find( 'input' ).data( 'price' ) * $( this ).find( 'input' ).val() );
				} else if ( $( this ).hasClass( 'hb-multiple-option' ) && $( this ).find( 'input:checked' ).length ) {
					options_price += parseFloat( $( this ).find( 'input:checked' ).data( 'price' ) );
				} else if ( $( this ).hasClass( 'hb-single-option' ) && $( this ).find( 'input' ).is(':checked' ) ) {
					options_price += parseFloat( $( this ).find( 'input' ).data( 'price' ) );
				}
			}
		});

		$booking_wrapper.find( '.hb-options-price-raw' ).val( options_price );
		if ( options_price != 0 ) {
			options_price = format_price( options_price );
			if ( options_price < 0 ) {
				options_price = format_price( options_price * -1 );
				$booking_wrapper.find( '.hb-summary-options-price .hb-price-placeholder-minus, .hb-options-total-price .hb-price-placeholder-minus' ).css( 'display', 'inline' );
			} else {
				$booking_wrapper.find( '.hb-summary-options-price .hb-price-placeholder-minus, .hb-options-total-price .hb-price-placeholder-minus' ).css( 'display', 'none' );
			}
			$booking_wrapper.find( '.hb-summary-options-price .hb-price-placeholder, .hb-options-total-price .hb-price-placeholder' ).html( options_price );
			$booking_wrapper.find( '.hb-summary-options-price, .hb-options-total-price' ).show();
		} else {
			$booking_wrapper.find( '.hb-summary-options-price, .hb-options-total-price' ).hide();
		}

	}

	/* end options selection */

	/* ------------------------------------------------------------------------------------------- */

	/* coupons */

	$( '.hb-apply-coupon' ).click( function() {
		var $form = $( this ).parents( '.hb-booking-details-form' );
		$form.find( '.hb-coupon-error, .hb-coupon-msg' ).slideUp();
		if ( ! $form.find( '.hb-coupon-code' ).val() ) {
			$form.find( '.hb-coupon-msg' ).html( hb_text.no_coupon ).slideDown();
			$form.find( '.hb-coupon-amount' ).html( '0' );
			calculate_total_price( $form.parents( '.hbook-wrapper' ) );
			return false;
		}
		$( this ).prop( 'disabled', true ).blur();
		$form.find( '.hb-processing-coupon' ).show();
		$.ajax({
			data: {
				'action': 'hb_verify_coupon',
				'check_in': $form.find( '.hb-details-check-in' ).val(),
				'check_out': $form.find( '.hb-details-check-out' ).val(),
				'accom_id': $form.find( '.hb-details-accom-id' ).val(),
				'coupon_code': $form.find( '.hb-coupon-code' ).val(),
			},
			success: function( response ) {
				coupon_verify_result( response, $form );
			},
			type : 'POST',
			timeout: hb_booking_form_data.ajax_timeout,
			url: hb_booking_form_data.ajax_url,
			error: function( jqXHR, textStatus, errorThrown ) {
				$form.find( '.hb-processing-coupon' ).hide();
				$form.find( '.hb-coupon-error' ).html( hb_text.connection_error ).slideDown();
				$form.find( '.hb-apply-coupon' ).prop( 'disabled', false );
				console.log( jqXHR );
				console.log( textStatus );
				console.log( errorThrown );
			}
		});
		return false;
	});

	function coupon_verify_result( response_text, $form ) {
		$form.find( '.hb-apply-coupon' ).prop( 'disabled', false );
		$form.find( '.hb-processing-coupon' ).hide();
		try {
			var response = JSON.parse( response_text );
		} catch ( e ) {
			$form.find( '.hb-coupon-error' ).html( 'An error occured. ' + response_text ).slideDown();
			return false;
		}
		if ( response['success'] ) {
			$form.find( '.hb-coupon-amount' ).html( response['coupon_amount'] );
			$form.find( '.hb-coupon-type' ).html( response['coupon_type'] );
			$form.find( '.hb-pre-validated-coupon-id' ).val( response['coupon_id'] );
		} else {
			$form.find( '.hb-coupon-amount' ).html( '0' );
		}
		$form.find( '.hb-coupon-msg' ).html( response['msg'] ).slideDown();
		calculate_total_price( $form.parents( '.hbook-wrapper' ) );
	}

	/* end coupons */

	/* ------------------------------------------------------------------------------------------- */

	/* admin global discount */

	$( '#hb-global-discount-amount, input[name="hb-global-discount-amount-type"]' ).click( function() {
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		calculate_total_price( $booking_wrapper );
	});

	$( '#hb-global-discount-amount' ).keyup( function() {
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		calculate_total_price( $booking_wrapper );
	});

	/* end admin global discount */

	/* ------------------------------------------------------------------------------------------- */

	/* total price */

	function calculate_total_price( $booking_wrapper ) {
		var accom_id = $booking_wrapper.find( '.hb-accom-selected' ).data( 'accom-id' ),
			accom_price = $booking_wrapper.find( '.hb-accom-selected' ).find( '.hb-accom-price-raw' ).val(),
			options_price = $booking_wrapper.find( '.hb-options-price-raw' ).val(),
			coupon_amount = $booking_wrapper.find( '.hb-coupon-amount' ).html(),
			coupon_type = $booking_wrapper.find( '.hb-coupon-type' ).html(),
			price_before_coupon,
			has_shown_fees = false,
			price_before_fees,
			fees_price,
			fee_price,
			fee_base;

		price_before_coupon = parseFloat( accom_price ) + parseFloat( options_price );
		if ( coupon_amount && coupon_type == 'percent' ) {
			coupon_amount = price_before_coupon  * coupon_amount / 100;
		}
		if ( coupon_amount > 0 ) {
			$( '.hb-summary-coupon-amount span' ).html( format_price( coupon_amount ) );
			$( '.hb-summary-coupon-amount' ).show();
		} else {
			$( '.hb-summary-coupon-amount' ).hide();
		}

		var discount_amount = $booking_wrapper.find( 'input[name="hb-global-discount-amount"]' ).val();
		var discount_type = $booking_wrapper.find( 'input[name="hb-global-discount-amount-type"]:checked' ).val();
		if ( discount_type == 'percent' ) {
			discount_amount = price_before_coupon  * discount_amount / 100;
		}
		$( '.hb-summary-discount-amount' ).hide();
		if ( discount_amount > 0 ) {
			if (
				( hb_booking_form_data.is_admin != 'yes' ) ||
				( ( hb_booking_form_data.is_admin == 'yes' ) && ( discount_type == 'percent' ) )
			) {
				$( '.hb-summary-discount-amount span' ).html( format_price( discount_amount ) );
				$( '.hb-summary-discount-amount' ).show();
			} else {
				$( '.hb-summary-discount-amount' ).hide();
			}
		}

		price_before_fees = price_before_coupon - coupon_amount - discount_amount;

		$booking_wrapper.find( '.hb-fee-accom-not-included-wrapper' ).html( '' );
		if ( $booking_wrapper.find( '.hb-accom-selected .hb-fee-accom-final' ).length ) {
			if (
				( hb_booking_form_data.is_admin != 'yes' ) &&
				( ! $booking_wrapper.find( '.hb-resa-summary-content .hb-fee-not-included' ).length )
			) {
				$booking_wrapper.find( '.hb-fee-accom-not-included-wrapper' ).append( '<br/>' );
			}
			$booking_wrapper.find( '.hb-accom-selected .hb-fee-accom-final' ).each( function() {
				if ( $( this ).find( 'span' ).data( 'price' ) > 0 ) {
					$booking_wrapper.find( '.hb-fee-accom-not-included-wrapper' ).append( '<span class="hb-fee hb-fee-accom-final">' + $( this ).html() + '</span>' );
					has_shown_fees = true;
				}
			});
		}

		fees_price = 0;
		$booking_wrapper.find( '.hb-fee-not-included' ).each( function() {
			fee_price = 0;
			fee_base = 0;
			if ( $( this ).hasClass( 'hb-fee-percentage' ) ) {
				fee_base = price_before_fees;
			} else if ( $( this ).hasClass( 'hb-fee-accom-percentage' ) ) {
				if (
					$( this ).hasClass( 'hb-fee-accom-percentage-all-accom' ) ||
					$( this ).hasClass( 'hb-fee-accom-percentage-accom-' + accom_id )
				) {
					fee_base = accom_price;
				}
			} else if ( $( this ).hasClass( 'hb-fee-extras-percentage' ) ) {
				fee_base = options_price;
			} else {
				fee_price = $( this ).data( 'price' );
			}
			if ( fee_base > 0 ) {
				fee_price = fee_base * $( this ).data( 'price' ) / 100;
			}
			fees_price += parseFloat( fee_price );
			if ( fee_price > 0 ) {
				$( this ).show();
				has_shown_fees = true;
			} else {
				$( this ).hide();
			}
			$( this ).find( '.hb-fee-base' ).html( format_price( fee_base ) );
			$( this ).find( '.hb-fee-price' ).html( format_price( fee_price ) );
		});

		$booking_wrapper.find( '.hb-resa-summary-content .hb-fee-accom-final, .hb-admin-booking-details-form .hb-fee-accom-final' ).each( function() {
			fees_price += parseFloat( $( this ).find( 'span' ).data( 'price' ) );
		});

		if ( has_shown_fees ) {
			$booking_wrapper.find( '.hb-admin-add-resa-section-title-fees' ).show();
		} else {
			$booking_wrapper.find( '.hb-admin-add-resa-section-title-fees' ).hide();
		}

		var total_price = price_before_fees + fees_price;

		var included_fee_total_percent_extras = 0;
		var included_fee_total_percent_global = 0;
		$booking_wrapper.find( '.hb-fee-included' ).each( function() {
			var included_fee_percent = $( this ).data( 'price' );
			if ( $( this ).hasClass( 'hb-fee-percentage' ) ) {
				included_fee_total_percent_global += parseFloat( included_fee_percent );
			} else if ( $( this ).hasClass( 'hb-fee-extras-percentage' ) ) {
				included_fee_total_percent_extras += parseFloat( included_fee_percent );
			}
		});

		var extras_price_before_included_fees = options_price / ( 1 + ( included_fee_total_percent_extras / 100 ) );
		var total_price_before_included_fees = total_price / ( 1 + ( included_fee_total_percent_global / 100 ) );
		$booking_wrapper.find( '.hb-fee-included' ).each( function() {
			fee_price = 0;
			fee_base = 0;
			if ( $( this ).hasClass( 'hb-fee-percentage' ) ) {
				fee_base = total_price_before_included_fees;
			} else if ( $( this ).hasClass( 'hb-fee-extras-percentage' ) ) {
				fee_base = extras_price_before_included_fees;
			}
			fee_price = fee_base * $( this ).data( 'price' ) /  100;
			if ( fee_price > 0 ) {
				$( this ).show();
			} else {
				$( this ).hide();
			}
			fee_base = format_price( fee_base );
			fee_price = format_price( fee_price );
			$( this ).find( '.hb-fee-base' ).html( format_price( fee_base ) );
			$( this ).find( '.hb-fee-price' ).html( format_price( fee_price ) );
		});

		var has_included_accom_fees = false;
		$booking_wrapper.find( '.hb-fee-accom-included-subwrapper' ).html( '' );
		$booking_wrapper.find( '.hb-accom-selected .hb-fee-accom-included' ).each( function() {
			$booking_wrapper.find( '.hb-fee-accom-included-subwrapper' ).append( '<div class="hb-fee-accom-included"><small>' + $( this ).html() + '</small></div>' );
			has_included_accom_fees = true;
		});

		if ( has_included_accom_fees ) {
			$booking_wrapper.find( '.hb-fee-accom-included-wrapper' ).show();
		} else {
			$booking_wrapper.find( '.hb-fee-accom-included-wrapper' ).hide();
		}

		if ( options_price != 0 || coupon_amount > 0 || fees_price != 0 || has_included_accom_fees ) {
			$booking_wrapper.find( '.hb-summary-accom-price' ).show();
		} else {
			$booking_wrapper.find( '.hb-summary-accom-price' ).hide();
		}

		if ( total_price < 0 ) {
			total_price = 0;
		}

		var deposit_amount = 0;
		if ( hb_booking_form_data.deposit_type == 'nb_night' ) {
			deposit_amount = ( total_price / $booking_wrapper.find( '.hb-booking-nb-nights' ).html() ) * hb_booking_form_data.deposit_amount;
		} else if ( hb_booking_form_data.deposit_type == 'percentage' ) {
			deposit_amount = total_price * hb_booking_form_data.deposit_amount / 100;
		} else if ( hb_booking_form_data.deposit_type == 'fixed' ) {
			deposit_amount = hb_booking_form_data.deposit_amount;
		}
		if ( deposit_amount > total_price ) {
			deposit_amount = total_price;
		}

		var charged_deposit_amount = parseFloat( deposit_amount );
		if ( hb_booking_form_data.security_bond_deposit == 'yes' ) {
			charged_deposit_amount += parseFloat( hb_booking_form_data.security_bond );
		}

		var charged_total_price = total_price + parseFloat( hb_booking_form_data.security_bond );
		var charged_total_minus_deposit = charged_total_price - charged_deposit_amount;

		if ( ( charged_total_price <= 0 ) && ( charged_deposit_amount <= 0 ) ) {
			$booking_wrapper.find( '.hb-payment-info-wrapper' ).hide();
			$booking_wrapper.find( 'input.hb-payment-type-null-price' ).prop( 'checked', true );
		} else {
			$booking_wrapper.find( '.hb-payment-info-wrapper' ).show();
			if ( $booking_wrapper.find( 'input.hb-payment-type-null-price' ).prop( 'checked' ) ) {
				$booking_wrapper.find( 'input[name="hb-payment-type"]' ).first().prop( 'checked', true );
			}
		}

		deposit_amount = format_price( deposit_amount );
		total_price = format_price( total_price );
		charged_total_price = format_price( charged_total_price );
		charged_total_minus_deposit = format_price( charged_total_minus_deposit );
		charged_deposit_amount = format_price( charged_deposit_amount );

		$booking_wrapper.find( '.hb-summary-total-price > span' ).html( total_price );
		$booking_wrapper.find( '.hb-summary-deposit span' ).html( deposit_amount );

		$booking_wrapper.find( '.hb-payment-type-explanation-full_amount span' ).html( charged_total_price );
		$booking_wrapper.find( '.hb-payment-type-explanation-deposit_amount span' ).html( charged_deposit_amount );
		$booking_wrapper.find( '.hb-payment-type-explanation-full_minus_deposit_amount span' ).html( charged_total_minus_deposit );
	}

	/* end total price */

	/* ------------------------------------------------------------------------------------------- */

	/* summary info */

	function set_summary_info( $booking_wrapper ) {
		if ( $booking_wrapper.find( '.hb-accom-list .hb-accom' ).length > 1 ) {
			$booking_wrapper.find( '.hb-summary-change-accom' ).show();
		} else {
			$booking_wrapper.find( '.hb-summary-change-accom' ).hide();
		}
		$booking_wrapper.find( '.hb-summary-check-in' ).html( $booking_wrapper.find( '.hb-check-in-date' ).val() );
		$booking_wrapper.find( '.hb-summary-check-out' ).html( $booking_wrapper.find( '.hb-check-out-date' ).val() );
		$booking_wrapper.find( '.hb-summary-nights' ).html( $booking_wrapper.find( '.hb-booking-nb-nights' ).html() );
		$booking_wrapper.find( '.hb-summary-adults' ).html( $booking_wrapper.find( 'select.hb-adults' ).val() );
		$booking_wrapper.find( '.hb-summary-children' ).html( $booking_wrapper.find( 'select.hb-children' ).val() );
		var accom_title = '';
		if ( $booking_wrapper.find( '.hb-accom-selected .hb-accom-title a' ).length ) {
			accom_title = $booking_wrapper.find( '.hb-accom-selected .hb-accom-title a' ).html();
		} else {
			accom_title = $booking_wrapper.find( '.hb-accom-selected .hb-accom-title' ).html();
		}
		var accom_id = $booking_wrapper.find( '.hb-accom-selected' ).data( 'accom-id' );
		var accom_num_name = '';
		if (
			$booking_wrapper.find( '.hb-select-accom-' + accom_id + '-num' ).length &&
			( $booking_wrapper.find( '.hb-select-accom-' + accom_id + '-num input' ).length > 1 )
		) {
			var selected_num = $booking_wrapper.find( 'input[name="hb-accom-' + accom_id + '-num"]:checked' ).val();
			accom_num_name = $booking_wrapper.find( 'label[for="hb-accom-' + accom_id + '-' + selected_num + '"]' ).html();
		}
		var accom_price = $booking_wrapper.find( '.hb-accom-selected' ).find( '.hb-accom-price-raw' ).val();
		accom_price = format_price( accom_price );
		$booking_wrapper.find( '.hb-summary-accom' ).html( accom_title );
		$booking_wrapper.find( '.hb-summary-accom-num-name' ).html( accom_num_name );
		if ( accom_num_name ) {
			$booking_wrapper.find( '.hb-summary-accom-num-name-wrap' ).show();
		} else {
			$booking_wrapper.find( '.hb-summary-accom-num-name-wrap' ).hide();
		}
		$booking_wrapper.find( '.hb-summary-accom-price > span' ).html( accom_price );
	}

	$( '.hb-summary-change-search a' ).click( function() {
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		$( 'html, body' ).animate({ scrollTop: $booking_wrapper.find( '.hb-booking-search-form' ).offset().top - page_padding_top }, function() {
			setTimeout( change_search( $booking_wrapper ), 400 );
		});
		return false;
	});

	$( '.hb-summary-change-accom a' ).click( function() {
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		$booking_wrapper.find( '.hb-search-result-title-section' ).slideDown();
		$booking_wrapper.find( '.hb-accom' ).removeClass( 'hb-accom-selected' ).slideDown();
		$( 'html, body' ).animate({ scrollTop: $booking_wrapper.find( '.hb-accom-list' ).offset().top - page_padding_top });
		return false;
	});

	$( '.hb-summary-change-accom-num a' ).click( function() {
		var $booking_wrapper = $( this ).parents( '.hbook-wrapper' );
		$( 'html, body' ).animate({ scrollTop: $booking_wrapper.find( '.hb-select-accom-num-form' ).offset().top - page_padding_top });
		return false;
	});

	/* end summary info */

	/* ------------------------------------------------------------------------------------------- */

	/* details form info */

	function set_details_form_info( $booking_wrapper, accom_id ) {
		$booking_wrapper.find( '.hb-details-check-in' ).val( $booking_wrapper.find( '.hb-check-in-hidden' ).val() );
		$booking_wrapper.find( '.hb-details-check-out' ).val( $booking_wrapper.find( '.hb-check-out-hidden' ).val() );
		$booking_wrapper.find( '.hb-details-adults' ).val( $booking_wrapper.find( 'select.hb-adults' ).val() );
		$booking_wrapper.find( '.hb-details-children' ).val( $booking_wrapper.find( 'select.hb-children' ).val() );
		$booking_wrapper.find( '.hb-details-accom-id' ).val( accom_id );
		$booking_wrapper.find( '.hb-details-is-admin' ).val( hb_booking_form_data.is_admin );
	}

	/* end details form info */

	/* ------------------------------------------------------------------------------------------- */

	/* details form validation */

	if ( $( '.hb-booking-details-form' ).length ) {
		$.validate({
			form: '.hb-booking-details-form',
			validateOnBlur: false,
			language: {
				badEmail: hb_text.invalid_email,
				requiredField: hb_text.required_field,
				requiredFields: hb_text.required_field,
				groupCheckedTooFewStart: hb_text.required_field + '<span style="display: none">',
				groupCheckedEnd: '</span>',
				badInt: hb_text.invalid_number
			},
			borderColorOnError: false,
			scrollToTopOnError: false,
			onError: function( $form ) {
				$form.find( '.hb-confirm-button input' ).blur();
				$( 'html, body' ).animate({	scrollTop: $( '.has-error' ).first().offset().top - page_padding_top }, 400 );
			},
			onSuccess: function( $form ) {
				submit_booking_details( $form );
				return false;
			}
		});
	}

	$( '.hb-admin-booking-details-form' ).submit( function() {
		$( this ).find( 'input[type="submit"]' ).blur();
		if ( $( '#hb-admin-customer-type-id:checked' ).length ) {
			if ( ! $( '#hb-add-resa-customer-id-list' ).val() ) {
				alert( hb_text.customer_not_selected );
				return false;
			}
		}
		submit_booking_details( $( this ) );
		return false;
	});

	/* end details form validation */

	/* ------------------------------------------------------------------------------------------- */

	/* save reservation details */

	function submit_booking_details( $form ) {
		$form.find( '.hb-confirm-button input' ).blur();

		if ( $form.hasClass( 'submitted' ) ) {
			return false;
		}

		var policies_error = '';
		$form.find( '.hb-policies-error, .hb-confirm-error' ).hide();
		if ( $form.find( 'input[name="hb_terms_and_cond"]' ).length && ! $form.find( 'input[name="hb_terms_and_cond"]' ).prop( 'checked' ) ) {
			policies_error = hb_text.terms_and_cond_error;
		}
		if ( $form.find( 'input[name="hb_privacy_policy"]' ).length && ! $form.find( 'input[name="hb_privacy_policy"]' ).prop( 'checked' ) ) {
			if ( policies_error ) {
				policies_error += '<br/>';
			}
			policies_error += hb_text.privacy_policy_error;
		}
		if ( policies_error ) {
			$form.find( '.hb-policies-error' ).html( policies_error ).slideDown();
			$( 'html, body' ).animate({
				scrollTop: $form.find( '.hb-policies-area' ).offset().top - page_padding_top
			}, 1000 );
			return false;
		}

		var payment_type = $form.find( 'input[name="hb-payment-type"]:checked' ).val(),
			payment_processing = false;

		if ( payment_type == 'store_credit_card' || payment_type == 'deposit' || payment_type == 'full' ) {
			$form.find( '.hb-payment-flag' ).val( 'yes' );
			var gateway_id = $form.find( 'input[name="hb-payment-gateway"]:checked' ).val(),
				payment_process_function = 'hb_' + gateway_id + '_payment_process';
			if ( ! gateway_id ) {
				alert( 'Error: all payment gateways are inactive.' );
				return;
			}
			if ( typeof window[ payment_process_function ] == 'function' ) {
				disable_form_submission( $form );
				payment_processing = window[ payment_process_function ]( $form, save_resa_details );
				if ( ! payment_processing ) {
					enable_form_submission( $form );
					return;
				}
			}
		} else {
			$form.find( '.hb-payment-flag' ).val( '' );
		}

		if ( ! payment_processing ) {
			$form.find( '.hb-saving-resa' ).slideDown();
			save_resa_details( $form );
		}
	}

	function save_resa_details( $form ) {
		disable_form_submission( $form );
		var $options_form = $form.parents( '.hbook-wrapper' ).find( '.hb-options-form' ),
			$accom_num_form = $form.parents( '.hbook-wrapper' ).find( '.hb-select-accom-num-form' ),
			$forms;
		$forms = $form.add( $options_form );
		$forms = $forms.add( $accom_num_form );
		$.ajax({
			data: $forms.serialize(),
			success: function( response ) {
				after_form_details_submit( response, $form );
			},
			type : 'POST',
			timeout: hb_booking_form_data.ajax_timeout,
			url: hb_booking_form_data.ajax_url,
			error: function( jqXHR, textStatus, errorThrown ) {
				$form.find( '.hb-saving-resa, .hb-confirm-error, .hb-policies-error' ).slideUp();
				$form.find( '.hb-confirm-error' ).html( hb_text.connection_error ).slideDown();
				console.log( jqXHR );
				console.log( textStatus );
				console.log( errorThrown );
				enable_form_submission( $form );
			}
		});
	}

	function after_form_details_submit( response_text, $form ) {
		try {
			var response = JSON.parse( response_text );
		} catch ( e ) {
			enable_form_submission( $form );
			$form.find( '.hb-saving-resa' ).slideUp();
			$form.find( '.hb-confirm-error' ).html( response_text ).slideDown();
			return false;
		}
		if ( response['success'] ) {
			var payment_type = $form.find( 'input[name="hb-payment-type"]:checked' ).val(),
				payment_has_redirection = $form.find( 'input[name="hb-payment-gateway"]:checked' ).data( 'has-redirection' );
			if ( ( payment_type == 'deposit' || payment_type == 'full' ) && ( payment_has_redirection == 'yes' ) ) {
				var gateway_id = $form.find( 'input[name="hb-payment-gateway"]:checked' ).val(),
					payment_process_redirection = 'hb_' + gateway_id + '_payment_redirection';
				window[ payment_process_redirection ]( $form, response );
			} else {
				enable_form_submission( $form );
				$form.find( '.hb-saving-resa' ).slideUp();
				if ( hb_booking_form_data.is_admin != 'yes' ) {
					$form.find( '.hb-resa-done-email' ).html( $form.find( 'input[name="hb_email"]' ).val() );
					$form.find( '.hb-summary-change-search, .hb-summary-change-accom, .hb-summary-change-accom-num' ).hide();
					$( 'html, body' ).animate({ scrollTop: $form.parents( '.hbook-wrapper' ).offset().top - page_padding_top }, 1000, function() {
						$form.parents( '.hbook-wrapper' ).find( '.hb-booking-search-form, .hb-accom-list, .hb-details-fields, .hb-coupons-area, .hb-resa-summary-title, .hb-confirm-area, .hb-policies-area, .hb-payment-info-wrapper, .hb-resa-summary' ).fadeOut( 1000, function() {
							if ( payment_type == 'deposit' || payment_type == 'full' ) {
								$form.find( '.hb-resa-payment-msg' ).show();
							} else {
								$form.find( '.hb-resa-done-msg' ).show();
							}
							$form.find( '.hb-resa-summary' ).slideDown();
						});
					});
					if ( typeof window['hbook_reservation_done'] == 'function' ) {
						window['hbook_reservation_done']();
					}
				} else {
					hb_new_admin_resa = response;
					change_search( $form.parents( '.hbook-wrapper' ) );
					$( '#hb-process-new-admin-resa' ).submit();
				}
			}
		} else {
			if ( response['error_msg'] == 'payment_requires_action' ) {
				var gateway_id = $form.find( 'input[name="hb-payment-gateway"]:checked' ).val(),
					payment_requires_action = 'hb_' + gateway_id + '_payment_requires_action';
				window[ payment_requires_action ]( $form, response );
			} else {
				enable_form_submission( $form );
				$form.find( '.hb-saving-resa' ).slideUp();
				$form.find( '.hb-confirm-error' ).html( response['error_msg'] ).slideDown();
			}
		}
	}

	/* end save reservation details */

	/* ------------------------------------------------------------------------------------------- */

	/* external payment confirmation */

	if ( $( '#hb-resa-confirm-done' ).length ) {
		$( '#hb-resa-confirm-done' ).parent('.hb-accom-list-booking-form' ).show();
		hb_format_date();
		if ( typeof window['hbook_reservation_done'] == 'function' ) {
			window['hbook_reservation_done']();
		}
		$( 'html, body' ).animate({ scrollTop: $( '#hb-resa-confirm-done' ).offset().top - page_padding_top }, 1000 );
	}

	/* end external payment confirmation */

	/* ------------------------------------------------------------------------------------------- */

	/* payment type and method init */

	$( '.hb-booking-details-form' ).each( function() {
		$( this ).find( 'input[name="hb-payment-type"]' ).first().prop( 'checked', true );
		$( this ).find( 'input[name="hb-payment-gateway"]' ).first().prop( 'checked', true );
		hide_show_payment_explanation( $( this ) );
		hide_show_payment_gateway_choice( $( this ) );
		hide_show_payment_gateway_form( $( this ) );
		hide_show_bottom_area( $( this ) );
	});

	/* end payment type and method init */

	/* ------------------------------------------------------------------------------------------- */

	/* payment gateway choice */

	$( 'input[name="hb-payment-type"]' ).change( function() {
		hide_show_payment_explanation( $( this ).parents( 'form' ) );
		hide_show_payment_gateway_choice( $( this ).parents( 'form' ) );
		hide_show_bottom_area( $( this ).parents( 'form' ) );
	});

	$( 'input[name="hb-payment-gateway"]' ).change( function() {
		hide_show_payment_gateway_form( $( this ).parents( 'form' ) );
		hide_show_bottom_area( $( this ).parents( 'form' ) );
	});

	function hide_show_payment_explanation( $form ) {
		var payment_type = $form.find( 'input[name="hb-payment-type"]:checked' ).val();
		$form.find( '.hb-payment-type-explanation' ).hide();
		$form.find( '.hb-payment-type-explanation-' + payment_type ).slideDown();
	}

	function hide_show_payment_gateway_choice( $form ) {
		var payment_type = $form.find( 'input[name="hb-payment-type"]:checked' ).val();
		if ( payment_type == 'store_credit_card' || payment_type == 'deposit' || payment_type == 'full' ) {
			$form.find( '.hb-payment-method-wrapper' ).slideDown();
		} else {
			$form.find( '.hb-payment-method-wrapper' ).slideUp();
		}
		if ( payment_type == 'store_credit_card' ) {
			$form.find( '.hb-payment-method' ).slideUp();
			$form.find( 'input[name="hb-payment-gateway"][value="stripe"]' ).prop( 'checked', true );
			if ( $form.find( '.hb-payment-form-stripe' ).css( 'display' ) == 'none' ) {
				$form.find( '.hb-payment-form' ).slideUp();
				$form.find( '.hb-payment-form-stripe' ).slideDown();
			}
		} else {
			$form.find( '.hb-payment-method' ).slideDown();
		}
	}

	function hide_show_payment_gateway_form( $form ) {
		$form.find( '.hb-payment-form' ).slideUp();
		var gateway_id = $form.find( 'input[name="hb-payment-gateway"]:checked' ).val();
		$form.find( '.hb-payment-form-' + gateway_id ).slideDown();
	}

	function hide_show_bottom_area( $form ) {
		var payment_type = $form.find( 'input[name="hb-payment-type"]:checked' ).val();
		if ( payment_type == 'deposit' || payment_type == 'full' ) {
			var gateway_id = $form.find( 'input[name="hb-payment-gateway"]:checked' ).val();
			if ( $form.find( '.hb-bottom-area-content-' + gateway_id ).length ) {
				var bottom_area_content = $form.find( '.hb-bottom-area-content-' + gateway_id ).html();
				$form.find( '.hb-bottom-area' ).html( bottom_area_content ).slideDown();
			} else {
				$form.find( '.hb-bottom-area' ).slideUp();
			}
		} else {
			$form.find( '.hb-bottom-area' ).slideUp();
		}
	}

	/* end payment gateway choice */

	/* ------------------------------------------------------------------------------------------- */

	/* misc */

	function format_price( price ) {
		if ( hb_booking_form_data.price_precision == 'no_decimals' ) {
			var formatted_price = Math.round( price );
		} else {
			var formatted_price = parseFloat( price ).toFixed( 2 );
		}
		var price_parts = formatted_price.toString().split( '.' );
		if ( hb_booking_form_data.thousands_sep ) {
			price_parts[0] = price_parts[0].replace( /\B(?=(\d{3})+(?!\d))/g, hb_booking_form_data.thousands_sep );
		}
		return price_parts.join( hb_booking_form_data.decimal_point );
	}

	function disable_form_submission( $form ) {
		$form.addClass( 'submitted' );
		$form.find( 'input[type="submit"]' ).prop( 'disabled', true );
	}

	function enable_form_submission( $form ) {
		$form.removeClass( 'submitted' );
		$form.find( 'input[type="submit"]' ).prop( 'disabled', false );
	}

	function debouncer( func ) {
		var timeoutID,
			timeout = 50;
		return function () {
			var scope = this,
				args = arguments;
			clearTimeout( timeoutID );
			timeoutID = setTimeout( function () {
				func.apply( scope, Array.prototype.slice.call( args ) );
			}, timeout );
		}
	}

	function resize_forms() {
		$( '.hb-booking-search-form' ).each( function() {
			var body_class = '';
			if ( $( this ).attr( 'id' ) != '' ) {
				body_class = 'hb-' + $( this ).attr('id') + '-is-vertical';
			}
			if ( $( this ).width() < hb_booking_form_data.horizontal_form_min_width ) {
				$( this ).addClass( 'hb-vertical-search-form' );
				$( this ).removeClass( 'hb-horizontal-search-form' );
				$( 'body' ).addClass( body_class );
			} else {
				$( this ).removeClass( 'hb-vertical-search-form' );
				$( this ).addClass( 'hb-horizontal-search-form' );
				$( 'body' ).removeClass( body_class );
			}
			if ( $( this ).width() < 400 ) {
				$( this ).addClass( 'hb-narrow-search-form' );
			} else {
				$( this ).removeClass( 'hb-narrow-search-form' );
			}
		});
		$( '.hb-booking-details-form' ).each( function() {
			if ( $( this ).width() < hb_booking_form_data.details_form_stack_width ) {
				$( this ).addClass( 'hb-details-form-stacked' );
			} else {
				$( this ).removeClass( 'hb-details-form-stacked' );
			}
		});
	}

	function resize_price_caption() {
		$( '.hb-accom-list' ).each( function() {
			if ( $( this ).width() < 600 ) {
				$( this ).find( '.hb-accom-price-caption br' ).show();
				$( this ).find( '.hb-accom-price-caption-dash' ).hide();
				$( this ).find( '.hb-accom-price-caption' ).addClass( 'hb-accom-price-caption-small' );
			} else {
				$( this ).find( '.hb-accom-price-caption br' ).hide();
				$( this ).find( '.hb-accom-price-caption-dash' ).show();
				$( this ).find( '.hb-accom-price-caption' ).removeClass( 'hb-accom-price-caption-small' );
			}
		});
	}

	$( window ).resize( debouncer ( function () {
		resize_forms();
		resize_price_caption();
	})).resize();

	/* end misc */

	/* ------------------------------------------------------------------------------------------- */

	/* status processing */

	$( '.hbook-wrapper-booking-form' ).each( function() {
		var $booking_wrapper = $( this ),
			$search_form = $booking_wrapper.find( '.hb-booking-search-form' );
		if ( $search_form.find( '.hb-check-in-hidden' ).val() != '' ) {
			var check_in = hb_date_str_2_obj( $search_form.find( '.hb-check-in-hidden' ).val() ),
				check_out = hb_date_str_2_obj( $search_form.find( '.hb-check-out-hidden' ).val() );
			check_in = $.datepick.formatDate( hb_date_format, check_in );
			check_out = $.datepick.formatDate( hb_date_format, check_out );
			$search_form.find( '.hb-check-in-date' ).val( check_in );
			$search_form.find( '.hb-check-out-date' ).val( check_out );
			$search_form.find( 'select.hb-adults' ).val( $search_form.find( '.hb-adults-hidden' ).val() );
			$search_form.find( 'select.hb-children' ).val( $search_form.find( '.hb-children-hidden' ).val() );
			if ( $search_form.find( '.dk-select.hb-adults' ).length ) {
				$search_form.find( 'select.hb-adults' ).dropkick( 'select', $search_form.find( 'select.hb-adults' ).val() );
			}
			if ( $search_form.find( '.dk-select.hb-children' ).length ) {
				$search_form.find( 'select.hb-children' ).dropkick( 'select', $search_form.find( 'select.hb-children' ).val() );
			}
		}

		if ( $booking_wrapper.data( 'status' ) == 'search-accom' ) {
			$( 'html, body' ).animate({ scrollTop: $search_form.offset().top - page_padding_top }, function() {
				$search_form.submit();
			});
			return false;
		}

		if ( $booking_wrapper.data( 'status' ) == 'external-payment-cancel' ) {
			$search_form.submit();
			return false;
		}

		if (
			$booking_wrapper.data( 'status' ) == '' ||
			$booking_wrapper.data( 'status' ) == 'external-payment-timeout' ||
			$booking_wrapper.data( 'status' ) == 'external-payment-confirm-error'
		) {
			setTimeout( function() {
				$( 'html, body' ).each( function() {
					$( this ).scrollTop( 0 );
				});
				if ( $booking_wrapper.data( 'status' ) == 'external-payment-timeout' ) {
					alert( hb_text.timeout_error );
				}
				if ( $booking_wrapper.data( 'status' ) == 'external-payment-confirm-error' ) {
					alert( hb_payment_confirmation_error );
				}
			}, 100 );
		}
	});

	/* end status processing */

	/* ------------------------------------------------------------------------------------------- */

});