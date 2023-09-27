odoo.define('df_website_front.user_sign', function (require) {
    "use strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var ajax = require('web.ajax');
    var core = require('web.core');
    var event_main = require('df_website_front.event_main');
    var event_message = require('df_website_front.event_message');
    var session = require('web.session');
    var _t = core._t;
    var EVENT_ID = event_main.get_event_id(true);
    /* Este valor obtiene su valor cuando se seleccione alguno de los eventos en la parte final de la
       primera pantalla del registro */
    var EVENT_ID_SELECT = 0;
    var TICKET_EXHIBITOR = [];
    var TICKET_SPEAKER = [];
    var REGISTRATION_MODE = 'registration_mode_business';
    var EVENT_FREE = $('#input_event_free_id').val();
    var EVENT_IDS = [];

    function parse_result(result) {
        return JSON.parse(result)
    }

    function redirectHome() {
        var event_id = event_main.get_event_id(true);
        setTimeout(() => {
            event_main.hideLoader();
            window.location = '/evento/' + event_id;
        }, 3000);
    }

    /* Obteniendo los type attendees tag dependiendo del id del evento pasado por parámetro */
    function get_type_attendees_by_event(event_id) {
        var formData = new FormData();
        formData.append('event_id_selected', event_id);
        $.ajax({
            url: '/evento/' + event_id + '/type_attendees_tag',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = event_main.parse_result(data_result);
            let html = '';
            let select_type_atte = $('select#event-to-participate-' + event_id + '-type-participation');
            if (result.length > 0) {
                let type_attes = result;
                type_attes.forEach(function (item, i) {
                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                });
                select_type_atte.html(html);
                select_type_atte.selectpicker('refresh');
            } else {
                select_type_atte.html(html);
                select_type_atte.selectpicker('refresh');
            }
        });
    }

    $("input.event-to-participate-check").on('click', function () {
        let id = $(this).attr('id');
        EVENT_ID_SELECT = $(this).data('event-id');
        EVENT_IDS = [];
        /* Obteniendo los eventos seleccionados en el registro */
        $('input.event-to-participate-check:checked').each(function(index,value){
            let split_elem = $(this).attr('id').split('event-to-participate-');
            if(split_elem.length > 1)
                EVENT_IDS.push(parseInt(split_elem[1]));
        });

        if ($(this).is(':checked')) {
            $('div#' + id + '-input').addClass('input-active');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-select-ticket-' + EVENT_ID_SELECT).attr('is-required', 'true');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-type-participation').attr('is-required', 'true');
            $('span.event-to-participate-' + EVENT_ID_SELECT + '-span-required').removeClass('d-none');
            $('select.event_type_select_session').parent().parent().removeClass('d-none').addClass('d-block');
            get_type_attendees_by_event(EVENT_ID_SELECT);
        } else {
            $('.div-conference-type-track-' + EVENT_ID_SELECT).addClass('d-none');
            $('.div-conference-theme-tag-' + EVENT_ID_SELECT).addClass('d-none');
            $('.div-conference-file-' + EVENT_ID_SELECT).addClass('d-none');
            $('.div-conference-name-' + EVENT_ID_SELECT).addClass('d-none');
            $('span#ticket_description-' + EVENT_ID_SELECT).parent().removeClass('d-block').addClass('d-none');

            $('#event-to-participate-' + EVENT_ID_SELECT + '-select-ticket-' + EVENT_ID_SELECT).removeAttr('is-required');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-type-participation').removeAttr('is-required');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-conference-file').removeAttr('is-required');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-conference-file').val('');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-conference-name').removeAttr('is-required');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-conference-name').val('');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-conference-type-track').removeAttr('is-required');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-conference-type-track').val('');
            $('#event-to-participate-' + EVENT_ID_SELECT + '-conference-type-track').selectpicker('refresh');

            $('span.event-to-participate-' + EVENT_ID_SELECT + '-span-required').addClass('d-none');

            $('div#' + id + '-input').removeClass('input-active');
            $('select#' + id + '-type-participation').val('');
            $('select#' + id + '-type-participation').parent().next('label.my-form-label').css({
                '-webkit-transform': 'none',
                'transform': 'none'
            });
            $('select#' + id + '-type-participation').selectpicker('refresh');
            $('select#' + id + '-select-ticket-' + EVENT_ID_SELECT).val('');
            $('select#' + id + '-select-ticket-' + EVENT_ID_SELECT).parent().next('label.my-form-label').css({
                '-webkit-transform': 'none',
                'transform': 'none'
            });
            $('select#' + id + '-select-ticket-' + EVENT_ID_SELECT).selectpicker('refresh');
        }
    });

    $('.my-select').selectpicker({
        style: "",
        styleBase: "form-control my-form-control"
    });

    $('button.my-form-control').click(function () {
        $(this).attr('style', 'border-color: #1b5c8f !important');
        $(this).parent().parent().children('label.my-form-label').css({
            '-webkit-transform': 'translateY(-1rem) translateY(.1rem) scale(.8)',
            'transform': 'translateY(-1rem) translateY(.1rem) scale(.8)',
            'color': '#1b5c8f'
        });
    });

    $('#initial-data-conference-in-back').click(function (e) {
        e.preventDefault();
        $('#institution-data-a').click();
    });

    $('#initial-data-in-back').click(function (e) {
        e.preventDefault();
        $('#initial-data-a').click();
    });

    $('#inst-data-in-back').click(function (e) {
        e.preventDefault();
        if (REGISTRATION_MODE == 'registration_mode_personal') {
            show_hide_inst_data(true);
            $('#initial-data-a').click();
        } else if (REGISTRATION_MODE == 'registration_mode_business') {
            $('#institution-data-a').click();
        }
    });

    $('.my-select').on('hidden.bs.select', function (e) {
        let my_select = $(this).children('select.my-select');
        EVENT_ID_SELECT = my_select.data('event-id');
        if (my_select.val() == "") {
            $(this).parent().children('label.my-form-label').css({
                '-webkit-transform': 'none',
                'transform': 'none'
            });
            /*Form Exhibitor and Visitor Company*/
        } else if (my_select.attr('id') == 'country_select_id' || my_select.attr('id') == 'country_select_profile' ||
            my_select.attr('id') == 'country_select_stand') {
            var profile = false;
            var register = false;
            var stand_profile = false;
            var code_phone_country = $('select#' + my_select.attr('id') + ' option:selected').data('phone-code');
            if (my_select.attr('id') == 'country_select_id') {
                register = true;
            } else if (my_select.attr('id') == 'country_select_profile') {
                profile = true;
            } else if (my_select.attr('id') == 'country_select_stand') {
                stand_profile = true;
            }

            ajax.jsonRpc('/province_by_country', 'call', {
                'country_id': my_select.val()
            }).then(function (result) {
                let province_state_region = result;
                let html = '';
                province_state_region.forEach(function (item, i) {
                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                });

                if (profile) {
                    $('#province_state_region_select_profile').html(html);
                    $('#province_state_region_select_profile').selectpicker('refresh');
                } else if (stand_profile) {
                    $('#province_state_region_select_stand').html(html);
                    $('#province_state_region_select_stand').selectpicker('refresh');
                }
            });

            if (register || profile || stand_profile) {
                $.ajax({
                    type: "POST",
                    dataType: 'json',
                    url: '/type_inst_by_country',
                    contentType: "application/json; charset=utf-8",
                    data: JSON.stringify({ 'jsonrpc': "2.0", 'method': "call", "params": { 'country_id': my_select.val() } }),
                    success: function (data) {
                        let inst_type = JSON.parse(data.result);
                        let html = '';
                        inst_type.forEach(function (item, i) {
                            html += '<option data-nit = ' + item.use_nit + ' data-code = ' + item.code + ' value="' + item.id + '">' + item.name + '</option>';
                        });

                        if (profile) {
                            $('#institution_type_select').html(html);
                            $('#institution_type_select').selectpicker('refresh');
                        } else if (stand_profile) {
                            $('#institution_type_select_stand').html(html);
                            $('#institution_type_select_stand').selectpicker('refresh');
                        } else if (register) {
                            $('#institution_type_select').html(html);
                            $('#institution_type_select').selectpicker('refresh');
                        }
                    },
                });
            }
            if (profile || stand_profile) {
                var selected_code = $('option:selected', this).attr("data-code");
                if (selected_code != 'CU') {
                    $('select#province_state_region_select_profile').parent().next('label.my-form-label span').removeClass('d-block').addClass('d-none');

                    $('#province_state_region_select_profile').attr('is-required', 'false');
                    $('#province_state_region_select_profile').parent().next('label.my-form-label').children('span.text-danger').css('display', 'none');
                    $('#municipality_select_profile').attr('is-required', 'false');
                    $('#municipality_select_profile').parents('div.mb-4').css('display', 'none');
                } else {
                    $('select#province_state_region_select_profile').parent().next('label.my-form-label span').removeClass('d-none').addClass('d-block');

                    $('#province_state_region_select_profile').attr('is-required', 'true');
                    $('#province_state_region_select_profile').parent().next('label.my-form-label').children('span.text-danger').css('display', 'inline');
                    $('#municipality_select_profile').attr('is-required', 'false');
                    $('#municipality_select_profile').parents('div.mb-4').css('display', 'block');
                }
                ajax.jsonRpc('/province_by_country', 'call', {
                    'country_id': my_select.val()
                }).then(function (result) {
                    let province_state_region = result;
                    let html = '';
                    province_state_region.forEach(function (item, i) {
                        html += '<option value="' + item.id + '">' + item.name + '</option>';
                    });
                    if (profile) {
                        $('#province_state_region_select_profile').html(html);
                        $('#province_state_region_select_profile').selectpicker('refresh');
                    }
                });
            }

        } else if (my_select.attr('id') == 'country_person_select_id') {
            reset_register_events_select();
            // Buscar los ticket y sus precios dependiendo de la moneda y país seleccionado
            /*if (EVENT_ID != undefined && $('select#type_participation_id').val() != '' && $('select#country_person_select_id').val() != '' && $('select#currency_id').val() != '') {
                get_tickets(EVENT_ID);
            }*/

            var code_phone_country = $('select#' + my_select.attr('id') + ' option:selected').data('phone-code');

            //Seteando código de teléfono según país
            set_code_country(code_phone_country);

            var formData = new FormData();
            formData.append('country_id', my_select.val());

            $.ajax({
                url: '/evento/' + EVENT_ID + '/get_currency_by_country',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = event_main.parse_result(data_result);
                let html = '';
                if (result.length > 0) {
                    let currencys = result;
                    currencys.forEach(function (item, i) {
                        html += '<option value="' + item.id + '">' + item.name + '</option>';
                    });
                    $('select#select_currency_id').html(html);
                    $('select#select_currency_id').selectpicker('refresh');
                } else {
                    $('select#select_currency_id').html(html);
                    $('select#select_currency_id').selectpicker('refresh');
                }
            });


        } else if (my_select.attr('id') == 'province_state_region_select_profile' || my_select.attr('id') == 'province_state_region_select_stand') {
            var profile = false;
            var stand_profile = false;
            if (my_select.attr('id') == 'province_state_region_select_profile') {
                profile = true;
            } else if (my_select.attr('id') == 'province_state_region_select_stand') {
                stand_profile = true;
            }

            ajax.jsonRpc('/municipality_by_province', 'call', {
                'state_id': my_select.val()
            }).then(function (result) {
                let municipality = result;
                let html = '';
                municipality.forEach(function (item, i) {
                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                });

                if (profile) {
                    $('#municipality_select_profile').html(html);
                    $('#municipality_select_profile').selectpicker('refresh');
                } else if (stand_profile) {
                    $('#municipality_select_stand').html(html);
                    $('#municipality_select_stand').selectpicker('refresh');
                }
            })
        } else if (my_select.attr('id') == 'institution_type_select' || my_select.attr('id') == 'institution_type_select_stand') {
            var selected_nit = $('option:selected', this).attr("data-nit");
            var selected_code = $('option:selected', this).attr("data-code");
            var profile = false;
            var stand_profile = false;
            if (my_select.attr('id') == 'institution_type_select') {
                profile = true;
            } else if (my_select.attr('id') == 'institution_type_select_stand') {
                stand_profile = true;
            }

            if (selected_code == '56') {
                ajax.jsonRpc('/get_activity_by_industry', 'call', {
                    'code_free_employed': true
                }).then(function (result) {
                    let activities = result;
                    let html = '';
                    activities.forEach(function (item, i) {
                        html += '<option value="' + item.id + '">' + item.name + '</option>';
                    });
                    if (stand_profile) {
                        $('#economic_activity_select_stand').html(html);
                        $('#economic_activity_select_stand').selectpicker('refresh');
                        $('#economic_activity_select_stand').val(activity_economic)
                        $('#economic_activity_select_stand').selectpicker('refresh');
                    }
                })
            }

            var selected_nit = $('option:selected', this).attr("data-nit");
            var selected_code = $('option:selected', this).attr("data-code");

            if (selected_nit == 'true') {
                $('#div_code_nit').removeClass('d-none').addClass('d-block');
                $('#div_code_reeup').removeClass('d-block').addClass('d-none');
                $('#code_reeup_select').val('');
                $('#code_reeup_select_stand').val('');
                $('#inp_name_social').val('');
                $('#acronym_id').val('');
                $('#website_id').val('');
                $('#industry_select').val('');
                $('input#vat_inst_stand').next().removeClass('d-none').addClass('d-block');

                $('#code_reeup_select').parent().parent().removeClass('label-select-automatic-top');
                $('#code_reeup_select_stand').parent().parent().removeClass('label-select-automatic-top');

                if ($('#inp_name_social').val() == '') {
                    $('#inp_name_social').next().removeClass('label-select-automatic-top');
                }

                if ($('#inp_name_social_stand').val() == '') {
                    $('#inp_name_social_stand').next().removeClass('label-select-automatic-top');
                }

                if ($('#website_id').val() == '') {
                    $('#website_id').next().removeClass('label-select-automatic-top');
                }

                if ($('#industry_select').val() == '') {
                    $('#industry_select').parent().parent().removeClass('label-select-automatic-top');
                }

                if ($('#sector_select_stand').val() == '') {
                    $('#sector_select_stand').parent().parent().removeClass('label-select-automatic-top');
                }
                $('#acronym_id').next().removeClass('label-select-automatic-top');

                $('#code_reeup_select').selectpicker('refresh');
                $('#code_reeup_select_stand').selectpicker('refresh');
                $('#industry_select').selectpicker('refresh');
                $('#sector_select_stand').selectpicker('refresh');

                $('#code_reeup_select').attr('is-required', 'false');
                $('#code_reeup_select_stand').attr('is-required', 'false');
                $('#vat_attendee').attr('is-required', 'true');
                $('#vat_inst_stand').attr('is-required', 'true');
            } else {
                $('#div_code_nit').removeClass('d-block').addClass('d-none');
                $('#div_code_reeup').removeClass('d-none').addClass('d-block');
                $('#vat_attendee').attr('is-required', 'false');

                $('#vat_attendee').val("");
                $('#vat_inst_stand').val("");
                $('#code_reeup_select').attr('is-required', 'true');
                $('#code_reeup_select_stand').attr('is-required', 'true');
                $('#vat_inst_stand').attr('is-required', 'false');

                ajax.jsonRpc('/reeup_by_type_institution', 'call', {
                    'type_institution_id': my_select.val()
                }).then(function (result) {
                    let reeups = result;
                    let html = '';
                    reeups.forEach(function (item, i) {
                        html += '<option data-acronym="' + item.acronym + '" data-entity-name = "' + item.name + '" data-economic-activity = ' + item.economic_activity_id +
                            ' data-industry = ' + item.industry_id + ' data-state-id = ' + item.state_id + ' data-municipality-id = ' + item.municipality_id + ' data-exist-image = ' + item.exist_image + ' value="' + item.id + '">' + item.name + ' (' + item.reeup + ')' + '</option>';
                    });
                    if (profile) {
                        $('#code_reeup_select').html(html);
                        $('#code_reeup_select').selectpicker('refresh');
                    } else if (stand_profile) {
                        $('#code_reeup_select_stand').html(html);
                        $('#code_reeup_select_stand').selectpicker('refresh');
                    }
                })
            }

        } else if (my_select.attr('id') == 'code_reeup_select' || my_select.attr('id') == 'code_reeup_select_stand') {
            var selected = $('option:selected', this);
            var entity_name = selected.attr("data-entity-name");
            var industry = selected.attr("data-industry");
            var acronym = selected.attr("data-acronym");
            var exist_image = selected.attr("data-exist-image");

            $('img#load-img-url-register-entity').attr('src', '/df_website_front/static/src/img/user_profile_default.png');

            var profile = false;
            var stand_profile = false;

            if (my_select.attr('id') == 'code_reeup_select') {
                profile = true;
            } else if (my_select.attr('id') == 'code_reeup_select_stand') {
                stand_profile = true;
            }
            if (profile) {
                $('#inp_name_social').parent().children('label.my-form-label').addClass('label-select-automatic-top');
                $('#industry_select').parent().parent().children('label.my-form-label').addClass('label-select-automatic-top');
                $('#inp_name_social').val(entity_name);
                $('#industry_select').val(industry);
                $('#industry_select').selectpicker('refresh');
                if (exist_image == 'true') {
//                    $('#profile-picture-entity-id').addClass('d-none');
//                    $('#profile-picture-entity-id').attr("is-required", "false");
//                    $('#entity-logo-span').addClass('d-none');

                    ajax.jsonRpc('/image_partner', 'call', {
                        'partner_id': my_select.val()
                    }).then(function (result) {
                        $('img#load-img-url-register-entity').attr('src', 'data:image/*; base64,' + result.image);
                    })

                } else {
//                    $('#profile-picture-entity-id').removeClass('d-none');
//                    $('#profile-picture-entity-id').attr("is-required", "true");
//                    $('#entity-logo-span').removeClass('d-none');
                }
            } else if (stand_profile) {
                $('#inp_name_social_stand').parent().children('label.my-form-label').addClass('label-select-automatic-top');
                $('#sector_select_stand').parent().parent().children('label.my-form-label').addClass('label-select-automatic-top');
                $('#inp_name_social_stand').val(entity_name);
                $('#sector_select_stand').val(industry);
                $('#sector_select_stand').selectpicker('refresh');
            }
            if (acronym != 'false') {
                if (profile) {
                    $('#acronym_id').next('label.my-form-label').addClass('label-select-automatic-top');
                    $('#acronym_id').val(acronym);
                } else if (stand_profile) {
                    $('#acronym_id').next('label.my-form-label').addClass('label-select-automatic-top');
                    $('#acronym_id').val(acronym);
                }
            } else {
                $('#acronym_id').next('label.my-form-label').removeClass('label-select-automatic-top');
                $('#acronym_id').val('');
            }

        } else if (my_select.attr('id') == 'sector_select_stand') {
            var stand_profile = false;
            var select_type_ins = false;
            if (my_select.attr('id') == 'sector_select_stand') {
                stand_profile = true
                select_type_ins = $('option:selected', $('select[id=institution_type_select_stand]')).data('code')
            }
            //Para cuando es cuenta propista
            if (select_type_ins != 56) {
                ajax.jsonRpc('/activities_by_sector', 'call', {
                    'sector_id': my_select.val()
                }).then(function (result) {
                    let activities = result;
                    let html = '';
                    activities.forEach(function (item, i) {
                        html += '<option value="' + item.id + '">' + item.name + '</option>';
                    });

                    if (stand_profile) {
                        $('#economic_activity_select_stand').html(html);
                        $('#economic_activity_select_stand').selectpicker('refresh');
                    }
                });
            }
        } else if (my_select.attr('id') == 'payment_method') {
            if (my_select.val() == 'TM') {
                $('div#enzona-qr img').fadeOut('75').promise().done(function () {
                    $('div#transfer-qr img').fadeIn('75');
                });
            } else if (my_select.val() == 'EZ') {
                $('div#transfer-qr img').fadeOut('75').promise().done(function () {
                    $('div#enzona-qr img').fadeIn('75');
                });
            } else {
                $('div#transfer-qr img').fadeOut('75');
                $('div#enzona-qr img').fadeOut('75');
            }
        } else if (my_select.attr('id') == 'select_currency_id') {
            //reset_register_events_select();
            // Buscar los ticket y sus precios dependiendo de la moneda y país seleccionado
            //            if (EVENT_ID != undefined && $('select#type_participation_id').val() != '' && $('select#country_person_select_id').val() != '' && my_select.val() != '') {
            //                get_tickets(EVENT_ID);
            //            }
        } else if (my_select.attr('id') == 'type_participation_id' || my_select.attr('id') == 'event-to-participate-' + EVENT_ID_SELECT + '-type-participation') {
            // Buscar los ticket y sus precios dependiendo de la moneda y país seleccionado
            // La moneda ya no se tiene en cuenta porque si es GRATIS el evento no se necsita la moneda, aunque en el formulario
            // si se coloca como obligatoria
            if (EVENT_ID_SELECT != undefined && $('#event-to-participate-' + EVENT_ID_SELECT + '-type-participation').val() != '' && $('select#country_person_select_id').val() != '') {
                get_tickets(EVENT_ID_SELECT);
                show_hide_track_data(false, EVENT_ID_SELECT);
            }
        } else if (my_select.attr('id') == 'select_ticket_id' || my_select.attr('id') == 'event-to-participate-' + EVENT_ID_SELECT + '-select-ticket-' + EVENT_ID_SELECT) {
            var speaker = false;
            var exhibitor = false;
            if ($('option:selected', this).attr("data-exhibitor") == 'true') {
                exhibitor = true;
                TICKET_EXHIBITOR.push(EVENT_ID_SELECT);
            } else {
                TICKET_EXHIBITOR = TICKET_EXHIBITOR.filter(function (value, index, arr) {
                    return value != EVENT_ID_SELECT;
                });
            }
            if ($('option:selected', this).attr("data-speaker") == 'true') {
                show_hide_track_data(true, EVENT_ID_SELECT);
                speaker = true;
                TICKET_SPEAKER.push(EVENT_ID_SELECT);
            } else {
                show_hide_track_data(false, EVENT_ID_SELECT);
                TICKET_SPEAKER = TICKET_SPEAKER.filter(function (value, index, arr) {
                    return value != EVENT_ID_SELECT;
                });
            }
            if ($('option:selected', this).val()) {
                $('span#ticket_description-' + EVENT_ID_SELECT).parent().removeClass('d-none').addClass('d-block');
                $('span#ticket_description-' + EVENT_ID_SELECT).text($('option:selected', this).attr("data-description"));
            } else {
                $('span#ticket_description-' + EVENT_ID_SELECT).parent().removeClass('d-block').addClass('d-none');
                $('span#ticket_description-' + EVENT_ID_SELECT).text('');
            }
            /* Obteniendo si el Evento actual es el principal */
            var principal = $('#event-to-participate-' + EVENT_ID_SELECT).data('principal');

            var formData = new FormData();
            var event_ticket_id = $('#event-to-participate-' + EVENT_ID_SELECT + '-select-ticket-' + EVENT_ID_SELECT);
            formData.append('ticket_id', event_ticket_id.val());
            formData.append('currency_id', $('select#select_currency_id').val());
            formData.append('country_id', $('select#country_person_select_id').val());

            if (REGISTRATION_MODE == 'registration_mode_personal' && TICKET_EXHIBITOR.length > 0) {
                $('a#stand_profile_design').parent().removeClass('d-none mx-auto mr-sm-auto ml-sm').addClass('nav-item mx-auto mr-sm-auto ml-sm-0 d-block');
                $('#check_use_conditions_id_inst').parent().removeClass('d-block').addClass('d-none');
                show_hide_inst_data(true);
                //Ocultando botón de registro y términos y condiciones de la pestaña Inicial si es un expositor individual
                $('#initial-data--in-next').removeClass('d-none').addClass('d-block');
                $('#institution-data-a').removeClass('d-block').addClass('d-none');
                $('input#check_use_conditions_personal_id').parent().removeClass('d-block').addClass('d-none');
                $('#register_attendee_personal').removeClass('d-block').addClass('d-none');
                $('#inst-data-in-back').removeClass('d-none').addClass('d-block');
            }

            /* Ocultar la pestaña de Select Stand en caso de que no sea el evento principal y un expositor */
            if (!principal || event_ticket_id.val() == 'undefined' || event_ticket_id.val() != undefined || TICKET_EXHIBITOR.length == 0) {

                $('a#stand_profile_design').parent().removeClass('d-block').addClass('d-none');

                $('div.stand-select-register').html('');
                $('a[name=stand_select]').removeClass('stand-active');
                $("input[name='count_stand']").val(0);
                //Mostrando botón de registro y términos y condiciones de la pestaña de Institución
                if (TICKET_SPEAKER.length > 0 && TICKET_EXHIBITOR.length == 0 && REGISTRATION_MODE == 'registration_mode_business') {
                    $('button#register_attendee_inst').removeClass('d-none').addClass('d-block ml-3');
                    $('input#check_use_conditions_id_inst').parent().removeClass('d-none').addClass('d-block');
                    $('a#stand-data--in-next').removeClass('d-block').addClass('d-none');
                    $('a#institution-data-a').parent().removeClass('d-none').addClass('nav-item mx-auto mr-sm-auto ml-sm-0 d-block');
                } else if (TICKET_SPEAKER.length > 0 && TICKET_EXHIBITOR.length == 0 && REGISTRATION_MODE == 'registration_mode_personal') {
                    $('input#check_use_conditions_id').parent().removeClass('d-none').addClass('d-block');
                }
                //Ocultando botón de registro y términos y condiciones de la pestaña de Stand
                $('button#register_attendee').removeClass('d-block').addClass('d-none');
                $('input#check_use_conditions_id').parent().removeClass('d-block').addClass('d-none');

                /* Limpiando los registros de stand en la vista Select stand */
                $('div.stand-select-register').html('');
            }

            // Buscar los templates de stand asociados al type attendee del ticket
            if (EVENT_ID_SELECT != undefined && EVENT_ID_SELECT != 0 && principal && event_ticket_id.val() != 'undefined' && event_ticket_id.val() != undefined && TICKET_EXHIBITOR.length > 0) {
                /* Seteando valor ya que es expositor */
                $('#event_for_exhibitor').val(true);
                $.ajax({
                    url: '/evento/' + EVENT_ID_SELECT + '/templates_attendee',
                    data: formData,
                    type: 'POST',
                    processData: false, // tell jQuery not to process the data
                    contentType: false // tell jQuery not to set contentType
                }).done(function (data_result) {
                    var result = event_main.parse_result(data_result);
                    if (result.length > 0) {
                        // Seteando valor de la cantidad de plantillas a mostrar para seleccionar
                        $("input[name='count_stand']").val(result.length);

                        var html = '';
                        // Mostrando las plantillas en la pestaña Stand Design del Registro
                        result.forEach(function (item, i) {
                            html += '<div class="col-sm-4 my-3"><a href="#" name="stand_select" data-plan-variacion-id=' + item.plan_variacion_id + ' data-plan-id=' + item.plan_id + ' data-id=' + item.template_id + '><div class="card box-shadow-card rounded">';
                            html += '<img alt="Picture" class="img-fluid w-100" src=" ' + 'data:image/*; base64,' + item.image + '" />';
                            html += '<p class="exo2-regular text-center mt-3">' + event_message.getMessage(37) + ' ' + item.price + '</p>';
                            html += '</div></a></div>';
                        });
                        // Mostrando la pestaña Stand Design del Registro
                        $('a#stand_profile_design').parent().removeClass('d-none mx-auto mr-sm-auto ml-sm').addClass('nav-item mx-auto mr-sm-auto ml-sm- d-block');
                        $('a#institution-data-a').parent().removeClass('mx-auto mr-sm-auto ml-sm-0').addClass('nav-item mx-auto mx-sm-0 d-block');

                        $('div.stand-select-register').html(html);
                        $('a[name=stand_select]').click(function (e) {
                            e.preventDefault();
                            $('a[name=stand_select]').children().removeClass('stand-active');
                            $(this).children().addClass('stand-active');
                            $('div#stand_resources_basic_id').removeClass('d-none').addClass('d-block');
                            $('img.stand-decor-img').attr('src', $(this).children('div.stand-active').children('img').attr('src'));
                        });

                        //Ocultando botón de registro y términos y condiciones de la pestaña de Institución
                        if (TICKET_SPEAKER.length == 0) {
                            $('button#register_attendee_inst').removeClass('d-block ml-3').addClass('d-none');
                            $('input#check_use_conditions_id_inst').parent().removeClass('d-block').addClass('d-none');
                            $('a#stand-data--in-next').removeClass('d-none').addClass('d-block');
                        }
                        //Mostrando botón de registro y términos y condiciones de la pestaña de Stand
                        $('button#register_attendee').removeClass('d-none').addClass('d-block');
                        $('input#check_use_conditions_id').parent().removeClass('d-none').addClass('d-block');

                    } else {
                        $('a#stand_profile_design').parent().removeClass('d-block').addClass('d-none mx-auto mx-sm-0');

                        $('div.stand-select-register').html('');
                        $('a[name=stand_select]').removeClass('stand-active');
                        $("input[name='count_stand']").val(0);

                        //Mostrando botón de registro y términos y condiciones de la pestaña de Institución
                        if (TICKET_SPEAKER.length > 0) {
                            $('button#register_attendee_inst').removeClass('d-none').addClass('d-block ml-3');
                            $('input#check_use_conditions_id_inst').parent().removeClass('d-none').addClass('d-block');
                            $('a#stand-data--in-next').removeClass('d-block').addClass('d-none');
                            $('a#institution-data-a').parent().removeClass().addClass('nav-item mx-auto mr-sm-auto ml-sm-0 d-block');
                        }
                        //Ocultando botón de registro y términos y condiciones de la pestaña de Stand
                        $('button#register_attendee').removeClass('d-block').addClass('d-none');
                        $('input#check_use_conditions_id').parent().removeClass('d-block').addClass('d-none');
                    }
                });
            } else {
                /* Seteando valor ya que no es expositor */
                $('#event_for_exhibitor').val(false);
            }
        }
        /*End*/

        $(this).parent().children('label.my-form-label').css('color', 'rgba(0, 0, 0, .6)');
        $(this).children('button.my-form-control').attr('style', 'border-color: #CED4DA !important');
    });

    $('button#register_attendee, button#register_attendee_personal, button#register_attendee_inst, button#register_conference').on('click', function (ev) {
        ev.preventDefault();

        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');
        var personal = false;
        var conditions = $('#check_use_conditions_id');
        if ($(this).attr('id') == 'register_attendee') {
            personal = false;
            conditions = $('#check_use_conditions_id');
        } else if ($(this).attr('id') == 'register_attendee_inst') {
            personal = false;
            conditions = $('#check_use_conditions_id_inst');
        } else if ($(this).attr('id') == 'register_conference') {
            personal = false;
            conditions = $('#check_use_conditions_conference_id');
        } else {
            personal = true;
            conditions = $('#check_use_conditions_personal_id');
        }

        if (conditions.is(':checked')) {
            let validado = true;
            // Validar el formulario de institucion en caso de que el tipo de participación sea 'registration_mode_business'
            if (REGISTRATION_MODE == 'registration_mode_business') {
                $('#institution-data-form input.my-form-control').each(function (i) {
                    validado = customValidation($(this), validado);
                });
                // Validando que sino existe stand ocnfigurado para ese ticket no verificar si se selecciono, y ademas si es Sponsor
                // tampoco validar si lo selecciono o no
                if (($('div.stand-active').length == 0 && $('select#select_ticket_id option:selected').attr('data-exhibitor') == 'true') &&
                    ($("input[name='count_stand']").val() != 0 || $("input[name='count_stand']").val() != '')) {
                    toastr.error(event_message.getMessage(18));
                    validado = false;
                }
            } else if (REGISTRATION_MODE == 'registration_mode_personal') {
                // Validar el formulario inicial solamente en caso de que el tipo de participación sea 'registration_mode_personal'
                $('#initial-data-form .my-select').each(function (i) {
                    if ($(this).attr('is-required') == 'true') {
                        if (!selectValidation($(this)))
                            validado = false;
                    }
                });

                $('#initial-data-form input.my-form-control').each(function (i) {
                    validado = customValidation($(this), validado);
                });
            }
            // Verificando que si es ponente deba adicionar al menos una ponencia
            if ($('select#select_ticket_id option:selected').attr("data-speaker") == 'true' && $('table#user_track_register tbody tr').length == 0) {
                toastr.error(event_message.getMessage(48));
                return;
            }

            if (validado) {
                var $form = $('form#form_register_attendee');
                var formData = new FormData($form[0]);
                var event_id = event_main.get_event_id(true);

                if ($('select[name=theme_tag_id]').val() != '' && $('select[name=theme_tag_id]').val() != undefined &&
                    $('select[name=theme_tag_id]').val() != 'undefined') {
                    formData.append('theme_tag_id_all', $('select[name=theme_tag_id]').val());
                }

                if ($('select[name=theme_tag_track_id]').val() != '' && $('select[name=theme_tag_track_id]').val() != undefined &&
                    $('select[name=theme_tag_track_id]').val() != 'undefined') {
                    formData.append('theme_tag_track_id_all', $('select[name=theme_tag_track_id]').val());
                }

                for(var i = 0; i < EVENT_IDS.length; i++){
                    let event_id = EVENT_IDS[i];
                    let theme_tag_track_id = $('select[name=theme_tag_track_id_'+event_id+']');
                    if (theme_tag_track_id.val() != '' && theme_tag_track_id.val() != undefined && theme_tag_track_id.val() != 'undefined') {
                        formData.append('theme_tag_track_id_'+event_id+'_all', theme_tag_track_id.val());
                    }
                }


                if ($('div.stand-active').parent().attr('data-id') != '' && $('div.stand-active').parent().attr('data-id') != undefined &&
                    $('div.stand-active').parent().attr('data-id') != 'undefined') {
                    formData.append('stand_id', $('div.stand-active').parent().attr('data-id'));
                }
                if ($('div.stand-active').parent().attr('data-plan-id') != '' && $('div.stand-active').parent().attr('data-plan-id') != undefined &&
                    $('div.stand-active').parent().attr('data-plan-id') != 'undefined') {
                    formData.append('plan_id', $('div.stand-active').parent().attr('data-plan-id'));
                }
                if ($('div.stand-active').parent().attr('data-plan-variacion-id') != '' && $('div.stand-active').parent().attr('data-plan-variacion-id') != undefined &&
                    $('div.stand-active').parent().attr('data-plan-variacion-id') != 'undefined') {
                    formData.append('plan_variacion_id', $('div.stand-active').parent().attr('data-plan-variacion-id'));
                }

                if ($('table#user_track_register tbody tr').length > 0) {
                    $('#user_track_register > tbody > tr').each(function (index, elem) {
                        let line = {};
                        $(this).children("td").each(function (index, td) {
                            // Nombre de la ponencia
                            if (index == 1) {
                                line['name'] = $(this).text();
                                // Tipo de ponencia
                            } else if (index == 2) {
                                if ($(this).data('id') != undefined) {
                                    line['type_track'] = $(this).data('id');
                                }
                                // Descripción de la ponencia
                            } else if (index == 4) {
                                line['description'] = $(this).text();
                            }
                        });
                        LIST_CONFERENCE.push(line);
                    });
                    formData.append('conferences', JSON.stringify(LIST_CONFERENCE));
                }

                event_main.showLoader();
                $.ajax({
                    url: '/evento/' + event_id + '/event_sign_in/register',
                    data: formData,
                    type: 'POST',
                    processData: false, // tell jQuery not to process the data
                    contentType: false // tell jQuery not to set contentType
                }).done(function (data_result) {
                    var result = parse_result(data_result);
                    //                    FILE_SESSION = {};
                    if (result.success == true) {
                        toastr.success(event_message.getMessage(result.message));
                        event_main.hideLoader();
                        redirectHome();
                    } else if (result.error == true) {
                        event_main.hideLoader();
                        toastr.error(event_message.getMessage(result.message));
                    }
                });

            } else
                toastr.error(_t('Check the required fields.'));
        } else
            toastr.error(_t('You need to accept the terms and conditions.'));

        return false;
    });

    function get_tickets(event_id) {
        var formData = new FormData();
        formData.append('type_participation_id', $('#event-to-participate-' + event_id + '-type-participation').val());
        formData.append('country_id', $('select#country_person_select_id').val());
        formData.append('currency_id', $('select#select_currency_id').val());
        formData.append('event_id_selected', event_id);
        $.ajax({
            url: '/evento/' + event_id + '/tickets_by_type_p',
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
                    html += '<option data-sponsor="' + item.sponsor + '" data-exhibitor="' + item.exhibitor + '" data-description="' + item.description + '" data-speaker="' + item.speaker + '" value="' + item.id + '">' + item.name + '</option>';
                });
                $('#event-to-participate-' + event_id + '-select-ticket-' + event_id).html(html);
                $('#event-to-participate-' + event_id + '-select-ticket-' + event_id).selectpicker('refresh');
            } else {
                $('#event-to-participate-' + event_id + '-select-ticket-' + event_id).html(html);
                $('#event-to-participate-' + event_id + '-select-ticket-' + event_id).selectpicker('refresh');
            }
        });
    };

    function set_code_country(code_phone_country) {
        if (code_phone_country != '' && code_phone_country != 'undefined' && code_phone_country != undefined) {
            $('span.phone_code_country').html(code_phone_country);
            $('span.phone_code_country').parent().removeClass('d-none').addClass('d-block');
        } else {
            $('span.phone_code_country').html('');
            $('span.phone_code_country').parent().removeClass('d-block').addClass('d-none');
        }
    };

    /* Modal de adicionar nueva presentacion DESCONECTADO*/
    $('button#add_profile_presentation').click(function (e) {
        e.preventDefault();
        var $modal = '#modalAddTrack';
        event_main.set_empty_all_fields('formAddTrack');
        let event_id = $('input#EVENT_ID').val();
        var formData = new FormData();
        formData.append('event_id_selected', event_id);
        $.ajax({
            url: '/evento/add_track_datas',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = JSON.parse(data_result);
            let html = '';
            let select_event = $('select#profile-conference-event');
            let theme_tag_id = $('select#theme-tag-id');
            if (result.events.length > 0) {
                result.events.forEach(function (item, i) {
                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                });
                select_event.html(html);
                select_event.selectpicker('refresh');
            }
            html = '';
            if (result.theme_tags.length > 0) {
                result.theme_tags.forEach(function (item, i) {
                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                });
                theme_tag_id.html(html);
                theme_tag_id.selectpicker('refresh');
            }
        });

        $($modal).modal('show');
    });

    /* Obtener los tipos de charla segun el evento */
    let profile_conference_event =$('select#profile-conference-event');
    if(profile_conference_event.length > 0){
        $('select#profile-conference-event').on('change',function(ev){
            ev.preventDefault();
            var formData = new FormData();
            formData.append('event_id_selected', $(this).val());
            $.ajax({
                url: '/evento/type_track',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = JSON.parse(data_result);
                let html = '';
                let select_type_track = $('select#profile-conference-type-track');
                if (result.type_tracks.length > 0) {
                    result.type_tracks.forEach(function (item, i) {
                        html += '<option value="' + item.id + '">' + item.name + '</option>';
                    });
                    select_type_track.html(html);
                    select_type_track.selectpicker('refresh');
                }
            });
        });
     }

    /* Adicionar nueva presentacion */
    $('#btnAddSaveTrack').click(function (e) {
        e.preventDefault();
        var $modal = '#modalAddTrack';
        let event_id = $('select#profile-conference-event').val();
        let validado = true;

        $('#formAddTrack select.my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });

        $('#formAddTrack .my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });

        if (event_id != "" && event_id != "undefined" && event_id != undefined && validado == true) {
            var $form = $('form#formAddTrack');
            var formData = new FormData($form[0]);
            formData.append('event_id',event_id);
            let theme_tag_id = $('select#theme-tag-id');
             if (theme_tag_id.val() != '' && theme_tag_id.val() != undefined && theme_tag_id.val() != 'undefined') {
                    formData.append('theme_tag_id_all', theme_tag_id.val());
             }

            $.ajax({
                url: '/evento/add_track',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = event_main.parse_result(data_result);
                if (result.success == true) {
                    toastr.success(event_message.getMessage(58));
                    $('div#table-users-profile-id').html(result.html);
                    window.location.reload();
                    $($modal).modal('hide');
                } else if (result.success == false) {
                    toastr.error(result.message);
                }
            });
        } else {
            toastr.error(_t('Check the required fields.'));
        }
    });

    //Habilitar o no el requerido de los campos de la institución
    function show_hide_inst_data(value = false) {
        //Imagen de perfil
        $("input[name='profile-picture-entity']").attr('is-required', value);
        //Pais
        $("select#country_select_id").attr('is-required', value);
        //Tipo de institución
        $("select#institution_type_select").attr('is-required', value);
        //Código REEUP
        $("select#code_reeup_select").attr('is-required', value);
        //Vat
        $("input#vat_attendee").attr('is-required', value);
        //Nombre institución
        $("input#inp_name_social").attr('is-required', value);
        //Sector
        $("input#industry_select").attr('is-required', value);
        //Perfil institución
        $("textarea[name='comment']").attr('is-required', value);

        if (value) {
            $('button#register_attendee').removeClass('d-none').addClass('d-block');
            $('button#register_attendee_personal').removeClass('d-block').addClass('d-none');
            $('#check_use_conditions_personal_id').parent().removeClass('d-block').addClass('d-none');
        } else if (TICKET_EXHIBITOR.length == 0) {
            $('button#register_attendee_personal').removeClass('d-none').addClass('d-block');
            $('button#register_attendee').removeClass('d-block').addClass('d-none');
            $('#check_use_conditions_personal_id').parent().removeClass('d-none').addClass('d-block');
        }
    }

    /* Obteniendo los type track dependiendo del id del evento pasado por parámetro */
    function get_type_track_by_event(event_id) {
        var formData = new FormData();
        formData.append('event_id_selected', event_id);
        $.ajax({
            url: '/evento/type_track',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function (data_result) {
            var result = JSON.parse(data_result);
            let select_type_track = $('select#event-to-participate-' + event_id + '-conference-type-track');
            let type_tracks = result.type_tracks;
            let html = '';
            if (type_tracks.length > 0) {
                type_tracks.forEach(function (item, i) {
                    html += '<option value="' + item.id + '">' + item.name + '</option>';
                });
                select_type_track.html(html);
                select_type_track.selectpicker('refresh');
            } else {
                select_type_track.html(html);
                select_type_track.selectpicker('refresh');
            }


            let select_theme_tag_track = $('select#event-to-participate-'+event_id+'-conference-theme-tag-id');
            let theme_tag_ids = result.theme_tag_ids;
            let html_tag = '';
            if (theme_tag_ids.length > 0) {
                theme_tag_ids.forEach(function (item_tag, i) {
                    html_tag += '<option value="' + item_tag.id + '">' + item_tag.name + '</option>';
                });
                select_theme_tag_track.html(html_tag);
                select_theme_tag_track.selectpicker('refresh');
            } else {
                select_theme_tag_track.html(html_tag);
                select_theme_tag_track.selectpicker('refresh');
            }


        });
    }

    //Mostrar o no los campos referentes a la ponencia
    function show_hide_track_data(value = false, event_id) {

        //Tab de las presentaciones
        var tab_presentacion = $('a#add-presentation-a');
        var tab_inst = $('a#institution-data-a');
        var tab_stand = $('a#stand_profile_design');

        if (value) {
            $('.div-conference-type-track-' + event_id).removeClass('d-none');
            $('.div-conference-theme-tag-' + event_id).removeClass('d-none');
            $('.div-conference-file-' + event_id).removeClass('d-none');
            $('.div-conference-name-' + event_id).removeClass('d-none');
            $('#event-to-participate-' + event_id + '-conference-name').attr('is-required', 'true');
            $('#event-to-participate-' + event_id + '-conference-file').attr('is-required', 'true');
            $('#event-to-participate-' + event_id + '-conference-type-track').attr('is-required', 'true');
            $('span.event-to-participate-' + event_id + '-span-required').removeClass('d-none');
            get_type_track_by_event(event_id);

            //        tab_inst.parent().removeClass().addClass('nav-item mx-auto mx-sm-0 d-block');
            //        tab_presentacion.parent().removeClass().addClass('nav-item mx-auto mr-sm-auto ml-sm-0 d-block');
            //        $('a#stand-data-conference--in-next').removeClass('d-block').addClass('d-none');
            //
            //        //Ocultando botón de registro y términos y condiciones de la pestaña de Institución
            //        $('button#register_attendee_inst').removeClass('d-block ml-3').addClass('d-none');
            //        $('input#check_use_conditions_id_inst').parent().removeClass('d-block').addClass('d-none');
            //        $('a#stand-data--in-next').removeClass('d-none').addClass('d-block');

        } else {

            $('.div-conference-type-track-' + event_id).removeClass('d-block').addClass('d-none');
            $('.div-conference-theme-tag-' + event_id).removeClass('d-block').addClass('d-none');
            $('.div-conference-file-' + event_id).removeClass('d-block').addClass('d-none');
            $('.div-conference-name-' + event_id).removeClass('d-block').addClass('d-none');
            $('#event-to-participate-' + event_id + '-conference-name').removeAttr('is-required');
            $('#event-to-participate-' + event_id + '-conference-file').removeAttr('is-required');
            $('#event-to-participate-' + event_id + '-conference-type-track').removeAttr('is-required');
            //        $('span.event-to-participate-'+event_id+'-span-required').removeClass('d-block').addClass('d-none');

            //        tab_presentacion.parent().removeClass().addClass('d-none');
        }
    }

    //Resetear campos de la selección de eventos, conferencias, tickets y type attendee en el registro de usuario
    function reset_register_events_select() {
        $('input.event-to-participate-check').prop("checked", false);
        $('select.event_type_select_session').parent().parent().removeClass('d-block').addClass('d-none');
        $('input.event_conference_inp').parent().parent().removeClass('d-block').addClass('d-none');
        $('input.event_conference').val('');
        $('select.event_type_select').val('');
        $('div.ticket_description_event').html('');
        $('select.event_type_select').selectpicker('refresh');
        $('div.event-to-participate-input').removeClass('input-active');
    }

    //Resetear los campos de pais, moneda, tipo de participacion y ticket al cambiar de modo de registro
    function reset_fields_register(event_id) {
        $('a#stand_profile_design').parent().removeClass('d-block').addClass('d-none');
        $('select#country_person_select_id').val('');
        $('select#country_person_select_id').parent().next('label.my-form-label').css({
            '-webkit-transform': 'none',
            'transform': 'none'
        });
        $('select#country_person_select_id').selectpicker('refresh');

        $('select#select_currency_id').val('');
        $('select#select_currency_id').parent().next('label.my-form-label').css({
            '-webkit-transform': 'none',
            'transform': 'none'
        });
        $('select#select_currency_id').selectpicker('refresh');

        $('select#type_participation_id').val('');
        $('select#type_participation_id').parent().next('label.my-form-label').css({
            '-webkit-transform': 'none',
            'transform': 'none'
        });
        $('select#type_participation_id').selectpicker('refresh');

        $('select#select_ticket_id').val('');
        $('select#select_ticket_id').parent().next('label.my-form-label').css({
            '-webkit-transform': 'none',
            'transform': 'none'
        });
        $('select#select_ticket_id').selectpicker('refresh');

        $('span#ticket_description-').html('');
    }

    $("input[name='registration_mode']").on('change', function (e) {
        e.preventDefault();
        /* Ocultar botones y terminos y condiciones inicialmente */
        $('.button-action-register').addClass('d-none');
        $('.form-check-term-conditions').addClass('d-none');
        REGISTRATION_MODE = $(this).val();
        if ($(this).val() == 'registration_mode_business') {
            // Habilitar tab de los datos de institución
            $('a#institution-data-a').parent().removeClass('d-none').addClass('d-block mx-auto mr-sm-auto ml-sm-0');
            $('a#initial-data-a').parent().addClass('mx-auto ml-sm-auto mr-sm-0');

            // Habilitar boton de registrar y termino y condiciones, boton next desde los datos iniciales
            // Representar a una entidad o empresa y no es expositor
            $('#initial-data--in-next').removeClass('d-none');
            $('button#register_attendee_inst').removeClass('d-none');
            $('#check_use_conditions_id_inst').parent().removeClass('d-none');

        } else if ($(this).val() == 'registration_mode_personal') {
            // Deshabilitar tab de los datos de institución
            $('a#institution-data-a').parent().removeClass('d-block').addClass('d-none');
            $('a#initial-data-a').parent().removeClass('mx-auto ml-sm-auto mr-sm-0');

            if (TICKET_EXHIBITOR.length > 0) {
                //Mostrar boton next y ocultar termino y condiciones, ya que es un usuario expositor a titulo personal
                $('#initial-data--in-next').removeClass('d-none').addClass('d-block');
            } else {
                //Habilitar boton de registrar y termino y condiciones: titulo personal
                $('button#register_attendee_personal').removeClass('d-none');
                $('#check_use_conditions_personal_id').parent().removeClass('d-none');
            }
            //Ocultar tabs que no sean de los datos iniciales
            $('#institution-data-a').parent().removeClass('d-block').addClass('d-none');
            $('#stand_profile_design').parent().removeClass('d-block').addClass('d-none');
        }
    });

    $('#initial-data--in-next').click(function (e) {
        e.preventDefault();
        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');

        let validado = true;
        $('#initial-data-form .my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });
        $('#initial-data-form input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });

        if (validado) {
            /* Ocultar botones y terminos y condiciones inicialmente */
            $('.button-action-register').addClass('d-none');
            $('.form-check-term-conditions').addClass('d-none');
        }
        let VALID = false;
        if ((TICKET_EXHIBITOR.length > 0 || TICKET_SPEAKER.length > 0) && REGISTRATION_MODE == 'registration_mode_business' && validado) {
            VALID = true;
            if(TICKET_EXHIBITOR.length > 0){
                $('#stand-data--in-next').removeClass('d-none').addClass('d-block');
                $('#register_attendee_inst').removeClass('d-block').addClass('d-none');
                $('a#stand_profile_design').parent().removeClass('d-none mx-auto mr-sm-auto ml-sm').addClass('nav-item mx-auto mr-sm-auto ml-sm-0 d-block');
                $('#check_use_conditions_id_inst').parent().removeClass('d-block').addClass('d-none');
            }
            $('#initial-data-in-back').removeClass('d-none').addClass('d-block');
            $('#institution-data-a').click();

        } else if ((TICKET_EXHIBITOR.length > 0 || TICKET_SPEAKER.length > 0) && REGISTRATION_MODE == 'registration_mode_personal' && validado) {
            VALID = true;
            show_hide_inst_data(true);
            $('a#stand_profile_design').parent().removeClass('d-none mx-auto mr-sm-auto ml-sm').addClass('nav-item mx-auto mr-sm-auto ml-sm-0 d-block');
            $('#check_use_conditions_id_inst').parent().removeClass('d-block').addClass('d-none');
            $('#stand_profile_design').click();
        } else if (TICKET_EXHIBITOR.length == 0 && TICKET_SPEAKER.length == 0 && REGISTRATION_MODE == 'registration_mode_business' && validado) {
            VALID = true;
            $('#register_attendee_inst').removeClass('d-none').addClass('d-block');
            $('#check_use_conditions_id_inst').parent().removeClass('d-none').addClass('d-block');
            $('#initial-data-in-back').removeClass('d-none').addClass('d-block');
            $('#institution-data-a').click();

        } else if (TICKET_EXHIBITOR.length == 0 && TICKET_SPEAKER.length == 0 && REGISTRATION_MODE == 'registration_mode_personal' && validado) {
            VALID = true;
            show_hide_inst_data(true);
            $('a#stand_profile_design').parent().removeClass('d-none mx-auto mr-sm-auto ml-sm').addClass('nav-item mx-auto mr-sm-auto ml-sm-0 d-block');
            $('#check_use_conditions_id_inst').parent().removeClass('d-block').addClass('d-none');
            $('#stand_profile_design').click();

        } else {
            toastr.error(_t('Check the required fields.'));
        }


    });

    $('#stand-data--in-next').click(function (e) {
        e.preventDefault();
        $('.input-error').removeClass('input-error');
        $('.select-error').removeClass('select-error');
        $('.label-error').removeClass('label-error');
        $('.my-alert').removeClass('d-block').addClass('d-none');
        $('.my-email-alert').removeClass('d-block').addClass('d-none');
        $('.my-phone-alert').removeClass('d-block').addClass('d-none');
        $('.my-url-alert').removeClass('d-block').addClass('d-none');
        let validado = true;
        $('#institution-data-form .my-select').each(function (i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });
        $('#institution-data-form input.my-form-control').each(function (i) {
            validado = customValidation($(this), validado);
        });
        if (validado && TICKET_EXHIBITOR.length > 0) {
//            if ($('select#select_ticket_id option:selected').attr("data-speaker") == 'true') {
//                $('a#add-presentation-a').click();
//                $('a#add-presentation-a').addClass('active');
//                $('div#add-presentation-form').addClass('show active');
//            } else {
            $('a#stand_profile_design').click();
            $('a#stand_profile_design').addClass('active');
            $('div#stand_sign_in_design_form').addClass('show active');
            $('#inst-data-in-back').removeClass('d-none').addClass('d-block');
//            }
        } else
            toastr.error(_t('Check the required fields.'));
    });

    $('#set_sponsor_id').on('change', function () {
        if ($(this).is(':checked')) {
            $('#type_sponsor_select_exhibitor').attr('is-required', 'true');
            $('#type_sponsor_select_exhibitor').parents('div.pt-3').css('display', 'block');
            $('#sponsor_exhibitor_id').attr('is-required', 'true');
            $('#sponsor_exhibitor_id').parents('div.mb-4').css('display', 'block');
        } else {
            $('#type_sponsor_select_exhibitor').attr('is-required', 'false');
            $('#type_sponsor_select_exhibitor').parents('div.pt-3').css('display', 'none');
            $('#sponsor_exhibitor_id').attr('is-required', 'false');
            $('#sponsor_exhibitor_id').parents('div.mb-4').css('display', 'none');
        }
    });

    $('#business-visitor-pre-sign-in-back').click(function (e) {
        e.preventDefault();
        $('#business-visitor-inst-data-a').click();
    });

    $('input.my-form-control,textarea.my-form-control').keypress(function () {
        $(this).addClass('active');
    });

    $('input.my-form-control,textarea.my-form-control').change(function () {
        if ($(this).val() == "")
            $(this).removeClass('active');
    });

    $('input.my-form-control,textarea.my-form-control').on('focusout', function () {
        if ($(this).val() == "")
            $(this).removeClass('active');
        else
            $(this).addClass('active');
    });

    $('#mensaje-sweet').click(function () {
        Swal.fire({
            title: 'Error!',
            text: _t('Do you want to continue'),
            icon: 'error',
            confirmButtonText: 'Cool'
        })
    });

    $('#user-profile-back').click(function (e) {
        e.preventDefault();
        $('#user_profile_datas').click();
    });

    $('#stand-profile-back').click(function (e) {
        e.preventDefault();
        $('#stand_profile_datas').click();
    });

    function customValidation(elem, validado_old) {
        let validado = validado_old;
        if ($(elem).attr('is-required') == 'true') {
            if (!inputValidation($(elem))) {
                validado = false;
            } else {
                if ($(elem).attr('is-email') == 'true') {
                    if (!emailValidation($(elem)))
                        validado = false;
                }
                if ($(elem).attr('is-phone') == 'true') {
                    if (!phoneValidation($(elem)))
                        validado = false;
                }
                if ($(elem).attr('is-url') == 'true') {
                    if (!urlValidation($(elem)))
                        validado = false;
                }
            }
        } else if ($(elem).val() != '') {
            if ($(elem).attr('is-email') == 'true') {
                if (!emailValidation($(elem)))
                    validado = false;
            }
            if ($(elem).attr('is-phone') == 'true') {
                if (!phoneValidation($(elem)))
                    validado = false;
            }
            if ($(elem).attr('is-url') == 'true') {
                if (!urlValidation($(elem)))
                    validado = false;
            }
        }

        return validado;
    }

    function inputValidation(elem) {
        let validado = false;
        if (elem.val() == '') {
            elem.addClass('input-error');
            elem.siblings('.my-form-label').addClass('label-error');
            elem.parent().next('.my-alert').removeClass('d-none').addClass('d-block');
        } else
            validado = true;
        return validado;
    }

    function textareaValidation(elem) {
        let validado = false;
        if (elem.val() == '') {
            elem.addClass('textarea-error');
            elem.siblings('.my-form-label').addClass('label-error');
            elem.parent().next('.my-alert').removeClass('d-none').addClass('d-block');
        } else
            validado = true;
        return validado;
    }

    function selectValidation(elem) {
        let validado = false;
        if (elem.val() == '') {
            elem.siblings('button.my-form-control').addClass('select-error');
            elem.parent().next('.my-form-label').addClass('label-error');
            elem.parent().parent().next('.my-alert').removeClass('d-none').addClass('d-block');
        } else
            validado = true;
        return validado;
    }

    function emailValidation(elem) {
        let validado = false;
        if (!emailVerify(elem)) {
            elem.addClass('input-error');
            elem.siblings('.my-form-label').addClass('label-error');
            elem.parent().siblings('.my-email-alert').removeClass('d-none').addClass('d-block');
        } else
            validado = true;
        return validado;
    }

    function emailVerify(elem) {
        var regex = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/;
        return regex.test(elem.val());
    }

    function phoneValidation(elem) {
        let validado = false;
        var regex = /^\+(?:[0-9]●?){6,14}[0-9]$/;
        if (!regex.test(elem.val())) {
            elem.addClass('input-error');
            elem.siblings('.my-form-label').addClass('label-error');
            elem.parent().siblings('.my-phone-alert').removeClass('d-none').addClass('d-block');
        } else
            validado = true;
        return validado;
    }

    function urlValidation(elem) {
        let validado = false;
        var regex = /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i;
        if (!regex.test(elem.val())) {
            elem.addClass('input-error');
            elem.siblings('.my-form-label').addClass('label-error');
            elem.parent().siblings('.my-url-alert').removeClass('d-none').addClass('d-block');
        } else
            validado = true;
        return validado;
    }

    return {
        'get_type_attendees_by_event': get_type_attendees_by_event,
        'TICKET_EXHIBITOR': TICKET_EXHIBITOR,
        'REGISTRATION_MODE': REGISTRATION_MODE,
        'customValidation': customValidation,
        'inputValidation': inputValidation,
        'textareaValidation': textareaValidation,
        'selectValidation': selectValidation,
        'emailValidation': emailValidation,
        'emailVerify': emailVerify,
        'phoneValidation': phoneValidation,
        'urlValidation': urlValidation
    }

});