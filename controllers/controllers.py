# -*- coding: utf-8 -*-
import werkzeug
import json
import base64
import io
import os
import mimetypes
from werkzeug.utils import redirect

from odoo import http
from odoo.http import request
from odoo.addons.portal.controllers.web import Home


class FeriaVirtual(Home):

    @http.route()
    def index(self, **kw):
        res = super(FeriaVirtual, self).index()
        """ Obtener el token enviado por la cabecera de la aplicación y poder identificar el evento actual """
        token = request.httprequest.headers.get('X-Event')
        obj_host = request.env['virtual.host.redirection'].search([('name', '=', token)], limit=1)
        if obj_host:
            return werkzeug.utils.redirect('/evento/%s' % obj_host.event_id.id)
        else:
            return res
            # TODO: @edilio Esto se comentareo porque no se usara la pagina web de la plataforma
            # template_plataforma_virtual = request.env.ref('df_website_front.plataforma_virtual_homepage')
            # return template_plataforma_virtual._render()

    @http.route('/evento/<int:event_id>/exhibitor_pre_sign_in', type='http', auth='public', website=True)
    def exhibitor_pre_sign_in(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        datas = event.get_datas_aux()
        datas['event'] = event
        datas['error'] = ''
        datas['sponsors'] = event.get_sponsor_by_event()
        datas['data_count_nav'] = event.get_counts_event()
        datas['title'] = event.name
        datas['no_is_home'] = True
        datas['sponsor_types'] = request.env['event.sponsor.type'].search([], order='sequence')
        return http.request.render('df_website_front.exhibitor_pre_sign_in', datas)

    @http.route('/evento/<int:event_id>/type_visitor_pre_sign_in', type='http', auth='public',
                website=True)
    def type_visitor_pre_sign_in(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        data_count_nav = event.get_counts_event()
        return http.request.render('df_website_front.type_visitor_pre_sign_in',
                                   {'event': event, 'no_is_home': True,
                                    'data_count_nav': data_count_nav,
                                    'title': event.name})

    @http.route('/evento/<int:event_id>/business_visitor_pre_sign_in', type='http', auth='public',
                website=True)
    def business_visitor_pre_sign_in(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        datas = event.get_datas_aux()
        datas['event'] = event
        datas['sponsors'] = event.get_sponsor_by_event()
        datas['data_count_nav'] = event.get_counts_event()
        datas['title'] = event.name
        datas['no_is_home'] = True
        return http.request.render('df_website_front.business_visitor_pre_sign_in', datas)

    @http.route('/evento/<int:event_id>/person_visitor_pre_sign_in', type='http', auth='public',
                website=True)
    def person_visitor_pre_sign_in(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        datas = event.get_datas_aux('person_visitor')
        datas['event'] = event
        datas['sponsors'] = event.get_sponsor_by_event()
        datas['data_count_nav'] = event.get_counts_event()
        datas['title'] = event.name
        datas['no_is_home'] = True
        return http.request.render('df_website_front.person_visitor_pre_sign_in', datas)

    @http.route('/user_sign_in', type='http', auth='public', website=True)
    def user_sign_in(self, **kw):
        return http.request.render('df_website_front.user_sign_in')

    @http.route('/province_by_country', type='json', auth='public', website=True)
    def province_by_country(self, **kw):
        provinces = []
        provinces_vals = request.env['res.country.state'].sudo().search(
            [('country_id', '=', int(kw.get('country_id')))])
        for prov in provinces_vals:
            provinces.append({
                'id': prov.id,
                'name': prov.name
            })
        return provinces

    @http.route('/municipality_by_province', type='json', auth='public', website=True)
    def municipality_by_province(self, **kw):
        municipalitys = []
        municipality_vals = request.env['df.municipality'].sudo().search(
            [('state_id', '=', int(kw.get('state_id')))])
        for prov in municipality_vals:
            municipalitys.append({
                'id': prov.id,
                'name': prov.name
            })
        return municipalitys

    @http.route('/type_inst_by_country', type='json', auth='public', website=True)
    def type_inst_by_country(self, country_id):
        types_insts = []
        types_inst_vals = request.env['df_base.type.institution'].sudo().search([]) \
            .mapped('type_institution_nit_ids').filtered(lambda ti: ti.country_id.id == int(country_id))
        for inst in types_inst_vals:
            types_insts.append({
                'id': inst.type_institution_id.id,
                'name': inst.type_institution_id.name,
                'use_nit': inst.use_nit,
                'code': inst.type_institution_id.code
            })
        return json.dumps(types_insts)

    @http.route('/activities_by_sector', type='json', auth='public', website=True)
    def activities_by_sector(self, **kw):
        activities, domain = [], []
        if 'sector_id' in kw and kw.get('sector_id') != 'false':
            domain = [('sector_id', '=', int(kw.get('sector_id')))]
        activities_vals = request.env['df_base.economic.activity'].sudo().search(domain)
        for actv in activities_vals:
            activities.append({
                'id': actv.id,
                'name': actv.name
            })
        return activities

    @http.route('/get_activity_by_industry', type='json', auth='public', website=True)
    def get_activity_by_industry(self, **kw):
        activities = []
        domain = [('sector_id', '=', False)]
        #  and 'sector_id' in kw
        if 'code_free_employed' not in kw and kw.get('industry_id') != 'false':
            domain = [('sector_id', '=', int(kw.get('industry_id')))]
        activities_vals = request.env['df_base.economic.activity'].sudo().search(domain)
        for actv in activities_vals:
            activities.append({
                'id': actv.id,
                'name': actv.name
            })
        return activities

    @http.route('/reeup_by_type_institution', type='json', auth='public', website=True)
    def get_reeup_by_type_institution(self, **kw):
        partnerts_reeup = request.env['res.partner'].get_partner_reeup(int(kw.get('type_institution_id')))
        return partnerts_reeup

    @http.route(['/evento/my/download'], type='http', auth='public')
    def event_download_attachment(self, attachment_id):
        # Check if this is a valid attachment id
        attachment = request.env['ir.attachment'].sudo().search_read(
            [('id', '=', int(attachment_id))],
            ["name", "datas", "mimetype", "res_model", "res_id", "type", "url"]
        )

        if attachment:
            attachment = attachment[0]
        else:
            return None

        # The client has bought the product, otherwise it would have been blocked by now
        if attachment["type"] == "url":
            if attachment["url"]:
                return redirect(attachment["url"])
            else:
                return request.not_found()
        elif attachment["datas"]:
            data = io.BytesIO(base64.standard_b64decode(attachment["datas"]))
            # we follow what is done in ir_http's binary_content for the extension management
            extension = os.path.splitext(attachment["name"] or '')[1]
            extension = extension if extension else mimetypes.guess_extension(attachment["mimetype"] or '')
            filename = attachment['name']
            filename = filename if os.path.splitext(filename)[1] else filename + extension
            return http.send_file(data, filename=filename, as_attachment=True)
        else:
            return request.not_found()

    @http.route('/get_payment_acquires', type='http', auth='public', website=True, csrf=False)
    def get_payment_acquires(self):
        payment_acquires = []
        payment_acquires_aux = request.env['payment.acquirer'].sudo().search([('state', '=', 'enabled')])
        for pac in payment_acquires_aux:
            payment_acquires.append({
                'id': pac.id,
                'name': pac.name,
                'provider': pac.provider,
                'image': pac.image_128.decode('utf-8') if pac.image_128 else '',
                'qr_code': pac.qr_code,
                'pending_msg': pac.pending_msg,
                'journal_id': pac.journal_id.id,
                'url': pac.stripe_image_url if pac.stripe_image_url else '#'
            })
        return json.dumps(payment_acquires)

    @http.route('/evento/<int:event_id>/tickets_by_type_p', type='http', auth='public', website=True, csrf=False)
    def tickets_by_type_p(self, event_id, **post):
        tickets = []
        if post.get('event_id_selected', False):
            event = request.env['event.event'].sudo().browse(int(post.get('event_id_selected', False)))
            if event:
                tickets = request.env['event.event.ticket'].get_tickets_pricelist(event, post)
        return json.dumps(tickets)

    @http.route('/evento/<int:event_id>/templates_attendee', type='http', auth='public', website=True, csrf=False)
    def get_templates_by_type_attendee(self, event_id, **post):
        templates = []
        """ La moneda ya no se tiene en cuenta porque si es GRATIS el evento no se necsita la moneda, aunque en el formulario 
                   si se coloca como obligatoria and post.get('currency_id', False) """
        if event_id and post.get('ticket_id', False):
            event = request.env['event.event'].sudo().browse(event_id)
            templates = event.get_templates_by_attendee(post)
        return json.dumps(templates)

    @http.route('/evento/<int:event_id>/get_currency_by_country', type='http', auth='public', website=True, csrf=False)
    def get_currency_by_country(self, event_id, **post):
        templates, currency_ids = [], []
        if event_id and post.get('country_id', False):
            event = request.env['event.event'].sudo().browse(event_id)
            currency_ids = request.env['res.currency'].sudo().get_currency_by_pricelist(event,
                                                                                        int(post.get('country_id')))
        return json.dumps(currency_ids)

    @http.route('/evento/<int:event_id>/tickets_acre', type='http', auth='public', website=True, csrf=False)
    def tickets_acre(self, event_id, **post):
        tickets = []
        if event_id:
            event = request.env['event.event'].sudo().browse(event_id)
            tickets = request.env['event.event.ticket'].get_tickets_acreditted_speaker(event)
        return json.dumps(tickets)

    @http.route('/evento/<int:event_id>/tickets_speaker', type='http', auth='public', website=True, csrf=False)
    def tickets_speaker(self, event_id, **post):
        tickets = []
        if event_id:
            event = request.env['event.event'].sudo().browse(event_id)
            tickets = request.env['event.event.ticket'].get_tickets_acreditted_speaker(event, vals_searh='speaker')
        return json.dumps(tickets)

    @http.route('/evento/<int:event_id>/tracks_location', type='http', auth='public', website=True, csrf=False)
    def tracks_by_location(self, event_id, **post):
        tracks = []
        if event_id:
            event = request.env['event.event'].sudo().browse(event_id)
            location_id = post.get('location_id', False)
            if event and location_id:
                tracks = request.env['event.track'].sudo().tracks_by_location(event, location_id)
        return json.dumps(tracks)

    @http.route('/evento/<int:event_id>/presentation', type='http', auth='public', website=True, csrf=False)
    def get_presentation(self, event_id, **post):
        datas = []
        if event_id:
            event = request.env['event.event'].sudo().browse(event_id)
            if event:
                datas = event.get_types_thematics()
        return json.dumps(datas)

    """ Listando los eventos los cuales el usuario actual tenga un área asignada, ya que en cada área es que se 
        registran los acreditados """

    @http.route('/all_events', type='http', auth='public', website=True, csrf=False)
    def all_events(self, **post):
        events = []
        events_aux = request.env['df_event_virtual_fair.area'].search(
            [('partner_id', '=', request.env.user.partner_id.id)]).mapped('event_id')
        for evt in events_aux:
            events.append({
                'id': evt.id,
                'name': evt.name
            })
        return json.dumps(events)

    @http.route('/image_partner', type='json', auth='public', website=True)
    def image_partner(self, **kw):
        partner_id = request.env['res.partner'].browse(int(kw.get('partner_id')))
        return {
            'image': partner_id.image_1920.decode('utf-8')
        }

    @http.route('/counts', type='json', auth='public', website=True)
    def counts_home(self, **kw):
        values = {'success': False}
        if kw.get('event_id', False):
            event_id = request.env['event.event'].sudo().browse(int(kw.get('event_id')))
            if event_id:
                values.update({
                    'success': True,
                    'sessions': event_id.get_count_conferences_by_event(),
                    'attendees': event_id.get_count_exhibitor_vistor_by_event(),
                    'countrys': event_id.get_count_countrys(),
                })
        return values
