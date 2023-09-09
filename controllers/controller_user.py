# -*- coding: utf-8 -*-
import base64, json, werkzeug

from odoo import http, _
from odoo.http import request


class WebsiteUserController(http.Controller):

    @http.route(['/<int:user_id>/user_profile', '/evento/<int:event_id>/<int:user_id>/user_profile'], type='http',
                auth='user', website=True)
    def user_profile(self, event_id=None, user_id=None):
        datas = {}
        datas = request.env['event.event'].get_datas_aux()
        datas['user_id'] = request.env['res.users'].sudo().browse(user_id)
        datas['title'] = 'Event'
        # if event_id:
        # datas['event'] = request.env['event.event'].sudo().browse(event_id)
        datas['area_id'] = request.env.user.stand_by_user()
        if datas['area_id']:
            datas['users_acre'] = datas['area_id'].mapped('attendees_ids')
        # if len(datas['event']) > 0:
        datas['schedules'] = request.env.user.partner_id.get_schudele_by_partner(datas)
        # datas['data_count_nav'] = datas['event'].get_counts_event()
        # datas['title'] = datas['event'].name
        # datas['is_speaker'] = datas['event'].is_speaker_by_event()
        if event_id:
            datas['event'] = request.env['event.event'].sudo().browse(event_id)
            datas['present_stand'] = request.env.user.present_stand_user(False, datas['event'].id)
        datas['invoices'] = request.env.user.partner_id.get_my_invoices()
        datas['provinces'] = request.env['res.country.state'].province_by_country_obj(
            datas['user_id'].country_id.id)
        datas['municipalitys'] = request.env['df.municipality'].municipality_by_province_obj(
            datas['user_id'].state_id.id)
        datas['objetives'] = request.env['df_event_virtual_fair.participation.objective'].sudo().search([]).sorted(
            lambda po: po.name)
        """ Listando los estados en los cuales los tipos son is_done o is_accepted """
        state_published = request.env['event.event'].sudo().get_state_is_accepted()
        state_published.extend(request.env['event.event'].sudo().get_state_is_done())
        state_published.extend(request.env['event.event'].sudo().get_state_is_cancel())
        datas['track_states'] = list(set(state_published))
        datas['tracks'] = request.env['event.track'].sudo().get_tracks_by_speaker()

        """ Verificando que el módulo df_event_certificate exista y este instalado, para no mostrar
                        un error al acceder al perfil sin que este módulo este instalado """
        module_certificate = request.env['ir.module.module'].sudo().search(
            [('name', '=', 'df_event_certificate'), ('state', '=', 'installed')])
        if module_certificate:
            """ Devolviendo los certificados asociados al usuario en los eventos """
            datas['certifications'] = request.env.user.partner_id.get_all_certifications(datas=datas)

        datas['no_is_home'] = True
        datas['stands_favorites'] = request.env.user.get_stand_favorites()
        datas['scientific_category_ids'] = request.env['res.partner.title'].search(
            [('category_type', '=', 'scientific')]).sorted(lambda st: st.name)
        datas['teaching_category_ids'] = request.env['res.partner.title'].search(
            [('category_type', '=', 'educational')]).sorted(lambda st: st.name)
        datas['investigative_category_ids'] = request.env['res.partner.title'].search(
            [('category_type', '=', 'investigative')]).sorted(lambda st: st.name)
        # else:
        #     return werkzeug.exceptions.Forbidden()
        return http.request.render('df_website_front.user_profile', datas)

    @http.route(['/<int:user_id>/save_profile', '/<int:event_id>/<int:user_id>/save_profile'], type='http', auth='user',
                website=True)
    def save_profile(self, event_id=None, user_id=None, **kw):
        if event_id:
            kw['event_id'] = event_id
        result = request.env['res.users'].sudo().browse(user_id).save_user_profile(kw)
        return json.dumps(result)

    @http.route(['/evento/<int:event_id>/search_schudele_user'], type='http', auth='user', website=True, csrf=False)
    def search_schudele_user(self, event_id=None, **kw):
        result = ''
        if event_id and kw.get('filter', False):
            kw['event'] = request.env['event.event'].sudo().browse(event_id)
            result = request.env.user.partner_id.sudo().get_schudele_by_partner(kw, kw['filter'])
        return json.dumps(result)

    @http.route(['/evento/<int:event_id>/accept_denied_date'], type='http', auth='user', website=True)
    def accept_denied_date(self, event_id=None, **kw):
        result = ''
        if event_id and 'calendar_attendee_id' in kw and kw['calendar_attendee_id'] != '':
            kw['event'] = request.env['event.event'].sudo().browse(event_id)
            result = request.env['calendar.attendee'].approved_denied_date(kw)
        return json.dumps(result)

    """ 
        Método para actualizar el listado de conferencias en el perfil de usuario
        @params 1: Valores actuales 
        @params 2: Evento actual 
    """

    def update_list_tracks_in_profile(self, values, event):
        state_published = []
        if event:
            """ Listando los estados en los cuales los tipos son is_done o is_accepted """
            state_published = event.get_state_is_accepted()
            state_published.extend(event.get_state_is_done())
            state_published.extend(event.get_state_is_cancel())
        html = request.env.ref('df_website_front.documents_presentations')._render({
            'tracks': request.env['event.track'].sudo().get_tracks_by_speaker(),
            'track_states': list(set(state_published))
        }, engine='ir.qweb')
        if html:
            values['html'] = html.decode('utf-8')
        return values

    @http.route(['/evento/add_track'], type='http', auth='user', website=True, csrf=False)
    def add_new_track(self, **kw):
        if kw.get('event_id', False):
            event = request.env['event.event'].browse(int(kw.get('event_id', False)))
            result = request.env['res.users'].add_event_track(int(kw.get('event_id', False)), kw)
            result = self.update_list_tracks_in_profile(result, event)
            result['message'] = 59
            return json.dumps(result)
        return json.dumps({
            'success': False,
            'message': _("The conference was not added")
        })

    @http.route(['/evento/<int:event_id>/remove_track','/evento/remove_track'], type='http', auth='user', website=True, csrf=False)
    def remove_track(self, event_id=None, **kw):
        result = {}
        if event_id:
            kw['event_id'] = event_id
            event = request.env['event.event'].browse(event_id)
            request.env['event.track'].sudo().browse(int(kw['id'])).unlink()
            result = self.update_list_tracks_in_profile({}, event)
            result['success'] = True
            result['message'] = 59
            return json.dumps(result)
        else:
            request.env['event.track'].sudo().browse(int(kw['id'])).unlink()
            result['success'] = True
            result['message'] = 59
            return json.dumps(result)
        return json.dumps({
            'success': True
        })

    @http.route(['/evento/remove_author'], type='http', auth='user', website=True, csrf=False)
    def remove_author(self, **kw):
        result = {}
        request.env['event.track.speaker'].sudo().browse(int(kw['id'])).unlink()
        result['success'] = True
        result['message'] = 59
        return json.dumps(result)      
    
    @http.route(['/evento/remove_doc'], type='http', auth='user', website=True, csrf=False)
    def remove_doc(self, **kw):
        result = {}
        request.env['ir.attachment'].sudo().browse(int(kw['id'])).unlink()
        result['success'] = True
        result['message'] = 59
        return json.dumps(result)   
    
    @http.route(['/evento/remove_img'], type='http', auth='user', website=True, csrf=False)
    def remove_img(self, **kw):
        result = {}
        request.env['ir.attachment'].sudo().browse(int(kw['id'])).unlink()
        result['success'] = True
        result['message'] = 59
        return json.dumps(result)  
