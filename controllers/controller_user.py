# -*- coding: utf-8 -*-
import base64
import json
import werkzeug

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
        datas['schedules'] = request.env.user.partner_id.get_schudele_by_partner(
            datas)
        # datas['data_count_nav'] = datas['event'].get_counts_event()
        # datas['title'] = datas['event'].name
        # datas['is_speaker'] = datas['event'].is_speaker_by_event()
        if event_id:
            datas['event'] = request.env['event.event'].sudo().browse(event_id)
            datas['present_stand'] = request.env.user.present_stand_user(
                False, datas['event'].id)
        datas['invoices'] = request.env.user.partner_id.get_my_invoices()
        datas['provinces'] = request.env['res.country.state'].province_by_country_obj(
            datas['user_id'].country_id.id)
        datas['municipalitys'] = request.env['df.municipality'].municipality_by_province_obj(
            datas['user_id'].state_id.id)
        datas['objetives'] = request.env['df_event_virtual_fair.participation.objective'].sudo().search([]).sorted(
            lambda po: po.name)
        """ Listando los estados en los cuales los tipos son is_done o is_accepted """
        state_published = request.env['event.event'].sudo(
        ).get_state_is_accepted()
        state_published.extend(
            request.env['event.event'].sudo().get_state_is_done())
        state_published.extend(
            request.env['event.event'].sudo().get_state_is_cancel())
        datas['track_states'] = list(set(state_published))
        datas['tracks'] = request.env['event.track'].sudo().get_tracks_by_speaker()

        """ Verificando que el módulo df_event_certificate exista y este instalado, para no mostrar
                           un error al acceder al perfil sin que este módulo este instalado """
        module_certificate = request.env['ir.module.module'].sudo().search(
            [('name', '=', 'df_event_certificate'), ('state', '=', 'installed')])
        if module_certificate:
            """ Devolviendo los certificados asociados al usuario en los eventos """
            datas['certifications'] = request.env.user.partner_id.get_all_certifications(
                datas=datas)

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
        event_registration = request.env['event.registration'].sudo().search(
            [('partner_id', '=', request.env.user.partner_id.id)])
        datas['event_registration'] = event_registration
         
        datas['type_attendee'] = request.env['type.attendee.registration'].sudo().search([])
        datas['lodging'] = request.env['product.template'].sudo().search([])
        datas['room_type'] = request.env['product.product'].sudo().search([])
        datas['payment_method'] = request.env['res.currency'].sudo().search([])
        return http.request.render('df_website_front.user_profile', datas)

    @http.route(['/<int:user_id>/save_profile', '/<int:event_id>/<int:user_id>/save_profile'], type='http', auth='user',
                website=True)
    def save_profile(self, event_id=None, user_id=None, **kw):
        if event_id:
            kw['event_id'] = event_id
        result = request.env['res.users'].sudo().browse(
            user_id).save_user_profile(kw)
        return json.dumps(result)

    @http.route(['/evento/<int:event_id>/search_schudele_user'], type='http', auth='user', website=True, csrf=False)
    def search_schudele_user(self, event_id=None, **kw):
        result = ''
        if event_id and kw.get('filter', False):
            kw['event'] = request.env['event.event'].sudo().browse(event_id)
            result = request.env.user.partner_id.sudo(
            ).get_schudele_by_partner(kw, kw['filter'])
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
            event = request.env['event.event'].browse(
                int(kw.get('event_id', False)))
            result = request.env['res.users'].add_event_track(
                int(kw.get('event_id', False)), kw)
            result = self.update_list_tracks_in_profile(result, event)
            result['message'] = 59
            return json.dumps(result)
        return json.dumps({
            'success': False,
            'message': _("The conference was not added")
        })

    @http.route(['/evento/<int:event_id>/remove_track', '/evento/remove_track'], type='http', auth='user', website=True, csrf=False)
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
        request.env['event.track.speaker'].sudo().browse(
            int(kw['id'])).unlink()
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

    @http.route(['/evento/event_registrations'], type='http', auth="public", website=True, csrf=False)
    def view_event_registrations(self, **post):
        if post.get('elem_id', False):
            registrations = request.env['event.registration'].sudo().search(
                [('partner_id', '=', request.env.user.partner_id.id)]).browse(int(post['elem_id'])).get_registrations_json()
        return json.dumps(registrations)

    @http.route(['/evento/edit_status_registrations'], type='http', auth="public", website=True,
                csrf=False)
    def edit_status_registrations(self,  **post):
        if post.get('elem_id', False):
            registrations = request.env['event.registration'].sudo().search(
                [('partner_id', '=', request.env.user.partner_id.id)]).browse(int(post['elem_id']))
            elem_update = {}
            if registrations:
                if registrations.state == 'cancel':
                    statusRegistrations = 'draft'
                else:
                    statusRegistrations = 'cancel'
                elem_update.update({
                    'state': statusRegistrations,
                })
            registrations.sudo().write(elem_update)
        return json.dumps({'success': True, 'message': 10})

    @http.route(['/evento/edit_event_registrations'], type='http', auth="public", website=True, csrf=False)
    def edit_event_registrations(self, **post):
        if post.get('elem_id', False):
           # registrations = request.env['event.registration'].sudo().search(
           #     [('partner_id', '=', request.env.user.partner_id.id)]).browse(int(post['elem_id'])).get_registrations_json()
            
            registrations = request.env['event.registration'].sudo().browse(int(post['elem_id'])).get_registrations_json()
        return json.dumps(registrations)
    

    #PENDIENTE //TODO
    @http.route('/evento/edit_inscription', type='http', auth="public", website=True,
    csrf=False) #Ruta de la URL para editar una inscripción
    def edit_inscription(self, **post): #Definición de la función para editar una inscripción

        #if post.get('elem_id', False) and post.get('event_ticket_id', False): #si se proporciona un ID de elemento en los datos enviados
        elem_id = post.get('elem_id', False)
        if elem_id != '' and elem_id != 'undefined': #si se proporciona un ID de elemento en los datos enviados
            
            registration_id = request.env['event.registration'].sudo().browse(int(post['elem_id'])) #Obtiene el objeto de la pista de evento correspondiente al ID proporcionado

            #Inicializa un diccionario para almacenar las actualizaciones de datos de la pista            
            elem_update = { #Actualiza el diccionario de actualizaciones con los datos proporcionados
                # Acceder a los valores enviados desde el formulario
                'event_ticket_id': post.get('event_tickets_registrations'), #nombre de la pista con el valor de 'event_tickets_registrations' en los datos enviados
                'type_attendees': post.get('event_type_attendee_registrations', False), 
                #'lodging': post.get('event_lodging_registrations', False), 
                #'room_type': post.get('event_room_type_registrations', False), 
                'number_nights': post.get('event_number_nights_registrations', False), 
                'entry_date': post.get('event_entry_date_registrations', False), 
                'companion': post.get('event_companion_registrations', False), 
                'type_institution': post.get('event_type_institution_registrations', False), 
                #'category_investigative': post.get('event_category_investigative_registrations', False), 

            }
        registration_id.write(elem_update)
        return json.dumps(
            {'success': True, 'message': 10}) #Devuelve un JSON indicando que la operación fue exitosa y un mensaje con el valor 10
    