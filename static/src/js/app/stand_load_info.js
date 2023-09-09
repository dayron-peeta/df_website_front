odoo.define('df_website_front.stand_load_info', function (require) {
    "use strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    $('#pavilion_title').on('click', function () {
        $('#show-stands').toggleClass('d-none');
        if ($('#show-pavilion i').hasClass('fa-chevron-circle-up')) {
            $('#show-pavilion i').removeClass('fa-chevron-circle-up');
            $('#show-pavilion i').addClass('fa-chevron-circle-down');
        } else {
            $('#show-pavilion i').removeClass('fa-chevron-circle-down');
            $('#show-pavilion i').addClass('fa-chevron-circle-up');
        }
    });

    $('.stand-box').hover(function () {
        $(this).css({'box-shadow': '0 0px 0px 0 #007b91, 0 0px 10px 0 #007b91'});
        $(this).css({'border-radius':'22px'});
    }, function () {
        $(this).css({'box-shadow': 'none'});
    });
});