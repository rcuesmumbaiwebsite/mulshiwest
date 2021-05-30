
var hb_datepicker_calendar_options = {
	changeMonth: false,
	prevText: '&lsaquo;',
	nextText: '&rsaquo;',
	prevStatus: '',
	nextStatus: '',
	dayStatus: '',
	dateFormat: hb_date_format,
	dayNamesMin: hb_day_names_min,
	monthNames: hb_months_name,
	firstDay: parseInt( hb_first_day, 10 ),
	defaultStatus: '',
	showAnim: 'fadeIn',
	useMouseWheel: false,
	renderer: {
		picker: '' +
		'<div class="hb-datepick-wrapper">' +
			'<div class="hb-dp-cmd-wrapper">{link:prev}{link:next}</div>' +
			'{months}' +
		'</div>',
		monthRow: '<div class="hb-dp-month-row hb-dp-clearfix">{months}</div>',
		month: '' +
		'<div class="hb-dp-month">' +
			'<div class="hb-dp-month-header">{monthHeader}</div>' +
			'<div class="hb-dp-week-header hb-dp-clearfix">{weekHeader}</div>' +
			'<div class="hb-dp-weeks">{weeks}</div>' +
		'</div>',
		weekHeader: '{days}',
		dayHeader: '<div>{day}</div>',
		week: '<div class="hb-dp-week hb-dp-clearfix">{days}</div>',
		day: '<div class="hb-dp-day">{day}</div>',
		monthSelector: '.hb-dp-month',
		daySelector: '.hb-dp-day',
		rtlClass: 'hb-dp-rtl',
		multiClass: 'hb-dp-multi',
		defaultClass: '',
		selectedClass: 'hb-dp-selected',
		highlightedClass: 'hb-dp-highlight',
		todayClass: 'hb-dp-today',
		otherMonthClass: 'datepick-other-month',
		weekendClass: 'hb-dp-weekend',
		commandClass: 'hb-dp-cmd',
		commandButtonClass: '',
		commandLinkClass: '',
		disabledClass: 'hb-dp-disabled'
	}
}

if ( hb_is_rtl == 'true' ) {
	hb_datepicker_calendar_options['isRTL'] = true;
} else {
	hb_datepicker_calendar_options['isRTL'] = false;
}

