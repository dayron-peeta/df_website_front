odoo.define('df_website_front.schudele', function(require) {
    "use_strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var event_main = require('df_website_front.event_main');
    var event_message = require('df_website_front.event_message');

    $('span.detail-date').click(function(e) {
        e.preventDefault();
        var calendar_att = $(this).parent().parent().attr('data-id');
        see_more_schedule(calendar_att);
    });

    function see_more_schedule(calendar_att_ids) {
        var event_id = event_main.get_event_id(true);
        event_main.showLoader();
        var formData = new FormData();
        formData.append('filter', calendar_att_ids);
        $.ajax({
            url: '/evento/' + event_id + '/search_schudele_user',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function(data_result) {
            var result = event_main.parse_result(data_result)
            if (result.success == true) {
                date_result = result.detail_date;
                $('#user-request-name').html(date_result.user_request);
                $('#user-request-subject').html(date_result.subject);
                $('#date_date').html(date_result.date_date);
                $('img#user-request-image').attr('src', 'data:image/*; base64,' + date_result.image);
                $('#user-request-email').html(date_result.user_req_email);
                $('#user-request-phone').html(date_result.user_req_phone);
                $('#user-request-mobile').html(date_result.user_req_mobile);
                $('#user-request-whatsapp').html(date_result.whatsapp_url);
                $('#user-request-description').html(date_result.detail);

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


                $('#eventScheduleModal').modal('show');
                event_main.hideLoader();
            } else if (result.error == true) {
                toastr.error(event_message.getMessage(result.message));
                event_main.hideLoader();
            }
        });
    }


    $('span.accept-date').click(function(e) {
        e.preventDefault();
        let calendar_attendee_id = $(this).parent().parent().attr('data-id');
        approved_denied_date(1, calendar_attendee_id);
    });

    $('span.reject-date').click(function(e) {
        e.preventDefault();
        let calendar_attendee_id = $(this).parent().parent().attr('data-id');
        approved_denied_date(2, calendar_attendee_id);
    });


    $('span.done-date').click(function(e) {
        e.preventDefault();
        let calendar_attendee_id = $(this).parent().parent().attr('data-id');
        approved_denied_date(3, calendar_attendee_id);
    });

    function approved_denied_date(action, id) {
        var modal = '';
        $('input[name=calendar_attendee_id]').val(id);
        if (action == 1) {
            modal = '#modalConfirmationDate';
            $(modal + ' span.title_message_confirmation').text(event_message.getMessage(32));
        } else  if (action == 2) {
            modal = '#modalDeniedDate';
            $(modal + ' span.title_message_confirmation').text(event_message.getMessage(33));
        } else  if (action == 3) {
            modal = '#modalDoneDate';
            $(modal + ' span.title_done_confirmation').text(event_message.getMessage(43));
        }
        $(modal).modal('show');
    }

    $('#modalConfirmationDate button.act-accept-date').click(function(e) {
        e.preventDefault();
        var modal = '#modalConfirmationDate';
        save_approved_denied_date(1, modal);
    });

    $('#modalDeniedDate button.act-reject-date').click(function(e) {
        e.preventDefault();
        var modal = '#modalDeniedDate';
        save_approved_denied_date(2, modal);
    });

    $('#modalDoneDate button.act-done-date').click(function(e) {
        e.preventDefault();
        var modal = '#modalDoneDate';
        save_approved_denied_date(3, modal);
    });

    function save_approved_denied_date(action, modal) {
        var event_id = event_main.get_event_id(true);
        event_main.showLoader();
        var $form = '';
        if (action == 1) {
            $form = $('form#formConfirmationDate');
        } else if (action == 2) {
            $form = $('form#formDeniedDate');
        } else if (action == 3) {
            $form = $('form#formDoneDate');
        }
        var formData = new FormData($form[0]);
        formData.append('action', action);
        $.ajax({
            url: '/evento/' + event_id + '/accept_denied_date',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function(data_result) {
            var result = event_main.parse_result(data_result)
            if (result.success == true) {
                $(modal).modal('hide');
                $('td#state_att_' + result.id).html(result.state_message);
                event_main.hideLoader();
                 if (action == 1) {
                    toastr.success(event_message.getMessage(34));
                } else if (action == 2) {
                    toastr.success(event_message.getMessage(35));
                } else if (action == 3) {
                    toastr.success(event_message.getMessage(44));
                }
                $('textarea#reject-response').val('');
            } else if (result.error == true) {
                toastr.error(event_message.getMessage(result.message));
                event_main.hideLoader();
            }
        });
    }


});