# -*- coding: utf-8 -*-
import base64
import json
import werkzeug
import logging

from odoo import http, _
from odoo.http import request

_logger = logging.getLogger(__name__)

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


    #PENDIENTE EDIT_EVENT_REGISTRATION (inscription) //TODO  
    @http.route('/evento/get_data_event_registration', type='http', auth='public', csrf=False, methods=['GET'])
    def get_data_event_registrations(self, registration_id=None, **kwargs):
        _logger.info('********************************Registration ID recibido: %s', registration_id)
        
        
        if not registration_id:
            _logger.error('Missing registration_id')
            return {'error': 'Missing registration_id'}
        
        registration = request.env['event.registration'].sudo().browse(int(registration_id))
        if not registration.exists():
            _logger.error('registration not found: %s', registration_id)
            return {'error': 'registration not found'}

        _logger.info('********************************Registration: %s', registration)
        # Log all attributes of the registration object
        # attributes = dir(registration)
        # _logger.info('********************************Attributes of registration: %s', attributes)

        def get_field_options(field_name, domain=None):
            field = registration._fields.get(field_name)
            if not field or not field.comodel_name:
                return []
            comodel = request.env[field.comodel_name].sudo()
            if domain:
                return [{'id': record.id, 'name': record.name} for record in comodel.search(domain)]
            else:
                return [{'id': record.id, 'name': record.name} for record in comodel.search([])]
        
        def get_selection_options(field_name):
            field_options = registration.fields_get(allfields=[field_name])[field_name]['selection'] #check this latter to understand well how it works
            if not field_options:
                return []
            return [{'id': value, 'name': name} for value, name in field_options]

        # Convert datetime to string in ISO 8601 format
        def format_datetime(dt):
            return dt.isoformat() if dt else None


        event_ticket_domain = [('event_id', '=', registration.event_id.id), '|', ('seats_limited', '=', False), ('seats_available', '>', 0)]

        data = {
            'event': registration.event_id.name,
            'selected_currency_id': registration.pricelist_id.id if registration.pricelist_id else None,
            'selected_type_attendee': registration.type_attendees if registration.type_attendees else None,
            'selected_event_tickets': registration.event_ticket_id.id if registration.event_ticket_id else None,
            'event_required_lodging': registration.event_id.required_lodging,
            'required_lodging': registration.required_lodging,
            'selected_lodging_id': registration.lodging_id.id if registration.lodging_id else None,
            'selected_room_type': registration.room_type_id.id if registration.room_type_id else None,
            'number_nights': registration.number_nights,
            'entry_date': format_datetime(registration.entry_date),
            'companion': registration.companion if registration.companion else None,
            'currency_id_options': get_field_options('pricelist_id'),
            'type_attendee_options': get_selection_options('type_attendees'),
            'event_tickets_options': get_field_options('event_ticket_id', event_ticket_domain),
            'lodging_id_options': get_field_options('lodging_id'),
            'room_type_options': get_field_options('room_type_id'),
            
            'state': registration.state,
        }
        return request.make_response(json.dumps(data), headers={'Content-Type': 'application/json'})    

    @http.route('/evento/update_registration', type='http', auth="public", website=True,
    csrf=False, methods=['POST']) #Ruta de la URL para editar una inscripción
    def update_registration(self, **post): #Definición de la función para editar una inscripción
        registration_id = post.get('registration_id')
        country_val= post.get('country_val')
        currency_val= post.get('currency_val')
        type_attendee_val= post.get('type_attendee_val')
        tickets_val= post.get('tickets_val')
        required_lodging_val= post.get('required_lodging_val')
        lodging_val= post.get('lodging_val')
        room_type_val= post.get('room_type_val')
        number_nights_val= post.get('number_nights_val')
        entry_date_val= post.get('entry_date_val')
        companion_val= post.get('companion_val')

        # Log the values received from the AJAX request
        _logger.info('********************************registration_id: %s', registration_id) 
        _logger.info('********************************country_val: %s', country_val) 
        _logger.info('********************************currency_val: %s', currency_val) 
        _logger.info('********************************type_attendee_val: %s', type_attendee_val) 
        _logger.info('********************************tickets_val: %s', tickets_val) 
        _logger.info('********************************required_lodging_val: %s', required_lodging_val) 
        _logger.info('********************************lodging_val: %s', lodging_val) 
        _logger.info('********************************room_type_val: %s', room_type_val) 
        _logger.info('********************************number_nights_val: %s', number_nights_val) 
        _logger.info('********************************entry_date_val: %s', entry_date_val) 
        _logger.info('********************************companion_val: %s', companion_val) 

        if registration_id: 
            registration = request.env['event.registration'].sudo().browse(int(post['registration_id'])) #objeto correspondiente al ID proporcionado
            _logger.info('********************************Registration to update: %s', registration)
            if registration.exists():
                registration.write({
                # 'country_id': country_val if country_val else False,
                'pricelist_id': currency_val if currency_val else False,
                'type_attendees': type_attendee_val if type_attendee_val else False,
                # 'event_ticket_id': tickets_val if tickets_val else False,
                'required_lodging': required_lodging_val if required_lodging_val else False,
                'lodging_id': lodging_val if lodging_val else False,
                'room_type_id': room_type_val if room_type_val else False,
                'number_nights': number_nights_val if number_nights_val else False,
                'entry_date': entry_date_val if entry_date_val else False,
                'companion': companion_val if companion_val else False,
                })
                
                # partner_id= registration.partner_id.id #obteniendo el partner del evento
                # partner = request.env['res.partner'].sudo().browse(int(partner_id)) #partner correspondiente al ID proporcionado
                # _logger.info('********************************Partner to update: %s', partner)
                # if partner:
                #     partner.write({
                #         'country_id': country_val if country_val else False,
                #     })
                # return http.request.make_response(json.dumps({'success': True, 'message': 10}), headers={'Content-Type': 'application/json'})
        
        
                # registration = request.env['event.registration'].sudo().browse(int(post['registration_id'])) #objeto correspondiente al ID proporcionado
                # _logger.info('********************************Registration to update: %s', registration)

                # if registration.partner_id:
                #     registration.partner_id.write({
                #         'country_id': country_val if country_val else False,
                #     })
                # return http.request.make_response(json.dumps({'success': True, 'message': 10}), headers={'Content-Type': 'application/json'})
        
                return http.request.make_response(json.dumps({'success': True, 'message': 10}), headers={'Content-Type': 'application/json'})
        
        return http.request.make_response(json.dumps({'success': False, 'error': 'Registration not found'}), headers={'Content-Type': 'application/json'})
    