odoo.define('df_website_front.custom_hover', function(require) {
    "use_strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var event_main = require('df_website_front.event_main');
    var user_sign = require('df_website_front.user_sign');

    function parse_result(result) {
        return JSON.parse(result)
    }

    //Social Networks Banner
    $('.facebook-banner').hover(function() {
        $(this).attr('src', '/df_website_front/static/src/img/Facebook_over.svg');
    }, function() {
        $(this).attr('src', '/df_website_front/static/src/img/Facebook_reposo.svg');
    });

    $('.twitter-banner').hover(function() {
        $(this).attr('src', '/df_website_front/static/src/img/Twitter_over.svg');
    }, function() {
        $(this).attr('src', '/df_website_front/static/src/img/Twitter_reposo.svg');
    });

    $('.youtube-banner').hover(function() {
        $(this).attr('src', '/df_website_front/static/src/img/Youtube_over.svg');
    }, function() {
        $(this).attr('src', '/df_website_front/static/src/img/Youtube_reposo.svg');
    });

    //Social Networks Footer
    $('.facebook-footer').hover(function() {
        $(this).attr('src', '/df_website_front/static/src/img/Facebook_footer_over.svg');
    }, function() {
        $(this).attr('src', '/df_website_front/static/src/img/Facebook_footer_reposo.svg');
    });

    $('.twitter-footer').hover(function() {
        $(this).attr('src', '/df_website_front/static/src/img/Twitter_footer_over.svg');
    }, function() {
        $(this).attr('src', '/df_website_front/static/src/img/Twitter_footer_reposo.svg');
    });

    $('.youtube-footer').hover(function() {
        $(this).attr('src', '/df_website_front/static/src/img/Youtube_footer_over.svg');
    }, function() {
        $(this).attr('src', '/df_website_front/static/src/img/Youtube_footer_reposo.svg');
    });

    //Icons navbar
    $('.search-navbar').hover(function() {
        $(this).attr('src', '/df_website_front/static/src/img/search_over.svg');
    }, function() {
        $(this).attr('src', '/df_website_front/static/src/img/search.svg');
    });

    $('.user-navbar').hover(function() {
        $(this).attr('src', '/df_website_front/static/src/img/user-3_over.svg');
    }, function() {
        $(this).attr('src', '/df_website_front/static/src/img/user-3.svg');
    });

    $('.locked-navbar').hover(function() {
        $(this).attr('src', '/df_website_front/static/src/img/locked_over.svg');
    }, function() {
        $(this).attr('src', '/df_website_front/static/src/img/locked.svg');
    });

    //Menu link scroll to target
    $('.menu-link a.scrollto-link').on('click', function(e) {
        let origin = $(this).attr('id');
        if(origin != 'schedule'){
            var event_main = require('df_website_front.event_main').get_event_id().indexOf('/');
            if (event_main == -1) {
                let target = $('#' + origin + '-section');
                var destination = $(target).offset().top - 10;
                $('html, body').animate({
                    scrollTop: '+=' + destination
                }, 800, function() {
                    if ($(window).width() < 992)
                        $('#navbar-button').click();
                });
            }
        }
    });


    $(function() {
        var event_id = event_main.get_event_id(true);
        if (event_id != '') {
            event_main.showLoader();
            $.ajax({
                url: '/evento/' + event_id + '/event_date',
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function(data_result) {
                var result = event_main.parse_result(data_result);
                if (result.success == true) {
                    event_main.hideLoader();
                    $('#datetimepicker').datetimepicker({
                        minDate: result.data.date_s,
                        maxDate: result.data.date_e
                    });
                }
            });
        }
    });

    $('.conference-ubication-link').on('click', function(ev){
        ev.preventDefault();
        $('.conference-ubication-link').removeClass('forum-menu-icon-anteroom-active');
        $(this).addClass('forum-menu-icon-anteroom-active');
        var event_id = event_main.get_event_id(true);
        var formData = new FormData();
        formData.append('location_id', $(this).data('id'));
        $.ajax({
            url: '/evento/' + event_id + '/tracks_location',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function(data_result) {
             var string_track = '';
             var result = parse_result(data_result);
             if(result.length > 0){
                result.forEach(function(item, i) {
                    var url = (item.event_area_id != undefined) ? item.event_area_id : '#';
                    if (item.event_area_id) {
                        url = '/evento/' + item.event_id + '/track_conference/' + item.id;
                    } else {
                        url = '#';
                    }
                    var date_session = '';
                    if(item.date){
                        date_session = item.date + ' - '
                    }

                    if (item.in_live){
                        string_track += '<li class="list-group-item anteroom-list-group-item">\n'+
                                       '<a href="'+ url +'">\n'+
                                           '<span class="fa fa-podcast mr-2"/>\n<strong>'+ date_session + '</strong>' + item.name + '\n'+
                                       '</a>\n'+
                                   '</li>\n';
                    } else {
                        string_track += '<li class="list-group-item anteroom-list-group-item">\n'+
                                       '<a href="'+ url +'">\n'+
                                       '<span class="fa fa-podcast mr-2 d-none"/>\n<strong>'+ date_session + '</strong>' + item.name + '\n'+ '</a>\n'+
                                   '</li>\n';
                    }
                });
            } else {
            }
            if($('#wrapwrap').width() < 576){
                $('#anteroom-video-list-responsive ul').html('').append(string_track);
                $('#anteroom-video-list-responsive-serie4 ul').html('').append(string_track);
            }
            else{
                $('#anteroom-video-list ul').html('').append(string_track);
                $('#anteroom-video-list-serie4 ul').html('').append(string_track);
            }
        });
    });

    $('#navigation-button').on('click', function(){
        $('#navigation-map').addClass('navigation-map-active');
        $(this).addClass('navigation-button-active');
        $(this).children('div.navigation-button-icon').addClass('navigation-button-icon-active');
        $(this).children('div.navigation-button-text').addClass('navigation-button-text-active');
        $('#navigation-content').fadeIn('75');
    });

    $(document).mouseup(function(e) {
        var container = $("#navigation-map");
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            $('#navigation-content').fadeOut('75').promise().done(function(){
                $('#navigation-map').removeClass('navigation-map-active');
                $('#navigation-button').removeClass('navigation-button-active');
                $('#navigation-button').children('div.navigation-button-icon').removeClass('navigation-button-icon-active');
                $('#navigation-button').children('div.navigation-button-text').removeClass('navigation-button-text-active');
            });
        }
    });

    $("#opt_for_prize").change(function() {
        if(this.checked) {
            $('.select_award').removeClass('d-none');
            $('select#select_award_id').attr('is-required','true');

            $('.doc_file_award').removeClass('d-none');
            $('input[name="doc_file_award"]').attr('is-required','true');
        } else {
            $('.select_award').addClass('d-none');
            $('select#select_award_id').attr('is-required','false');

            $('.doc_file_award').addClass('d-none');
            $('input[name="doc_file_award"]').attr('is-required','false');
        }
    });

});