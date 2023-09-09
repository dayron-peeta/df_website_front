function topFunction() {
    $('html,body,div').animate({
        scrollTop: $("#top").offset().top
    }, 'slow');
};

function img_pathUrl(input) {
    if ($('#load-img-url').length) {
        $('#load-img-url')[0].src = (window.URL ? URL : webkitURL).createObjectURL(input.files[0]);
    } else if (input.id == 'profile-picture-id') {
        $('#load-img-url-register')[0].src = (window.URL ? URL : webkitURL).createObjectURL(input.files[0]);
    } else if (input.id == 'profile-picture-entity-id') {
        $('#load-img-url-register-entity')[0].src = (window.URL ? URL : webkitURL).createObjectURL(input.files[0]);
    }
}

function img_pathUrl_Design(input) {
    let img = $(input).parent().find('img');
    if (img.length)
        img[0].src = (window.URL ? URL : webkitURL).createObjectURL(input.files[0]);
}

function img_pathUrl_Modal(input) {
    let img = $(input).parents('div.d-flex').find('img');
    if (img.length)
        img[0].src = (window.URL ? URL : webkitURL).createObjectURL(input.files[0]);
}

function img_pathUrl_Stand(input) {
    //$('#load-img-url-stand').css('height', '50px').css('width', '195px');
    $('#load-img-url-stand')[0].src = (window.URL ? URL : webkitURL).createObjectURL(input.files[0]);
    if ($('#load-img-url-resources').length > 0) {
        $('#load-img-url-resources')[0].src = (window.URL ? URL : webkitURL).createObjectURL(input.files[0]);
    }
}

