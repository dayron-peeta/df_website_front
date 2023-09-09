# -*- coding: utf-8 -*-
import base64
import json
from datetime import datetime, timedelta

import babel
import babel.dates
import pytz
import werkzeug
from werkzeug.exceptions import Forbidden, NotFound
from odoo.exceptions import AccessError

from odoo import exceptions, http, fields, _, tools
from odoo.http import request
from odoo.osv import expression
from odoo.tools import is_html_empty, DEFAULT_SERVER_DATETIME_FORMAT
import logging

_logger = logging.getLogger(__name__)


# import babel.Locale.parse
def babel_locale_parse(lang_code):
    try:
        return babel.Locale.parse(lang_code)
    except:
        try:
            return babel.Locale.default()
        except:
            return babel.Locale.parse("en_US")


# from odoo.tools.misc import babel_ocale_parse

def get_date_by_tz(tz_name, val_date):
    utc_timestamp = pytz.utc.localize(val_date, is_dst=False)
    context_tz = pytz.timezone(tz_name)
    return utc_timestamp.astimezone(context_tz)


class WebsiteEventControllerInherit(http.Controller):

    # TODO: Se cambio la url de 'event' por 'evento' por problemas de conflicto entre las urls nativas
    @http.route(['/evento/<int:event_id>'], type='http', auth="public", website=True)
    def eventos(self, event_id):
        datas = {}
        datas['event'] = request.env['event.event'].sudo().browse(event_id)
        datas['sponsors'] = datas['event'].get_sponsor_by_event()
        datas['date_range_str'] = datas['event'].get_range_date_event()
        datas['exhibitors'] = datas['event'].get_exhibitor_by_event()
        datas['speakers'] = datas['event'].get_speaker_by_event(False, True)
        datas['news'] = datas['event'].get_news_by_event()
        datas['counts'] = datas['event'].get_counts_event()
        datas['data_count_nav'] = datas['event'].get_counts_event()
        datas['plans'] = datas['event'].get_plans_by_event()
        template_home = datas['event'].template_id
        datas['present_stand'] = request.env.user.present_stand_user(False, datas['event'].id)
        datas['check_key_in_list'] = datas['event'].check_key_in_list
        datas['title'] = datas['event'].name
        datas = datas['event'].get_countdown_event(datas)
        """ 
            Buscando plantilla por defecto para el sitio del evento en caso de que no se seleccione ninguna, y así 
            se pueda constuir dinamicamente con snippets
        """
        if template_home:
            return template_home._render(datas)
        else:
            current_website = request.env['website'].get_current_website()
            website_specific_view = request.env['ir.ui.view'].sudo().search([
                ('key', '=', 'df_website_front.event_empty_page_view'),
                ('website_id', '=', current_website.id)
            ], limit=1)

            if website_specific_view:
                return website_specific_view._render(datas)
            else:
                raise werkzeug.exceptions.NotFound()

    @http.route('''/evento/<int:event_id>/announcement_en''', type='http', auth='public')
    def show_announcement_event_en(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        if event.file_announcement_en:
            pdf = base64.decodebytes(event.file_announcement_en)
            pdfhttpheaders = [('Content-Type', 'application/pdf'), ('Content-Length', len(pdf))]
            return request.make_response(pdf, headers=pdfhttpheaders)
        return False

    @http.route('''/evento/<int:event_id>/announcement_es''', type='http', auth='public')
    def show_announcement_event_es(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        if event.file_announcement_es:
            pdf = base64.decodebytes(event.file_announcement_es)
            pdfhttpheaders = [('Content-Type', 'application/pdf'), ('Content-Length', len(pdf))]
            return request.make_response(pdf, headers=pdfhttpheaders)
        return False

    @http.route('/evento/<int:event_id>/committee_event', type='http', auth='public', website=True)
    def committee_event(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        template_current = 'df_website_front.committee_event'
        data_count_nav = event.get_counts_event()
        type_c = 'organizer'
        obj = request.env['df_event_virtual_fair.event.committee']
        committe = obj.get_commite_by_event(event)
        present_stand = request.env.user.present_stand_user(False, event.id)
        return http.request.render(template_current, {'committe': committe, 'event': event,
                                                      'data_count_nav': data_count_nav,
                                                      'type_c': type_c,
                                                      'title': event.name, 'no_is_home': True,
                                                      'present_stand': present_stand})

    @http.route('/evento/<int:event_id>/committee_event_s', type='http', auth='public', website=True)
    def committee_event_s(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        template_current = 'df_website_front.committee_event'
        data_count_nav = event.get_counts_event()
        obj = request.env['df_event_virtual_fair.event.committee']
        type_c = 'scientific'
        committe = obj.get_commite_by_event(event, type_c)
        present_stand = request.env.user.present_stand_user(False, event.id)
        return http.request.render(template_current, {'committe': committe, 'event': event,
                                                      'data_count_nav': data_count_nav, 'type_c': type_c,
                                                      'title': event.name, 'no_is_home': True,
                                                      'present_stand': present_stand})

    @http.route('/evento/<int:event_id>/committee_event_jury', type='http', auth='public', website=True)
    def committee_event_s(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        template_current = 'df_website_front.jury_event'
        data_count_nav = event.get_counts_event()
        obj = request.env['df_event_virtual_fair.event.committee']
        type_c = 'jury'
        committe = obj.get_commite_by_event(event, type_c)
        present_stand = request.env.user.present_stand_user(False, event.id)
        return http.request.render(template_current, {'committe': committe, 'event': event,
                                                      'data_count_nav': data_count_nav, 'type_c': type_c,
                                                      'title': event.name, 'no_is_home': True,
                                                      'present_stand': present_stand})

    @http.route('/evento/<int:event_id>/participant_event', type='http', auth='public', website=True)
    def participant_event(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.participant_event'
        # if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current):
        #     raise Forbidden()
        datas = event.get_datas_aux(search_participant=True)
        datas['data_count_nav'] = event.get_counts_event()
        datas['event'] = event
        datas['speakers_attendees'] = event.get_exhibitor_by_event(attendee=True)
        datas['present_stand'] = request.env.user.present_stand_user(False, datas['event'].id)
        datas['title'] = event.name
        datas['no_is_home'] = True
        datas['participant'] = True
        datas['type_attendee_ids'] = event.get_attendees()
        datas['check_key_in_list'] = event.check_key_in_list
        return http.request.render(template_current, datas)

    @http.route(['/evento/<int:event_id>/speaker_event', '/evento/<int:event_id>/speaker-event'], type='http',
                auth='public', website=True)
    def speaker_event(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.speaker_event'
        # if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current):
        #     raise Forbidden()
        data_count_nav = event.get_counts_event()
        speakers = event.get_speaker_by_event(False)
        theme_tags = request.env['df_event_virtual_fair.theme.tag'].get_theme_tag_with_track(event_id)
        return http.request.render(template_current,
                                   {'event': event, 'participant': False, 'speakers_attendees': speakers,
                                    'data_count_nav': data_count_nav, 'theme_tags': theme_tags, 'no_is_home': True,
                                    'title': event.name})

    @http.route('/evento/<int:event_id>/sponsor_event', type='http', auth='public', website=True)
    def sponsor_event(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.sponsor_event'
        # if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current):
        #     raise Forbidden()
        data_count_nav = event.get_counts_event()
        sponsors = event.get_sponsor_by_event()
        return http.request.render(template_current,
                                   {'event': event, 'sponsors_with_types': sponsors['sponsors_with_types'],
                                    'data_count_nav': data_count_nav, 'no_is_home': True,
                                    'title': event.name})

    @http.route(['/evento/<int:event_id>/news'], type='http', auth='public', website=True)
    def all_news_event(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.event_news'
        # if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current):
        #     raise Forbidden()
        data_count_nav = event.get_counts_event()
        news = event.get_news_by_event(True)
        present_stand = request.env.user.present_stand_user(False, event.id)
        return http.request.render('df_website_front.event_news', {
            'news': news,
            'event': event,
            'data_count_nav': data_count_nav,
            'title': event.name,
            'no_is_home': True,
            'present_stand': present_stand
        })

    @http.route(['/evento/<int:event_id>/newsletter'], type='http', auth='public', website=True, csrf=False)
    def newsletter(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        mailing = request.env['mailing.list']
        result = mailing.add_suscription_newsletter(event, kw)
        return json.dumps(result)

    @http.route(['/evento/<int:event_id>/<int:new_id>/new_detail'], type='http',
                auth='public', website=True)
    def new_detail(self, event_id, new_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.event_new_detail'
        # if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current):
        #     raise Forbidden()
        data_count_nav = event.get_counts_event()
        new = request.env['event.blog'].sudo().browse(new_id)
        if new.state == 'done':
            present_stand = request.env.user.present_stand_user(False, event.id)
            return http.request.render('df_website_front.event_new_detail', {
                'new': new,
                'event': event,
                'data_count_nav': data_count_nav,
                'title': event.name,
                'no_is_home': True,
                'present_stand': present_stand
            })
        else:
            raise werkzeug.exceptions.NotFound()

    @http.route(['/evento/<int:event_id>/about_us'], type='http', auth='public', website=True)
    def event_about_us(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.event_about_us'
        # if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current):
        #     raise Forbidden()
        data_count_nav = event.get_counts_event()
        present_stand = request.env.user.present_stand_user(False, event.id)
        return http.request.render(template_current, {
            'event': event,
            'data_count_nav': data_count_nav,
            'title': event.name,
            'no_is_home': True,
            'present_stand': present_stand
        })

    @http.route('/evento/<int:event_id>/event_sign_in', type='http', auth='public', website=True)
    def event_sign_in(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        datas = {}
        datas['event'] = event
        datas['sponsors'] = event.get_sponsor_by_event()
        datas['data_count_nav'] = event.get_counts_event()
        datas['title'] = event.name
        datas['no_is_home'] = True
        datas['present_stand'] = request.env.user.present_stand_user(False, datas['event'].id)
        datas['types_part'] = request.env['type.attendee.registration.tag'].sudo().search([], order='sequence')
        """@edilio Esto se comento ya que no se cargaran inicialmente los tipos de participación, sino dependiendo
            del eevnto sleccionado en el registro """
        # datas['theme_tags'] = request.env['df_event_virtual_fair.theme.tag'].sudo().search([], order='name')
        datas['event_type_tracks_ids'] = request.env['event.track.type'].sudo().search([('event_id', '=', event_id)],
                                                                                       order='name')
        datas['countrys'] = request.env['res.country'].sudo().search([('is_blacklist', '!=', True)], order='name')
        datas['economic_sectors'] = request.env['res.partner.industry'].sudo().search([])
        datas['scientific_category_ids'] = request.env['res.partner.title'].search(
            [('category_type', '=', 'scientific')]).sorted(lambda st: st.name)
        datas['teaching_category_ids'] = request.env['res.partner.title'].search(
            [('category_type', '=', 'educational')]).sorted(lambda st: st.name)
        datas['investigative_category_ids'] = request.env['res.partner.title'].search(
            [('category_type', '=', 'investigative')]).sorted(lambda st: st.name)
        datas['speciality_type_ids'] = request.env['df_event_virtual_fair.specialty.type'].search([]).sorted(
            lambda st: st.name)
        """ Mostrando solo eventos publicados """
        datas['event_ids'] = request.env['event.event'].search([('is_published', '=', True)]).sorted(
            lambda st: st.principal, reverse=True)
        datas['types_session'] = request.env['event.track.type'].sudo().search([('event_id.id', '=', event.id)])
        return http.request.render('df_website_front.event_sign_in', datas)

    @http.route(['/evento/<int:event_id>/event_sign_in/register'], type='http', auth='public',
                website=True, csrf=False)
    def event_sign_in_attendee(self, event_id, **post):
        event = request.env['event.event'].sudo().browse(event_id)
        validate_form = event.validate_data(post)
        if validate_form:
            result = request.env['event.registration'].sudo().create_attendee(event, post)
            if len(result) == 0:
                return json.dumps({'success': True, 'message': 2})
            else:
                return json.dumps({'error': True, 'message': result.get('message')})
        return json.dumps({'error': True, 'message': 5})

    @http.route(['/evento/<int:event_id>/contact_us'], type='http', auth='public', website=True)
    def contact_us(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        data_count_nav = event.get_counts_event()
        present_stand = request.env.user.present_stand_user(False, event.id)
        return http.request.render('df_website_front.event_contact_us', {
            'event': event,
            'data_count_nav': data_count_nav,
            'title': event.name,
            'no_is_home': True,
            'present_stand': present_stand
        })

    @http.route(['''/evento/<int:event_id>/contact_us_ajax'''], type='http', auth="public",
                methods=['POST'], website=True)
    def contact_us_ajax(self, event_id, **post):
        event = request.env['event.event'].sudo().browse(event_id)
        if not event.can_access_from_current_website():
            raise NotFound()
        result = event.event_contact_us(event, post)
        return json.dumps({'success': result})

    @http.route('''/evento/<int:event_id>/<int:plan_id>/plan''', type='http', auth='public')
    def show_plan_event(self, event_id, plan_id):
        event = request.env['event.event'].sudo().browse(event_id)
        plan_id = request.env['df_event_virtual_fair.event.plan'].sudo().browse(plan_id)
        if plan_id.file:
            pdf = base64.decodebytes(plan_id.file)
            pdfhttpheaders = [('Content-Type', 'application/pdf'), ('Content-Length', len(pdf))]
            return request.make_response(pdf, headers=pdfhttpheaders)
        return False

    @http.route('''/evento/<int:event_id>/event_plan_es''', type='http', auth='public')
    def plan_event_es(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        if event.event_file_plan_es:
            pdf = base64.decodebytes(event.event_file_plan_es)
            pdfhttpheaders = [('Content-Type', 'application/pdf'), ('Content-Length', len(pdf))]
            return request.make_response(pdf, headers=pdfhttpheaders)
        return False

    @http.route('''/evento/<int:event_id>/event_plan_en''', type='http', auth='public')
    def plan_event_en(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        if event.event_file_plan_en:
            pdf = base64.decodebytes(event.event_file_plan_en)
            pdfhttpheaders = [('Content-Type', 'application/pdf'), ('Content-Length', len(pdf))]
            return request.make_response(pdf, headers=pdfhttpheaders)
        return False

    @http.route('''/evento/<int:event_id>/get_count_event''', type='http', auth='public')
    def get_count_event(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        counts = event.get_counts_event(event_id, send_pavilion=False)
        return json.dumps({'counts': counts})

    @http.route('''/evento/<int:event_id>/search_event_all''', type='http', auth='public', website=True)
    def search_event_all(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        term_search = kw.get('search')
        data_count_nav = event.get_counts_event()
        result_search = event.get_search_event(term_search, event_id)
        present_stand = request.env.user.present_stand_user(False, event.id)
        return http.request.render('df_website_front.search_event', {
            'event': event,
            'data_count_nav': data_count_nav,
            'term_search': term_search,
            'title': event.name,
            'no_is_home': True,
            'result_search': result_search,
            'present_stand': present_stand
        })

    @http.route('''/evento/<int:event_id>/terms_conditions''', type='json', auth='public', website=True)
    def terms_conditions(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        return {'description': event.term_condition}

    @http.route('''/evento/<int:event_id>/search_speaker''', type='http', auth='public', website=True)
    def search_speaker(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        theme_tag_id = kw.get('theme_tag_id')
        data_count_nav = event.get_counts_event()
        theme_tags = request.env['df_event_virtual_fair.theme.tag'].sudo().search([])
        speakers = request.env['event.track'].get_speakers_by_theme_tag(theme_tag_id, event_id)
        present_stand = request.env.user.present_stand_user(False, event.id)
        return http.request.render('df_website_front.speaker_event', {
            'event': event,
            'data_count_nav': data_count_nav,
            'theme_tag_id': int(theme_tag_id),
            'theme_tags': theme_tags,
            'speakers_attendees': speakers,
            'participant': False,
            'title': event.name,
            'no_is_home': True,
            'present_stand': present_stand
        })

    @http.route('/evento/<int:event_id>/<int:pavilion_id>/pavilion_event', type='http', auth='user', website=True)
    def pavilion_event(self, event_id, pavilion_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        pavilion = event.get_pavilion_by_event(pavilion_id)
        datas = {}
        template_pavilion = False
        datas['event'] = event
        datas['no_is_home'] = True
        datas['sponsors'] = event.get_sponsor_by_event()
        datas['data_count_nav'] = event.get_counts_event()
        datas['title'] = event.name
        datas['present_stand'] = request.env.user.present_stand_user(False, datas['event'].id)
        datas['get_area_name'] = event.get_area_name
        datas['check_key_in_list'] = datas['event'].check_key_in_list
        # Si tiene alguno de estos roles que vaya directo al stand
        if not request.env.user.has_group(
                'df_event_virtual_fair.group_event_organizer') and not request.env.user.has_group(
            'base.group_system') and not request.env.user.has_group(
            'event.group_event_manager'):
            datas['areas'] = pavilion.area_ids.filtered(lambda ar: ar.state == 'done')
        else:
            datas['areas'] = pavilion.area_ids
        datas['pavilion'] = pavilion
        if len(pavilion) > 0:
            template_pavilion = pavilion.event_template_id.template_id
            # Validando el acceso a la página
            if not request.env['ir.ui.view'].sudo().validate_user_groups_view(event, template_pavilion.xml_id) and (
                    not request.env.user.has_group(
                        'df_event_virtual_fair.group_event_organizer') and not request.env.user.has_group(
                'base.group_system') and not request.env.user.has_group('event.group_event_manager')):
                raise Forbidden()
        if template_pavilion:
            return template_pavilion._render(datas)
        else:
            raise Forbidden()

    @http.route(['/evento/<int:event_id>/speaker_detail'], type='json', auth='public', website=True)
    def speaker_detail(self, event_id, **kw):
        speaker_det = {}
        if kw.get('attendee_id', False):
            speaker_id = request.env['event.track.speaker'].sudo().browse(int(kw['attendee_id']))
            speaker_det = speaker_id.get_speaker_detail()
        return speaker_det

    @http.route('/evento/<int:event_id>/refresh_chat_event', type='http', auth='user', website=True, csrf=False)
    def refresh_chat_event(self, event_id, **kw):
        messages = {'error': True, 'message': 29}
        if kw.get('track_id', False) and kw['track_id'] != '':
            event_track = request.env['event.track'].browse(int(kw['track_id']))
            messages = event_track.get_message_by_track(kw)
        return json.dumps(messages)

    @http.route('/evento/<int:event_id>/add_chat_event', type='http', auth='public', website=True)
    def add_chat_event(self, event_id, **kw):
        messages = {'error': True, 'message': 29}
        if kw.get('track_id', False) and kw['track_id'] != '':
            event_track = request.env['event.track'].browse(int(kw['track_id']))
            messages = event_track.add_message_by_track(kw)
        return json.dumps(messages)

    @http.route(['/evento/<int:event_id>/exhibitor'], type='http', auth='public', website=True)
    def exhibitor_template(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.exhibitor_template'
        # if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current):
        #     raise Forbidden()
        datas = event.get_datas_aux(search_exhibitor=True)
        datas['data_count_nav'] = event.get_counts_event()
        datas['areas'] = event.get_pavilion_by_areas_exhibitor_event(kw)
        datas['title'] = event.name
        datas['event'] = event
        datas['no_is_home'] = True
        datas['get_area_by_user'] = request.env['df_event_virtual_fair.area'].get_area_by_user
        datas['pavillions'] = event.get_pavilion_by_event(search_pavilion=True)
        return http.request.render(template_current, datas)

    # TODO: @cesar terminar @edilio
    @http.route(['/evento/<int:event_id>/new_participant_event'], type='http', auth='public', website=True)
    def new_participant_event(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.new_participant_event'
        # if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current):
        #     raise Forbidden()
        datas = event.get_datas_aux(search_exhibitor=True)
        datas['data_count_nav'] = event.get_counts_event()
        datas['areas'] = event.get_pavilion_by_areas_exhibitor_event(kw)
        datas['title'] = event.name
        datas['event'] = event
        datas['no_is_home'] = True
        return http.request.render(template_current, datas)

    @http.route(['/evento/<int:event_id>/search_exhibitor'], type='http', auth='public', website=True)
    def search_exhibitor(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.exhibitor_template'
        # if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current):
        #     raise Forbidden()
        datas = event.get_datas_aux(search_exhibitor=True)
        datas['data_count_nav'] = event.get_counts_event()
        datas['areas'] = event.get_pavilion_by_areas_exhibitor_event(kw)
        datas['title'] = event.name
        datas['event'] = event
        datas['no_is_home'] = True
        datas['pavillions'] = event.get_pavilion_by_event(search_pavilion=True)
        if 'pavilion_id' in kw and kw['pavilion_id'] != '' and kw['pavilion_id'] != 'undefined':
            datas['pavilion_id_sel'] = int(kw['pavilion_id'])
        if 'cou_id' in kw and kw['cou_id'] != '' and kw['cou_id'] != 'undefined':
            datas['cou_id_sel'] = int(kw['cou_id'])
        if 'search_part' in kw and kw['search_part'] != '':
            datas['search_part_sel'] = kw['search_part']
        return http.request.render(template_current, datas)

    @http.route('/profile/add_payment_event', type='http', auth='user', website=True)
    def add_payment_event(self, **post):
        result = request.env['event.event'].sudo().add_payment_event(post)
        return json.dumps(result)

    @http.route('/evento/<int:event_id>/<int:area_id>/networking_update', csrf=False)
    def event_networking_update(self, event_id, area_id, **kwargs):
        event = request.env['event.event'].sudo().browse(event_id)
        area = event.get_room_networking()
        selected_partner_id = kwargs.get('selected_partner_id', False)  # usuario seleccionado para chatear
        filter_username = kwargs.get('filter_username', '')  # texto escrito en el campo de busqueda
        user_message_date = json.loads(kwargs.get('user_message_date', '{}'))  # {'user' : 'fecha ultimo mensaje'}
        new_messages_count = json.loads(kwargs.get('new_messages_count', '{}'))  # {'user' : 'fecha ultimo mensaje'}
        users_active, users_idle = [], []

        if area:
            # Verificando si el usuario ya existe en la tabla bus.presence, sino crearlo y ponerle como online
            request.env.user.sudo().update_bus_presence()
            logged_partner = request.env['res.users'].sudo().browse(request._uid).partner_id
            selected_partner = request.env['res.users'].sudo().browse(selected_partner_id)
            # cargando los usuarios que estan en linea y aplicando el filtro de nombre
            active_partners = area.load_partner_networking(filter_username=filter_username)
            active_partners = active_partners.filtered(lambda p: p.id != logged_partner.id).sorted(lambda sr: sr.name)

            # buscando los canales privados que el usuario logueado tiene en esta area
            private_channels = request.env['mail.channel'].sudo().search([
                ('public', '=', 'private'),
                ('channel_type', '=', 'chat'),
                # ('area_id', '=', area.id),
                ('channel_partner_ids', 'in', [logged_partner.id])])

            current_date = datetime.now()
            tz_name = request.env.user.tz
            for channel in private_channels:
                # alguno de los partners activos esta en mi canal
                exist = len(list(set(channel.channel_partner_ids.ids).intersection(set(active_partners.ids)))) > 0
                new_messages = request.env['mail.message']
                if exist:
                    for mesg in channel.channel_message_ids.sorted(lambda st: st.id):
                        # capturando la fecha del ultimo mensaje escrito a 'mesg.author_id.id'
                        date_user = datetime.strptime(str(user_message_date.get(str(mesg.author_id.id),
                                                                                datetime.strptime(
                                                                                    '1900-01-01 00:00:00',
                                                                                    DEFAULT_SERVER_DATETIME_FORMAT)
                                                                                )), DEFAULT_SERVER_DATETIME_FORMAT)

                        # corrigiendo desfazaje del timezone
                        # if datetime.strptime(datetime.strftime(get_date_by_tz(tz_name, mesg.write_date),
                        #                                        DEFAULT_SERVER_DATETIME_FORMAT),
                        #                      DEFAULT_SERVER_DATETIME_FORMAT) >= date_user:
                        # print(date_user.strftime(tools.DEFAULT_SERVER_DATETIME_FORMAT),
                        #       mesg.write_date.strftime(tools.DEFAULT_SERVER_DATETIME_FORMAT))
                        mesg_write_date = datetime.strptime(
                            mesg.write_date.strftime(tools.DEFAULT_SERVER_DATETIME_FORMAT),
                            DEFAULT_SERVER_DATETIME_FORMAT)
                        if mesg_write_date > date_user:
                            new_messages |= mesg
                    if new_messages:
                        for msg in new_messages:
                            new_messages_count[msg.author_id.id] = new_messages_count[
                                                                       msg.author_id.id] + 1 if new_messages_count.get(
                                str(msg.author_id.id), False) else 0
                            if msg.author_id != logged_partner:
                                user_message_date[str(msg.author_id.id)] = str(
                                    msg.write_date.strftime(DEFAULT_SERVER_DATETIME_FORMAT))

                                if msg.author_id not in users_active:
                                    users_active.append(msg.author_id)

            # los partners que no tengan mensajes se catalogan como INACTIVOS
            for part in active_partners:
                if part not in users_active:
                    users_idle.append(part)
        html = request.env.ref('df_website_front.networking_event_participants')._render({
            'users_active': users_active,
            'users_idle': users_idle,
        }, engine='ir.qweb')
        return json.dumps({
            'html': html.decode('utf-8'),
            'user_message_date': user_message_date,
            'new_messages_count': new_messages_count
        })

    @http.route(['/evento/<int:event_id>/<int:area_id>/event_area',
                 '/evento/<int:event_id>/<int:area_id>/event_area/<stand_networking>/<val_area_stand_id>'], type='http',
                auth='user', website=True)
    def event_area(self, event_id, area_id, stand_networking=False, val_area_stand_id=False, **post):
        obj_area, event_history_obj = request.env['df_event_virtual_fair.area'], request.env[
            'df_event_virtual_fair.event.history']
        datas = {}
        datas['no_is_home'] = True
        datas['val_area_stand_id'] = False
        datas['event'] = request.env['event.event'].sudo().browse(event_id)
        present_stand = request.env.user.present_stand_user(True, datas['event'].id)
        valido, valido_admin = False, False
        datas['conference'] = False
        # Si tiene alguno de estos roles que vaya directo al stand
        if not request.env.user.has_group(
                'df_event_virtual_fair.group_event_organizer') and not request.env.user.has_group(
            'base.group_system') and not request.env.user.has_group(
            'event.group_event_manager') and obj_area.sudo().browse(area_id).area_type_id.code not in ['AR']:
            # Validar si el usuario logueado es el exhibitor del stand que se desea entrar
            if not isinstance(present_stand, bool) and len(present_stand) > 0:
                datas['area_id'] = obj_area.sudo().search([('id', '=', area_id), ('event_id', '=', event_id),
                                                           ('partner_id.id', '=', present_stand.id)])
                if len(datas['area_id']) > 0:
                    valido = True
                    datas['room_networking'] = datas['event'].get_room_networking()
                    datas['present_stand'] = request.env.user.present_stand_user(False, datas['event'].id)
            # Validar si el usuario logueado no es el exhibitor del stand que se desea entrar, validar que
            # dicho stand ya se facturo (pagado)
            if not valido:
                # Verificar que el area esta finalizada
                datas['area_id'] = obj_area.sudo().search([('id', '=', area_id), ('event_id', '=', event_id),
                                                           ('state', '=', 'done')])
                # Obtener el area propia del usuario logueado en caso de que sea un expositor
                if present_stand:
                    datas['my_area_id'] = obj_area.sudo().search([('event_id', '=', event_id),
                                                                  ('partner_id.id', '=', present_stand.id)])
                if len(datas['area_id']) > 0:
                    valido = True
                if datas.get('my_area_id', False) and len(datas['my_area_id']) > 0:
                    datas['room_networking'] = datas['event'].get_room_networking()
        else:
            datas['area_id'] = obj_area.sudo().search([('id', '=', area_id), ('event_id', '=', event_id)])
            valido_admin = True
            if datas['area_id'].template_id.template_id.conference_virtual_fair:
                datas['conference'] = True

            if datas['area_id'].template_id.template_id.networking_virtual_fair and not stand_networking:
                datas['users_idle'] = datas['area_id'].load_partner_networking()
            elif stand_networking == 'True':
                datas['room_networking'] = datas['event'].get_room_networking()
                datas['val_area_stand_id'] = int(val_area_stand_id)
                datas['users_idle'] = datas['area_id'].load_partner_networking(None, val_area_stand_id)
            if datas['area_id'].template_id.template_id.information_virtual_fair or datas[
                'area_id'].template_id.template_id.forum_virtual_fair or datas[
                'area_id'].template_id.template_id.press_room_virtual_fair:
                datas['conference'] = True
                datas['information'] = True
                # data['video_url']
            if datas['area_id'].template_id.template_id.lobby_virtual_fair:
                datas['pavilion'] = datas['event'].get_pavilion_by_event()

            if datas['area_id'].template_id.template_id.pre_conference_virtual_fair:
                datas['locations'] = datas['event'].get_locations_tracks()
        if not valido and not valido_admin:
            raise Forbidden()

        """ Verificando que el area tenga template asociado """
        template_area = datas['area_id'].template_id.template_id if datas['area_id'] else None

        """ Verificar que es el expositor del area actual"""
        expositor_area = request.env.user.partner_id.validate_partner_area(datas['area_id'],
                                                                           request.env.user.partner_id)
        """ Verificar que tenga permiso para esta plantilla """
        if template_area:
            perm_template = request.env['ir.ui.view'].sudo().validate_user_groups_view(datas['event'],
                                                                                       template_area.xml_id)

        if not valido and template_area and not expositor_area and not valido_admin:
            if not perm_template:
                # Validando el acceso a la página
                raise Forbidden()
        datas['sponsors'] = datas['event'].get_sponsor_by_event()
        datas['date_range_str'] = datas['event'].get_range_date_event()
        datas['exhibitors'] = datas['event'].get_exhibitor_by_event()
        datas['speakers'] = datas['event'].get_speaker_by_event()
        datas['news'] = datas['event'].get_news_by_event()
        datas['counts'] = datas['event'].get_counts_event()
        datas['plans'] = datas['event'].get_plans_by_event()
        datas['pendons'] = datas['area_id'].get_pendons()
        datas['data_count_nav'] = datas['event'].get_counts_event()
        datas['url_id'] = datas['area_id'].get_video_url()
        datas['catalogue'] = datas['area_id'].get_catalogue()
        datas['documents'] = datas['area_id'].get_documents()
        datas['images'] = datas['area_id'].get_images()
        datas['check_key_in_list'] = datas['event'].check_key_in_list
        if datas['conference'] is True and datas['area_id'].template_id.template_id.conference_virtual_fair:
            datas['videos'] = datas['area_id'].get_videos_track_finish()
            datas['documents'] = datas['area_id'].get_docs_track_finish()
        else:
            datas['videos'] = datas['area_id'].get_videos()
        datas['user_exhibitor_area'] = datas['area_id'].get_exhibitor_by_area()
        datas['thematic_rooms'] = datas['event'].get_thematic_rooms()
        if datas['area_id'].is_area_conference():
            datas['tracks'] = datas['event'].get_tracks_by_event()
        datas['title'] = datas['event'].name
        """ Galeria poster """
        if datas['area_id'].template_id.template_id.poster_gallery_virtual_fair:
            # datas['type_documents'] = request.env['event.track'].sudo().load_type_documents_all_tracks(datas['event'])
            datas['type_talk'] = request.env['event.track'].sudo().load_all_type_talk(datas['event'])

            if post.get('filter_typ', False) or post.get('search_post', False):
                filter_pos = {}
                if post.get('filter_typ', False):
                    datas['type_sel'] = int(post['filter_typ'])
                if post.get('search_post', False):
                    datas['search_sel'] = post['search_post']
                documents = request.env['event.track'].sudo().load_documents_all_tracks(datas['event'], filter_pos=post)
                datas['documents_all_tracks'] = documents
            else:
                datas['documents_all_tracks'] = request.env['event.track'].sudo().load_documents_all_tracks(
                    datas['event'])
        if datas.get('area_id', False):
            datas['all_stands'] = datas['area_id'].get_all_stands()
            datas['title'] = datas['area_id'].name + "|" + datas['event'].name
            datas['count_visit_area'] = event_history_obj.get_visits_by_area(datas.get('area_id').id)
        if template_area:
            datas['sessionId'] = request.session.session_token
            """ Generar historial del acceso a las áreas temáticas """
            event_history_obj.sudo().generate_event_history(datas)
            datas['favorite_user'] = request.env[
                'df_event_virtual_fair.event.history'].sudo().verify_unique_session_area(datas, area=True,
                                                                                         favorite=True)
            """ Verificando si el usuario logueado es el organizador del evento o el dueño del stand """
            datas['visitor_view_access'] = False
            if request.env.user.has_group('df_event_virtual_fair.group_event_organizer'):
                datas['visitor_view_access'] = True
            elif datas.get('area_id', False) and datas.get('area_id').partner_id.id == request.env.user.partner_id.id:
                datas['visitor_view_access'] = True
            elif datas.get('area_id', False) and request.env.user.partner_id.id in datas.get(
                    'area_id').sudo().calendar_event_ids.partner_ids.ids:
                datas['visitor_view_access'] = True
            return template_area._render(datas)
        else:
            raise werkzeug.exceptions.NotFound()

    @http.route(['/evento/<int:event_id>/schedule'], type='http', auth='user', website=True)
    def event_schedule(self, event_id, tag=None, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        """ Validando que exista al menos un evento con el menú del programa activo """
        event_exist_schedule = len(
            request.env['event.event'].sudo().search([('menu_register_schedule', '=', True)])) > 0
        # Validando el acceso a la página
        template_current = 'website_event_track.agenda_online'
        if not event.can_access_from_current_website() or not event_exist_schedule:
            raise Forbidden()
        event = event.with_context(tz=event.date_tz or 'UTC')
        counts = event.get_counts_event()
        vals = {
            'event': event,
            'main_object': event,
            'tag': tag,
            'user_event_manager': request.env.user.has_group('event.group_event_manager'),
            'counts': counts,
            'data_count_nav': counts,
            'no_is_home': True
        }

        vals.update(self._prepare_calendar_values(event))

        return request.render(template_current, vals)

    def _prepare_calendar_values(self, event):
        """
         Override that should completely replace original method in v14.

        This methods slit the day (max end time - min start time) into 15 minutes time slots.
        For each time slot, we assign the tracks that start at this specific time slot, and we add the number
        of time slot that the track covers (track duration / 15 min)
        The calendar will be divided into rows of 15 min, and the talks will cover the corresponding number of rows
        (15 min slots).
        """
        event = event.with_context(tz=event.date_tz or 'UTC')
        local_tz = pytz.timezone(event.date_tz or 'UTC')
        lang_code = request.env.context.get('lang')
        event_track_ids = self._event_agenda_get_tracks(event)

        locations = list(set(track.location_id for track in event_track_ids))
        locations.sort(key=lambda x: x.id)

        # First split day by day (based on start time)
        time_slots_by_tracks = {track: self._split_track_by_days(track, local_tz) for track in event_track_ids}

        # extract all the tracks time slots
        track_time_slots = set().union(
            *(time_slot.keys() for time_slot in [time_slots for time_slots in time_slots_by_tracks.values()]))

        # extract unique days
        days = list(set(time_slot.date() for time_slot in track_time_slots))
        days.sort()

        # Create the dict that contains the tracks at the correct time_slots / locations coordinates
        tracks_by_days = dict.fromkeys(days, 0)
        time_slots_by_day = dict((day, dict(start=set(), end=set())) for day in days)
        tracks_by_rounded_times = dict(
            (time_slot, dict((location, {}) for location in locations)) for time_slot in track_time_slots)
        for track, time_slots in time_slots_by_tracks.items():
            start_date = fields.Datetime.from_string(track.date).replace(tzinfo=pytz.utc).astimezone(local_tz)
            end_date = start_date + timedelta(hours=(track.duration or 0.25))

            for time_slot, duration in time_slots.items():
                tracks_by_rounded_times[time_slot][track.location_id][track] = {
                    'rowspan': duration,  # rowspan
                    'start_date': self._get_locale_time(start_date, lang_code),
                    'end_date': self._get_locale_time(end_date, lang_code),
                    'occupied_cells': self._get_occupied_cells(track, duration, locations, local_tz)
                }

                # get all the time slots by day to determine the max duration of a day.
                day = time_slot.date()
                time_slots_by_day[day]['start'].add(time_slot)
                time_slots_by_day[day]['end'].add(time_slot + timedelta(minutes=10 * duration))
                tracks_by_days[day] += 1

        # split days into 15 minutes time slots
        global_time_slots_by_day = dict((day, {}) for day in days)
        for day, time_slots in time_slots_by_day.items():
            start_time_slot = min(time_slots['start'])
            """ Se suma +15m por si existe una charla mayor a max(time_slots['end']) """
            end_time_slot = max(time_slots['end']) + timedelta(minutes=15)

            time_slots_count = int(((end_time_slot - start_time_slot).total_seconds() / 3600) * 4)
            current_time_slot = start_time_slot

            for i in range(0, time_slots_count + 1):
                global_time_slots_by_day[day][current_time_slot] = tracks_by_rounded_times.get(current_time_slot, {})
                global_time_slots_by_day[day][current_time_slot]['formatted_time'] = self._get_locale_time(
                    current_time_slot, lang_code)
                current_time_slot = current_time_slot + timedelta(minutes=10)

        # count the number of tracks by days
        tracks_by_days = dict.fromkeys(days, 0)
        for track in event_track_ids:
            track_day = fields.Datetime.from_string(track.date).replace(tzinfo=pytz.utc).astimezone(local_tz).date()
            tracks_by_days[track_day] += 1
        # obj_area = request.env['df_event_virtual_fair.area'].sudo().search(
        #     [('event_id', '=', event.id), ('area_type_id.code', '=', 'AR'), ('state', '=', 'done')])
        # room_conference = obj_area.filtered(lambda a: a.template_id.template_id.conference_virtual_fair == True)
        # .search([], limit=1)
        return {
            'days': days,
            'tracks_by_days': tracks_by_days,
            'time_slots': global_time_slots_by_day,
            'locations': locations
            # ,
            # 'room_conference': room_conference[0]
        }

    def _event_agenda_get_tracks(self, event):
        tracks_sudo = request.env['event.track'].search([]).sudo().filtered(lambda track: track.date)
        if not request.env.user.has_group('event.group_event_manager'):
            tracks_sudo = tracks_sudo.filtered(
                lambda track: (track.is_published or track.stage_id.is_accepted) and track.event_area_id)
        return tracks_sudo

    def _split_track_by_days(self, track, local_tz):
        """
        Based on the track start_date and the duration,
        split the track duration into :
            start_time by day : number of time slot (15 minutes) that the track takes on that day.
        E.g. :  start date = 01-01-2000 10:00 PM and duration = 3 hours
                return {
                    01-01-2000 10:00:00 PM: 8 (2 * 4),
                    01-02-2000 00:00:00 AM: 4 (1 * 4)
                }
        Also return a set of all the time slots
        """
        start_date = fields.Datetime.from_string(track.date).replace(tzinfo=pytz.utc).astimezone(local_tz)
        start_datetime = self.time_slot_rounder(start_date, 10)
        end_datetime = self.time_slot_rounder(start_datetime + timedelta(hours=(track.duration or 0.25)), 10)
        time_slots_count = int(((end_datetime - start_datetime).total_seconds() / 3600) * 4)

        time_slots_by_day_start_time = {start_datetime: 0}
        for i in range(0, time_slots_count):
            # If the new time slot is still on the current day
            next_day = (start_datetime + timedelta(days=1)).date()
            if (start_datetime + timedelta(minutes=10 * i)).date() <= next_day and 10 > 15:
                time_slots_by_day_start_time[start_datetime] += 1
            elif isinstance(next_day, datetime):
                start_datetime = next_day.datetime()
                time_slots_by_day_start_time[start_datetime] = 0

        return time_slots_by_day_start_time

    def _get_occupied_cells(self, track, rowspan, locations, local_tz):
        """
        In order to use only once the cells that the tracks will occupy, we need to reserve those cells
        (time_slot, location) coordinate. Those coordinated will be given to the template to avoid adding
        blank cells where already occupied by a track.
        """
        occupied_cells = []

        start_date = fields.Datetime.from_string(track.date).replace(tzinfo=pytz.utc).astimezone(local_tz)
        start_date = self.time_slot_rounder(start_date, 10)
        for i in range(0, rowspan):
            time_slot = start_date + timedelta(minutes=10 * i)
            if track.location_id:
                occupied_cells.append((time_slot, track.location_id))
            # when no location, reserve all locations
            else:
                occupied_cells += [(time_slot, location) for location in locations if location]

        return occupied_cells

    def _get_locale_time(self, dt_time, lang_code):
        """ Get locale time from datetime object

            :param dt_time: datetime object
            :param lang_code: language code (eg. en_US)
        """
        locale = babel_locale_parse(lang_code)
        return babel.dates.format_time(dt_time, format='short', locale=locale)

    def time_slot_rounder(self, time, rounded_minutes):
        """ Rounds to nearest hour by adding a timedelta hour if minute >= rounded_minutes
            E.g. : If rounded_minutes = 15 -> 09:26:00 becomes 09:30:00
                                              09:17:00 becomes 09:15:00
        """
        return (time.replace(second=0, microsecond=0, minute=0, hour=time.hour)
                + timedelta(minutes=rounded_minutes * (time.minute // rounded_minutes)))

    @http.route('/evento/<int:event_id>/load_documents', type='http', auth='user', website=True, csrf=False)
    def load_documents(self, event_id, **kw):
        messages = {'error': True, 'message': 29}
        if 'track_id' in kw and kw['track_id'] != '':
            event_track = request.env['event.track'].browse(int(kw['track_id']))
            messages = event_track.load_documents()
        return json.dumps(messages)

    @http.route('/evento/<int:event_id>/get_message_networking', type='http', auth='user', website=True, csrf=False)
    def get_message_networking(self, event_id, **kw):
        messages = {'error': True, 'message': 29}
        event = request.env['event.event'].sudo().browse(event_id)
        if (kw.get('partner_id', False) and kw['partner_id'] != '') or (kw.get('stand', False) and kw['stand'] != ''):
            if kw.get('stand', False) and kw['stand'] != '':
                kw['area_id'] = request.env['df_event_virtual_fair.area'].browse(int(kw['current_area_id']))
            messages = event.load_message_by_partners(kw)
        return json.dumps(messages)

    @http.route('/evento/<int:event_id>/get_message_stand', type='http', auth='user', website=True, csrf=False)
    def get_message_stand(self, event_id, **kw):
        messages = {'error': True, 'message': 29}
        event = request.env['event.event'].sudo().browse(event_id)
        if (kw.get('partner_id', False) and kw['partner_id'] != '') or (kw.get('stand', False) and kw['stand'] != ''):
            if kw.get('stand', False) and kw['stand'] != '':
                kw['area_id'] = request.env['df_event_virtual_fair.area'].browse(int(kw['current_area_id']))
            messages = event.load_message_by_partners(kw)
        return json.dumps(messages)

    @http.route('/evento/<int:event_id>/add_message_networking', type='http', auth='public', website=True)
    def add_message_networking(self, event_id, **kw):
        messages = {'error': True, 'message': 29}
        event = request.env['event.event'].sudo().browse(event_id)
        kw['area_id'] = event.get_room_networking()
        if kw.get('partner_id', False) and kw['partner_id'] != '':
            messages = event.add_messages_networking(kw)
        return json.dumps(messages)

    @http.route('''/evento/<int:event_id>/track/<int:track_id>''', type='http', auth="user", website=True,
                sitemap=True)
    def event_track_page(self, event_id, track_id, **options):
        event = request.env['event.event'].sudo().browse(event_id)
        track = request.env['event.track'].browse(track_id)

        track = self._fetch_track(track.id, allow_is_accepted=False)

        return request.render(
            "website_event_track.event_track_main",
            self._event_track_page_get_values(event, track.sudo(), **options)
        )

    def _fetch_track(self, track_id, allow_is_accepted=False):
        track = request.env['event.track'].browse(track_id).exists()
        if not track:
            raise NotFound()
        try:
            track.check_access_rights('read')
            track.check_access_rule('read')
        except exceptions.AccessError:
            track_sudo = track.sudo()
            if allow_is_accepted and track_sudo.is_accepted:
                track = track_sudo
            else:
                raise Forbidden()

        event = track.event_id
        # JSON RPC have no website in requests
        if hasattr(request, 'website_id') and not event.can_access_from_current_website():
            raise NotFound()
        try:
            event.check_access_rights('read')
            event.check_access_rule('read')
        except exceptions.AccessError:
            raise Forbidden()

        return track

    def _event_track_page_get_values(self, event, track, **options):
        track = track.sudo()

        option_widescreen = options.get('widescreen', False)
        option_widescreen = bool(option_widescreen) if option_widescreen != '0' else False
        # search for tracks list
        tracks_other = track._get_track_suggestions(
            restrict_domain=self._get_event_tracks_base_domain(track.event_id),
            limit=10
        )

        sponsors = event.get_sponsor_by_event()
        date_range_str = event.get_range_date_event()
        exhibitors = event.get_exhibitor_by_event()
        speakers = event.get_speaker_by_event()
        news = event.get_news_by_event()
        counts = event.get_counts_event()
        plans = event.get_plans_by_event()
        template_home = event.template_id
        present_stand = request.env.user.present_stand_user(False, event.id)
        thematic_rooms = event.get_thematic_rooms()

        return {
            # event information
            'event': event,
            'main_object': track,
            'track': track,
            # sidebar
            'tracks_other': tracks_other,
            # options
            'option_widescreen': option_widescreen,
            # environment
            'is_html_empty': is_html_empty,
            'hostname': request.httprequest.host.split(':')[0],
            'user_event_manager': request.env.user.has_group('event.group_event_manager'),
            'sponsors': sponsors['sponsors'],
            'exhibitors': exhibitors,
            'date_range_str': date_range_str,
            'speakers': speakers,
            'news': news,
            'counts': counts,
            'plans': plans,
            'data_count_nav': counts,
            'title': event.name,
            'present_stand': present_stand,
            'thematic_rooms': thematic_rooms
        }

    def _get_event_tracks_base_domain(self, event):
        """ Base domain for displaying tracks. Restrict to accepted or published
        tracks for people not managing events. Unpublished tracks may be displayed
        but not reachable for teasing purpose. """
        search_domain_base = [
            ('event_id', '=', event.id),
        ]
        if not request.env.user.has_group('event.group_event_user'):
            search_domain_base = expression.AND([
                search_domain_base,
                ['|', ('is_published', '=', True), ('is_accepted', '=', True)]
            ])
        return search_domain_base

    @http.route(['/evento/<int:event_id>/search_partner_networking',
                 '/evento/<int:event_id>/search_partner_networking/<val_area_stand_id>'], type='http', auth='user',
                website=True, csrf=False)
    def search_partner_networking(self, event_id, val_area_stand_id=None, **kw):
        partners = ''
        if 'criteria' in kw and kw['criteria'] != '':
            partners = request.env['df_event_virtual_fair.area'].load_partner_networking(kw['criteria'],
                                                                                         val_area_stand_id)
        return json.dumps(partners)

    @http.route('/evento/<int:event_id>/add_message_stand', type='http', auth='public', website=True)
    def add_message_stand(self, event_id, **post):
        messages = {'error': True, 'message': 45}
        event = request.env['event.event'].sudo().browse(event_id)
        if post.get('current_area_id', False) and post['current_area_id'] != '':
            post['area_id'] = request.env['df_event_virtual_fair.area'].sudo().search(
                [('id', '=', int(post['current_area_id'])), ('event_id', '=', event_id)])
            messages = event.add_messages_networking(post, True)
        return json.dumps(messages)

    @http.route(['''/evento/<int:event_id>/search_participant'''], type='http', auth='public', website=True)
    def search_event(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.participant_event'
        if kw.get('types_ins_id', False) or kw.get('participant_company', False):
            template_current = 'df_website_front.participant_company_event'
            datas = event.get_datas_aux(search_participant=True, participant_company=True)
            datas['speakers_attendees'] = event.get_exhibitor_by_event(True, post=kw, participant_company=True)
        else:
            datas = event.get_datas_aux(search_participant=True)
            datas['speakers_attendees'] = event.get_exhibitor_by_event(True, post=kw)

        datas['data_count_nav'] = event.get_counts_event()
        datas['event'] = event
        datas['present_stand'] = request.env.user.present_stand_user(False, datas['event'].id)
        datas['title'] = event.name
        datas['participant'] = True
        datas['no_is_home'] = True
        datas['type_attendee_ids'] = event.get_attendees()
        datas['check_key_in_list'] = event.check_key_in_list
        if kw.get('type_par_id', False) and kw['type_par_id'] != '' and kw['type_par_id'] != 'undefined':
            datas['type_participant_id_sel'] = kw['type_par_id']
        if kw.get('cou_id', False) and kw['cou_id'] != '' and kw['cou_id'] != 'undefined':
            datas['country_id_name_sel'] = int(kw['cou_id'])
        if kw.get('search_part', False) and kw['search_part'] != '':
            datas['search_part_sel'] = kw['search_part']
        if kw.get('types_ins_id', False) and kw['types_ins_id'] != '':
            datas['types_ins_sel'] = int(kw['types_ins_id'])
        return http.request.render(template_current, datas)

    @http.route(['/evento/<int:event_id>/attendee_detail'], type='json', auth='public', website=True)
    def attendee_detail(self, event_id, **kw):
        attendees_det = {}
        if kw.get('attendee_id', False):
            attendee = request.env['event.registration'].sudo().browse(int(kw['attendee_id']))
            attendees_det = {
                'detail': attendee.partner_id.biography,
                'name': attendee.partner_id.name,
                'image': attendee.partner_id.image_1920,
                'biography': attendee.partner_id.biography,
                'email': attendee.partner_id.email if attendee.partner_id.email else '',
                'functions': attendee.partner_id.function,
                'company': attendee.partner_id.parent_id.name if attendee.partner_id.parent_id else '',
                'facebook_url': attendee.partner_id.facebook_url,
                'twitter_url': attendee.partner_id.twitter_url,
                'linkedin_url': attendee.partner_id.linkedin_url,
                'telegram_url': attendee.partner_id.telegram_url
            }
        return attendees_det

    @http.route(['/evento/<int:event_id>/attendee_company_detail'], type='json', auth='public', website=True)
    def attendee_company_detail(self, event_id, **kw):
        partner_id_det = {}
        if kw.get('attendee_id', False):
            partner_id = request.env['res.partner'].sudo().browse(int(kw['attendee_id']))
            partner_id_det = {
                'detail': partner_id.biography,
                'name': partner_id.name,
                'image': partner_id.image_1920,
                'biography': partner_id.biography,
                'email': partner_id.email if partner_id.email else '',
                'functions': partner_id.function,
                'company': partner_id.parent_id.name if partner_id.parent_id else '',
                'facebook_url': partner_id.facebook_url,
                'twitter_url': partner_id.twitter_url,
                'linkedin_url': partner_id.linkedin_url,
                'telegram_url': partner_id.telegram_url
            }
        return partner_id_det

    @http.route(['/evento/<int:event_id>/exhibitor_detail'], type='json', auth='public', website=True)
    def exhibitor_detail(self, event_id, **kw):
        # exhibitor = request.env['df_event_virtual_fair.area'].sudo().browse(int(kw['attendee_id']))

        if kw.get('attendee_id', False):
            area_id = request.env['df_event_virtual_fair.area'].sudo().search(
                [('partner_id', '=', int(kw['attendee_id'])), ('event_id', '=', event_id)])
            # exhibitor = request.env['event.registration'].sudo().search(
            #     [('partner_id', '=', int(kw['attendee_id'])), ('event_id', '=', event_id)])
            exhibitor = request.env['res.partner'].sudo().browse(int(kw['attendee_id']))
            exhibitor_det = {
                'detail': exhibitor.comment_large if exhibitor.comment_large else exhibitor.comment,
                'name': exhibitor.name if exhibitor.name else '',
                'image': exhibitor.image_1920 if exhibitor.image_1920 else '',
                'website': exhibitor.website if exhibitor.website else '',
                'pavilion': area_id.pavilion_id.name if area_id.pavilion_id else '',
                'email': exhibitor.email if exhibitor.email else '',
                'functions': '',
                'company': exhibitor.parent_id.name if exhibitor.parent_id else '',
                'facebook_url': exhibitor.facebook_url if exhibitor.website else '',
                'twitter_url': exhibitor.twitter_url if exhibitor.website else '',
                'linkedin_url': exhibitor.linkedin_url if exhibitor.website else '',
                'telegram_url': exhibitor.telegram_url if exhibitor.website else ''
            }
            return exhibitor_det
        return False

    @http.route(['/evento/<int:event_id>/countdown'], type='http', auth='public', website=True, csrf=False)
    def event_count_down(self, event_id):
        datas = {}
        datas['event'] = request.env['event.event'].sudo().browse(event_id)
        datas = datas['event'].get_countdown_event(datas, True)
        return json.dumps([datas])

    @http.route('''/evento/<int:event_id>/track_conference/<int:track_id>''', type='http', auth='user', website=True)
    def event_track_conference(self, event_id, track_id):
        if event_id and track_id:
            datas, template_id = {}, request.env['ir.ui.view'].sudo()
            datas['event'] = request.env['event.event'].sudo().browse(event_id)
            datas['track'] = request.env['event.track'].sudo().browse(track_id)
            if datas['track']:
                datas['area_id'] = datas['track'].event_area_id
            template_id = datas['track'].event_area_id.mapped('template_id').mapped('template_id')
            # Validando el acceso a la página
            template_current = template_id.xml_id
            if not request.env['ir.ui.view'].sudo().validate_user_groups_view(datas['event'],
                                                                              template_current) and not request.env.user.has_group(
                'df_event_virtual_fair.group_event_organizer') and not request.env.user.has_group(
                'base.group_system') and not request.env.user.has_group(
                'event.group_event_manager'):
                raise Forbidden()

            datas['speakers'] = datas['track'].event_track_speakers
            rooms = datas['event'].get_thematic_rooms(event_id=event_id)
            if rooms['pre_conference']:
                datas['ante_room'] = rooms['pre_conference']
            if datas['track']:
                if datas['track'].event_area_id:
                    # Estos son los videos de las conferencias pasadas
                    datas['videos'] = datas['track'].event_area_id.sudo().get_videos_track_finish(datas['track'])
                    # Estos son los documentos e imagenes de la charla
                    datas['imgs'] = datas['track'].get_resorces_by_track()['imgs_track']
                    if len(datas['imgs']) == 0:
                        datas['imgs'] = datas['track'].event_area_id.get_images_area()
                datas['documents'] = datas['track'].get_resorces_by_track()['docs_track']
                # Video de la charla
                datas['video_url'] = datas['track'].get_video_track_url()
                datas['title'] = datas['track'].name + "|" + datas['event'].name
            datas['conference'] = True
            # Esta variable es para que cuando llegue al menu lateral los videos se muestren en forma de listado y no
            # como miniaturas
            datas['list_video'] = True
            datas['check_key_in_list'] = datas['event'].check_key_in_list
            datas['no_is_home'] = True
            datas['data_count_nav'] = datas['event'].get_counts_event()
            if template_id:
                datas['sessionId'] = request.session.session_token
                """ Generar historial del acceso a las áreas temáticas """
                request.env['df_event_virtual_fair.event.history'].sudo().generate_event_history(datas, area=False)
                return template_id._render(datas)
            else:
                raise werkzeug.exceptions.NotFound()
        else:
            raise werkzeug.exceptions.NotFound()

    @http.route(['/evento/<int:event_id>/add_speaker','/evento/add_speaker'], type='http', auth='public', website=True)
    def add_speaker(self, event_id=None, **kw):
        messages = {'error': True, 'message': 29}
        if kw.get('track_id', False) and kw['track_id'] != '':
            event_track_id = request.env['event.track'].browse(int(kw['track_id']))
            messages = event_track_id.add_speaker_by_track(kw)
        return json.dumps(messages)

    @http.route(['/evento/<int:event_id>/detail_track_speakers'], type='http', auth='user', website=True, csrf=False)
    def detail_track_speaker(self, event_id, **kw):
        speaker_det, details = [], {}
        if kw.get('track_id', False) and kw['track_id'] != '':
            event_track = request.env['event.track'].sudo().browse(int(kw['track_id']))
            for speaker in event_track.event_track_speakers:
                speaker_det.append({
                    'id': speaker.id,
                    'name': speaker.partner_id.name
                })
            track_detail = {
                'name': event_track.name,
                'duration': event_track.duration if event_track.duration else '',
                'date': event_track.date.strftime('%Y-%m-%d %H:%M') if event_track.date else '',
                'description': event_track.description if event_track.description else '',
                'responsable': event_track.user_id.partner_id.name if event_track.user_id else '',
                'location': event_track.location_id.name if event_track.location_id else ''
            }
            details = {
                'track': track_detail,
                'speakers': speaker_det
            }
        return json.dumps(details)

    @http.route('''/evento/<int:event_id>/handbook''', type='http', auth='public')
    def event_handbook(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        if event.handbook:
            pdf = base64.decodebytes(event.handbook)
            pdfhttpheaders = [('Content-Type', 'application/pdf'), ('Content-Length', len(pdf))]
            return request.make_response(pdf, headers=pdfhttpheaders)
        return False

    @http.route('''/evento/<int:event_id>/event_favorite_history''', type='http', auth='user', website=True, csrf=False)
    def event_favorite_history(self, event_id, **post):
        datas, result = {}, {'error': True, 'message': 50}
        if post.get('area_id', False) and event_id:
            datas['event'] = request.env['event.event'].sudo().browse(event_id)
            datas['area_id'] = request.env['df_event_virtual_fair.area'].sudo().browse(int(post['area_id']))
            datas['sessionId'] = request.session.session_token
            """ Generar historial del acceso a las áreas temáticas """
            result = request.env['df_event_virtual_fair.event.history'].sudo().generate_event_history(datas, area=True,
                                                                                                      post_ajax=True,
                                                                                                      favorite=True)
        return json.dumps(result)

    @http.route(['/evento/<int:event_id>/jury_detail'], type='json', auth='public', website=True)
    def jury_detail(self, event_id, **kw):
        attendees_det = {}
        if kw.get('attendee_id', False):
            partner_id = request.env['res.partner'].sudo().browse(int(kw['attendee_id']))
            attendees_det = {
                'detail': partner_id.biography if partner_id.biography else '',
                'name': partner_id.name if partner_id.name else '',
                'image': partner_id.image_1920 if partner_id.image_1920 else '',
                'biography': partner_id.biography if partner_id.biography else '',
                'functions': partner_id.function if partner_id.function else '',
                'email': partner_id.email if partner_id.email else '',
                'company': partner_id.parent_id.name if partner_id.parent_id else '',
                'facebook_url': partner_id.facebook_url if partner_id.facebook_url else '',
                'twitter_url': partner_id.twitter_url if partner_id.twitter_url else '',
                'linkedin_url': partner_id.linkedin_url if partner_id.linkedin_url else '',
                'telegram_url': partner_id.telegram_url if partner_id.telegram_url else ''
            }
        return attendees_det

    @http.route('/evento/<int:event_id>/type_attendees', type='http', auth='public', website=True, csrf=False)
    def type_attendees(self, event_id, **post):
        type_attendees_tag = []
        if post.get('event_id_selected', False):
            event = request.env['event.event'].sudo().browse(int(post.get('event_id_selected')))
            if event:
                type_attendees_tag = event.get_type_attendees()
        return json.dumps(type_attendees_tag)

    @http.route('/evento/<int:event_id>/type_attendees_tag', type='http', auth='public', website=True, csrf=False)
    def type_attendees_tag(self, event_id, **post):
        type_attendees_tag = []
        if post.get('event_id_selected', False):
            event = request.env['event.event'].sudo().browse(int(post.get('event_id_selected')))
            if event:
                type_attendees_tag = event.get_type_attendees_tag()
        return json.dumps(type_attendees_tag)

    @http.route('/evento/type_track', type='http', auth='public', website=True, csrf=False)
    def type_track_by_event(self, **post):
        type_tracks, theme_tag_ids = [], []
        if post.get('event_id_selected', False):
            event = request.env['event.event'].sudo().browse(int(post.get('event_id_selected')))
            if event:
                type_sessiones = request.env['event.track.type'].sudo().search([('event_id.id', '=', event.id)])
                tags = request.env['df_event_virtual_fair.theme.tag'].sudo().search([], order='name')
                type_tracks = [{'id': type_session.id, 'name': type_session.name} for type_session in type_sessiones]
                theme_tag_ids = [{'id': tag.id, 'name': tag.name} for tag in tags]
        return json.dumps({'type_tracks': type_tracks, 'theme_tag_ids': theme_tag_ids})

    @http.route('/evento/add_track_datas', type='http', auth='public', website=True, csrf=False)
    def add_track_datas(self, **post):
        events = request.env['event.event'].sudo().get_events_by_attendee()
        values = {}
        values.update({
            'events': [{'id': event.id, 'name': event.name} for event in events]
        })
        tags = request.env['df_event_virtual_fair.theme.tag'].sudo().search([])
        values.update({
            'theme_tags': [{'id': tag.id, 'name': tag.name} for tag in tags]
        })
        return json.dumps(values)

    @http.route(['/evento/<int:event_id>/poster_tracks'], type='http', auth='public', website=True)
    def poster_tracks(self, event_id, **kw):
        values = {}
        values['event'] = request.env['event.event'].sudo().browse(event_id)

        return request.render("df_website_front.template_poster_tracks", values)

    @http.route(['/evento/<int:event_id>/poster_track_detail'], type='http', auth='public', website=True)
    def poster_track_detail(self, event_id, **kw):
        values = {}
        values['event'] = request.env['event.event'].sudo().browse(event_id)

        return request.render("df_website_front.template_poster_track_detail", values)

    @http.route('/evento/<int:event_id>/participant_company_event', type='http', auth='public', website=True)
    def participant_company_event(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        template_current = 'df_website_front.participant_company_event'
        datas = event.get_datas_aux(search_participant=True, participant_company=True)
        datas['data_count_nav'] = event.get_counts_event()
        datas['event'] = event
        datas['speakers_attendees'] = event.get_exhibitor_by_event(attendee=True, participant_company=True)
        datas['present_stand'] = request.env.user.present_stand_user(False, datas['event'].id)
        datas['title'] = event.name
        datas['no_is_home'] = True
        datas['participant'] = True
        datas['type_attendee_ids'] = event.get_attendees()
        datas['check_key_in_list'] = event.check_key_in_list
        return http.request.render(template_current, datas)
