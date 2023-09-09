odoo.define('df_website_front.event-stand', function (require) {
    "use strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var event_main = require('df_website_front.event_main');
    var event_event = require('df_website_front.event');
    var event_message = require('df_website_front.event_message');
    var event_networking = require('df_website_front.networking');
    var selectValidation = require('df_website_front.user_sign').selectValidation;
    var customValidation = require('df_website_front.user_sign').customValidation;
    var inputValidation = require('df_website_front.user_sign').inputValidation;
    var textareaValidation = require('df_website_front.user_sign').textareaValidation;
    var emailValidation = require('df_website_front.user_sign').emailValidation;
    var emailVerify = require('df_website_front.user_sign').emailVerify;
    var phoneValidation = require('df_website_front.user_sign').phoneValidation;
    var urlValidation = require('df_website_front.user_sign').urlValidation;
    var core = require('web.core');
    var translation = require('web.translation');
    var _t = translation._t;

    function parse_result(result) {
        return JSON.parse(result)
    }

    function inputValidationTable(elem_table, element) {
        let valido = true;
        if (elem_table.length > 0) {
            $(element + " input.form-control").each(function (i, val) {
                val.classList.remove("input-error");
                if (val.value == '') {
                    valido = false;
                    val.classList.add("input-error");
                    return;
                }
            });
        }
        return valido;
    }

    //Mostrar los campos para la decoración del Stand seleccionado
    $('a[name=stand_select]').click(function (e) {
        e.preventDefault();
        $('a[name=stand_select]').children().removeClass('stand-active');
        $(this).children().addClass('stand-active');
        if ($(this).data('value') != '') {
            $('div#stand_resources_basic_id').removeClass('d-none');
            $('img.stand-decor-img').attr('src', $(this).find('img').attr('src'));
            $('h2#title_document span').html("(" + $(this).data('cant-doc') + ")");
            $('h2#title_image_gallery span').html("(" + $(this).data('cant-img') + ")");
            $('h2#title_video_gallery span').html("(" + $(this).data('cant-media') + ")");
            $('h2#title_catalogue span').html("(" + $(this).data('cant-products') + ")");
            $('h2#title_pendon span').html("(" + $(this).data('cant-pendons') + ")");
            $('h2#title_accredited span').html("(" + $(this).data('cant-attendees') + ")");

            let target = $('div#stand_resources_basic_id');
            var destination = $(target).offset().top - 10;
            $('html, body').animate({
                scrollTop: '+=' + destination
            }, 800);
        } else {
            $('div#stand_resources_basic_id').removeClass('d-block').addClass('d-none');
            $('span#stand_assigned').removeClass('d-block').addClass('d-none');
            $('span#stand_not_assigned').removeClass('d-none').addClass('d-block');
        }
    });

    function valid_row(elem, edit = false) {
        let valid = true;
        var stand_active = $('div.stand-active').parent();
        if (stand_active.length > 0) {
            var elem_insert = 0;
            var elem_limit = 0;
            var elem_table = '';
            var element = '';
            if (elem.attr('id') == 'add_document_id') {
                element = "#documents_mng";
                elem_table = $(element + " tbody tr");
                var elem_limit = stand_active.data('cant-doc');
                var elem_insert = elem_table.length;
            } else if (elem.attr('id') == 'add_image_id') {
                element = "#gallery_mng";
                elem_table = $(element + " tbody tr");
                var elem_limit = stand_active.data('cant-img');
                var elem_insert = elem_table.length;
            } else if (elem.attr('id') == 'add_media_id') {
                element = "#video_mng";
                elem_table = $(element + " tbody tr");
                var elem_limit = stand_active.data('cant-media');
                var elem_insert = elem_table.length;
            } else if (elem.attr('id') == 'add_catalogue_id' || elem.attr('id') == 'select_catalogue_id') {
                element = "#catalogue_mng";
                elem_table = $(element + " tbody tr");
                var elem_limit = stand_active.data('cant-products');
                var elem_insert = elem_table.length;
            } else if (elem.attr('id') == 'add_pendon_id') {
                element = "#pendons_mng";
                elem_table = $(element + " tbody tr");
                var elem_limit = stand_active.data('cant-pendons');
                var elem_insert = elem_table.length;
            } else if (elem.attr('id') == 'add_accredited') {
                element = "#accredited_mng";
                elem_table = $(element + " tbody tr");
                var elem_limit = stand_active.data('cant-attendees');
                var elem_insert = elem_table.length;
            }
            if (elem_insert >= elem_limit && !edit) {
                valid = false;
                toastr.error(event_message.getMessage(11));
            }
        } else {
            toastr.error(event_message.getMessage(18));
            valid = false;
        }

        return valid;
    }

    /* Variables globales para almacenar los valores temporales del diseño del stand en el perfil del mismo. */
    var LOGO_IMAGE = '';
    var PENDON1_IMAGE = '';
    var PENDON2_IMAGE = '';
    var PENDON3_IMAGE = '';
    var VIDEO_URL = '';

    function cleanDinamicInput() {
        $('.video-promo-div,.logo-div,.pendon-div,.pendon-2-div,.pendon-3-div').removeClass('d-block').addClass('d-none');
        $('#url-video-input').val('');
        $('#logo-input').val('');
        $('#pendon-1-input').val('');
        $('#pendon-2-input').val('');
        $('#pendon-3-input').val('');
        $('#video-promo-content>iframe').addClass('d-none');
        $('#logo-content').addClass('d-none');
        $('#pendon-1-content').addClass('d-none');
        $('#pendon-2-content').addClass('d-none');
        $('#pendon-3-content').addClass('d-none');
        $('#video-promo-button-div').removeClass('active-button-div');
        $('#logo-button-div').removeClass('active-button-div');
        $('#pendon-1-button-div').removeClass('active-button-div');
        $('#pendon-2-button-div').removeClass('active-button-div');
        $('#pendon-3-button-div').removeClass('active-button-div');
        $('a#dinamic-stand-button').parent().addClass('d-none')
    }

    $('a[name=stand_select]').click(function (e) {
        e.preventDefault();
        cleanDinamicInput();

        /* Si ya existe un stand previamente seleccionado se deben agregar estas clases para que no salgan
            las imágenes fuera de lugar.
            Además mostrar el video. */
        if ($('div.stand-active').length > 0) {
            $('#video-promo-button-div').addClass('active-button-div');
            $('#logo-button-div').addClass('active-button-div');
            $('#pendon-1-button-div').addClass('active-button-div');
            $('#pendon-2-button-div').addClass('active-button-div');
            $('#pendon-3-button-div').addClass('active-button-div');
        }

        let type_stand = $(this).data('stand');
        let video_id = type_stand + '-video-promo';
        let logo_id = type_stand + '-logo';
        let pendon_id = type_stand + '-pendon';
        $('.video-promo-div').attr('id', video_id).removeClass('d-none');
        $('.logo-div').attr('id', logo_id).removeClass('d-none');
        $('.pendon-div').attr('id', pendon_id).removeClass('d-none');

        if (type_stand != 'stand-b1' && type_stand != 'stand-b2' && type_stand != 'stand-b3') {
            let pendon_2_id = type_stand + '-pendon-2';
            $('.pendon-2-div').attr('id', pendon_2_id).removeClass('d-none');
            if (type_stand != 'stand-i1' && type_stand != 'stand-i2' && type_stand != 'stand-i3') {
                let pendon_3_id = type_stand + '-pendon-3';
                $('.pendon-3-div').attr('id', pendon_3_id).removeClass('d-none');
            }
        }
    });

    $('#video-promo-button').on('click', function () {
        let temp_url = $('#url-video-input').val();
        let url = "https://www.youtube.com/embed/" + temp_url.split('=')[1] + "?autoplay=1";
        VIDEO_URL = url;
        $('#video-promo-content>iframe').attr('src', url);
        $('#video-promo-button-div').addClass('active-button-div');
        $('#video-promo-content').removeClass('d-none');
        $('#dinamic-url-video').modal('hide');
    });

    $('#logo-button').on('click', function () {
        $('#logo-content')[0].src = (window.URL ? URL : webkitURL).createObjectURL(document.getElementById('logo-input').files[0]);
        LOGO_IMAGE = document.getElementById('logo-input').files[0];
        $('#logo-button-div').addClass('active-button-div');
        $('#logo-content').removeClass('d-none');
        $('#dinamic-logo').modal('hide');

    });

    $('#pendon-1-button').on('click', function () {
        $('#pendon-1-content')[0].src = (window.URL ? URL : webkitURL).createObjectURL(document.getElementById('pendon-1-input').files[0]);
        PENDON1_IMAGE = document.getElementById('pendon-1-input').files[0];
        $('#pendon-1-button-div').addClass('active-button-div');
        $('#pendon-1-content').removeClass('d-none');
        $('#dinamic-pendon-1').modal('hide');
    });

    $('#pendon-2-button').on('click', function () {
        $('#pendon-2-content')[0].src = (window.URL ? URL : webkitURL).createObjectURL(document.getElementById('pendon-2-input').files[0]);
        PENDON2_IMAGE = document.getElementById('pendon-2-input').files[0];
        $('#pendon-2-button-div').addClass('active-button-div');
        $('#pendon-2-content').removeClass('d-none');
        $('#dinamic-pendon-2').modal('hide');
    });

    $('#pendon-3-button').on('click', function () {
        $('#pendon-3-content')[0].src = (window.URL ? URL : webkitURL).createObjectURL(document.getElementById('pendon-3-input').files[0]);
        PENDON3_IMAGE = document.getElementById('pendon-3-input').files[0];
        $('#pendon-3-button-div').addClass('active-button-div');
        $('#pendon-3-content').removeClass('d-none');
        $('#dinamic-pendon-3').modal('hide');
    });

    function fn_save_stand_profile(action) {
        var $form_str = 'form#form_stand_profile_ins_data';
        var $form = $($form_str);
        var formData = new FormData($form[0]);
        var stand_active = $('div.stand-active').parent();
        let validado = true;
        if (action == 2) {
            $form = $('form#form_stand_profile_design');
            formData = new FormData($form[0]);
        } else {

            $($form_str + ' input.my-form-control').each(function (i) {
                validado = customValidation($(this), validado);
            });

            $($form_str + ' select.my-select').each(function (i) {
                if ($(this).attr('is-required') == 'true') {
                    if (!selectValidation($(this)))
                        validado = false;
                }
            });
        }

        if ($('div.stand-active').parent().length > 0) {
            formData.append('stand_select', stand_active.data('value'));
            formData.append('plan_id', stand_active.data('plan'));
            formData.append('cant_attendees', stand_active.data('cant-attendees'));
        } else {
            toastr.error(event_message.getMessage(42));
            return;
        }
        formData.append('action_id', action);
        var event_id = event_main.get_event_id(true);

        // Logo
        if (LOGO_IMAGE != 'undefined' && LOGO_IMAGE != undefined) {
            formData.append('logo_stand', LOGO_IMAGE);
        }

        // Video url
        if (VIDEO_URL != 'undefined' && VIDEO_URL != undefined) {
            formData.append('video_stand_url', VIDEO_URL);
        }

        // Pendon 1
        if (PENDON1_IMAGE != 'undefined' && PENDON1_IMAGE != undefined) {
            formData.append('pendon1', PENDON1_IMAGE);
        }

        // Pendon 2
        if (PENDON2_IMAGE != 'undefined' && PENDON2_IMAGE != undefined) {
            formData.append('pendon2', PENDON2_IMAGE);
        }

        // Pendon 3
        if (PENDON3_IMAGE != 'undefined' && PENDON3_IMAGE != undefined) {
            formData.append('pendon3', PENDON3_IMAGE);
        }
        if (validado) {
            event_main.showLoader();
            $.ajax({
                url: '/evento/' + event_id + '/save_stand_profile',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);
                if (result.success == true) {
                    event_main.hideLoader();
                    toastr.success(event_message.getMessage(result.message));
                    //Mostrar botón del Stand y si esta asignado o no, y asinar url del area en el botón de stand
                    $('a.url_span_stand').parent().removeClass('d-none').addClass('d-block');
                    $('span#stand_assigned').removeClass('d-none').addClass('d-block');
                    $('span#stand_not_assigned').removeClass('d-block').addClass('d-none');
                    if (result.area_id && result.area_id != '' && result.area_id != 'undefined' && result.area_id != undefined) {
                        $('a.url_span_stand')[0].href = result.area_id + '/event_area';
                    }

                } else if (result.error == true) {
                    toastr.error(_t(result.message));
                    event_main.hideLoader();
                }
            });
        } else
            toastr.error(_t('Check the required fields.'));
    };

    $('button#save_stand_inst_data').click(function (e) {
        e.preventDefault();
        fn_save_stand_profile(1);
    });

    $('button#save_stand_profile').click(function (e) {
        e.preventDefault();
        fn_save_stand_profile(2);
    });

    $('#allcb').change(function () {
        $('table#catalogue_mng tbody tr td input[type="checkbox"]').prop('checked', $(this).prop('checked'));
    });

    function fn_remove_resources(id, action) {
        var event_id = event_main.get_event_id(true);
        var formData = new FormData();
        formData.append('id', id);
        formData.append('action', action);
        event_main.showLoader();
        $.ajax({
            url: '/evento/' + event_id + '/remove_resource_stand',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result.success == true) {
                event_main.hideLoader();
                toastr.success(event_message.getMessage(result.message));
                set_row(action, result.data, false, true);
            } else if (result.error == true) {
                toastr.error(event_message.getMessage(result.message));
            }
        });
    }

    function set_row(action, values = null, edit = false, del_elem = false) {
        var table = '';
        var row_id = 0;
        switch (parseInt(action)) {
            case 3:
                table = 'table#pendons_mng';
                break;
            case 4:
                table = 'table#documents_mng';
                break;
            case 5:
                table = 'table#gallery_mng';
                break;
            case 6:
                table = 'table#video_mng';
                break;
            case 7:
                table = 'table#catalogue_mng';
                break;
            case 8:
                table = 'table#accredited_mng';
                break;
        }

        if (!edit && !del_elem) {
            row_id = $(table + ' tbody tr').length + 1;
            var datas = '<tr id=' + values.id + '>';
            datas += "<th scope='row'><p>" + row_id + "</th>";
        } else if (del_elem) {
            $(table + ' tbody tr#' + values).remove();
        }
        if (values != null && !del_elem) {
            if (parseInt(action) == 3) {
                $('#modalResourcesPendon select[name=position]').val('');
                $('#modalResourcesPendon input[name=image_file]').val('');
                $('#modalResourcesPendon img#load-img-url').attr('src', '/df_website_front/static/src/img/user_profile_default.png');
                $('#modalResourcesPendon').modal('hide');
            } else if (parseInt(action) == 4) {
                $('#modalResourcesDocs input[name=name]').val('');
                $('#modalResourcesDocs input[name=doc_file]').val('');
                $('#modalResourcesDocs').modal('hide');
            } else if (parseInt(action) == 5) {
                $('#modalResourcesImages input[name=image_file]').val('');
                $('#modalResourcesImages img#load-img-url').attr('src', '/df_website_front/static/src/img/user_profile_default.png');
                $('#modalResourcesImages').modal('hide');
            } else if (parseInt(action) == 6) {
                $('#modalResourcesMedias input[name=name]').val('');
                $('#modalResourcesMedias input[name=media_url]').val('');
                $('#modalResourcesMedias textarea[name=description]').val('');
                $('#modalResourcesMedias').modal('hide');
            } else if (parseInt(action) == 7) {
                $('#modalResourcesProducts img#load-img-url-resources').attr('src', '/df_website_front/static/src/img/user_profile_default.png');
                $('#modalResourcesProducts input[name=image_file]').val('');
                $('#modalResourcesProducts input[name=doc_file_award]').val('');
                $('#modalResourcesProducts input[name=name]').val('');
                $('#modalResourcesProducts input[name=reference]').val('');
                $('#modalResourcesProducts input[name=price]').val('');
                $('#modalResourcesProducts textarea[name=description]').val('');
                $('#modalResourcesProducts select[name=award_id]').val('');
                $('#modalResourcesProducts').modal('hide');
            } else if (parseInt(action) == 8) {
                $('#modalResourcesAccredited input[name=name]').val('');
                $('#modalResourcesAccredited input[name=email]').val('');
                $('#modalResourcesAccredited').modal('hide');
            } else if (parseInt(action) == 9) {
                $('#modalSelectResourcesProducts select[name=product_id]').val('');
                $('#modalSelectResourcesProducts select[name=award_id]').val('');
                $('#modalSelectResourcesProducts input[name=name]').val('');
                $('#modalSelectResourcesProducts input[name=reference]').val('');
                $('#modalSelectResourcesProducts').modal('hide');
            }

            if (parseInt(action) == 3 && !edit) {
                datas += "<td><p>" + values.name + "</p></td>";
                datas += "<td><img width='75px' alt='Picture' src='" + "data:image/*; base64," + values.file_image + "' /></p></td>";
                datas += "<td><p>" + values.position + "</p></td>";
                datas += "<td><a class='editRow fa fa-edit icon-fa-myfont cursor-pointer'/><a class='deleteRow fa fa-close icon-fa-myfont cursor-pointer'/></td>";
                datas += "</tr>";
            } else if (parseInt(action) == 5 && !edit) {
                datas += "<td><p>" + values.name + "</p></td>";
                datas += "<td><img width='75px' alt='Picture' src='" + "data:image/*; base64," + values.file_image + "' /></p></td>";
                datas += "<td><a class='editRow fa fa-edit icon-fa-myfont cursor-pointer'/><a class='deleteRow fa fa-close icon-fa-myfont cursor-pointer'/></td>";
                datas += "</tr>";
            } else if (parseInt(action) == 4 && !edit) {
                datas += "<td><p>" + values.name + "</p></td>";
                datas += "<td><a href='/web/content/" + values.id + "?download=true' target='_blank'>" +
                    "<div class='o_portal_chatter_attachment_name'>" + values.name + "</div></a> </td>";
                datas += "<td><a class='editRow fa fa-edit icon-fa-myfont cursor-pointer'/><a class='deleteRow fa fa-close icon-fa-myfont cursor-pointer'/></td>";
                datas += "</tr>";
            } else if (parseInt(action) == 6 && !edit) {
                datas += "<td><p>" + values.name + "</p></td>";
                datas += "<td><a href='" + values.url + "' _target='blank'>" + values.url + "</a></td>";
                datas += "<td><p>" + values.description + "</p></td>";
                datas += "<td><a class='editRow fa fa-edit icon-fa-myfont cursor-pointer'/><a class='deleteRow fa fa-close icon-fa-myfont cursor-pointer'/></td>";
                datas += "</tr>";
            } else if (parseInt(action) == 7 && !edit) {
                datas += "<td><p>" + values.name + "</p></td>";
                datas += "<td><p>" + values.reference + "</p></td>";
                datas += "<td><p>" + values.description + "</p></td>";
                datas += "<td><p>" + values.price + "</p></td>";
                datas += "<td><img width='75px' alt='Picture' src='" + "data:image/*; base64," + values.file_image + "' /></p></td>";
                datas += "<td><a class='editRow fa fa-edit icon-fa-myfont cursor-pointer'/><a class='deleteRow fa fa-close icon-fa-myfont cursor-pointer'/></td>";
                datas += "</tr>";
            } else if (parseInt(action) == 8 && !edit) {
                if (values != 'undefined') {
                    datas += "<td><p>" + values.name + "</p></td>";
                    datas += "<td><p>" + values.email + "</p></td>";
                    if (values.active == true) {
                        datas += "<td> <span class='fa fa-check-circle'/></td>";
                    } else {
                        datas += "<td><p></p></td>";
                    }
                    datas += "<td><a class='deleteRow fa fa-close icon-fa-myfont cursor-pointer'/></td>";
                    datas += "</tr>";
                }
            }
            if (edit == false) {
                $(table).append(datas);
            } else {

            }
        }
    }

    function fn_add_resources(action,event_id='') {

        if (action != 8){
            event_id = event_main.get_event_id(true);
        }

        var $form = '';
        if (action == 3) {
            $form = 'form#formModalResourcesPendon';
        } else if (action == 4) {
            $form = 'form#formModalResourcesDocs';
        } else if (action == 5) {
            $form = 'form#formModalResourcesImages';
        } else if (action == 6) {
            $form = 'form#formModalResourcesMedias';
        } else if (action == 7) {
            $form = 'form#formModalResourcesProducts';
        } else if (action == 8) {
            $form = 'form#formModalResourcesAccredited';
        } else if (action == 9) {
            $form = 'form#formSelectResourcesProducts';
        }

        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');

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
            var formData = new FormData($($form)[0]);
            var stand_active = $('div.stand-active').parent();
            formData.append('action', action);
            event_main.showLoader();
            if ($('input[name=current_area_id]').val() != '' && $('input[name=current_area_id]').val() != undefined && $('input[name=current_area_id]').val() != 'undefined') {
                formData.append('current_area_id', $('input[name=current_area_id]').val());
            }
            if ($('input[name=current_area_id]').val() != '') {
                formData.append('opt_for_prize', $('#opt_for_prize').checked);
            }

            $.ajax({
                url: '/evento/' + event_id + '/add_resource_stand',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);
                if (result.success == true) {
                    event_main.hideLoader();
                    toastr.success(event_message.getMessage(result.message));
                    set_row(action, result.data);
                } else if (result.error == true) {
                    event_main.hideLoader();
                    toastr.error(result.message);
                }
            });
        } else
            toastr.error('Check the required fields.');
    }

    function fn_edit_resources(action, elem_id) {
        var event_id = event_main.get_event_id(true);
        var $form = '';
        var $modal = '';
        if (action == 3) {
            $form = 'form#formModalResourcesPendon';
            $modal = 'modalResourcesPendon';
        } else if (action == 4) {
            $form = 'form#formModalResourcesDocs';
            $modal = 'ModalResourcesDocs';
        } else if (action == 5) {
            $form = 'form#formModalResourcesImages';
            $modal = 'ModalResourcesImages';
        } else if (action == 6) {
            $form = 'form#formModalResourcesMedias';
            $modal = 'ModalResourcesMedias';
        } else if (action == 7) {
            $form = 'form#formModalResourcesProducts';
            $modal = 'ModalResourcesProducts';
        } else if (action == 8) {
            $form = $('form#formModalResourcesAccredited');
            $modal = 'odalResourcesAccredited';
        }

        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');

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
            var formData = new FormData($($form)[0]);
            var stand_active = $('div.stand-active').parent();

            formData.append('action', action);
            formData.append('elem_id', elem_id);
            if ($('input[name=current_area_id]').val() != '') {
                formData.append('current_area_id', $('input[name=current_area_id]').val());
            }

            if ($('input[name=current_area_id]').val() != '') {
                formData.append('opt_for_prize', $('#opt_for_prize').checked);
            }

            event_main.showLoader();
            $.ajax({
                url: '/evento/' + event_id + '/edit_resource_stand',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);
                if (result.success == true) {
                    event_main.hideLoader();
                    toastr.success(event_message.getMessage(result.message));
                    set_row(action, result.data, true);
                    $($modal).modal('hide');
                } else if (result.error == true) {
                    toastr.error(event_message.getMessage(result.message));
                }
            });
        } else
            toastr.error('Check the required fields.');
    }

    $('button.btnSaveResourcesStand').click(function (e) {
        e.preventDefault();
        var action = $(this).parent().prev().children().find('input[name=action_id]').val();
        var event_id = '';
        if (action == 8){
            event_id = $('#select_event_id').val();
        }

        fn_add_resources(parseInt(action),event_id);
    });

    $('button.btnSaveEditResourcesStand').click(function (e) {
        e.preventDefault();
        var action = $(this).parent().prev().children().find('input[name=action_id]').val();
        var elem_id = $(this).parent().prev().children().find('input[name=elem_id]').val();
        fn_edit_resources(action, elem_id);
    });

    function disable_button_set_title(edit = true, action = false) {
        if (edit) {
            $('button.btnSaveResourcesStand').removeClass('d-block').addClass('d-none');
            $('button.btnSaveEditResourcesStand').removeClass('d-none').addClass('d-block');
            $('span.title_modal_save_edit_resources').html(event_message.getMessage(21));
        } else {
            $('button.btnSaveResourcesStand').removeClass('d-none').addClass('d-block');
            $('button.btnSaveEditResourcesStand').removeClass('d-block').addClass('d-none');
            $('span.title_modal_save_edit_resources').html(event_message.getMessage(20));
        }

        if (action == 9) {
            $('span.title_modal_save_edit_resources').html(event_message.getMessage(22));
        }
    }

    $('button#add_pendon_id').click(function (e) {
        e.preventDefault();
        if (valid_row($(this))) {
            var action = $('table#pendons_mng').data('resources');
            var stand_active = $('div.stand-active').parent();
            var html = '';
            var modal = '#modalResourcesPendon';
            for (var i = 1; i < stand_active.data('cant-pendons') + 1; i += 1) {
                html += '<option value="' + i + '"> Pendon-' + i + '</option>';
            }
            $(modal + ' #select_position_pendon').html(html);
            $(modal + ' #select_position_pendon').selectpicker('refresh');
            $(modal + ' input[name=action_id]').val(action);
            disable_button_set_title(false);
            $('#modalResourcesPendon').modal('show');
        }
    });

    $('button#add_image_id').click(function (e) {
        e.preventDefault();
        if (valid_row($(this))) {
            var action = $('table#gallery_mng').data('resources');
            disable_button_set_title(false);
            var modal = '#modalResourcesImages';
            $(modal + ' input[name=action_id]').val(action);
            $(modal).modal('show');
        }
    });

    $('button#add_document_id').click(function (e) {
        e.preventDefault();
        if (valid_row($(this))) {
            var action = $('table#documents_mng').data('resources');
            disable_button_set_title(false);
            var modal = '#modalResourcesDocs';
            $(modal + ' input[name=action_id]').val(action);
            $(modal).modal('show');
        }
    });

    $('button#add_media_id').click(function (e) {
        e.preventDefault();
        if (valid_row($(this))) {
            var action = $('table#video_mng').data('resources');
            disable_button_set_title(false);
            var modal = '#modalResourcesMedias';
            $(modal + ' input[name=action_id]').val(action);
            $(modal).modal('show');
        }
    });

    $('button#add_catalogue_id').click(function (e) {
        e.preventDefault();
        if (valid_row($(this))) {
            var action = $('table#catalogue_mng').data('resources');
            var modal = '#modalResourcesProducts';
            disable_button_set_title(false);
            $(modal + ' input[name=action_id]').val(action);
            $(modal).modal('show');
            if ($('select#select_award_id').length > 0) {
                let EVENT_ID = event_main.get_event_id(true);
                event_main.showLoader();
                $.ajax({
                    url: '/evento/' + EVENT_ID + '/categories_awards',
                    type: 'GET',
                    processData: false, // tell jQuery not to process the data
                    contentType: false // tell jQuery not to set contentType
                }).done(function (data_result) {
                    event_main.hideLoader();
                    var result = parse_result(data_result);
                    let html = '';
                    result.forEach(function (item, i) {
                        html += '<option value="' + item.id + '">' + item.name + '</option>';
                    });

                    $(modal + ' select#select_award_id').html(html);
                    $(modal + ' select#select_award_id').selectpicker('refresh');
                });
            }

        }
    });

    $('button#add_accredited, button#add_profile_accredited').click(function (e) {
        e.preventDefault();
        var action = $('table#accredited_mng').data('resources');
        var modal = '#modalResourcesAccredited';
        disable_button_set_title(false);
        $(modal + ' input[name=action_id]').val(action);

        var formData = new FormData();
        $.ajax({
            url: '/all_events',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = event_main.parse_result(data_result);
            let html = '';
            if (result.length > 0) {
                let events = result;
                events.forEach(function (item, i) {
                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                });
                $('select#select_event_id').html(html);
                $('select#select_event_id').selectpicker('refresh');
            }
            $(modal).modal('show');
        });
    });

    $('#select_event_id').change(function (e) {
        e.preventDefault();
        var formData = new FormData();
        $.ajax({
            url: '/evento/'+$(this).val()+'/tickets_acre',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = event_main.parse_result(data_result);
            let html = '';
            if (result.length > 0) {
                let tickets = result;
                tickets.forEach(function (item, i) {
                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                });
                $('select#select_accredited_ticket_id').html(html);
                $('select#select_accredited_ticket_id').selectpicker('refresh');
            } else {
                $('select#select_accredited_ticket_id').html(html);
                $('select#select_accredited_ticket_id').selectpicker('refresh');
            }
        });
    });

    $('button#select_catalogue_id').click(function (e) {
        e.preventDefault();
        var action = 9;
        var elem_id = $(this).closest('tr').attr('id');
        var formData = new FormData();
        var event_id = event_main.get_event_id(true);
        if ($('input[name=current_area_id]').val() != '') {
            formData.append('current_area_id', $('input[name=current_area_id]').val());
        }
        event_main.showLoader();
        $.ajax({
            url: '/evento/' + event_id + '/select_product',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            event_main.hideLoader();
            var result = parse_result(data_result);
            var modal = '#modalSelectResourcesProducts';
            $(modal + ' input[name=action_id]').val(action);
            let html = '';
            result.forEach(function (item, i) {
                html += '<option value="' + item.product_id + '" data-image="' + item.image + '" data-reference="' + item.reference + '" data-name="' + item.name + '" ">' + item.display_name + '</option>';
            });
            disable_button_set_title(false, 9);
            $(modal + ' select#select_product_id').html(html);
            $(modal + ' select#select_product_id').selectpicker('refresh');
            $(modal).modal('show');

        });
    });

    $("#documents_mng, #gallery_mng, #video_mng, #catalogue_mng, #pendons_mng, #accredited_mng").on('click', '.editRow', function (e) {
        e.preventDefault();
        var action = $(this).closest('table').data('resources');
        var elem_id = $(this).closest('tr').attr('id');
        var formData = new FormData();
        var event_id = event_main.get_event_id(true);
        var modal = '';
        formData.append('elem_id', elem_id);
        formData.append('action', action);
        if ($('input[name=current_area_id]').val() != '') {
            formData.append('current_area_id', $('input[name=current_area_id]').val());
        }
        event_main.showLoader();
        $.ajax({
            url: '/evento/' + event_id + '/get_resource_stand',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result.success == true) {
                var _button_add = '';
                switch (action) {
                    //Stand pendons
                    case 3:
                        _button_add = $('button#add_pendon_id');
                        if (valid_row(_button_add, true)) {
                            var stand_active = $('div.stand-active').parent();
                            var modal = '#modalResourcesPendon';
                            var html = '';
                            disable_button_set_title(true);
                            $(modal + ' input[name=elem_id]').val(elem_id);
                            $(modal + ' input[name=action_id]').val(action);
                            $('img#load-img-url').attr('src', 'data:image/*; base64,' + result.datas);
                            $(modal + ' input[name=name]').val(result.name);

                            for (var i = 1; i < stand_active.data('cant-pendons') + 1; i += 1) {
                                html += '<option value="' + i + '"> Pendon-' + i + '</option>';
                            }
                            $(modal + ' #select_position_pendon').html(html);
                            $(modal + ' #select_position_pendon').selectpicker('refresh');
                            $(modal + ' #select_position_pendon').val(3);
                            $(modal + ' #select_position_pendon').selectpicker('refresh');
                            $(modal + ' .label-position').addClass('label-select-automatic-top');
                            $(modal).modal('show');
                        }
                        break;
                    //Stand documents
                    case 4:
                        _button_add = $('button#add_document_id');
                        if (valid_row(_button_add, true)) {
                            var modal = '#modalResourcesDocs';
                            disable_button_set_title(true);
                            $(modal + ' input[name=name]').val(result.name);
                            $(modal + ' input[name=elem_id]').val(elem_id);
                            $(modal + ' input[name=action_id]').val(action);
                            $(modal + ' .label-position').addClass('label-select-automatic-top');
                            $(modal).modal('show');
                        }
                        break;
                    //Stand images
                    case 5:
                        _button_add = $('button#add_image_id');
                        if (valid_row(_button_add, true)) {
                            var modal = '#modalResourcesImages';
                            $('img#load-img-url').attr('src', 'data:image/*; base64,' + result.datas);
                            $(modal + ' input[name=name]').val(result.name);
                            $(modal + ' .label-position').addClass('label-select-automatic-top');
                            $(modal).modal('show');
                        }
                        break;
                    //Stand videos
                    case 6:
                        _button_add = $('button#add_media_id');
                        if (valid_row(_button_add, true)) {
                            var modal = '#modalResourcesMedias';
                            $(modal + ' input[name=media_url]').val(result.url);
                            $(modal + ' input[name=name]').val(result.name);
                            $(modal + ' textarea[name=description]').val(result.description);
                            $(modal + ' input[name=elem_id]').val(elem_id);
                            $(modal + ' input[name=action_id]').val(action);
                            disable_button_set_title(true);
                            $(modal + ' .label-position').addClass('label-select-automatic-top');
                            $(modal).modal('show');
                        }
                        break;
                    //Stand products
                    case 7:
                        _button_add = $('button#add_catalogue_id');
                        if (valid_row(_button_add, true)) {
                            disable_button_set_title(action, true);
                            var modal = '#modalResourcesProducts';
                            $(modal + ' input[name=name]').val(result.name);
                            $(modal + ' textarea[name=description]').val(result.description);
                            $(modal + ' input[name=price]').val(result.price);
                            $(modal + ' input[name=reference]').val(result.reference);
                            $(modal + ' img#load-img-url-resources').attr('src', 'data:image/*; base64,' + result.image);
                            $(modal + ' input[name=elem_id]').val(elem_id);
                            $(modal + ' input[name=action_id]').val(action);
                            $(modal + ' .label-position').addClass('label-select-automatic-top');

                            if (result.categories_awards != undefined && result.categories_awards != 'undefined') {
                                result.categories_awards.forEach(function (item, i) {
                                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                                });
                                $(modal + ' #select_award_id').html(html);
                                $(modal + ' #select_award_id').selectpicker('refresh');
                            }

                            $(modal).modal('show');
                        }
                        break;
                    //Stand accredited
                    case 8:
                        _button_add = $('button#add_catalogue_id');
                        if (valid_row(_button_add, true)) {
                            disable_button_set_title(action, true);
                            var modal = '#modalResourcesAccredited';
                            $(modal + ' input[name=name]').val(result.name);
                            $(modal + ' input[name=email]').val(result.email);
                            $(modal + ' input[name=elem_id]').val(elem_id);
                            $(modal + ' input[name=action_id]').val(action);
                            $(modal + ' .label-position').addClass('label-select-automatic-top');
                            $(modal).modal('show');
                        }
                        break;
                }
            }
            event_main.hideLoader();
        });
    });

    $("#documents_mng, #gallery_mng, #video_mng, #catalogue_mng, #pendons_mng, #accredited_mng").on('click', '.deleteRow', function (e) {
        var elem_id = $(this).closest('tr').attr('id');
        e.preventDefault();
        var elem_id = $(this).closest('tr').attr('id');
        var action = $(this).closest('table').data('resources');
        $(this).bootstrap_confirm_delete({
            heading: event_message.getMessage(16),
            message: event_message.getMessage(13),
            btn_ok_label: event_message.getMessage(14),
            btn_cancel_label: event_message.getMessage(15),
            callback: function (event) {
                fn_remove_resources(elem_id, action);
            }
        });

    });

    $('.my-select').on('hidden.bs.select', function (e) {
        let my_select = $(this).children('select.my-select');
        if (my_select.attr('id') == 'select_product_id') {
            var selected_reference = $('option:selected', this).attr("data-reference");
            var selected_price = $('option:selected', this).attr("data-name");
            var selected_image = $('option:selected', this).attr("data-image");
            var modal = '#modalSelectResourcesProducts';
            $(modal + ' input[name=reference]').val(selected_reference);
            $(modal + ' input[name=name]').val(selected_price);
            $(modal + 'img#load-img-url-resources').attr('src', 'data:image/*; base64,' + selected_image);
        }
    });

    $('.btnCancelResourcesStand').on('click', function () {
        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');
    });

    $('button#add_message_stand').click(function (e) {
        e.preventDefault();
        var event_id = event_main.get_event_id(true);
        var $form = $('form#formCommentStand');
        var formData = new FormData($form[0]);
        $.ajax({
            url: '/evento/' + event_id + '/add_message_stand',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = event_main.parse_result(data_result)
            if (result.success == true) {
                $('input[name=my-comment-stand-input]').val('');
                $('ul#commentListStand').append(result.current_message);
            } else if (result.error == true) {
                toastr.error(event_message.getMessage(result.message));

            }
        });

    });

    function load_message_stand() {
        setInterval(() => {
            var event_id = event_main.get_event_id(true);
            var formData = new FormData();
            formData.append('stand', true);
            formData.append('current_area_id', $('input[name=current_area_id]').val());
            $.ajax({
                url: '/evento/' + event_id + '/get_message_networking',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = event_main.parse_result(data_result)
                if (result.success == true) {
                    $('ul#commentListStand').html(result.messages);
                    event_main.hideLoader();
                } else if (result.error == true) {
                    toastr.error(event_message.getMessage(result.message));
                }
            });
        }, 3000);

    }

    function load_message_by_networking_stand_recursive() {
        var event_id = event_main.get_event_id(true);
        var formData = new FormData();
        formData.append('stand', true);
        formData.append('current_area_id', $('input[name=current_area_id]').val());
        $.ajax({
            url: '/evento/' + event_id + '/get_message_stand',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = event_main.parse_result(data_result)
            if (result.success == true) {
                $('ul.chatContainerScroll').html(result.messages);
            }
        });
    }

    $('select#stand_select_id').on('hidden.bs.select', function (e) {
        e.preventDefault();
        var event_id = event_main.get_event_id(true);
        var area_id = $(this).val();
        event_main.showLoader();
        if (event_id != '' && event_id != undefined) {
            $('input[name=current_area_id]').val(area_id);
            window.location = '/evento/' + event_id + '/' + area_id + '/event_area';
        }
    });

    $('a.favorite-icon-stand').on('click', function (e) {
        e.preventDefault();
        var event_id = event_main.get_event_id(true);
        var area_id = $(this).data('area');
        var formData = new FormData();
        formData.append('area_id', area_id);

        $.ajax({
            url: '/evento/' + event_id + '/event_favorite_history',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = event_main.parse_result(data_result)
            if (result.success == true) {
                if (result.deselect == undefined || result.deselect == 'undefined') {
                    $('a.favorite-icon-stand').find('img').attr('src', '/df_website_front/static/src/img/like-1-full.svg');
                } else {
                    $('a.favorite-icon-stand').find('img').attr('src', '/df_website_front/static/src/img/like-1.svg');
                }
                toastr.success(event_message.getMessage(result.message));
            } else if (result.error == true) {
                toastr.error(event_message.getMessage(result.message));
            }
        });
    });


    //    Mostrando información del Stand
    $('a#information_stand_id').on('click', function (ev) {
        ev.preventDefault();
        load_information_stand();
    });
    function load_information_stand() {
        const formData = new FormData();
        formData.append('area_id', $('input#AREA_ID').val());
        const event_id = $('input#EVENT_ID').val();
        $.ajax({
            url: '/evento/' + event_id + '/information_stand',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = parse_result(data_result);
            if (result.success == true) {
                const modal = 'div#modal-stand-info';
                $('div.col.description_stand').html(result.description);
                $(modal).modal('show');
            } else {
                toastr.error(event_message.getMessage(result.message));
                event_main.hideLoader();
            }
        });
    }

    $('div.stand-view-count-detail').on('click', function (ev) {
        ev.preventDefault();
        var formData = new FormData();
        event_main.showLoader();
        if ($('input#AREA_ID').val() != '') {
            var event_id = event_main.get_event_id(true);
            formData.append('area_id', $('input#AREA_ID').val());
            $.ajax({
                url: '/evento/' + event_id + '/information_stand_statistic',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = parse_result(data_result);
                if (result.success == true) {
                    let modal = 'div#modal-stand-visitor-info';
                    let table_tbody = $(modal + " tbody");
                    let html = '';
                    let nro = 0;
                    result.statistics.forEach(function (item, i) {
                        nro += 1;
                        html += '<tr id=' + item.id + '>';
                        html += "<th scope='row'><p>" + nro + "</th>";
                        html += "<td><p>" + item.name + "</p></td>";
                        html += "<td><p>" + item.date + "</p></td>";
                        html += "</tr>";
                    });
                    table_tbody.html(html);
                    $(modal).modal('show');
                } else {
                    toastr.error(event_message.getMessage(result.message));
                    event_main.hideLoader();
                }
            });
        }
    });

    return {
        'parse_result': parse_result,
        'load_message_stand': load_message_stand
    }

});