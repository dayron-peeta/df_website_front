odoo.define('df_website_front.event_payments', function(require) {
    "use strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var event_main = require('df_website_front.event_main');
    var event_event = require('df_website_front.event');
    var event_message = require('df_website_front.event_message');
    var selectValidation = require('df_website_front.user_sign').selectValidation;
    var customValidation = require('df_website_front.user_sign').customValidation;
    var inputValidation = require('df_website_front.user_sign').inputValidation;
    var textareaValidation = require('df_website_front.user_sign').textareaValidation;
    var emailValidation = require('df_website_front.user_sign').emailValidation;
    var emailVerify = require('df_website_front.user_sign').emailVerify;
    var phoneValidation = require('df_website_front.user_sign').phoneValidation;
    var urlValidation = require('df_website_front.user_sign').urlValidation;
    var set_empty_all_fields = require('df_website_front.event').set_empty_all_fields;
    var core = require('web.core');

    //Mensajes que se definen en el campo 'pending_msg' de los medios de pagos
    var LIST_MESSAGES_PAYS = [];

    $('button#payment_invoice, a#exportInvoice').click(function(e) {
        e.preventDefault();
        event_main.showLoader();
        var elem_id = $(this).attr('id');
        var invoice_id = $(this).closest('tr').attr('id');
        var payment_method_id = $(this).closest('tr').attr('data-payment-method-id');
        if(elem_id == 'payment_invoice'){
            $('a.load-image-image-operation').removeClass('d-none').addClass('d-block');
            $('a.show-load-image-image-operation').removeClass('d-block').addClass('d-none');
        }
        var formData = new FormData();
        if (invoice_id != 'undefined' && invoice_id != undefined && invoice_id != ''){
            formData.append('invoice_id',invoice_id);
        }
        $.ajax({
            url: '/get_payment_acquires',
            type: 'GET',
            data: formData,
            processData: false, // tell jQuery not to process the data
            contentType: false // tell jQuery not to set contentType
        }).done(function(data_result) {
            var result = event_main.parse_result(data_result);
            if (result) {
                event_main.hideLoader();
                $('input[name=invoice_id]').val(invoice_id);

                let html = '';
                result.forEach(function(item, i) {
                    html += '<option data-qr-code = ' + item.qr_code + ' data-url = ' + item.url + ' data-image = ' + item.image + ' data-journal-id = ' + item.journal_id + ' data-provider = ' + item.provider + ' value="' + item.id + '">' + item.name + '</option>';
                    LIST_MESSAGES_PAYS[item.id] = item.pending_msg;
                });

                if(elem_id == 'payment_invoice'){
                    $('select#payment_method').html(html);
                    $('select#payment_method').selectpicker('refresh');
                    $('div#pay_description').html('');
                    $('select#payment_method').val('');
                    $('input[name=operation_id]').val('');
                    $('input[name=journal_id]').val(invoice_id);
                    if(payment_method_id != 'undefined' && payment_method_id != undefined && payment_method_id != ''){
                        $('select#payment_method').selectpicker('val',payment_method_id);
                        $('select#payment_method').parent().parent().children('label.my-form-label').addClass('label-select-automatic-top');
                        $('select#payment_method').trigger('hidden.bs.select');
                    }
                    $('img#img-transfer-qr').removeClass('d-block').addClass('d-none');
                    $('div#payment-detail').modal('show');
                } if(elem_id == 'exportInvoice'){
                    $('div#pay_only_description').html('');
                    $('select#payment_only_method').html(html);
                    $('select#payment_only_method').selectpicker('refresh');
                    if(payment_method_id != 'undefined' && payment_method_id != undefined && payment_method_id != ''){
                        $('select#payment_only_method').selectpicker('val',payment_method_id);
                        $('select#payment_only_method').parent().parent().children('label.my-form-label').addClass('label-select-automatic-top');
                        $('select#payment_only_method').trigger('hidden.bs.select');
                    }
                    $('div#payment-add-payment-method').modal('show');
                }
            }
        });
    });

    $('.my-select').on('hidden.bs.select', function(e) {
        let my_select = $(this).children('select.my-select');
        if (my_select.attr('id') == 'payment_method') {
            var image = $('option:selected', this).attr("data-image");
            var qr_code = $('option:selected', this).attr("data-qr-code");
            var provider = $('option:selected', this).attr("data-provider");
            var journal_id = $('option:selected', this).attr("data-journal-id");
            var url = $('option:selected', this).attr("data-url");
            var description = $('option:selected', this).attr("data-description");
            if (qr_code == 'true') {
                $('img#img-transfer-qr').removeClass('d-none').addClass('d-block');
                $('img#img-transfer-qr').attr('src', 'data:image/*; base64,' + image);
            } else {
                $('img#img-transfer-qr').removeClass('d-block').addClass('d-none');
            }

            if (url != '#') {
                $('div#div-url-pay').removeClass('d-none').addClass('d-block');
                $('a#url-pay').attr('href',url);
                $('span.url-pay-name').html(url);
            } else {
                $('div#div-url-pay').removeClass('d-block').addClass('d-none');
                $('a#url-pay').attr('href','');
            }

            $('div#pay_description').html(LIST_MESSAGES_PAYS[$('option:selected', this).val()]);
        } else if (my_select.attr('id') == 'payment_only_method') {
            var description = $('option:selected', this).attr("data-description");
            $('div#pay_only_description').html(LIST_MESSAGES_PAYS[$('option:selected', this).val()]);

        }
    });

    $('a#add-payment-method,a#add-only-payment-method').click(function(e) {
        e.preventDefault();
        var elem_id = $(this).attr('id');
        var form = elem_id == 'add-payment-method' ? 'form#formPayments' : 'form#formOnlyPaymentMethod';
        var formData = new FormData($(form)[0]);

        let validado = true;
        $(form + ' select.my-select').each(function(i) {
            if ($(this).attr('is-required') == 'true') {
                if (!selectValidation($(this)))
                    validado = false;
            }
        });

        $(form + ' input.my-form-control').each(function(i) {
            validado = customValidation($(this), validado);
        });

        if (validado) {
            if(elem_id == 'add-only-payment-method'){
                formData.append('set_payment_method',true);
            }

            var EVENT_ID = event_main.get_event_id(true);
            event_main.showLoader();
            set_empty_all_fields();
            $.ajax({
                url: '/profile/add_payment_event',
                data: formData,
                type: 'POSt',
                processData: false, // tell jQuery not to process the data
                contentType: false // tell jQuery not to set contentType
            }).done(function(data_result) {
                var result = event_main.parse_result(data_result);
                if (result.success == true) {
                    if(elem_id == 'add-only-payment-method'){
                        let invoice_id = $('form#formOnlyPaymentMethod input[name=invoice_id]').val();
                        window.open(result.invoice_url, '_blank');
                        $('div#payment-add-payment-method').modal('hide');
                        window.location.reload();
                    } else {
                        toastr.success(event_message.getMessage(result.message));
                        $('span.span-state-invoice').html(event_message.getMessage(28));
                        $('span.span-state-invoice').removeClass('badge-success').addClass('badge-warning');
                        $('span.journal-invoice').text(result.datas.journal_name);
                        $('span.operation-invoice').text(result.datas.operation);
                        $('div#payment-detail').modal('hide');
                    }
                } else if (result.error == true) {
                    toastr.error(event_message.getMessage(result.message));
                }
                event_main.hideLoader();
            });
        } else
            toastr.error('Check the required fields.');
    });



    /* TODO: Cargar foto de pago en pestaña de Perfil de usuario */
    $(".load-image-image-operation").on('click', function (e) {
        e.preventDefault();
        $("input[name='image_operation_id']:hidden").trigger('click');
    });

    $("input[name='image_operation_id']").on('change', function () {
         if (this.files && this.files[0]) {
            var reader = new FileReader();
            $('a.load-image-image-operation').removeClass('d-block').addClass('d-none');
            $('a.show-load-image-image-operation').removeClass('d-none').addClass('d-block');
            $('a.show-load-image-image-operation').html(this.files[0].name);
            reader.onload = function (e) {
                $(this).attr('src', e.target.result);
            }
            reader.readAsDataURL(this.files[0]);
        }
    });

});