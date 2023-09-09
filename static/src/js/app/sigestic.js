odoo.define('df_website_front.sigestic', function(require) {
    "use_strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var event_main = require('df_website_front.event_main');
    var conferences = require('df_website_front.conferences');
    var event_message = require('df_website_front.event_message');

    $('.event-conference-chat').on('click', function(){
        if($('input#track_conference_id').val() != '' && $('input#track_conference_id').val() != undefined){
          $('input#track_conference_chat_id').val($('input#track_conference_id').val());
          $('span#chat_conference_span').text(event_message.getMessage(41) + ' ' + $('input#track_conference_name').val());
          conferences.load_message_by_track($('input#track_conference_id').val());
          // Eliminar parpadeo del icono de chat
          $('a.event-conference-chat').removeClass('parpadea');
          $('#event-conference-chat-modal').modal('show');
        }
    });

    // Capturando cada vez que se cambie de resolución la ventana
    $(window).resize(function() {
        if($('#wrapwrap').width() < 576){
            var sigestic_nav = $('#sigestic-nav');
            var sigestic_nav_link = $('.sigestic-nav-link');
            var sigestic_logo_nav = $('#sigestic-logo-nav');
            sigestic_nav.removeClass('bg-transparent').removeClass('fixed-top');
            sigestic_nav.addClass('bg-light').addClass('sticky-top');
            sigestic_nav_link.removeClass('text-white');
            sigestic_nav_link.addClass('sigestic-darkblue');
            sigestic_logo_nav.removeClass('sigestic-logo-nav');
            $('.sigestic-banner').removeClass('d-block').addClass('d-none');
            $('.sigestic-responsive-banner').removeClass('d-none').addClass('d-block');
            $('.metrologia-responsive-banner').removeClass('d-none').addClass('d-block');
            $('.desoft-responsive-banner').removeClass('d-none').addClass('d-block');

            $('.new-conference-content').addClass('d-none');
            $('.new-conference-content-responsive').removeClass('d-none');

            $('.anteroom-content').addClass('d-none');
            $('.anteroom-content-responsive').removeClass('d-none');
        } else {
            $('.sigestic-banner').removeClass('d-none').addClass('d-block');
            $('.sigestic-responsive-banner').removeClass('d-block').addClass('d-none');
            $('.metrologia-responsive-banner').removeClass('d-block').addClass('d-none');
            $('.desoft-responsive-banner').removeClass('d-block').addClass('d-none');
        }
    });

    if($('#wrapwrap').width() < 576){
        var sigestic_nav = $('#sigestic-nav');
        var sigestic_nav_link = $('.sigestic-nav-link');
        var sigestic_logo_nav = $('#sigestic-logo-nav');
        let navbar_Desoft = $('#navbarSupportedContent');

        sigestic_nav.removeClass('bg-transparent').removeClass('fixed-top');
        sigestic_nav.addClass('bg-light').addClass('sticky-top');
        sigestic_nav_link.removeClass('text-white');
        sigestic_nav_link.addClass('sigestic-darkblue');
        sigestic_logo_nav.removeClass('sigestic-logo-nav');
        $('.sigestic-banner').addClass('d-none');
        $('.sigestic-responsive-banner').removeClass('d-none');
        $('.metrologia-responsive-banner').removeClass('d-none').addClass('d-block');
        $('.desoft-responsive-banner').removeClass('d-none');

        $('.new-conference-content').addClass('d-none');
        $('.new-conference-content-responsive').removeClass('d-none');

        $('.anteroom-content').addClass('d-none');
        $('.anteroom-content-responsive').removeClass('d-none');
    }

    $('#wrapwrap').on('scroll', function(){
        var event_main = require('df_website_front.event_main').get_event_id().indexOf('/');
        if (event_main == -1) {
            var sigestic_nav = $('#sigestic-nav');
            var metrologia_nav = $('#metrologia-nav');
            var desoft_nav = $('#desoft-nav');
            var sigestic_nav_link = $('.sigestic-nav-link');
            var sigestic_logo_nav = $('#sigestic-logo-nav');
            if($(this).scrollTop() > 0){
                sigestic_nav.removeClass('bg-transparent');
                metrologia_nav.removeClass('bg-transparent');
                desoft_nav.removeClass('bg-transparent');
                sigestic_nav.addClass('bg-light');
                metrologia_nav.addClass('bg-light');
                desoft_nav.addClass('bg-light');
                sigestic_nav_link.removeClass('text-white');
                sigestic_nav_link.addClass('sigestic-darkblue');
                sigestic_logo_nav.removeClass('sigestic-logo-nav');
            }
            else if($(this).width() > 576){
                sigestic_nav.removeClass('bg-light');
                sigestic_nav.addClass('bg-transparent');
                sigestic_nav_link.removeClass('sigestic-darkblue');
                sigestic_nav_link.addClass('text-white');
                sigestic_logo_nav.addClass('sigestic-logo-nav');
            }
            if($(this).scrollTop() === 0){
                metrologia_nav.addClass('bg-transparent');
                desoft_nav.addClass('bg-transparent');
            }
        }
    });

    $('.sigestic-selectpicker').selectpicker({
        style: "",
        styleBase: "form-control my-sigestic-form-control"
    });

    /*--------------------------------------------------------------------------
      ACTUALIZAR LA CUENTA ATRÁS DEL EVENTO CADA 10 SEGUNDOS
    --------------------------------------------------------------------------*/
    setInterval(() => {
        var EVENT_ID = event_main.get_event_id(true);
        var formData = new FormData();
        if(EVENT_ID != undefined && $('div.desoft-timer').length > 10){
            $.ajax({
                url: '/evento/' + EVENT_ID + '/countdown',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false  // tell jQuery not to set contentType
            }).done(function(data_result) {
                var result = event_main.parse_result(data_result);

                if (result[0].event_start == false){
                    $('div.desoft-timer').removeClass('d-none').addClass('d-block');

                    $('h1#timer-day').html(result[0].event_days);
                    $('div#timer-day-progress').css('left',result[0].event_days_porciento +'%');
                    $('h1#timer-day-metro').html(result[0].event_days);
                    $('div#timer-day-progress-metro').css('bottom',result[0].event_days_porciento +'%');

                    $('h1#timer-hour').html(result[0].event_hours);
                    $('div#timer-hour-progress').css('left',result[0].event_hours_porciento +'%');
                    $('h1#timer-hour-metro').html(result[0].event_hours);
                    $('div#timer-hour-progress-metro').css('bottom',result[0].event_hours_porciento +'%');

                    $('h1#timer-minute').html(result[0].event_minutes);
                    $('div#timer-minute-progress').css('left',result[0].event_minutes_porciento +'%');
                    $('h1#timer-minute-metro').html(result[0].event_minutes);
                    $('div#timer-minute-progress-metro').css('bottom',result[0].event_minutes_porciento +'%');

                    $('h1#timer-second').html(result[0].event_seconds);
                    $('div#timer-second-progress').css('left',result[0].event_seconds_porciento +'%');
                } else {
                    $('div.desoft-timer').removeClass('d-block').addClass('d-none');
                }
            });
        }

    }, 10000);

});
