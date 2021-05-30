function hb_date_str_2_obj( str_date ) {
	if ( str_date ) {
		var array_date = str_date.split( '-' );
		return new Date( array_date[0], array_date[1] - 1, array_date[2] );
	} else {
		return false;
	}
}

function hb_date_obj_2_str( obj_date ) {
	if ( obj_date ) {
		var y = obj_date.getFullYear(),
			m = obj_date.getMonth() + 1,
			d = obj_date.getDate();
		m = m + '';
		d = d + '';
		if ( m.length == 1 ) {
			m = '0' + m;
		}
		if ( d.length == 1 ) {
			d = '0' + d;
		}
		return y + '-' + m + '-' + d;
	} else {
		return false;
	}
}

function hb_format_date() {
	jQuery( '.hb-format-date' ).each( function() {
		var str_date = jQuery( this ).html();
		if ( str_date.indexOf( '-' ) > -1 ) {
			var date = hb_date_str_2_obj( str_date );
			jQuery( this ).html( jQuery.datepick.formatDate( hb_date_format, date ) ).removeClass( 'hb-format-date' );
		}
	});
}

function hb_get_season_id( date ) {
	var seasons = hb_booking_form_data.seasons,
		nb_day,
		copied_date = new Date( date.valueOf() );

	copied_date.setHours( 0, 0, 0, 0 );

	nb_day = date.getDay();
	if ( nb_day == 0 ) {
		nb_day = 6;
	} else {
		nb_day = nb_day - 1;
	}
	nb_day += '';

	for ( var i = 0; i < seasons.length; i++ ) {
		var start = hb_date_str_2_obj( seasons[ i ]['start_date'] ),
			end = hb_date_str_2_obj( seasons[ i ]['end_date'] );
		start.setHours( 0, 0, 0, 0 );
		end.setHours( 0, 0, 0, 0 );
		if ( copied_date >= start && copied_date <= end && seasons[ i ]['days'].indexOf( nb_day ) != -1 ) {
			return seasons[ i ]['season_id'];
		}
	}
	return false;
}