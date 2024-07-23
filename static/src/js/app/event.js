odoo.define('df_website_front.event', function (require) {
    "use strict"

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var core = require('web.core');
    var Dialog = require('web.Dialog');
    const ajax = require('web.ajax');
    var event_main = require('df_website_front.event_main');
    var utils = require('web.utils');
    var translation = require('web.translation');
    var _t = translation._t;
    var event_message = require('df_website_front.event_message');
    var session = require('web.session');
    var TICKET_EXHIBITOR = require('df_website_front.user_sign').TICKET_EXHIBITOR;
    var REGISTRATION_MODE = require('df_website_front.user_sign').REGISTRATION_MODE;
    var selectValidation = require('df_website_front.user_sign').selectValidation;
    var customValidation = require('df_website_front.user_sign').customValidation;
    var inputValidation = require('df_website_front.user_sign').inputValidation;
    var textareaValidation = require('df_website_front.user_sign').textareaValidation;
    var emailValidation = require('df_website_front.user_sign').emailValidation;
    var emailVerify = require('df_website_front.user_sign').emailVerify;
    var phoneValidation = require('df_website_front.user_sign').phoneValidation;
    var urlValidation = require('df_website_front.user_sign').urlValidation;
    const env = require('web.commonEnv');

    //Variable que almacena las conferencias que se van creando en el registro
    var LIST_CONFERENCE = [];
    //    var FILE_SESSION = [];

    function parse_result(result) {
        return JSON.parse(result)
    }

    function show_dialog(title = '', content, size = 'larger') {
        //'extra-large', 'large', 'medium'
        var dialog = new Dialog(this, {
            $content: content,
            buttons: [],
            title: _t(title),
            size: "large",
        }).open();
    };

    function redirectHome() {
        var event_id = event_main.get_event_id(true);
        setTimeout(() => {
            event_main.hideLoader();
            window.location = '/evento/' + event_id;
        }, 3000);
    }

    function save_track(close = false) {
        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');

        let validado = true;
        $('#track_form_id select.my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });
        $('#track_form_id input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });

        if (validado) {
            var $form = $('form#track_form_id');
            var formData = new FormData($form[0]);
            var event_id = event_main.get_event_id(true)
            formData.append('theme_tag_id_all', $('select[name=theme_tag_id]').val());
            event_main.showLoader();
            $.ajax({
                url: '/evento/' + event_id + '/track_proposal/post_ajax',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);
                if (result.success == true) {
                    toastr.success(_t('The chat was successfully registered.'));
                    if (close) {
                        redirectHome();
                    } else {
                        event_main.hideLoader();
                    }
                }
                if (result.error == true) {
                    event_main.hideLoader();
                    toastr.error(event_message.getMessage(result.message));
                }
            });
        } else
            toastr.error(_t('Check the required fields.'));
    }

    $('button#event_save_new_track').on('click', function (ev) {
        ev.preventDefault();
        save_track()
        return false;
    });

    $('button#event_save_close_track').on('click', function (ev) {
        ev.preventDefault();
        save_track(true)
        return false;
    });



    $('a.btn-convocatoria').on('click', function () {
        var self = this;
        var event_id = event_main.get_event_id()
        var lang = utils.get_cookie('frontend_lang') || getLang();
        var iframe_content = "<iframe  src='/evento/" + event_id + "/announcement_en'  width='100%' height='600px' style='border: none;' />";
        if (lang == 'es_ES') {
            iframe_content = "<iframe  src='/evento/" + event_id + "/announcement_es'  width='100%' height='600px' style='border: none;' />";
        }
        var title = _t("Announcement");
        var content = iframe_content;
        show_dialog(title, content)
    });

    $('button#newsletter_id').on('click', function (ev) {
        ev.preventDefault();
        var $form = $('form#form_newsletter_id');
        var formData = new FormData($form[0]);
        var event_id = event_main.get_event_id();

        if ($('#input_newsletter_field').val() != "") {
            if (emailVerify($('#input_newsletter_field'))) {
                event_main.showLoader();
                $.ajax({
                    url: '/evento/' + event_id + '/newsletter',
                    data: formData,
                    type: 'POST',
                    processData: false, // tell jQuery not to process the data
                    contentType: false // tell jQuery not to set contentType
                }).done(function (data_result) {
                    var result = parse_result(data_result);
                    event_main.hideLoader();
                    if (result.mailing_missing) {
                        toastr.error(_t('An error occurred, if it persists, contact the administrator.'))
                    } else if (result.success == true) {
                        $("#input_newsletter_field").val('');
                        toastr.success(_t('Thanks for subscribing to our newsletter! We hope it provides you with all the information you need. Do you have a friend, colleague or boss who could find the newsletter useful?'))
                    } else {
                        $("#input_newsletter_field").val('');
                        toastr.error(_t('You have already subscribed to our event.'))
                    }
                });
            } else {
                toastr.error(_t('The email format is incorrect.'));
            }
        } else {
            toastr.error(_t('Please provide an email address.'));
        }

        return false;
    });

    $('button#register_contact_us').on('click', function (ev) {
        ev.preventDefault();

        $('.input-error').removeClass('input-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');

        let validado = true;
        $('#register_contactus_form input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });

        if (validado) {
            var $form = $('form#register_contactus_form');
            var formData = new FormData($form[0]);
            var event_id = event_main.get_event_id(true);
            event_main.showLoader();
            $.ajax({
                url: '/evento/' + event_id + '/contact_us_ajax',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);
                if (result.success == true) {
                    toastr.success(_t('Thank you for contacting us. We will reply to you as soon as possible'));
                    redirectHome();
                } else {
                    event_main.hideLoader();
                    toastr.error(_t('There are mandatory or buggy fields.'))
                }

            });
        } else
            toastr.error(_t('Check the required fields.'));

        return false;
    });

    $('button.btn-plan').on('click', function () {
        var self = this;
        var event_id = event_main.get_event_id(true);
        var plan_id = $(self).data('plan-id');
        var title = "Plan";
        var content = "<iframe  src='/evento/" + event_id + '/' + plan_id + "/plan'  width='100%' height='600px' style='border: none;' />";
        show_dialog(title, content)
    });

    $('a.btn-event-plan,a.btn-event-plan-sponsor').on('click', function () {
        var self = this;
        var event_id = event_main.get_event_id(true);
        var title = _t("Categories");
        var lang = utils.get_cookie('frontend_lang') || getLang();
        var iframe_content = "<iframe  src='/evento/" + event_id + "/event_plan_en'  width='100%' height='600px' style='border: none;' />";
        if (lang == 'es_ES') {
            var iframe_content = "<iframe  src='/evento/" + event_id + "/event_plan_es'  width='100%' height='600px' style='border: none;' />";
        }
        show_dialog(title, iframe_content)
    });

    $('form#track_form_id').on('submit', function () {
        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');

        let validado = true;
        $('#track_form_id select.my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });
        $('#track_form_id input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });

        if (validado) {
            return true;
        } else {
            toastr.error(_t('Check the required fields.'));
            return false;
        }
    });

    $('.my-select').on('hidden.bs.select', function (e) {
        let my_select = $(this).children('select.my-select');
        if (my_select.val() == "") {
            $(this).parent().children('label.my-form-label').css({
                '-webkit-transform': 'none',
                'transform': 'none'
            });
        } else if (my_select.attr('id') == 'theme_select_id') {
            $('form#search_speaker_form').submit()
        } else if (my_select.attr('id') == 'type_participant_id') {
            $('form#search_participant_form').submit()
        }
    });

    $('#register_user_profile').click(function (e) {
        e.preventDefault();

        //         bootbox.alert('This is an alert with a callback!', function() {
        //                    console.log('This was logged in the callback!');
        //                    });

        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');
        let validado = true;
        $('#form_register_user_profile select.my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });
        $('#form_register_user_profile input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });
        if (validado) {
            var $form = $('form#form_register_user_profile');
            var formData = new FormData($form[0]);
            var url_end = '/' + session.user_id + '/save_profile';
            if (session.start_event_id) {
                url_end = '/' + session.start_event_id + '/' + session.user_id + '/save_profile';
            }
            if ($('select[name=objetive_id]').val() != '' && $('select[name=objetive_id]').val() != 'undefined' &&
                $('select[name=objetive_id]').val() != undefined) {
                formData.append('objetive_ids', $('select[name=objetive_id]').val())
            }
            event_main.showLoader();

            $.ajax({
                url: url_end,
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);
                if (result.success == true) {
                    if (result.event_id == false) {
                        setTimeout(() => {
                            window.location = '/event/';
                            toastr.success(_t(event_message.getMessage(result.message)));
                            event_main.hideLoader();
                        }, 1000);
                    } else {
                        setTimeout(() => {
                            window.location = '/evento/' + result.event_id;
                            toastr.success(_t(event_message.getMessage(result.message)));
                            event_main.hideLoader();
                        }, 1000);
                    }

                } else {
                    event_main.hideLoader();
                    toastr.error(_t(event_message.getMessage(result.message)));
                }
            });
        } else
            toastr.error(_t('Check the required fields.'));
    });

    $('a#user-stand-profile-next').click(function (e) {
        e.preventDefault();
        $('#user_profile_stand_socials').click();
    });

    $('#stand-profile-next').click(function (e) {
        e.preventDefault();
        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');
        let validado = true;
        $('#form_register_stand_profile select.my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });
        $('#form_register_stand_profile input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });
        if (validado)
            $('#stand_profile_socials').click();
        else
            toastr.error(_t('Check the required fields.'));
    });

    $('#register_stand_profile').click(function (e) {
        e.preventDefault();
        var $form = $('form#form_register_stand_profile');
        var formData = new FormData($form[0]);
        var url_end = '/' + session.user_id + '/save_profile';
        if (session.start_event_id) {
            url_end = '/' + session.start_event_id + '/' + session.user_id + '/save_profile';
        }
        event_main.showLoader();
        $.ajax({
            url: url_end,
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result.success == true) {
                toastr.success(_t(event_message.getMessage(result.message)));
                if (result.event_id == false) {
                    setTimeout(() => {
                        event_main.hideLoader();
                        window.location = '/event/';
                    }, 3000);
                } else {
                    setTimeout(() => {
                        event_main.hideLoader();
                        window.location = '/evento/' + result.event_id;
                    }, 3000);
                }

            } else {
                event_main.hideLoader();
                toastr.error(_t(event_message.getMessage(result.message)));
            }
        });
    });

    $('table#user_tracks .editTrackRow').click(function (e) {
        e.preventDefault();
        var elem_id = $(this).closest('tr').attr('id');
        var formData = new FormData();
        var event_id = event_main.get_event_id(true);
        formData.append('elem_id', elem_id);

        event_main.showLoader();
        $.ajax({
            url: '/evento/' + event_id + '/event_registrations',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result) {
                var modal = '#modalTrack';
                event_main.hideLoader();
                $('input[name=track_name]').val('');
                $('input[name=track_video]').val('');
                $('textarea[name=description]').val('');
                if (result.date != false && result.date != '') {
                    $('input[name=track_date]').val(result.date);
                    $('input[name=track_date]').next().addClass('label-select-automatic-top');
                }
                if (result.duration != false && result.duration != '') {
                    $('input[name=track_duration]').val(result.duration);
                    $('input[name=track_duration]').next().addClass('label-select-automatic-top');
                }

                if (result.name != false && result.name != '') {
                    $('input[name=track_name]').val(result.name);
                    $('input[name=track_name]').next().addClass('label-select-automatic-top');
                }
                if (result.video != false && result.video != '') {
                    $('input[name=track_video]').val(result.video);
                    $('input[name=track_video]').next().addClass('label-select-automatic-top');
                }
                if (result.description != false && result.description != '') {
                    $('textarea[name=description]').val(result.description);
                    $('textarea[name=description]').next().addClass('label-select-automatic-top');
                }

                let theme_tag_id = $('select#theme-tag-edit-id');
                let html = '';
                if (result.thematics.length > 0) {
                    result.thematics.forEach(function (item, i) {
                        html += '<option value="' + item.id + '">' + item.name + '</option>';
                    });
                    theme_tag_id.html(html);
                    theme_tag_id.selectpicker('refresh');
                }
                //label-select-automatic-top
                theme_tag_id.next().addClass('label-select-automatic-top')
                theme_tag_id.selectpicker('val', result.thematics_select);
                theme_tag_id.selectpicker('refresh');

                $(modal + ' input[name=elem_id]').val(elem_id);
                $(modal).modal('show');

            } else {
                event_main.hideLoader();
                toastr.error(_t(event_message.getMessage(result.message)));
            }
        });

    });

    //TODO
    function edit_track(elem_id, event_id) {
        var $form = $('#form_edit_track'); //el formulario con id "form_edit_track" se guarda en $form
        var formData = new FormData($form[0]); //Se crea un objeto FormData a partir del formulario seleccionado
        var event_id = event_id;

        if (event_id == null)
            event_id = $(elem_id).attr('event_id'); //Si event_id es nulo, se obtiene el valor del atributo "event_id" del elemento elem_id

        if (elem_id == '' || elem_id == undefined || elem_id == 'undefined') {
            elem_id = $('#input-track-id').val();  //Si no elem_id, se obtiene el valor del campo de entrada con el id "input-track-id"
        }

        if (event_id == '' || event_id == undefined || event_id == 'undefined') {
            event_id = $('#input-event-id').val(); //Si no event_id, se obtiene el valor del campo de entrada con el id "input-event-id" 

        }

        formData.append('elem_id', elem_id); // Se agrega el valor de elem_id al objeto FormData con la clave 'elem_id'

        if ($('select[name=theme_tag_id]').val() != '' && $('select[name=theme_tag_id]').val() != undefined &&
            $('select[name=theme_tag_id]').val() != 'undefined') {

            formData.append('theme_tag_id_all', $('select[name=theme_tag_id]').val()); // Si el elemento select con el nombre "theme_tag_id" es válido, se agrega ese valor al objeto FormData con la clave 'theme_tag_id_all'

        }

        if ($('select[name=event-list]').val() != '' && $('select[name=event-list]').val() != undefined &&
            $('select[name=event-list]').val() != 'undefined') {
            formData.append('event-list_all', $('select[name=event-list]').val()); //Si el elemento select con el nombre "event-list" es válido, se agrega ese valor al objeto FormData con la clave 'event-list_all'
        }

        if ($('select[name=presentation]').val() != '' && $('select[name=presentation]').val() != undefined &&
            $('select[name=presentation]').val() != 'undefined') {
            formData.append('presentation_all', $('select[name=presentation]').val()); //Si el elemento select con el nombre "presentation" es válido, se agrega ese valor al objeto FormData con la clave 'presentation_all'
        }

        event_main.showLoader(); //Se muestra un cargador en la interfaz
        $.ajax({ //Se realiza una solicitud AJAX
            url: '/evento/' + event_id + '/edit_track',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) { // Cuando la solicitud AJAX se completa con éxito, se ejecuta esta función con la respuesta recibida
            var result = parse_result(data_result); //Se analiza la respuesta recibida y se guarda
            if (result.success == true) { //Si la propiedad success de result es verdadera
                var modal = '#modalTrack'; // Se guarda el selector '#modalTrack'
                event_main.hideLoader(); //Se oculta el cargador en la interfaz
                //$('table#user_tracks tr[id=' + result.data.id + '] p.track_name_id').text(result.data.name);
                $(modal).modal('hide'); //Se oculta el modal con el selector guardado en la variable modal
                toastr.success(_t(event_message.getMessage(result.message))); //mensaje de éxito utilizando la biblioteca Toastr
            } else {
                event_main.hideLoader(); //Se oculta el cargador en la interfaz
                toastr.error(_t(event_message.getMessage(result.message))); //mensaje de error utilizando la biblioteca Toastr.
            }
        });
    }

    $('#modalTrack button, #btnSaveTrack').click(function () {
        var elem_id = $('#form_edit_track input[name=elem_id]').val();
        var event_id = $('select#event-list-edit').val();
        edit_track(elem_id, event_id);
    });

    function load_events_users_profile() {
        /* Adicionar documentos a una charla */
        $("a.addDocuments").click(function (e) {
            e.preventDefault();
            var track_id = $(this).closest('tr').attr('id');
            var modal = '#modalTableResourcesDocsPresentation';
            $('table#user_tracks_docs').data('track-id', track_id);
            var formData = new FormData();
            var event_id = event_main.get_event_id(true);
            formData.append('track_id', track_id);
            event_main.showLoader();
            $.ajax({
                url: '/evento/' + event_id + '/get_resource_presentation',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);

                var table = 'table#user_tracks_docs';
                $('table#user_tracks_docs tr:not(#header_track_docs)').remove();
                var row_id = 0;
                var datas = '';
                //            <a class='editRow fa fa-edit icon-fa-myfont cursor-pointer'/>
                result.docs_track.forEach(function (item, i) {
                    row_id = $(table + ' tbody tr').length + 1;
                    datas = '<tr id=' + item.id + '>';
                    datas += "<th scope='row'><p>" + row_id + "</th>";
                    datas += "<td><p>" + item.name + "</p></td>";
                    datas += "<td><img width='75px' alt='Picture' src='" + "data:image/*; base64," + item.doc_file + "' /></p></td>";
                    datas += "<td><a class='deleteDoc fa fa-close icon-fa-myfont cursor-pointer'/></td>";
                    datas += "</tr>";
                    $(table).append(datas);
                });

                event_main.hideLoader();
                $('#modalTableResourcesDocsPresentation').modal('show');
            });

        });

        /* Adicionar imagenes a una charla */
        $("a.addImages").click(function (e) {
            e.preventDefault();
            var track_id = $(this).closest('tr').attr('id');
            var modal = '#modalTableResourcesImgPresentation';
            $('table#user_tracks_imgs').data('track-id', track_id);
            var formData = new FormData();
            var event_id = event_main.get_event_id(true);
            formData.append('track_id', track_id);
            event_main.showLoader();
            $.ajax({
                url: '/evento/' + event_id + '/get_resource_presentation',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);

                var table = 'table#user_tracks_imgs';
                $('table#user_tracks_imgs tr:not(#header_track_imgs)').remove();
                var row_id = 0;
                var datas = '';

                result.imgs_track.forEach(function (item, i) {
                    row_id = $(table + ' tbody tr').length + 1;
                    datas = '<tr id=' + item.id + '>';
                    datas += "<th scope='row'><p>" + row_id + "</th>";
                    datas += "<td><p>" + item.name + "</p></td>";
                    datas += "<td><img width='75px' alt='Picture' src='" + "data:image/*; base64," + item.doc_file + "' /></p></td>";
                    datas += "<td><a class='deleteImg fa fa-close icon-fa-myfont cursor-pointer'/></td>";
                    datas += "</tr>";
                    $(table).append(datas);
                });

                event_main.hideLoader();
                $('#modalTableResourcesImgPresentation').modal('show');
            });
        });

        /* Eliminar una charla */
        $('a.deleteTrack').click(function (e) {
            e.preventDefault();
            var elem_id = $(this).closest('tr').attr('id');
            $(this).bootstrap_confirm_delete({
                heading: event_message.getMessage(16),
                message: event_message.getMessage(13),
                btn_ok_label: event_message.getMessage(14),
                btn_cancel_label: event_message.getMessage(15),
                callback: function (event) {
                    fn_remove_track(elem_id);
                }
            });
        });

        /* Eliminar un autor */
        $('a.deleteSpeaker').click(function (e) {
            e.preventDefault();
            var elem_id = $(this).closest('tr').attr('id');
            $(this).bootstrap_confirm_delete({
                heading: event_message.getMessage(16),
                message: event_message.getMessage(13),
                btn_ok_label: event_message.getMessage(14),
                btn_cancel_label: event_message.getMessage(15),
                callback: function (event) {
                    fn_remove_author(elem_id);
                }
            });
        });

        /* Eliminar un doc */
        $('a.deleteDoc').click(function (e) {
            e.preventDefault();
            var elem_id = $(this).closest('tr').attr('id');
            $(this).bootstrap_confirm_delete({
                heading: event_message.getMessage(16),
                message: event_message.getMessage(13),
                btn_ok_label: event_message.getMessage(14),
                btn_cancel_label: event_message.getMessage(15),
                callback: function (event) {
                    fn_remove_doc(elem_id);
                }
            });
        });

        /* Eliminar un img */
        $('a.deleteImg').click(function (e) {
            e.preventDefault();
            var elem_id = $(this).closest('tr').attr('id');
            $(this).bootstrap_confirm_delete({
                heading: event_message.getMessage(16),
                message: event_message.getMessage(13),
                btn_ok_label: event_message.getMessage(14),
                btn_cancel_label: event_message.getMessage(15),
                callback: function (event) {
                    fn_remove_img(elem_id);
                }
            });
        });

        /* Agregar speakers a la charla */
        $('a.add_speaker_profile').click(function (e) {
            e.preventDefault();
            var modal = '#modalAddSpeaker';
            var track_id = $(this).closest('tr').attr('id');
            $('form#formAddSpeaker input[name=track_id]').val(track_id);

            var formData = new FormData();
            var EVENT_ID = event_main.get_event_id(true);
            $.ajax({
                url: '/evento/' + EVENT_ID + '/tickets_speaker',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = event_main.parse_result(data_result);
                let html = '';
                //            if (result.length > 0) {
                let tickets = result;
                tickets.forEach(function (item, i) {
                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                });
                $('select#select_conference_ticket_id').html(html);
                $('select#select_conference_ticket_id').selectpicker('refresh');
                $(modal).modal('show');
                //            } else {
                //                toastr.error(_t("There is no configured speaker ticket."));
                //            }

            });
        });

        /* Ver los speakers de la charla */
        $('a.see_speaker_profile').click(function (e) {
            e.preventDefault();
            var modal = '#modalTrackSpeaker';
            var track_id = $(this).closest('tr').attr('id');
            var formData = new FormData();
            formData.append('track_id', track_id);
            var EVENT_ID = event_main.get_event_id(true);
            $.ajax({
                url: '/evento/' + EVENT_ID + '/detail_track_speakers',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = event_main.parse_result(data_result);

                if (result.speakers.length > 0) {
                    let tracks_by_speaker = result.speakers;
                    let track_detail = result.track;
                    let speakers = '';
                    for (var i = 0; i < tracks_by_speaker.length; i++) {
                        speakers += "<li class='mb-1'>" + tracks_by_speaker[i].name + "</li>";
                    }
                    $('#list-track-speakers').html(speakers);

                    $('h2#track-name').html(track_detail.name);
                    $('p#track-duration').html(track_detail.duration);
                    $('p#track-date').html(track_detail.date);
                    $('p#track-location').html(track_detail.location);
                    $('p#track-responsable').html(track_detail.responsable);
                    $('p#track-description').html(track_detail.description);

                    $(modal).modal('show');
                }
            });
        });
    }

    load_events_users_profile();

    $('#add_author_track_id').click(function () {
        var modal = '#modalResourcesAuthPresentation';
        $('span.title_modal_save_edit_resources_presentation').text(event_message.getMessage(60));
        $(modal + ' input[name=track_id]').val($('#input-track-id').val());
        $('#modalResourcesAuthPresentation input[name=name]').val('');
        $('#modalResourcesAuthPresentation input[email=email]').val('');
        $(modal).modal('show');
    });

    $('#add_doc_track_id, #add_doc').click(function () {
        var modal = '#modalResourcesDocsPresentation';
        $('span.title_modal_save_edit_resources_presentation').text(event_message.getMessage(39));
        $(modal + ' input[name=track_id]').val($('table#user_tracks_docs').data('track-id'));
        $('#modalResourcesDocsPresentation input[name=name]').val('');
        $('#modalResourcesDocsPresentation input[name=doc_file]').val('');
        $(modal).modal('show');
    });

    $('#add_img_track_id, #add_img').click(function () {
        var modal = '#modalResourcesImgsPresentation';
        $('span.title_modal_save_edit_resources_presentation').text(event_message.getMessage(40));
        var track_id = $(modal + ' input[name=track_id]').val($('table#user_tracks_imgs').data('track-id'));
        $('#modalTableResourcesImgPresentation input[name=name]').val('');
        $('#modalTableResourcesImgPresentation input[name=doc_file]').val('');
        $(modal).modal('show');
    });

    $('#modalResourcesAuthPresentation button#btnSaveResourcesPresentation').click(function (e) {
        e.preventDefault();
        var modal = '#documents_presentations_authors';
        var track_id = $(modal + ' input[name=track_id]').val();
        save_edit_track_resources(1);
    });

    $('#modalResourcesDocsPresentation button#btnSaveResourcesDocPresentation').click(function (e) {
        e.preventDefault();
        var modal = '#modalResourcesDocsPresentation';
        $(modal + ' input[name=track_id]').val($('#input-track-id').val());
        save_edit_track_resources(1);
    });

    $('#modalResourcesImgsPresentation button#btnSaveResourcesImgsPresentation').click(function (e) {
        e.preventDefault();
        var modal = '#modalResourcesImgsPresentation';
        $(modal + ' input[name=track_id]').val($('#input-track-id').val());
        save_edit_track_resources(2);
    });

    function set_row_track_docs(action, values) {

        if (action == 1) {
            var table = 'table#user_tracks_docs';
            var row_id = $(table + ' tbody tr').length + 1;
            var datas = '<tr id=' + values.id + '>';
            datas += "<th scope='row'><p>" + row_id + "</th>";
            datas += "<td><p>" + values.name + "</p></td>";
            datas += "<td><img width='75px' alt='Picture' src='" + "data:image/*; base64," + values.doc_file + "' /></p></td>";
            datas += "<td><a class='deleteDoc fa fa-close icon-fa-myfont cursor-pointer'/></td>";
            datas += "</tr>";
            $(table).append(datas);
        } else if (action == 2) {
            var table = 'table#user_tracks_imgs';
            var row_id = $(table + ' tbody tr').length + 1;
            var datas = '<tr id=' + values.id + '>';
            datas += "<th scope='row'><p>" + row_id + "</th>";
            datas += "<td><p>" + values.name + "</p></td>";
            datas += "<td><img width='75px' alt='Picture' src='" + "data:image/*; base64," + values.doc_file + "' /></p></td>";
            datas += "<td><a class='deleteImg fa fa-close icon-fa-myfont cursor-pointer'/></td>";
            datas += "</tr>";
            $(table).append(datas);
        }

    }

    function save_edit_track_resources(action) {
        var $form = '';
        if (action == 1) {
            $form = $('#formModalResourcesDocsPresentation');
        } else if (action == 2) {
            $form = $('#formModalResourcesImgsPresentation');
        }
        var formData = new FormData($form[0]);
        let event_id = undefined;
        formData.append('action', action);
        event_main.showLoader();
        $.ajax({
            url: event_id != '' && event_id != 'undefined' && event_id != undefined ? '/evento/' + event_id + '/save_doc_track' : '/evento/save_doc_track',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            event_main.hideLoader();
            if (result.success == true) {
                var modal = '';
                if (action == 1) {
                    modal = '#modalResourcesDocsPresentation';
                } else if (action == 2) {
                    modal = '#modalResourcesImgsPresentation';
                }
                $(modal).modal('hide');
                toastr.success(_t(event_message.getMessage(result.message)));
                set_row_track_docs(action, result.data);
            } else {
                toastr.error(_t(event_message.getMessage(result.message)));
            }
        });
    }

    function fn_remove_resources_track(elem_id, action = 1) {
        var event_id = event_main.get_event_id(true);
        var formData = new FormData();
        formData.append('elem_id', elem_id);
        event_main.showLoader();
        $.ajax({
            url: '/evento/' + event_id + '/remove_resource_present',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            event_main.hideLoader();

            if (result.success == true) {
                if (action == 1) {
                    $('table#user_tracks_docs tbody tr#' + result.data).remove();
                } else if (action == 2) {
                    $('table#user_tracks_imgs tbody tr#' + result.data).remove();
                }
                toastr.success(event_message.getMessage(result.message));
            } else if (result.error == true) {
                toastr.error(event_message.getMessage(result.message));
            }
        });
    }

    function send_date_event() {
        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');

        var $form = 'form#formDateEvent';

        let validado = true;
        $($form + ' select.my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });

        $($form + ' textarea.my-form-control').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!textareaValidation($(this)))
                    validado = false;
            }
        });

        $($form + ' input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });

        if (validado) {
            var event_id = event_main.get_event_id(true);
            var formData = new FormData($($form)[0]);
            event_main.showLoader();
            $.ajax({
                url: '/evento/' + event_id + '/send_date_event',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);
                event_main.hideLoader();
                if (result.success == true) {
                    toastr.success(event_message.getMessage(result.message));
                } else if (result.error == true) {
                    toastr.error(event_message.getMessage(result.message));
                }
            });
        } else
            toastr.error('Check the required fields.');
    }

    $('button#register_date_event').click(function (e) {
        e.preventDefault();
        send_date_event();
    });

    $('button#filter-clear').click(function (e) {
        e.preventDefault();
        $('select[name=country_send]').val('');
        $('select[name=pavilion_send]').val('');
        $('input[name=stand_filter_input]').val('');
    });

    $('button#add_conference_register').click(function (e) {
        e.preventDefault();
        let modal = '#modalAddConference';
        let $form = "#formModalAddConference";
        $($form + ' input[name=name]').val('');
        var EVENT_ID = event_main.get_event_id(true);
        var formData = new FormData();
        $.ajax({
            url: '/evento/' + EVENT_ID + '/presentation',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = event_main.parse_result(data_result);
            let html_t = '';
            $('textarea#brief_resume_id').val('');
            if (result.types.length > 0) {
                let types = result.types;
                types.forEach(function (item, i) {
                    html_t += '<option value="' + item.id + '">' + item.name + '</option>';
                });
                $('select#type_track_select').html(html_t);
                $('select#type_track_select').selectpicker('refresh');
            }
            $(modal).modal('show');
        });

    });

    $('button.btnSaveConference').click(function (e) {
        e.preventDefault();
        let validado = true;
        let $form = "#formModalAddConference";
        let $modal = "#modalAddConference";
        $($form + ' select.my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });

        $($form + ' textarea.my-form-control').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!textareaValidation($(this)))
                    validado = false;
            }
        });

        $($form + ' input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });
        if (validado) {
            let track_name = $('#track_name_register').val();
            let type_select = $('#type_track_select option:selected');
            let description = $('#brief_resume_id').val();
            let type_id = '';
            let type_name = '';
            if (type_select != '') {
                type_id = type_select.val();
                type_name = type_select.text();
            }

            let table = 'table#user_track_register tbody';
            let nro_track = $(table + ' tr').length + 1;

            //            if (document.getElementById('file_session_id') != '' && document.getElementById('file_session_id') != undefined){
            //                FILE_SESSION.push(document.getElementById('file_session_id').files[0]);
            //            }
            //


            $(table).append("<tr id=" + nro_track + "><td>" + nro_track + "</td><td>" + track_name + "</td><td data-id=" + type_id + ">" + type_name + "</td><td>" + _t('Proposal') + "</td><td class='d-none'>" + description + "</td><td><a class='deleteRow fa fa-close icon-fa-myfont cursor-pointer'/></td></tr>");
            $($modal).modal('hide');
        } else {
            toastr.error('Check the required fields.');
        }
    });

    $("#user_track_register").on('click', '.deleteRow', function (e) {
        e.preventDefault();
        var elem_id = $(this).closest('tr').attr('id');
        $(this).bootstrap_confirm_delete({
            heading: event_message.getMessage(16),
            message: event_message.getMessage(49),
            btn_ok_label: event_message.getMessage(14),
            btn_cancel_label: event_message.getMessage(15),
            callback: function (event) {
                $('table#user_track_register tbody tr#' + elem_id).remove();
            }
        });

    });

    $('button.btnSaveSpeaker').click(function (e) {
        e.preventDefault();
        var $form = 'form#formAddSpeaker';
        var validado = true;

        $($form + ' select.my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });

        $($form + ' textarea.my-form-control').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!textareaValidation($(this)))
                    validado = false;
            }
        });

        $($form + ' input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });

        if (validado) {
            var formData = new FormData($($form)[0]);
            var EVENT_ID = event_main.get_event_id(true);
            //            event_main.showLoader();
            $.ajax({
                url: '/evento/' + EVENT_ID + '/add_speaker',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = event_main.parse_result(data_result);
                event_main.hideLoader();
                if (result.success == true) {
                    toastr.success(event_message.getMessage(result.message));
                    $('#modalAddSpeaker').modal('hide');
                } else if (result.error == true) {
                    toastr.error(event_message.getMessage(result.message));
                }
            });
        }
    });

    $('a.posters-gallery-item').on('click', function () {
        var self = this;
        var content = '';
        var event_id = event_main.get_event_id(true);
        var attachment_id = $(this).data('id');
        var type_doc = $(this).data('type-doc');
        var title = $(this).data('track-name');
        var download = $(this).data('track-download');

        if (download == 'undefined' || download == undefined) {
            if (type_doc == 'image') {

                var formData = new FormData();
                var EVENT_ID = event_main.get_event_id(true);

                $.ajax({
                    url: '/evento/' + EVENT_ID + '/document_track/' + attachment_id,
                    data: formData,
                    type: 'POST',
                    processData: false, // tell jQuery not to process the data
                    contentType: false // tell jQuery not to set contentType
                }).done(function (data_result) {
                    content = "<div class='text-center'><img alt='Picture' class='w-100 img-fluid' src='" + "data:image/*; base64," + data_result + "' /></div>";
                    show_dialog(title, content, 'medium');
                });

            } else {
                content = "<iframe  src='/evento/" + event_id + "/document_track/" + attachment_id + "' width='100%' height='600px' style='border: none;' />";
                show_dialog(title, content);
            }
        }
    });

    $('.my-select').on('hidden.bs.select', function (e) {
        e.preventDefault();
        let my_select = $(this).children('select.my-select');
        if (my_select.attr('id') == 'select_type_talk') {
            event_main.showLoader();
            var EVENT_ID = $('input#EVENT_ID').val();
            var area_id = $('input#poster_area_id').val();
            var val_type = my_select.val();
            var search_poster = $('input#search_poster_id').val();
            window.location = '/evento/' + EVENT_ID + '/' + area_id + '/event_area?filter_typ=' + val_type + '&search_post=' + search_poster;
        }
    });

    /* Eliminar charla desde el perfil de usuario */
    function fn_remove_track(id) {
        var event_id = event_main.get_event_id(true);
        var formData = new FormData();
        formData.append('id', id);
        //event_main.showLoader();

        $.ajax({
            url: event_id != '' && event_id != undefined && event_id != 'undefined' ? '/evento/' + event_id + '/remove_track' : '/evento/remove_track',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result.success == true) {
                event_main.hideLoader();
                toastr.success(event_message.getMessage(result.message));
                $('div#table-users-profile-id').html(result.html);
                load_events_users_profile();
            }
        });
    }

    function fn_remove_author(id) {
        var formData = new FormData();
        formData.append('id', id);
        //event_main.showLoader();

        $.ajax({
            url: '/evento/remove_author',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result.success == true) {
                event_main.hideLoader();
                toastr.success(event_message.getMessage(result.message));
            }
        });
    };

    function fn_remove_doc(id) {
        var formData = new FormData();
        formData.append('id', id);
        //event_main.showLoader();

        $.ajax({
            url: '/evento/remove_doc',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result.success == true) {
                event_main.hideLoader();
                toastr.success(event_message.getMessage(result.message));
            }
        });
    };

    function fn_remove_img(id) {
        var formData = new FormData();
        formData.append('id', id);
        //event_main.showLoader();
        alert(id)

        $.ajax({
            url: '/evento/remove_img',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result.success == true) {
                event_main.hideLoader();
                toastr.success(event_message.getMessage(result.message));
            }
        });
    };

    $('button#btnSaveResourcesAuthorPresentation').click(function (e) {
        e.preventDefault();
        var $form = 'form#formModalResourcesAuthPresentation';
        var formData = new FormData($($form)[0]);
        var EVENT_ID = event_main.get_event_id(true);
        //            event_main.showLoader();
        $.ajax({
            url: '/evento/' + EVENT_ID + '/add_speaker',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = event_main.parse_result(data_result);
            event_main.hideLoader();
            if (result.success == true) {
                toastr.success(event_message.getMessage(result.message));
                $('#modalAddSpeaker').modal('hide');
                window.location.reload();
            } else if (result.error == true) {
                toastr.error(event_message.getMessage(result.message));
            }
        });

    });

    $('input#search_poster_id').bind("enterKey", function (e) {
        e.preventDefault();
        var EVENT_ID = $('input#EVENT_ID').val();
        var val_type = $('select#select_type_talk').val();
        var area_id = $('input#poster_area_id').val();
        window.location = '/evento/' + EVENT_ID + '/' + area_id + '/event_area?filter_typ=' + val_type + '&search_post=' + $(this).val();
    });

    // KEYMAP
    $('input#search_poster_id').keyup(function (e) {
        // Enter
        if (e.keyCode == 13) {
            $(this).trigger("enterKey");
        }
        //        else if(e.keyCode == 8){
        //            //Backspace
        //            $(this).trigger("enterKey");
        //        }
    });

    function set_empty_all_fields(form_id = 'formPayments') {
        $('form#' + form_id + ' input, form#' + form_id + ' textarea').each(function (index) {
            $(this).val('');
        });
    }

    // Contador para el HOME, revisar luego con el snippet
    function update_counts_home() {
        var event_id = event_main.get_event_id();
        ajax.jsonRpc('/counts', 'call', {
            'event_id': event_id
        }).then(function (result) {
            console.warn(result);
            if (result.success == true) {
                $('span.s_numbers_countrys').html(result.countrys);
                $('span.s_numbers_attendees').html(result.attendees);
                $('span.s_numbers_sessions').html(result.sessions);
            }
        });
    }
    if ($('section.s_custom_numbers').length > 0) {
        //Cada 30 min
        setTimeout(function () {
            update_counts_home();
        }, 3000);

        //Cada 30 min
        setInterval(function () {
            update_counts_home();
        }, 1800000);
    }

    //INSCRIPTIONS
    $('a.ChangeStatusInscription').click(function (e) {
        e.preventDefault();
        var elem_id = $(this).closest('tr').attr('id');
        var formData = new FormData($form[0]);
        formData.append('elem_id', elem_id);

        $(this).bootstrap_confirm_delete({
            heading: event_message.getMessage(62),
            message: event_message.getMessage(61),
            btn_ok_label: event_message.getMessage(14),
            btn_cancel_label: event_message.getMessage(15),
            callback: function (event) {
                event_main.showLoader();
                $.ajax({
                    url: '/evento/edit_status_registrations',
                    data: formData,
                    type: 'POST',
                    processData: false, // tell jQuery not to process the data
                    contentType: false // tell jQuery not to set contentType
                })
                event_main.hideLoader();
            }
        });

    });

    // Edit Inscriptions
    //Levanta modal Edit Inscriptions //TODO
    $("a.EditInscription").on("click", function () {
        var registrationId = parseInt($(this).closest("tr").attr("id"));
        console.log("ID de registration a enviar:", registrationId);
        event_main.showLoader();

        $.ajax({
            url: '/evento/get_data_event_registration',
            type: "GET",
            data: { registration_id: registrationId },
            success: function (data) {
                // var data = parse_result(result);
                console.log("Datos recibidos:", data);
                event_main.hideLoader();

                if (data.error) {
                    console.log('Error:', data.error);
                    return;
                }

                $('input[name=registration_id]').val(registrationId);

                $('input[id=event]').val(data.event);

                 // (cargar opciones de moneda) Llamar a updateCurrencyOptions con el registration_id y country_id
                var countryId = $('#country_person_id').val();
                if (countryId) {
                    var requestData = {
                        registration_id: registrationId,
                        country_id: countryId,
                    };
                    updateCurrencyOptions(requestData, data.selected_currency_id); // Pasa también selected_currency_id
                } else {
                    loadOptions('currency_id', data.currency_id_options, data.selected_currency_id); // Cargar las opciones de moneda directamente si no hay country_id
                }

                loadOptions('type_attendee', data.type_attendee_options, data.selected_type_attendee);
                loadOptions('event_tickets', data.event_tickets_options, data.selected_event_tickets);
                $('#required_lodging').prop('checked', data.selected_lodging_id);
                // Mostrar u ocultar sección y campos relacionados al lodging 
                if (data.event_required_lodging) {
                    $('.lodging-section').removeClass('d-none');
                    $('#required_lodging').prop('checked', data.selected_lodging_id);
                    if (data.selected_lodging_id) {
                        enable_disable_lodging(true);
                    } else { enable_disable_lodging(false); }

                } else {
                    $('.lodging-section').addClass('d-none');
                }
                loadOptions('lodging_id', data.lodging_id_options, data.selected_lodging_id);
                loadOptions('room_type', data.room_type_options, data.selected_room_type);
                $('input[id=number_nights]').val(data.number_nights);
                // Asegúrate de que el valor de la fecha está en un formato compatible con el input de tipo "date"
                var formattedDate = data.entry_date ? new Date(data.entry_date).toISOString().split('T')[0] : '';
                $('input[id=entry_date]').val(formattedDate);
                $('input[id=companion]').val(data.companion);

                applyModifiers(data.state);

                $('#modalEditRegistrations').modal('show'); // Abre el modal después de cargar los datos
            },
            error: function (error) {
                console.log('Error:', error);
                event_main.hideLoader();
                toastr.error(_t(event_message.getMessage(error.message)));
            }
        });
    });

    

    function loadOptions(selectId, options, selectedValue) {
        var selectElement = $('#' + selectId);
        selectElement.empty(); // Limpiar el select
    
        options.forEach(function(option) {
            selectElement.append('<option value="' + option.id + '">' + option.name + '</option>');
        });
    
        // Verificar la selección de la opción después de añadirlas
        if (selectedValue && options.length > 0) {
            selectElement.val(selectedValue).change(); // Seleccionar la primera opción si está disponible
        } else {
            selectElement.change();
        }
    
        // refresh Selectpicker and set value
        if (selectElement.hasClass('selectpicker')) {
            selectElement.selectpicker('refresh');
            selectElement.selectpicker('val', selectedValue);
        }
    }

    // Configuración del check ´Required-Lodging´
    $('#required_lodging').on('change', function (ev) {
        ev.preventDefault();
        if ($(this).is(':checked')) {
            enable_disable_lodging(true); // mostrar campos
        } else {
            enable_disable_lodging(false); // ocultar campos
        }
    });


    function enable_disable_lodging(REQUIRED_LODGING) {
        let fade_lodging = $('.fade-lodging');

        if (REQUIRED_LODGING == true) { //mostrar
            fade_lodging.removeClass('d-none');
            fade_lodging.find('select, input').attr('is-required', 'true');
        } else { //ocultar
            fade_lodging.addClass('d-none');
            fade_lodging.find('select, input').removeAttr('is-required');
        }
    }

    // Aplicar modificadores al campo event_ticket_id
    function applyModifiers(state) {
        let eventTicketField = $('#event_tickets');

        // Aplicar disabled basado en el estado del evento
        if (state != 'draft' && state != 'open') {
            console.log('state:', state);
            eventTicketField.attr('disabled', 'disabled');
        } else {
            eventTicketField.removeAttr('disabled');
        }
    }

    // actualizar las opciones del selector currency_id en función de la opción seleccionada en el selector country_person_id
    $('#country_person_id').on('change', function () {
        var registration_id = $('#registration_id').val();
        var countryId = $(this).val(); // Obtener el ID del país seleccionado
        var data = {
            registration_id: registration_id,
            country_id: countryId,
        };

        if (countryId && registration_id) {
            updateCurrencyOptions(data, 2); // Llamar a la función para actualizar las opciones de moneda
            console.log('updating to currency from:', countryId);
        } else {
            // Si no hay país seleccionado, limpiar el selector de moneda
            $('#currency_id').empty().selectpicker('refresh');
        }
    });

    function updateCurrencyOptions(data, selectedValue) {
        $.ajax({
            url: '/evento/get_currency_by_country',
            type: 'GET',
            data: data,
            success: function (response) {
                if (response.success) {
                    loadOptions('currency_id', response.currency_id_options, selectedValue); // Cargar las opciones de moneda del país y preseleccionar usd      
                } else {
                    console.log('Error al obtener las opciones de moneda:', response.error);
                }
            },
            error: function (error) {
                console.log('Error en la llamada AJAX:', error);
            }

        });
    }

    //PENDIENTE //TODO
    $('#btnAceptEditRegistrations').click(function () {
        var registration_id = $('#registration_id').val();

        // Variables de campos obligatorios
        var country_val = $('#country_person_id').val();
        var currency_val = $('#currency_id').val();
        var type_attendee_val = $('#type_attendee').val();
        var tickets_val = $('#event_tickets').val();

        // Variables de campos obligatorios si se alojará
        var required_lodging_val = $('#required_lodging').is(':checked');
        var lodging_val = $('#lodging_id').val();
        var room_type_val = $('#room_type').val();
        var number_nights_val = $('#number_nights').val();
        var entry_date_val = $('#entry_date').val();
        var companion_val = $('#companion').val();

        var data = {
            country_val: country_val,
            currency_val: currency_val,
            type_attendee_val: type_attendee_val,
            tickets_val: tickets_val,
            required_lodging_val: required_lodging_val,
            lodging_val: lodging_val,
            room_type_val: room_type_val,
            number_nights_val: number_nights_val,
            entry_date_val: entry_date_val,
            companion_val: companion_val,
            registration_id: registration_id,
        };

        var data2 = {
            country_val: country_val,
            currency_val: currency_val,
            type_attendee_val: type_attendee_val,
            tickets_val: tickets_val,
            registration_id: registration_id,
        };

        // Limpiar mensajes de error anteriores
        $('.my-alert').addClass('d-none');

        // Comprobar y marcar campos obligatorios vacíos
        var hasError = false;
        if (isEmpty(country_val)) { showError('#country_person_id'); hasError = true; }
        if (isEmpty(currency_val)) { showError('#currency_id'); hasError = true; }
        if (isEmpty(type_attendee_val)) { showError('#type_attendee'); hasError = true; }
        if (isEmpty(tickets_val)) { showError('#event_tickets'); hasError = true; }

        // Comprobar campos obligatorios si se aloja
        if (required_lodging_val) {
            if (isEmpty(lodging_val)) { showError('#lodging_id'); hasError = true; }
            if (isEmpty(room_type_val)) { showError('#room_type'); hasError = true; }
            if (isEmpty(number_nights_val)) { showError('#number_nights'); hasError = true; }
            if (isEmpty(entry_date_val)) { showError('#entry_date'); hasError = true; }
        }


        // Si está desmarcado required logding llamar a la función sin los datos relacionados
        // Si hay errores, no continuar
        if (!hasError && !required_lodging_val) {
            edit_inscription(data2);
        }
        // Si hay errores, no continuar
        else if (!hasError) {
            edit_inscription(data);
        }
    });

    function isEmpty(value) {
        return value == null || value === "" || value === undefined || value === 'undefined';
    }

    function showError(fieldId) {
        $(fieldId).closest('.mb-4').find('.my-alert').removeClass('d-none');
    }

    function edit_inscription(data) {
        $.ajax({
            url: "/evento/update_registration",
            type: "POST",
            data: $.param(data), // Convertir el objeto a formato URL-encoded
            success: function (response) {
                if (response.success) {
                    $('#modalEditRegistrations').modal('hide');
                    toastr.success("Registro actualizado con éxito.");
                    location.reload();
                } else {
                    toastr.error(response.error || "Error al actualizar el registro.");
                }
            },
            error: function (error) {
                console.log("Error:", error);
                toastr.error("Error al actualizar el registro, falla del servidor.");
            },
        });
    }

    $('a.ViewInscription').click(function () {
        var elem_id = $(this).closest('tr').attr('id');
        var formData = new FormData();
        formData.append('elem_id', elem_id);
        event_main.showLoader();
        $.ajax({
            url: '/evento/event_registrations',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result) {
                var modal = '#modalViewRegistrations';
                event_main.hideLoader();
                $('input[name=event_registrations]').val(result.event);
                $('input[name=event_tickets_registrations]').val(result.event_ticket);
                $('input[name=event_type_attendee_registrations]').val(result.type_attendees);
                $('input[name=event_lodging_registrations]').val(result.lodging);
                $('input[name=event_room_type_registrations]').val(result.room_type);
                $('input[name=event_event_number_nights_registrations]').val(result.number_nights);
                $('input[name=event_entry_date_registrations]').val(result.entry_date);
                $('input[name=event_companion_registrations]').val(result.companion);
                $('input[name=event_type_institution_registrations]').val(result.type_institution);
                $('input[name=event_category_investigative_registrations]').val(result.category_investigative);
                $('input[name=event_price_list_registrations]').val(result.pricelist);
                $('input[name=event_invoice_registrations]').val(result.invoice);
                $('input[name=event_state_registrations]').val(result.state);

                $(modal).modal('show');
            } else {
                event_main.hideLoader();
                toastr.error(_t(event_message.getMessage(result.message)));
            }
        });
    });
    $('a.InscriptionsRegistration').click(function () {
        var elem_id = $(this).closest('tr').attr('id');
        var formData = new FormData();
        formData.append('elem_id', elem_id);
        event_main.showLoader();
        $.ajax({
            url: '/evento/event_registrations',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result) {
                var modal = '#modal_inscriptions_registration';
                event_main.hideLoader();
                $('input[name=event_registrations]').val(result.event);
                $('input[name=event_tickets_registrations]').val(result.event_ticket);
                $(modal).modal('show');
            } else {
                event_main.hideLoader();
                toastr.error(_t(event_message.getMessage(result.message)));
            }
        });
    });

    return {
        'redirectHome': redirectHome,
        'set_empty_all_fields': set_empty_all_fields
    }


});
