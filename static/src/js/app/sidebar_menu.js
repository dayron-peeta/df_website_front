odoo.define('df_website_front.sidebar_menu', function (require) {
    'use strict';

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var event_stand = require('df_website_front.event-stand');
    var event_message = require('df_website_front.event_message');
    var session = require('web.session');
    var translation = require('web.translation');
    var _t = translation._t;

    $('.js-menu-toggle').click(function (e) {
        let user_public = false;
        var elem_id = $(this).attr('id');
        if(session && session.user_id == false)
            user_public = true;

        if(user_public && elem_id == 'forum-chat'){
            toastr.info(_t('You must register in the system to be able to exchange with the exhibitor.'));
            return;
        }

        if(user_public && elem_id == 'forum-calendar'){
            toastr.info(_t('You must register in the system to be able to make an appointment with the exhibitor.'));
            return;
        }
        var $this = $(this);

        $('div.forum-menu-text').removeClass('forum-menu-text-active');
        $this.children('div.forum-menu-text').addClass('forum-menu-text-active');
        $('div.forum-menu-icon').removeClass('forum-menu-icon-active');
        $this.children('div.forum-menu-icon').addClass('forum-menu-icon-active');
        $('body').addClass('show-sidebar');
        $('.js-menu-toggle').removeClass('js-menu-toggle-active');
        $this.addClass('js-menu-toggle-active');
        $('aside.sidebar').css('min-width', '30%');
        if ($this.attr('id') == 'forum-videos' && $('.' + $this.attr('id') + ' iframe').length > 0) {
            $('aside.sidebar').css('min-width', '50%');
        }
        if ($this.attr('id') == 'forum-products') {
            $('aside.sidebar').css('min-width', '50%');
        }
        $('.forum-aside-menu').fadeOut('75').promise().done(function () {
            $('.' + $this.attr('id')).fadeIn('75');
            if ($this.attr('id') == 'forum-chat') {
                // Comprobando si existe el input que contiene el area_id
                if ($('input[name=current_area_id]').length > 0) {
                    if (user_public)
                        event_stand.load_message_stand();
                } else {
                    toastr.error(event_message.getMessage(29));
                }
            }
        });

        e.preventDefault();
    });

    // click outisde offcanvas
    $(document).mouseup(function (e) {
        var datetimepicker = $(".xdsoft_datetimepicker");
        var container = $(".sidebar");
        if (!container.is(e.target) && container.has(e.target).length === 0) {
            if (!datetimepicker.is(e.target) && datetimepicker.has(e.target).length === 0) {
                if ($('body').hasClass('show-sidebar')) {
                    $('body').removeClass('show-sidebar');
                    var js_menu_toggle = $('body').find('.js-menu-toggle');
                    js_menu_toggle.removeClass('js-menu-toggle-active')
                    js_menu_toggle.children('div.forum-menu-text').removeClass('forum-menu-text-active');
                    js_menu_toggle.children('div.forum-menu-icon').removeClass('forum-menu-icon-active');
                }
            }
        }
    });

    //    $('.tool-link').click(function(){
    //        $('.tool-content');
    //    });
});