jQuery(document).ready(function($) {

	if ( ! $( '.hb-check-in-date' ).length ) {
		return;
	}

	$( 'body' ).append( '' +
		'<div class="hb-datepick-popup-wrapper">' +
			'<div class="hb-datepick-legend">' +
				'<div class="hb-datepick-selecting-legend">&nbsp;</div>' +
				'<div class="hb-datepick-custom-legend"></div>' +
				'<a class="hb-dp-cmd-close" href="#">&times;</a>' +
			'</div>' +
			'<div class="hb-datepick-popup hb-datepick-check-in-out"></div>' +
		'</div>'
	);

	var hb_check_in_out_datepicker_calendar_options = JSON.parse( JSON.stringify( hb_datepicker_calendar_options ) );
	hb_check_in_out_datepicker_calendar_options.renderer.picker = '<div class="hb-dp-cmd-wrapper">{link:prev}{link:next}</div>{months}';

	$( '.hb-datepick-popup' ).datepick( hb_check_in_out_datepicker_calendar_options );
	$( '.hb-datepick-popup' ).datepick( 'option', 'monthsToShow', 2 );

	var is_hb_dp_mobile = false,
		double_datepick_width,
		booking_rules,
		current_date_shown = new Date();

	if ( ( hb_min_date != '0' ) &&  ( hb_date_str_2_obj( hb_min_date ) > current_date_shown ) ) {
		current_date_shown = hb_date_str_2_obj( hb_min_date );
	}

	if ( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test( navigator.userAgent ) ) {
		is_hb_dp_mobile = true;
		$( '.hb-datepick-check-in-mobile-trigger, .hb-datepick-check-out-mobile-trigger, .hb-dp-cmd-close' ).css( 'display', 'block' );
	}

	$( '.hb-datepick-popup-wrapper' ).show();
	double_datepick_width = $( '.hb-datepick-popup-wrapper' ).width();
	$( '.hb-datepick-popup-wrapper' ).hide();

	$( '.hb-datepick-check-in-out' ).on( 'click', function( e ) {
		if ( $( e.target ).is( '.hb-dp-cmd-prev' ) && ! $( e.target ).is( '.hb-dp-disabled' ) ) {
			current_date_shown.setMonth( current_date_shown.getMonth() - 1 );
		} else if ( $( e.target ).is( '.hb-dp-cmd-next' ) && ! $( e.target ).is( '.hb-dp-disabled' ) ) {
			current_date_shown.setMonth( current_date_shown.getMonth() + 1 );
		}
	});

	function show_current_month() {
		var input_date,
			$input,
			months_shown;
		if ( $( '.hb-check-in-date' ).is( ':focus' ) ) {
			$input = $( '.hb-check-in-date:focus' );
		} else if ( $( '.hb-check-out-date' ).is( ':focus' ) ) {
			$input = $( '.hb-check-out-date:focus' );
		}
		try {
			input_date = $.datepick.parseDate( hb_date_format, $input.val() );
		} catch( e ) {
			input_date = false;
		}
		if ( input_date ) {
			var first_month_shown = current_date_shown.getMonth() + 1;
			if ( double_datepick_width > $( window ).width() ) {
				months_shown = [ first_month_shown ];
			} else {
				months_shown = [ first_month_shown, first_month_shown + 1 ];
			}
			if ( months_shown.indexOf( input_date.getMonth() + 1 ) == -1 ) {
				current_date_shown.setMonth( input_date.getMonth() );
			}
		}

		var y = current_date_shown.getFullYear(),
			m = current_date_shown.getMonth() + 1,
			d = current_date_shown.getDate();
		$( '.hb-datepick-popup' ).datepick( 'showMonth', y, m, d );
		setTimeout( function () {
			$( '.hb-datepick-popup' ).datepick( 'showMonth', y, m, d );
		}, 10 );
	}

	$( window ).resize( debouncer ( function () {
		if ( $( '.hb-datepick-active-inputs' ).length ) {
			resize_datepick();
			reposition_datepick( $( '.hb-datepick-active-inputs' ) );
		}
	}));

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

	function resize_datepick() {
		if ( double_datepick_width > $( window ).width() ) {
			$( '.hb-datepick-popup' ).datepick( 'option', 'monthsToShow', 1 );
		} else {
			$( '.hb-datepick-popup' ).datepick( 'option', 'monthsToShow', 2 );
		}
	}

	function reposition_datepick( $inputs_wrapper ) {
		var $check_in = $inputs_wrapper.find( '.hb-check-in-date' ),
			$check_out = $inputs_wrapper.find( '.hb-check-out-date' ),
			scroll_y = $( window ).scrollTop(),
			scroll_x = $( window ).scrollLeft(),
			input_left = $check_in.offset().left,
			input_right = $check_out.offset().left + $check_out.outerWidth( true ),
			input_top,
			input_bottom;

		if ( selecting_check_in ) {
			input_top = $check_in.offset().top;
			input_bottom = input_top + $check_in.outerHeight( true );
		} else {
			input_top = $check_out.offset().top;
			input_bottom = input_top + $check_out.outerHeight( true );
		}

		var available_space_above = input_top - scroll_y,
			available_space_below = $( window ).height() - input_bottom + scroll_y,
			available_space_if_align_left = $( window ).width() - input_left + scroll_x,
			available_space_if_align_right = input_right - scroll_x,
			datepick_width = $( '.hb-datepick-popup-wrapper' ).outerWidth( true ),
			datepick_height = $( '.hb-datepick-popup-wrapper' ).outerHeight( true );

		if ( available_space_below > datepick_height ) {
			$( '.hb-datepick-popup-wrapper' ).css( 'top', input_bottom );
		} else if ( available_space_above > datepick_height ) {
			$( '.hb-datepick-popup-wrapper' ).css( 'top', input_top - datepick_height );
		} else {
			$( '.hb-datepick-popup-wrapper' ).css( 'top', scroll_y );
		}
		if ( available_space_if_align_left > datepick_width ) {
			$( '.hb-datepick-popup-wrapper' ).css( 'left', input_left );
		} else if ( available_space_if_align_right > datepick_width ) {
			$( '.hb-datepick-popup-wrapper' ).css( 'left', input_right - datepick_width );
		} else {
			$( '.hb-datepick-popup-wrapper' ).css( 'left', ( $( window ).width() - datepick_width ) / 2 + scroll_x );
		}
	}

	var selecting_check_in = true,
		hb_dp_max_check_out = false,
		current_form_status_days,
		current_check_in_date,
		current_check_out_date;

	$( '.hb-datepick-check-in-mobile-trigger' ).click( function() {
		activate_check_in_choice( $( this ).parents( '.hb-search-fields' ) );
	});

	$( '.hb-datepick-check-out-mobile-trigger' ).click( function() {
		activate_check_out_choice( $( this ).parents( '.hb-search-fields' ) );
	});

	$( '.hb-datepick-check-in-trigger' ).click( function() {
		if ( ! $( '.hb-datepick-active-inputs' ).length ) {
			activate_check_in_choice( $( this ).parents( '.hb-search-fields' ) );
		} else {
			close_datepick_popup();
		}
	});

	$( '.hb-datepick-check-out-trigger' ).click( function() {
		if ( ! $( '.hb-datepick-active-inputs' ).length ) {
			activate_check_out_choice( $( this ).parents( '.hb-search-fields' ) );
		} else {
			close_datepick_popup();
		}
	});

	$( '.hb-datepick-check-out-mobile-trigger' ).click( function() {
		activate_check_out_choice( $( this ).parents( '.hb-search-fields' ) );
	});

	$( '.hb-check-in-date' ).focus( function() {
		activate_check_in_choice( $( this ).parents( '.hb-search-fields' ) );
	});

	$( '.hb-check-out-date' ).focus( function() {
		activate_check_out_choice( $( this ).parents( '.hb-search-fields' ) );
	});

	function activate_check_in_choice( $inputs_wrapper ) {
		selecting_check_in = true;
		if ( hb_text.legend_select_check_in != '' ) {
			$( '.hb-datepick-legend' ).show();
			$( '.hb-datepick-selecting-legend' ).html( hb_text.legend_select_check_in );
		} else {
			$( '.hb-datepick-legend' ).hide();
		}
		activate_check_in_out_choice( $inputs_wrapper );
	}

	function activate_check_out_choice( $inputs_wrapper ) {
		selecting_check_in = false;
		if ( hb_text.legend_select_check_out != '' ) {
			$( '.hb-datepick-legend' ).show();
			$( '.hb-datepick-selecting-legend' ).html( hb_text.legend_select_check_out );
		} else {
			$( '.hb-datepick-legend' ).hide();
		}
		activate_check_in_out_choice( $inputs_wrapper );
	}

	function activate_check_in_out_choice( $inputs_wrapper ) {
		show_current_month();
		var current_accom_id = 'all';
		$hbook_wrapper = $inputs_wrapper.parents( '.hbook-wrapper' );
		if ( $hbook_wrapper.data( 'page-accom-id' ) ) {
			current_accom_id = $hbook_wrapper.data( 'page-accom-id' );
		}
		current_form_status_days = window[ 'hb_status_days_' + current_accom_id ];
		if ( ! $inputs_wrapper.hasClass( 'hb-datepick-active-inputs' ) ) {
			open_datepick_popup( $inputs_wrapper );
		}
		reposition_datepick( $inputs_wrapper );
	}

	$( '.hb-dp-cmd-close' ).click( function() {
		close_datepick_popup();
		return false;
	});

	$( 'html' ).click( function( e ) {
		if ( new Date().getTime() - opening_time < 1000 ) {
			return;
		}
		if (
			$( '.hb-datepick-active-inputs' ).length &&
			! $( e.target ).closest( '.hb-datepick-popup' ).length &&
			! $( e.target ).is( '.hb-datepick-popup-wrapper' ) &&
			! $( e.target ).is( '.hb-datepick-legend' ) &&
			! $( e.target ).is( '.hb-dp-cmd' ) &&
			! $( e.target ).is( '.hb-dp-day-link' ) &&
			! $( e.target ).is( '.hb-check-in-date' ) &&
			! $( e.target ).is( '.hb-check-out-date' ) &&
			! $( e.target ).is( '.hb-day-taken-content' ) &&
			! $( e.target ).is( '.hb-datepick-check-in-mobile-trigger' ) &&
			! $( e.target ).is( '.hb-datepick-check-out-mobile-trigger' ) &&
			! $( e.target ).is( '.hb-datepick-check-in-trigger' ) &&
			! $( e.target ).is( '.hb-datepick-check-out-trigger' )
		) {
			close_datepick_popup();
		}
	});

	var opening_time = 0;

	function open_datepick_popup( $inputs_wrapper ) {
		opening_time = new Date().getTime();
		$inputs_wrapper.addClass( 'hb-datepick-active-inputs' );
		$check_in = $inputs_wrapper.find( '.hb-check-in-date' );
		$check_out = $inputs_wrapper.find( '.hb-check-out-date' );
		booking_rules = $inputs_wrapper.parents( '.hbook-wrapper' ).data( 'booking-rules' );
		set_datepick_options();

		var check_in_date,
			check_out_date;
		try {
			check_in_date = $.datepick.parseDate( hb_date_format, $check_in.val() );
		} catch( e ) {
			check_in_date = false;
		}
		try {
			check_out_date = $.datepick.parseDate( hb_date_format, $check_out.val() );
		} catch( e ) {
			check_out_date = false;
		}
		if ( check_in_date ) {
			current_check_in_date = new Date( check_in_date.getTime() );
			current_check_in_date.setHours( 0, 0, 0, 0 );
		} else {
			current_check_in_date = null;
		}
		if ( check_out_date ) {
			current_check_out_date = new Date( check_out_date.getTime() );
			current_check_out_date.setHours( 0, 0, 0, 0 );
		} else {
			current_check_out_date = null;
		}
		if ( selecting_check_in && check_in_date ) {
			current_date_shown = new Date( check_in_date.getTime() );
		} else if ( ! selecting_check_in && check_out_date ) {
			current_date_shown = new Date( check_out_date.getTime() );
		}
		show_current_month();
		$( '.hb-datepick-popup-wrapper' ).show().css( 'opacity', 0 );
		resize_datepick();
		reposition_datepick( $inputs_wrapper );
		$( '.hb-datepick-popup-wrapper' ).animate({ opacity: 1 });
	}

	function close_datepick_popup() {
		$( '.hb-datepick-popup-wrapper' ).fadeOut();
		$( '.hb-datepick-active-inputs' ).removeClass( 'hb-datepick-active-inputs' );
	}

	function set_datepick_options() {
		var hb_dp_today = new Date(),
			hb_dp_min_date = false,
			hb_dp_max_date = false,
			hb_dp_allowed_check_in_days = false,
			hb_dp_allowed_check_out_days = false,
			hb_dp_seasonal_allowed_check_in_days = booking_rules.seasonal_allowed_check_in_days,
			hb_dp_seasonal_allowed_check_out_days = booking_rules.seasonal_allowed_check_out_days,
			hb_dp_season = 0;

		hb_dp_today.setHours( 0, 0, 0, 0 );

		if ( hb_booking_form_data.is_admin != 'yes') {
			if ( hb_min_date != '0' ) {
				hb_dp_min_date = hb_date_str_2_obj( hb_min_date );
			} else {
				hb_dp_min_date = 0;
			}
			if ( hb_max_date != '0' ) {
				hb_dp_max_date = hb_date_str_2_obj( hb_max_date );
			}
		}

		if ( booking_rules.allowed_check_in_days != 'all' ) {
			hb_dp_allowed_check_in_days = booking_rules.allowed_check_in_days.split( ',' );
		}
		if ( booking_rules.allowed_check_out_days != 'all' ) {
			hb_dp_allowed_check_out_days = booking_rules.allowed_check_out_days.split( ',' );
		}

		$( '.hb-datepick-check-in-out' ).datepick( 'option', {
			minDate: hb_dp_min_date,
			maxDate: hb_dp_max_date,

			onDate: function ( date_noon, date_is_in_current_month ) {
				var date = new Date( date_noon.getTime() );
				date.setHours( 0, 0, 0, 0 );

				var day = date.getDate(),
					hb_dp_season = hb_get_season_id( date ),
					nb_day,
					str_date = hb_date_obj_2_str( date ),
					hb_dp_min_check_out,
					hb_dp_min_stay_date,
					hb_dp_max_stay_date,
					hb_dp_current_min_stay,
					hb_dp_current_max_stay,
					on_date_returned = {};

				nb_day = date.getDay();
				if ( nb_day == 0 ) {
					nb_day = 6;
				} else {
					nb_day = nb_day - 1;
				}
				nb_day += '';

				if ( current_check_in_date ) {
					var chosen_season = hb_get_season_id( current_check_in_date );
					hb_dp_min_check_out = new Date( current_check_in_date.getTime() );
					hb_dp_min_check_out.setDate( hb_dp_min_check_out.getDate() + 1 );
					hb_dp_min_stay_date = new Date( current_check_in_date.getTime() );
					hb_dp_min_stay_date.setDate( hb_dp_min_stay_date.getDate() + parseInt( booking_rules.minimum_stay ) );
					hb_dp_current_min_stay = booking_rules.minimum_stay;
					if ( booking_rules.seasonal_minimum_stay[ chosen_season ] ) {
						hb_dp_min_stay_date = new Date( current_check_in_date.getTime() );
						hb_dp_min_stay_date.setDate( hb_dp_min_stay_date.getDate() + parseInt( booking_rules.seasonal_minimum_stay[ chosen_season ] ) );
						hb_dp_current_min_stay = booking_rules.seasonal_minimum_stay[ chosen_season ];
					}
					hb_dp_max_stay_date = new Date( current_check_in_date.getTime() );
					hb_dp_max_stay_date.setDate( hb_dp_max_stay_date.getDate() + parseInt( booking_rules.maximum_stay ) );
					hb_dp_current_max_stay = booking_rules.maximum_stay;
					if ( booking_rules.seasonal_maximum_stay[ chosen_season ] ) {
						hb_dp_max_stay_date = new Date( current_check_in_date.getTime() );
						hb_dp_max_stay_date.setDate( hb_dp_max_stay_date.getDate() + parseInt( booking_rules.seasonal_maximum_stay[ chosen_season ] ) );
						hb_dp_current_max_stay = booking_rules.seasonal_maximum_stay[ chosen_season ];
					}
				}

				on_date_returned['selectable'] = true;
				on_date_returned['dateClass'] = 'hb-dp-day-link hb-dp-date-' + str_date;
				on_date_returned['title'] = hb_text.legend_available;

				if ( date_is_in_current_month && current_form_status_days[ str_date ] ) {

					if (
						( current_form_status_days[ str_date ].indexOf( 'hb-day-fully-taken' ) != -1 ) ||
						( current_form_status_days[ str_date ].indexOf( 'hb-day-taken-end' ) != -1 && ! selecting_check_in )
					) {
						on_date_returned['selectable'] = false;
						on_date_returned['dateClass'] += ' hb-dp-day-not-selectable hb-dp-day-not-selectable-taken';
					}
					if (
						( current_form_status_days[ str_date ].indexOf( 'hb-day-no-check-in-min-stay' ) != -1 && selecting_check_in ) ||
						( current_form_status_days[ str_date ].indexOf( 'hb-day-taken-start' ) != -1 && selecting_check_in )
					)
					{
						on_date_returned['selectable'] = false;
						on_date_returned['dateClass'] += ' hb-dp-day-no-check-in';
					}
					if (
						( current_form_status_days[ str_date ].indexOf( 'hb-day-taken-start' ) != -1 && selecting_check_in ) ||
						( current_form_status_days[ str_date ].indexOf( 'hb-day-no-check-in-min-stay' ) != -1  && selecting_check_in )
					) {
						on_date_returned['title'] = hb_text.legend_check_out_only;
					} else if ( current_form_status_days[ str_date ].indexOf( 'hb-day-fully-taken' ) != -1 ) {
						on_date_returned['title'] = hb_text.legend_occupied;
					} else if ( current_form_status_days[ str_date ].indexOf( 'hb-day-taken-end' ) != -1 && ! selecting_check_in ) {
						on_date_returned['title'] = hb_text.legend_check_in_only;
					}

					on_date_returned['dateClass'] += ' ' + current_form_status_days[ str_date ];
					on_date_returned['content'] = ' ' + '<span class="hb-day-taken-content">' + day + '</span>';

					if (
						! hb_dp_max_check_out &&
						current_check_in_date &&
						date > current_check_in_date &&
						( current_form_status_days[ str_date ].indexOf( 'hb-day-fully-taken' ) != -1 ||
						current_form_status_days[ str_date ].indexOf( 'hb-day-taken-end' ) != -1 )
					) {
						hb_dp_max_check_out = new Date( date.getTime() );
					}
				}

				if ( ! date_is_in_current_month ) {
					on_date_returned['dateClass'] += ' hb-dp-day-not-current-month';
					on_date_returned['title'] = '';
				} else if ( date < hb_dp_today ) {
					on_date_returned['title'] = hb_text.legend_past;
					if ( hb_booking_form_data.is_admin != 'yes') {
						on_date_returned['selectable'] = false;
					}
					on_date_returned['dateClass'] += ' hb-dp-day-past';
				} else if ( hb_dp_min_date && date < hb_dp_min_date ) {
					on_date_returned['title'] = hb_text.legend_closed;
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-closed';
				} else if ( current_check_in_date && date.getTime() == current_check_in_date.getTime() ) {
					on_date_returned['title'] = hb_text.legend_check_in;
					if ( selecting_check_in ) {
						on_date_returned['selectable'] = true;
					} else {
						on_date_returned['selectable'] = false;
					}
					on_date_returned['dateClass'] += ' hb-dp-day-check-in';
				} else if ( current_check_out_date && date.getTime() == current_check_out_date.getTime() ) {
					on_date_returned['title'] = hb_text.legend_check_out;
					if ( selecting_check_in ) {
						on_date_returned['selectable'] = true;
					} else {
						on_date_returned['selectable'] = false;
					}
					on_date_returned['dateClass'] += ' hb-dp-day-check-out';
				} else if ( selecting_check_in && hb_dp_allowed_check_in_days && hb_dp_allowed_check_in_days.indexOf( nb_day ) == -1 ) {
					on_date_returned['title'] = hb_text.legend_no_check_in;
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-not-selectable hb-dp-day-not-selectable-check-in-day-not-allowed';
				} else if (
					selecting_check_in &&
					hb_dp_seasonal_allowed_check_in_days[ hb_dp_season ] &&
					hb_dp_seasonal_allowed_check_in_days[ hb_dp_season ].split( ',' ).indexOf( nb_day ) == -1
				) {
					on_date_returned['title'] = hb_text.legend_no_check_in;
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-not-selectable hb-dp-day-not-selectable-check-in-day-not-allowed';
				} else if (
					! selecting_check_in &&
					hb_dp_seasonal_allowed_check_out_days[ hb_dp_season ] &&
					hb_dp_seasonal_allowed_check_out_days[ hb_dp_season ].split( ',' ).indexOf( nb_day ) == -1
				) {
					on_date_returned['title'] = hb_text.legend_no_check_out;
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-not-selectable hb-dp-day-not-selectable-check-out-day-not-allowed';
				} else if ( ! selecting_check_in && hb_dp_allowed_check_out_days && hb_dp_allowed_check_out_days.indexOf( nb_day ) == -1 ) {
					on_date_returned['title'] = hb_text.legend_no_check_out;
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-not-selectable hb-dp-day-not-selectable-check-out-day-not-allowed';
				} else if ( ! selecting_check_in && current_check_in_date && date < hb_dp_min_check_out) {
					on_date_returned['title'] = hb_text.legend_before_check_in;
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-not-selectable hb-dp-day-not-selectable-min-check-out';
				} else if ( hb_dp_max_date && date > hb_dp_max_date ) {
					on_date_returned['title'] = hb_text.legend_closed;
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-closed';
				} else if ( ! selecting_check_in && hb_dp_max_check_out && date >= hb_dp_max_check_out ) {
					on_date_returned['title'] = hb_text.legend_no_check_out;
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-not-selectable hb-dp-day-not-selectable-max-check-out';
				} else if ( ! selecting_check_in && current_check_in_date && date < hb_dp_min_stay_date ) {
					on_date_returned['title'] = hb_text.legend_no_check_out_min_stay.replace( '%nb_nights', hb_dp_current_min_stay );
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-not-selectable hb-dp-day-not-selectable-min-stay';
				} else if ( ! selecting_check_in && current_check_in_date && date > hb_dp_max_stay_date ) {
					on_date_returned['title'] = hb_text.legend_no_check_out_max_stay.replace( '%nb_nights', hb_dp_current_max_stay );
					on_date_returned['selectable'] = false;
					on_date_returned['dateClass'] += ' hb-dp-day-not-selectable hb-dp-day-not-selectable-max-stay';
				} else {
					on_date_returned['dateClass'] += ' hb-day-available';
				}

				return on_date_returned;

			},

			onSelect: function( dates ) {
				var $check_in = $( '.hb-datepick-active-inputs' ).find( '.hb-check-in-date' ),
					$check_out = $( '.hb-datepick-active-inputs' ).find( '.hb-check-out-date' ),
					date,
					str_date,
					str_date_current_format;

				if ( ! dates[0] || ! $( '.hb-datepick-popup' ).datepick( 'isSelectable', dates[0] ) ) {
					return;
				}

				date = new Date( dates[0].getFullYear(), dates[0].getMonth(), dates[0].getDate() );
				str_date = $.datepick.formatDate( 'yyyy-mm-dd', date ),
				str_date_current_format = $.datepick.formatDate( hb_date_format, date );

				hb_dp_max_check_out = false;

				if ( selecting_check_in ) {
					selecting_check_in = false;
					$check_in.val( str_date_current_format );
					current_check_in_date = date;
					show_current_month();
					if ( current_check_out_date ) {
						if ( is_valid_check_out_date() ) {
							close_datepick_popup();
						} else {
							current_check_out_date = null;
							$check_out.val( '' );
						}
					}
					if ( ! current_check_out_date ) {
						if ( is_hb_dp_mobile ) {
							activate_check_out_choice( $( '.hb-datepick-active-inputs' ) );
						} else {
							$check_out.focus();
						}
					}
				} else {
					$check_out.val( str_date_current_format );
					current_check_out_date = date;
					if ( current_check_in_date ) {
						close_datepick_popup();
					} else {
						if ( is_hb_dp_mobile ) {
							activate_check_in_choice( $( '.hb-datepick-active-inputs' ) );
						} else {
							$check_in.focus();
						}
					}
				}
			}
		});
	}

	function is_valid_check_out_date() {
		var min_check_out_date = new Date( current_check_in_date.getTime() ),
			max_check_out_date = new Date( current_check_in_date.getTime() );
		min_check_out_date.setDate( min_check_out_date.getDate() + parseInt( booking_rules.minimum_stay ) );
		max_check_out_date.setDate( max_check_out_date.getDate() + parseInt( booking_rules.maximum_stay ) );
		if (
			( min_check_out_date.getTime() > current_check_out_date.getTime() ) ||
			( max_check_out_date.getTime() < current_check_out_date.getTime() ) ||
			( hb_dp_max_check_out && current_check_out_date.getTime() > hb_dp_max_check_out.getTime() )
		) {
			return false;
		} else {
			return true;
		}
	}

	$( '.hb-check-in-date, .hb-check-out-date' ).keyup( function() {
		if ( $( this ).val() == '' ) {
			if ( $( this ).hasClass( 'hb-check-in-date' ) ) {
				current_check_in_date = null;
			} else {
				current_check_out_date = null;
			}
			show_current_month();
			return;
		}

		var input_date;
		try {
			input_date = $.datepick.parseDate( hb_date_format, $( this ).val() );
		} catch( e ) {
			input_date = false;
		}

		if ( input_date && $( '.hb-datepick-popup' ).datepick( 'isSelectable', input_date ) ) {
			input_date.setHours( 0, 0, 0, 0 );
			if ( selecting_check_in ) {
				current_check_in_date = new Date( input_date.getTime() );
				show_current_month();
				if ( current_check_out_date && ! is_valid_check_out_date() ) {
					current_check_out_date = null;
					$check_out.val( '' );
				}
			} else {
				current_check_out_date = new Date( input_date.getTime() );
			}
			hb_dp_max_check_out = false;
			show_current_month();
		}
	});

	$( 'select' ).focus( function() {
		close_datepick_popup();
	});

});
