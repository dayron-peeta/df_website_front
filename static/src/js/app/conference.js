odoo.define('df_website_front.conferences', function(require) {
    "use_strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var event_main = require('df_website_front.event_main');
    var event_message = require('df_website_front.event_message');

    function updateScroll() {
        var element = document.getElementById("commentList");
        element.scrollTop = element.scrollHeight;
    }

    $('#my-comment-button').on('click', function(e) {
        e.preventDefault();
        add_message_by_track();
        updateScroll();
    });

    function add_message_by_track() {
        var event_id = event_main.get_event_id(true);
        event_main.showLoader();
        var $form = $('form#formCommentConference');
        var formData = new FormData($form[0]);
        $.ajax({
            url: '/evento/' + event_id + '/add_chat_event',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function(data_result) {
            var result = event_main.parse_result(data_result)
            if (result.success == true) {
                $('.commentList').append(result.current_message);
                event_main.hideLoader();
                $('input[name=my-comment-input]').val('');
            } else if (result.error == true) {
                toastr.error(event_message.getMessage(result.message));
                event_main.hideLoader();
            }
        });
    }

    $('a.track-conference-selected').click(function(ev) {
        ev.preventDefault();
        let current_track = $(this).data('id');
        $('input[name=track_id]').val(current_track);
        $('span.title-channel-conference').html(event_message.getMessage(30) + $(this).data('name'));
        $('div#conference-video iframe').attr('src',$(this).data('url'));
        $('a#external-channel-link').attr('href',$(this).data('external-url'));
        load_message_by_track(current_track);
        load_documents_by_track(current_track);
    });

    function load_documents_by_track(current_track){
        var event_id = event_main.get_event_id(true);
        event_main.showLoader();
        var formData = new FormData();
        formData.append('track_id', current_track);
        $.ajax({
            url: '/evento/' + event_id + '/load_documents',
            data: formData,
            type: 'POST',
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function(data_result) {
            var result = event_main.parse_result(data_result)
            if (result.success == true) {
                $('ul.list-documents-conference').html(result.documents);
                $('h4.no-documents').removeClass('d-block').addClass('d-none');
                event_main.hideLoader();
            } /*else if (result.error == true) {
                toastr.error(event_message.getMessage(result.message));
                event_main.hideLoader();
            }*/
        });

    }

     /*--------------------------------------------------------------------------
           Actualizando los mensajes de la charla actual
        --------------------------------------------------------------------------*/
     /* Cantidad de mensajes del chat de la conferencia */
    var cant_message = 0;
    function load_message_by_track(current_track) {
        var event_id = event_main.get_event_id(true);
        setInterval(() => {
            // Verificando que si el modal del chat de conferencia no esta activo no se realicen las peticiones
            if($('a.event-conference-chat').length > 0){
                var formData = new FormData();
                formData.append('track_id', current_track);
                formData.append('cant_message', cant_message);
                $.ajax({
                    url: '/evento/' + event_id + '/refresh_chat_event',
                    data: formData,
                    type: 'POST',
                    processData: false, // tell jQuery not to process the data
                    contentType: false // tell jQuery not to set contentType
                }).done(function(data_result) {
                    var result = event_main.parse_result(data_result)
                    if (result.success == true) {
                        $('ul#commentList').html(result.datas.messages);
                        $('input[name=track_id]').val(current_track);
                        cant_message = result.datas.cant_message;
                        // Si tiene nuevo mensajes que parpadee el icono de chat en las conferencias
                        if(result.datas.new_message == true){
                            $('a.event-conference-chat').addClass('parpadea');
                        }

                        updateScroll();
                    } else if (result.error == true) {
                        toastr.error(event_message.getMessage(result.message));
                        event_main.hideLoader();
                    }
                });
            }
        }, 1000);
    };

//    function load_message_by_track_recursive(current_track) {
//        var event_id = event_main.get_event_id(true);
//        var formData = new FormData();
//        formData.append('track_id', current_track);
//        $.ajax({
//            url: '/evento/' + event_id + '/refresh_chat_event',
//            data: formData,
//            type: 'POST',
//            processData: false, // tell jQuery not to process the data
//            contentType: false // tell jQuery not to set contentType
//        }).done(function(data_result) {
//            var result = event_main.parse_result(data_result)
//            if (result.success == true) {
//                $('ul#commentList').html(result.messages);
//                updateScroll();
//            }
//        });
//    }

    return {
        'load_message_by_track': load_message_by_track
    }

});