odoo.define('df_website_front.event_attendee', function(require) {
    "use strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var ajax = require('web.ajax');
    var event_main = require('df_website_front.event_main');
    var event_message = require('df_website_front.event_message');

    function parse_result(result) {
        return JSON.parse(result)
    }

    //Participant social links
    $('.participant-card, .speaker-card').hover(function() {
        $(this).css({ 'box-shadow': '0 0px 0px 0 #007b91, 0 0px 10px 0 #007b91' });
    }, function() {
        $(this).css({ 'box-shadow': 'none' });
    });

    $('.participant-social-link').hover(function() {
        $(this).parents('.participant-card').css({ 'box-shadow': 'none' });
        $(this).parents('.speaker-card').css({ 'box-shadow': 'none' });
        $(this).parents('.exhibitor-card').css({ 'box-shadow': 'none' });
    }, function() {
        $(this).parents('.participant-card').css({ 'box-shadow': '0 0px 0px 0 #007b91, 0 0px 10px 0 #007b91' });
        $(this).parents('.speaker-card').css({ 'box-shadow': '0 0px 0px 0 #007b91, 0 0px 10px 0 #007b91' });
        $(this).parents('.exhibitor-card').css({ 'box-shadow': '0 0px 0px 0 #007b91, 0 0px 10px 0 #007b91' });
    });

    function modal_detail(attendee_id, participant = false, exhibitor = false,jury=false,participant_company=false) {
        var event_id = event_main.get_event_id(true);
        var url_detail = '/evento/' + event_id + '/speaker_detail';
        var params = { 'attendee_id': attendee_id };
        if (participant || exhibitor || jury || participant_company) {
            if (exhibitor) {
                url_detail = '/evento/' + event_id + '/exhibitor_detail';
            } else if (participant) {
                url_detail = '/evento/' + event_id + '/attendee_detail';
            } else if (jury) {
                url_detail = '/evento/' + event_id + '/jury_detail';
            } else if (participant_company) {
                url_detail = '/evento/' + event_id + '/attendee_company_detail';
            }
            $('#participant-detail div.div-detail-modal-right').removeClass('d-block').addClass('d-none');
            $('#participant-detail div.div-detail-modal').removeClass('speaker-detail-divider col-sm-7').addClass('col-sm-12');
        } else {
            $('#participant-detail div.div-detail-modal-right').removeClass('d-none').addClass('d-block');
            $('#participant-detail div.div-detail-modal').removeClass('col-sm-12').addClass('speaker-detail-divider col-sm-7');
        }

        ajax.jsonRpc(url_detail, 'call', params).then(function(data_result) {
            $('#participant-detail-name').html(data_result.name);
            $('#participant-detail-description').html(data_result.detail);
            if (data_result.image){
                $('#participant-detail-image').attr('src', 'data:image/*; base64,' + data_result.image);
            }else {
                $('#participant-detail-image').attr('src', '/df_website_front/static/src/img/user_profile_default.png');
            }

            $('#speaker-function').html(data_result.functions);
            if (data_result.company != '') {
                if(jury == true){
                    $('#jury-company').html(data_result.company);
                    $('#jury-company').removeClass('d-none').addClass('d-block');
                }else if(exhibitor == true){
                    $('#exhibitor-company').html(data_result.company);
                    $('#exhibitor-company').removeClass('d-none').addClass('d-block');
                } else {
                    $('#speaker-company').html(data_result.company);
                    $('#speaker-company').removeClass('d-none').addClass('d-block');
                }
            } else {
                $('#speaker-company').removeClass('d-block').addClass('d-none');
                $('#jury-company').removeClass('d-block').addClass('d-none');
                $('#exhibitor-company').removeClass('d-block').addClass('d-none');
            }

            if (data_result.email == false) {
                $('.participant-email').removeClass('d-block').addClass('d-none');
            } else {
                $('.participant-email').html('Email: ' + data_result.email);
                $('.participant-email').removeClass('d-none').addClass('d-block');
            }

            if (data_result.facebook_url == false) {
                $('#speaker-face-url').addClass('d-none');
            } else {
                $('#speaker-face-url').removeClass('d-none');
                $('#speaker-face-url').attr('href', data_result.facebook_url);
            }

            if (data_result.twitter_url == false) {
                $('#speaker-twitter-url').addClass('d-none');
            } else {
                $('#speaker-twitter-url').removeClass('d-none');
                $('#speaker-twitter-url').attr('href', data_result.twitter_url);
            }

            if (data_result.linkedin_url == false) {
                $('#speaker-linkedin-url').addClass('d-none');
            } else {
                $('#speaker-linkedin-url').removeClass('d-none');
                $('#speaker-linkedin-url').attr('href', data_result.linkedin_url);
            }
            if (data_result.telegram_url == false) {
                $('#speaker-telegram-url').addClass('d-none');
            } else {
                $('#speaker-telegram-url').removeClass('d-none');
                $('#speaker-telegram-url').attr('href', data_result.telegram_url);
            }
            if (participant == false && exhibitor == false && jury == false && participant_company == false) {
                var tracks_by_speaker = data_result.tracks
                var speakers = ""
                for (var i = 0; i < tracks_by_speaker.length; i++) {
                    speakers += "<li class='list-group-item ponencias-li mb-1'>" + tracks_by_speaker[i].name + "<span class='float-right'>" + tracks_by_speaker[i].date + "</span></li>"
                }
                $('#list-tracks').html(speakers);
            }
            if (exhibitor == false && jury == false) {
                $('#participant-detail').modal('show');
            } else if (jury == true) {
                $('#jury-detail').modal('show');
            } else {
                if (data_result.pavilion != ''){
                    $('#exhibitor-pavilion').html(event_message.getMessage(36) + data_result.pavilion);
                }
                $('#exhibitor-website').html('Website: ' + data_result.website);
                $('#exhibitor-detail').modal('show');
            }
        })
    }

    function modal_terms_conditions() {
        var event_id = event_main.get_event_id(true);
        ajax.jsonRpc('/evento/' + event_id + '/terms_conditions', 'call', {}).then(function(data_result) {
            $('#ter_condition_description').html(data_result.description);
            $('#term_condition_event').modal('show');
        })
    }

    $('.speaker-card').on('click', function(ev) {
        ev.preventDefault();
        var attendee_id = $(this).data('id')
        modal_detail(attendee_id);
        return false;
    });

    $('.participant-card').on('click', function(ev) {
        ev.preventDefault();
        var attendee_id = $(this).data('id')
        modal_detail(attendee_id, true);
        return false;
    });

    $('.exhibitor-card').on('click', function(ev) {
        ev.preventDefault();
        var area_id = $(this).data('id');
        modal_detail(area_id, false, true);
        return false;
    });

    $('.ponente-grid').on('click', function(ev) {
        ev.preventDefault();
        var attendee_id = $(this).data('id')
        modal_detail(attendee_id);
        return false;
    });

    $('.committe-jury-card').on('click', function(ev) {
        ev.preventDefault();
        var attendee_id = $(this).data('id');
        modal_detail(attendee_id, false, false,true);
        return false;
    });

    $('.participant-company-card').on('click', function(ev) {
        ev.preventDefault();
        var attendee_id = $(this).data('id');
        modal_detail(attendee_id, false, false,false,true);
        return false;
    });

    $('.participant-social-link').on('click', function(event) {
        event.stopPropagation();
    });

    $('a.terms-conditions').on('click', function(ev) {
        ev.preventDefault();
        modal_terms_conditions()
    });

    var url_sear_part = '';
    var event_id = event_main.get_event_id(true);
    $('.my-select').on('hidden.bs.select', function(e) {
        e.preventDefault();
        let my_select = $(this).children('select.my-select');
        if (my_select.attr('id') == 'type_participant_id' || my_select.attr('id') == 'country_id_list') {
            event_main.showLoader();
            var type_participant_id = 0;
            var country_id_list = 0;
            var search_list_part = '';
            if ($('select#type_participant_id').val() != 'undefined' && $('select#type_participant_id').val() != undefined) {
                type_participant_id = $('select#type_participant_id').val();
            }
            if ($('select#country_id_list').val() != 'undefined' && $('select#country_id_list').val() != undefined) {
                country_id_list = $('select#country_id_list').val();
            }
            search_list_part = $('input#search_list_part').val();

            url_sear_part = '/evento/' + event_id + '/search_participant?' + 'type_par_id=' + type_participant_id + '&cou_id=' + country_id_list;
            if (search_list_part != '') {
                url_sear_part += '&search_part=' + search_list_part;
            }
            window.location = url_sear_part;
        } else if (my_select.attr('id') == 'pavilion_id' || my_select.attr('id') == 'country_exhibitor_list') {
            event_main.showLoader();
            var pavilion_id = 0;
            var country_id_list = 0;
            var search_exhibitor_list = '';

            if ($('select#pavilion_id').val() != 'undefined' && $('select#pavilion_id').val() != undefined) {
                pavilion_id = $('select#pavilion_id').val();
            }
            if ($('select#country_exhibitor_list').val() != 'undefined' && $('select#country_exhibitor_list').val() != undefined) {
                country_id_list = $('select#country_exhibitor_list').val();
            }

            url_sear_part = '/evento/' + event_id + '/search_exhibitor?' + 'pavilion_id=' + pavilion_id + '&cou_id=' + country_id_list;
            if (search_list_part != '') {
                url_sear_part += '&search_part=' + search_exhibitor_list;
            }
            window.location = url_sear_part;
        } else if (my_select.attr('id') == 'types_ins_id') {
            event_main.showLoader();
            var types_ins_id = 0;
            var search_list_part = '';
            if ($('select#types_ins_id').val() != 'undefined' && $('select#types_ins_id').val() != undefined) {
                types_ins_id = $('select#types_ins_id').val();
            }

            search_list_part = $('input#search_list_part_company').val();

            url_sear_part = '/evento/' + event_id + '/search_participant?' + 'types_ins_id=' + types_ins_id + '&participant_company=true';
            if (search_list_part != '') {
                url_sear_part += '&search_part=' + search_list_part;
            }
            window.location = url_sear_part;
        }
    });

    $('input#search_list_part').keyup(function() {
        if ($(this).val() != '' && $(this).val().length > 2) {
            event_main.showLoader();
            var type_participant_id = $('select#type_participant_id').val();
            var country_id_list = $('select#country_id_list').val();
            url_sear_part = '/evento/' + event_id + '/search_participant?' + 'type_par_id=' + type_participant_id + '&cou_id=' + country_id_list;
            url_sear_part += '&search_part=' + $(this).val();
            window.location = url_sear_part;
        }
    });

    $('input#search_list_part_company').keyup(function() {
        if ($(this).val() != '' && $(this).val().length > 2) {
            event_main.showLoader();
            var types_ins_id = $('select#types_ins_id').val();
            url_sear_part = '/evento/' + event_id + '/search_participant?' + 'types_ins_id=' + types_ins_id + '&participant_company=true';
            url_sear_part += '&search_part=' + $(this).val();
            window.location = url_sear_part;
        }
    });

    $('input#search_exhibitor_list').keyup(function() {
        if ($(this).val() != '' && $(this).val().length > 2) {
            event_main.showLoader();
            var pavilion_id = $('select#pavilion_id').val();
            var country_id_list = $('select#country_exhibitor_list').val();
            url_sear_part = '/evento/' + event_id + '/search_exhibitor?' + 'pavilion_id=' + pavilion_id + '&cou_id=' + country_id_list;
            url_sear_part += '&search_part=' + $(this).val();
            window.location = url_sear_part;
        }
    });

    $('button#clear_filters').click(function() {
        event_main.showLoader();
        url_sear_part = '/evento/' + event_id + '/search_participant';
        window.location = url_sear_part;
    });

    $('button#clear_filters_exhibitor').click(function() {
        event_main.showLoader();
        url_sear_part = '/evento/' + event_id + '/search_exhibitor';
        window.location = url_sear_part;
    });

    $('button#clear_filters_participant_company').click(function() {
        event_main.showLoader();
        url_sear_part = '/evento/' + event_id + '/participant_company_event';
        window.location = url_sear_part;
    });

})