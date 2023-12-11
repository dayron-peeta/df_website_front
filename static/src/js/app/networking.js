odoo.define('df_website_front.networking', function (require) {
    "use_strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var event_main = require('df_website_front.event_main');
    var event_message = require('df_website_front.event_message');
    var session = require('web.session');

    /*--------------------------------------------------------------------------
      VARIABLES GLOBALES
    --------------------------------------------------------------------------*/
    var EVENT_ID = false     // este valor aparece cuando se renderea la plantilla
    var AREA_ID = false     // este valor aparece cuando se renderea la plantilla
    var FILTER_USER_NAME = '';       // valor para filtrar los usuarios
    var SELECTED_USER_ID = false;    // aqui aparecera el id del usuario que se seleccione
    var SELECTED_USER_NAME = '';       // valor a mostrar en el titulo de la conversacion
    var USER_MESSAGE_DATE = {};        // {user : date} ; fecha del ultimo mensaje de cada usuario para poder resaltar los que hayan escrito recientemente
    var NEW_MESSAGE_COUNT = {};        // {user : count} ; Cantidad de mensajes nuevos

    /*--------------------------------------------------------------------------
      ENVIAR MENSAJE AL SERVIDOR
    --------------------------------------------------------------------------*/
    $('button#add_message_networking').click(function (e) {
        e.preventDefault();

        event_main.showLoader();

        var partner_id = $(this).data('partner_id');
        var formData = new FormData($('form#formNetworking')[0]);
        formData.append('partner_id', SELECTED_USER_ID);
        if (EVENT_ID != undefined) {
            $.ajax({
                url: '/evento/' + EVENT_ID + '/add_message_networking',
                data: formData,
                type: 'POST',
                processData: false, // tell jQuery not to process the data
                contentType: false  // tell jQuery not to set contentType
            }).done(function (data_result) {
                var result = event_main.parse_result(data_result)
                if (result.success == true) {
                    $('input[name=my-comment-networking-input]').val('');
                    $('ul.chatContainerScroll').append(result.current_message);
                    NEW_MESSAGE_COUNT[SELECTED_USER_ID] = parseInt(NEW_MESSAGE_COUNT[SELECTED_USER_ID]) + 1;
                    event_main.hideLoader();
                } else if (result.error == true) {
                    toastr.error(event_message.getMessage(result.message));
                    event_main.hideLoader();
                }
            });
        }
    });

    /*--------------------------------------------------------------------------
      ACTUALIZAR USUARIOS EN LINEA Y MENSAJES DEL USUARIO SELECCIONADO
    --------------------------------------------------------------------------*/
    setInterval(() => {
        if (session && session.user_id != false) {
            EVENT_ID = $('input#EVENT_ID').val();
            AREA_ID = $('input#AREA_ID').val();
            FILTER_USER_NAME = $('input#search-partner-networking').val();

            /*--------------------------------------------------------------------------
               Cargando los usuarios en linea
            --------------------------------------------------------------------------*/
            var formData = new FormData();
            formData.append('selected_partner_id', SELECTED_USER_ID);
            formData.append('filter_username', FILTER_USER_NAME);
            formData.append('user_message_date', JSON.stringify(USER_MESSAGE_DATE));
            formData.append('new_messages_count', JSON.stringify(NEW_MESSAGE_COUNT));
            if (EVENT_ID != undefined && AREA_ID != undefined) {
                $.ajax({
                    url: '/evento/' + EVENT_ID + '/' + AREA_ID + '/networking_update',
                    data: formData,
                    type: 'POST',
                    processData: false, // tell jQuery not to process the data
                    contentType: false,  // tell jQuery not to set contentType
                })
                    .done(function (data_result) {
                        var data_result = JSON.parse(data_result);

                        if ($('span.notifications-networking').length > 0) {
                            $('span.notifications-networking').html(NEW_MESSAGE_COUNT[session.user_id]);
                        }

                        $('div#users').html(data_result.html);
                        $('li.person').on('click', function (e) {
                            e.preventDefault();
                            SELECTED_USER_ID = $(this).data('id');
                            SELECTED_USER_NAME = $(this).data('name');
                            USER_MESSAGE_DATE[SELECTED_USER_ID] = moment(Date.now()).format('YYYY-MM-DD HH:MM:s');
                            NEW_MESSAGE_COUNT[SELECTED_USER_ID] = 0;

                            $('.selected-user .partner-name').html(SELECTED_USER_NAME);
                            $('input[name=my-comment-networking-input]').removeAttr('disabled');
                            $('button#add_message_networking').removeAttr('disabled');
                        });
                    });
            }

            /*--------------------------------------------------------------------------
               Cargando los mensajes del usuario seleccionado
            --------------------------------------------------------------------------*/
            var formData = new FormData();
            formData.append('partner_id', SELECTED_USER_ID);
            if (EVENT_ID != undefined) {
                $.ajax({
                    url: '/evento/' + EVENT_ID + '/get_message_networking',
                    data: formData,
                    type: 'POST',
                    processData: false, // tell jQuery not to process the data
                    contentType: false  // tell jQuery not to set contentType
                }).done(function (data_result) {
                    var result = event_main.parse_result(data_result)
                    if (result.success == true) {
                        $('ul.chatContainerScroll').html(result.messages);
                        event_main.hideLoader();
                    } else if (result.error == true) {
                        toastr.error(event_message.getMessage(result.message));
                        event_main.hideLoader();
                    }
                });
            }
        }

    }, 3000);

    return {
        'event_id': EVENT_ID,
        'area_id': AREA_ID,
    }

});