odoo.define('df_website_front.event_main', function (require) {
    "use strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    //Patrocinadores slider
    let slider = $('#slider');
    let siguiente = $('#btn-next');
    let anterior = $('#btn-prev');
    var ajax = require('web.ajax');

    function get_event_id(register = false, separator = "evento/", plataforma = false) {
        var current_url = window.location.pathname;
        var EVENT_ID = '';

        if (register == false && plataforma == false && current_url.indexOf(separator) != -1) {
            EVENT_ID = current_url.split(separator)[1];
        } else if (register == true && plataforma == false && current_url.indexOf(separator) != -1) {
            EVENT_ID = current_url.split(separator)[1].split("/")[0];
        } else if (plataforma == true) {
            EVENT_ID = current_url.split("/")[0];
        }

        return EVENT_ID;
    };

    var event_id = get_event_id();

    $('#slider .slider__section:last').insertBefore('#slider .slider__section:first');
    slider.css('margin-right', '-' + 0 + '%');

    function moverD() {
        slider.animate({
            marginLeft: '-' + 2 + '%'
        }, 250, function () {
            $('#slider .slider__section:first').insertAfter('#slider .slider__section:last');
            slider.css('margin-left', '-' + 0 + '%');
        });
    };

    function moverI() {
        slider_jep_catalogue.animate({
            marginLeft: '+' + 2 + '%'
        }, 250, function () {
            $('#slider_jep_catalogue .slider__section:last').insertBefore('#slider .slider__section:first');
            slider.css('margin-left', '-' + 0 + '%');
        });
    };

    /* --- Start slider for stand catalogue --- */

    let slider_jep_catalogue = $('#slider_jep_catalogue');
    let siguiente_jep = $('#btn-next-jep-catalogue');
    let anterior_jep = $('#btn-prev-jep-catalogue');

    $('#slider_jep_catalogue .slider__section__jep__catalogue:last').insertBefore('#slider_jep_catalogue .slider__section__jep__catalogue:first');
    slider_jep_catalogue.css('margin-right', '-' + 0 + '%');

    function moverDJepCatalogue() {
        slider_jep_catalogue.animate({
            marginLeft: '-' + 2 + '%'
        }, 200, function () {
            $('#slider_jep_catalogue .slider__section__jep__catalogue:first').insertAfter('#slider_jep_catalogue .slider__section__jep__catalogue:last');
            slider_jep_catalogue.css('margin-left', '-' + 0 + '%');
        });
    };

    function moverIJepCatalogue() {
        slider_jep_catalogue.animate({
            marginLeft: '+' + 2 + '%'
        }, 200, function () {
            $('#slider_jep_catalogue .slider__section__jep__catalogue:last').insertBefore('#slider_jep_catalogue .slider__section__jep__catalogue:first');
            slider_jep_catalogue.css('margin-left', '-' + 0 + '%');
        });
    };

    let interval_jep;

    function autoplay_jep() {
        interval_jep = setInterval(function () {
            moverDJepCatalogue();
        }, 10000);
    }

    siguiente_jep.on('click', function () {
        moverDJepCatalogue();
        clearInterval(interval_jep);
        autoplay_jep();
    });

    anterior_jep.on('click', function () {
        moverIJepCatalogue();
        clearInterval(interval_jep);
        autoplay_jep();
    });
    autoplay_jep();

    /* --- End slider for stand catalogue --- */

    /* --- Start slider for stand documents --- */

    let slider_jep_docs = $('#slider_jep_docs');
    let siguiente_jep_docs = $('#btn-next-jep-docs');
    let anterior_jep_docs = $('#btn-prev-jep-docs');

    $('#slider_jep_docs .slider__section__jep__docs:last').insertBefore('#slider_jep_docs .slider__section__jep__docs:first');
    slider_jep_docs.css('margin-right', '-' + 0 + '%');

    function moverDJepDocs() {
        slider_jep_docs.animate({
            marginLeft: '-' + 2 + '%'
        }, 200, function () {
            $('#slider_jep_docs .slider__section__jep__docs:first').insertAfter('#slider_jep_docs .slider__section__jep__docs:last');
            slider_jep_docs.css('margin-left', '-' + 0 + '%');
        });
    };

    function moverIJepDocs() {
        slider_jep_docs.animate({
            marginLeft: '+' + 2 + '%'
        }, 200, function () {
            $('#slider_jep_docs .slider__section__jep__docs:last').insertBefore('#slider_jep_docs .slider__section__jep__docs:first');
            slider_jep_docs.css('margin-left', '-' + 0 + '%');
        });
    };

    let interval_jep_docs;

    function autoplay_jep_docs() {
        interval_jep_docs = setInterval(function () {
            moverDJepDocs();
        }, 10000);
    }

    siguiente_jep_docs.on('click', function () {
        moverDJepDocs();
        clearInterval(interval_jep_docs);
        autoplay_jep_docs();
    });

    anterior_jep_docs.on('click', function () {
        moverIJepDocs();
        clearInterval(interval_jep_docs);
        autoplay_jep_docs();
    });
    autoplay_jep_docs();

    /*End slider for stand documents */

    /* --- Start slider for stand Images --- */

    let slider_jep_imgs = $('#slider_jep_imgs');
    let siguiente_jep_imgs = $('#btn-next-jep-imgs');
    let anterior_jep_imgs = $('#btn-prev-jep-imgs');

    $('#slider_jep_imgs .slider__section__jep__imgs:last').insertBefore('#slider_jep_imgs .slider__section__jep__imgs:first');
    slider_jep_imgs.css('margin-right', '-' + 0 + '%');

    function moverDJepImgs() {
        slider_jep_imgs.animate({
            marginLeft: '-' + 2 + '%'
        }, 200, function () {
            $('#slider_jep_imgs .slider__section__jep__imgs:first').insertAfter('#slider_jep_imgs .slider__section__jep__imgs:last');
            slider_jep_imgs.css('margin-left', '-' + 0 + '%');
        });
    };

    function moverIJepImgs() {
        slider_jep_imgs.animate({
            marginLeft: '+' + 2 + '%'
        }, 200, function () {
            $('#slider_jep_imgs .slider__section__jep__imgs:last').insertBefore('#slider_jep_imgs .slider__section__jep__imgs:first');
            slider_jep_imgs.css('margin-left', '-' + 0 + '%');
        });
    };

    let interval_jep_imgs;

    function autoplay_jep_imgs() {
        interval_jep_imgs = setInterval(function () {
            moverDJepImgs();
        }, 10000);
    }

    siguiente_jep_imgs.on('click', function () {
        moverDJepImgs();
        clearInterval(interval_jep_imgs);
        autoplay_jep_imgs();
    });

    anterior_jep_imgs.on('click', function () {
        moverIJepImgs();
        clearInterval(interval_jep_imgs);
        autoplay_jep_imgs();
    });
    autoplay_jep_imgs();

    /*End slider for stand images */

    /* --- Start slider for stand Images --- */

    let slider_jep_videos = $('#slider_jep_videos');
    let siguiente_jep_videos = $('#btn-next-jep-videos');
    let anterior_jep_videos = $('#btn-prev-jep-videos');

    $('#slider_jep_videos .slider__section__jep__videos:last').insertBefore('#slider_jep_videos .slider__section__jep__videos:first');
    slider_jep_videos.css('margin-right', '-' + 0 + '%');

    function moverDJepVideos() {
        slider_jep_videos.animate({
            marginLeft: '-' + 2 + '%'
        }, 200, function () {
            $('#slider_jep_videos .slider__section__jep__videos:first').insertAfter('#slider_jep_videos .slider__section__jep__videos:last');
            slider_jep_videos.css('margin-left', '-' + 0 + '%');
        });
    };

    function moverIJepVideos() {
        slider_jep_videos.animate({
            marginLeft: '+' + 2 + '%'
        }, 200, function () {
            $('#slider_jep_videos .slider__section__jep__videos:last').insertBefore('#slider_jep_videos .slider__section__jep__videos:first');
            slider_jep_videos.css('margin-left', '-' + 0 + '%');
        });
    };

    let interval_jep_videos;

    function autoplay_jep_videos() {
        interval_jep_videos = setInterval(function () {
            moverDJepVideos();
        }, 10000);
    }

    siguiente_jep_videos.on('click', function () {
        moverDJepVideos();
        clearInterval(interval_jep_videos);
        autoplay_jep_videos();
    });

    anterior_jep_videos.on('click', function () {
        moverIJepVideos();
        clearInterval(interval_jep_videos);
        autoplay_jep_videos();
    });
    autoplay_jep_videos();

    /*End slider for stand videos */



    function get_count_patrocinadores() {
        var event_id = get_event_id();
        if (event_id != undefined) {
            if (event_id.indexOf('/') != -1) {
                event_id = get_event_id(true)
            }
            $.ajax({
                url: '/evento/' + event_id + '/get_count_event',
                dataType: 'json'
            }).done(function (data) {
                var interval;
                if (data.counts.count_sponsors > 4) {
                    $("#botons-carousel").css('display', "block");

                    function autoplay() {
                        interval = setInterval(function () {
                            moverD();
                        }, 5000);
                    }

                    siguiente.on('click', function () {
                        moverD();
                        clearInterval(interval);
                        autoplay();
                    });

                    anterior.on('click', function () {
                        moverI();
                        clearInterval(interval);
                        autoplay();
                    });
                    autoplay()
                } else if (data.counts.count_sponsors > 1 && $(window).width() < 625) {
                    $("#botons-carousel").css('display', "block");

                    function autoplay() {
                        interval = setInterval(function () {
                            moverD();
                        }, 5000);
                    }

                    siguiente.on('click', function () {
                        moverD();
                        clearInterval(interval);
                        autoplay();
                    });

                    anterior.on('click', function () {
                        moverI();
                        clearInterval(interval);
                        autoplay();
                    });
                    autoplay()
                }
            });
        }
    };
    if (event_id != '') {
        get_count_patrocinadores();
    }

    $('#navbarSearch').on('click', function () {
        if ($('#search-icon').hasClass('fa-search')) {
            $('#search-icon').removeClass('fa-search');
            $('#search-icon').addClass('fa-close');
        } else {
            $('#search-icon').removeClass('fa-close');
            $('#search-icon').addClass('fa-search');
        }

    });

    $('#wrapwrap').on('scroll', function (evt) {
        let scrollTop = $('#wrapwrap').scrollTop(),
            elementOffset = $('#wrapwrap').offset().top,
            distance = (scrollTop - elementOffset);
        if (distance > 400) {
            $('#btnToTop').css('display', 'block');
        } else {
            $('#btnToTop').hide();
        }
        $('.animation-felti-right').each(function (i, item) {
            let itemParentOffset = $(item).parent().offset().top;
            let windowHeight = $(window).height();
            let window_div_ratio = itemParentOffset / windowHeight * 100;
            //            if(itemParentOffset < 200 && itemParentOffset > -200)
            if (window_div_ratio < 80)
                $(item).addClass("animation-felti");
            else
                $(item).removeClass("animation-felti");
        });
        $('.animation-felti-left').each(function (i, item) {
            let itemParentOffset = $(item).parent().offset().top;
            let windowHeight = $(window).height();
            let window_div_ratio = itemParentOffset / windowHeight * 100;
            if (window_div_ratio < 80)
                $(item).addClass("animation-felti");
            else
                $(item).removeClass("animation-felti");
        });
    });

    function showLoader() {
        $('#loader-parent').removeClass('d-none').addClass('d-block');
        $('#wrapwrap').addClass('disable-all');
        $('#oe_main_menu_navbar').addClass('disable-all');
    }

    function hideLoader() {
        $('#loader-parent').removeClass('d-block').addClass('d-none');
        $('#wrapwrap').removeClass('disable-all');
        $('#oe_main_menu_navbar').removeClass('disable-all');
    }

    function parse_result(result) {
        return JSON.parse(result)
    }

    function set_empty_all_fields(form_id = 'form-request-job-id') {
        $('form#' + form_id + ' input, form#' + form_id + ' textarea').each(function (index) {
            $(this).val('');
        });
    }

    return {
        'get_event_id': get_event_id,
        'showLoader': showLoader,
        'hideLoader': hideLoader,
        'parse_result': parse_result,
        'set_empty_all_fields': set_empty_all_fields
    }


})