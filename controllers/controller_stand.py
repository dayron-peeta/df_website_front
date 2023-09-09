# -*- coding: utf-8 -*-
import base64, json, werkzeug

from odoo import http
from odoo.http import request
from werkzeug.exceptions import Forbidden


class WebsiteStandController(http.Controller):

    @http.route('/evento/<int:event_id>/stand_profile', type='http', auth='user', website=True)
    def stand_profile(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        area_id = request.env.user.stand_by_user(event_id)
        # Validando el acceso a la página
        template_current = 'df_website_front.stand_profile'
        # Verificando si es dueño del stand y tiene el permiso correspondiente a la plantilla del stand,
        # que muestre un acceso prohibido
        if not request.env['ir.ui.view'].validate_user_groups_view(event, template_current) \
                and not request.env.user.partner_id.validate_partner_area(area_id, request.env.user.partner_id):
            return werkzeug.exceptions.Forbidden()
        datas_aux = event.get_datas_aux()
        datas_aux['area_id'] = request.env.user.stand_by_user(event.id)
        # Verificando que tengas areas, sino se lanza un error de acceso
        if datas_aux.get('area_id', False):
            datas = event.get_datas_stand(datas_aux, event)
            datas['present_stand'] = request.env.user.present_stand_user(False, event.id)
            datas['no_is_home'] = True
            datas['pendons'] = datas_aux['area_id'].get_pendons()
            datas['current_template_id'] = datas_aux['area_id'].template_id
            return http.request.render('df_website_front.stand_profile', datas)
        else:
            return werkzeug.exceptions.Forbidden()

    @http.route('/evento/<int:event_id>/save_stand_profile', type='http', auth='user', website=True)
    def save_stand_profile(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        result = {}
        if not kw.get('current_area_id', False) and kw.get('action_id', False) and int(kw['action_id']) > 1:
            result = event.create_stand(kw)
        else:
            if kw.get('action_id', False) and int(kw['action_id']) > 1:
                result = event.create_update_pendon_stand(kw, update_area=True)
            if not result.get('error', False):
                result = request.env.user.partner_id.parent_id.update_inst_data(kw)
                result['area_id'] = kw.get('current_area_id', False)

        return json.dumps(result)

    @http.route('/evento/<int:event_id>/add_resource_stand', type='http', auth='user', website=True)
    def add_resource_stand(self, event_id, **kw):
        kw['event_id'] = event_id
        obj_area = request.env['df_event_virtual_fair.area']
        current_area = False
        if kw.get('current_area_id', False):
            current_area = int(kw.get('current_area_id'))
        area_id = obj_area.get_area_by_user(current_area_id=current_area,event_id=event_id)
        if area_id:
            try:
                result = area_id.create_edit_resource_stand(kw)
                return json.dumps(result)
            except Exception as ex:
                return json.dumps({'error': True, 'message': str(ex)})
        else:
            return json.dumps({'error': True, 'message': 18})

    @http.route('/evento/<int:event_id>/edit_resource_stand', type='http', auth='user', website=True)
    def edit_resource_stand(self, event_id, **kw):
        if 'current_area_id' in kw and kw['current_area_id'] != '':
            kw['edit'] = True
            kw['event_id'] = event_id
            area_id = request.env['df_event_virtual_fair.area'].sudo().browse(int(kw['current_area_id']))
            area_id.create_edit_resource_stand(kw)
            return json.dumps({'success': True, 'message': 10})
        else:
            return json.dumps({'error': True, 'message': 18})

    @http.route('/evento/<int:event_id>/remove_resource_stand', type='http', auth='user', website=True, csrf=False)
    def remove_resource_stand(self, **kw):
        try:
            if kw.get('id', False) and kw.get('action', False):
                if int(kw['action']) not in [7, 8]:
                    request.env['ir.attachment'].sudo().browse(int(kw['id'])).unlink()
                elif int(kw['action']) == 7:
                    area_product_id = request.env['df_event_virtual_fair.area.product'].sudo().browse(int(kw['id']))
                    if area_product_id:
                        request.env['df_event_virtual_fair.area.product'].delete_resource_product(area_product_id)

                elif int(kw['action']) == 8:
                    # request.env['event.registration'].sudo().browse(int(kw['id'])).mapped('user_id').sudo().write(
                    #     {'active': False})
                    request.env['event.registration'].sudo().browse(int(kw['id'])).write(
                        {'area_id': None, 'type_attendees': ''})
            return json.dumps({'success': True, 'message': 17, 'data': kw['id']})
        except Exception as e:
            return json.dumps({'error': True, 'message': 56})

    @http.route('/evento/<int:event_id>/get_resource_stand', type='http', auth='user', website=True, csrf=False)
    def get_resource_stand(self, event_id, **kw):
        result = {}
        kw['event_id'] = event_id
        obj_area = request.env['df_event_virtual_fair.area']
        if obj_area.get_area_by_user():
            area_id = obj_area.get_area_by_user()
            result = area_id.get_resource_stand(kw)
        return json.dumps(result)

    @http.route('/evento/<int:event_id>/select_product', type='http', auth='user', website=True, csrf=False)
    def select_product(self, event_id, **kw):
        obj_area = request.env['df_event_virtual_fair.area']
        result = {}
        if obj_area.get_area_by_user():
            area_id = obj_area.get_area_by_user()
            result = area_id.get_products_by_partner()
        return json.dumps(result)

    @http.route('/evento/<int:event_id>/event_date', type='http', auth='public', website=True, csrf=False)
    def event_date(self, event_id):
        event = request.env['event.event'].sudo().browse(event_id)
        dates = event.get_event_date()
        return json.dumps({'success': True, 'data': dates})

    @http.route('/evento/<int:event_id>/send_date_event', type='http', auth='public', website=True)
    def send_date_event(self, event_id, **post):
        if post.get('current_area_id', False) and post['current_area_id'] != '':
            area_id = request.env['df_event_virtual_fair.area'].sudo().search(
                [('id', '=', int(post['current_area_id'])), ('event_id', '=', event_id)])
            result = area_id.create_date_event(post)
            return json.dumps(result)

    @http.route('/evento/<int:event_id>/refresh_chat_stand_event', type='http', auth='user', website=True, csrf=False)
    def refresh_chat_stand_event(self, event_id, area_id, **post):
        messages = {'error': True, 'message': 29}
        if 'current_area_id' in post and post['current_area_id'] != '':
            event_area = request.env['df_event_virtual_fair.area'].browse(int(post['current_area_id']))
            messages = event_area.get_message_by_stand()
        return json.dumps(messages)

    @http.route('/evento/<int:event_id>/information_stand', type='http', auth='user', website=True, csrf=False)
    def information_stand(self, event_id, **kw):
        event = request.env['event.event'].sudo().browse(event_id)
        description_area = ''
        if event and kw.get('area_id', False):
            area_id = request.env['df_event_virtual_fair.area'].sudo().browse(int(kw['area_id']))
            if area_id:
                description_area = area_id.description
        return json.dumps({
            'description': description_area,
            'success': True
        })

    @http.route('/evento/<int:event_id>/information_stand_statistic', type='http', auth='user', website=True,
                csrf=False)
    def information_stand_statistic(self, event_id, **kw):
        event, statistics = request.env['event.event'].sudo().browse(event_id), []
        if event and kw.get('area_id', False):
            statistics = request.env['df_event_virtual_fair.area'].sudo().get_statistics_stand(
                area_id=int(kw.get('area_id')))
        return json.dumps({
            'statistics': statistics,
            'success': True
        })
