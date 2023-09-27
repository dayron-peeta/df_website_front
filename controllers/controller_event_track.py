import json, base64, io
import PIL.Image as Image
from odoo import http
from odoo.http import request
from werkzeug.exceptions import NotFound
from odoo.addons.website_event_track.controllers.event_track import EventTrackController


class EventTrackControllerInherit(EventTrackController):

    @http.route(['''/evento/<int:event_id>/track_proposal'''], type='http', auth="public", website=True,
                sitemap=False)
    def evento_track_proposal(self, event_id, **post):
        event = request.env['event.event'].sudo().browse(event_id)
        data_count_nav = event.get_counts_event()
        if not event.can_access_from_current_website():
            raise NotFound()
        theme_tags = request.env['df_event_virtual_fair.theme.tag'].sudo().search([], order='name')
        countrys = request.env['res.country'].sudo().search([('is_blacklist', '!=', True)], order='name')
        event_type_tracks_ids = request.env['event.track.type'].sudo().search([('event_id', '=', event_id)],
                                                                              order='name')
        return request.render("df_website_front.custom_event_track_proposal",
                              {'event': event, 'main_object': event, 'theme_tags': theme_tags, 'countrys': countrys,
                               'data_count_nav': data_count_nav, 'event_type_tracks_ids': event_type_tracks_ids,
                               'no_is_home': True})

    @http.route(['''/evento/<int:event_id>/track_proposal/post_ajax'''], type='http', auth="public",
                methods=['POST'], website=True)
    def event_track_proposal_post_ajax(self, event_id, **post):
        event = request.env['event.event'].sudo().browse(event_id)
        if not event.can_access_from_current_website():
            raise NotFound()
        track_obj = request.env['event.track']
        post['event'] = event
        result = track_obj.create_event_track(post, event)
        if result.get('error', False):
            return json.dumps(result)
        return json.dumps({'success': True})

    @http.route(['''/evento/<int:event_id>/event_track'''], type='http', auth="public", website=True,
                csrf=False)
    def get_event_track(self, event_id=None, **post):
        tracks = {}
        if post.get('elem_id', False):
            tracks = request.env['event.track'].sudo().browse(int(post['elem_id'])).get_speaker_json()
        return json.dumps(tracks)

    @http.route(['/evento/<int:event_id>/edit_track', '/evento/edit_track'], type='http', auth="public", website=True,
                csrf=False)
    def edit_track(self, event_id=None, **post):
        if post.get('elem_id', False):
            track_id = request.env['event.track'].sudo().browse(int(post['elem_id']))
            elem_update = {}
            if track_id:
                elem_update.update({
                    'name': post.get('track_name', False),
                    'video_track_url': post.get('track_video', False),
                    'description': post.get('description', False),
                    'event_track_type_id': post.get('track_type_id', False)
                })
            if post.get('thematic_all', False):
                thematic = [int(t) for t in post['thematic_all'].split(',')]
                elem_update['theme_tag_ids'] = [(6, 0, thematic)]

            if post.get('event-list_all', False):
                event = [int(t) for t in post['event-list_all'].split(',')]
                elem_update['event_id'] = event[0]

            if post.get('presentation_all', False):
                presentation = [int(t) for t in post['presentation_all'].split(',')]
                elem_update['event_track_type_id'] = [(6, 0, presentation)]

            track_id.sudo().write(elem_update)
            # 'data': {'id': int(post['elem_id']), 'name': post['track_name']}
        return json.dumps(
            {'success': True, 'message': 10})

    @http.route(['/evento/<int:event_id>/save_doc_track', '/evento/save_doc_track'], type='http', auth="public",
                website=True)
    def save_doc_track(self, event_id=None, **post):
        result = {}
        # if post.get('track_id', False) and post['track_id'] != '':
        result = request.env['event.track'].browse(int(post['track_id'])).sudo().crete_edit_doc_track(post)

        return json.dumps({'success': True, 'message': 10, 'data': result})

    @http.route('/evento/<int:event_id>/get_resource_presentation', type='http', auth='user', website=True, csrf=False)
    def get_resource_presentation(self, event_id, **kw):
        result = {}
        if kw.get('track_id', False) and kw['track_id'] != '':
            result = request.env['event.track'].sudo().browse(int(kw['track_id'])).get_resorces_by_track()
        return json.dumps(result)

    @http.route('/evento/<int:event_id>/remove_resource_present', type='http', auth='user', website=True, csrf=False)
    def remove_resource_present(self, **kw):
        el_id = 0
        if kw.get('elem_id', False) and kw['elem_id'] != '':
            request.env['ir.attachment'].sudo().browse(int(kw['elem_id'])).unlink()
            el_id = int(kw['elem_id'])
        return json.dumps({'success': True, 'message': 17, 'data': el_id})

    @http.route('''/evento/<int:event_id>/document_track/<int:attachment_id>''', type='http', auth='public', csrf=False)
    def show_document_track(self, event_id, attachment_id):
        if event_id and attachment_id:
            attachment = request.env['ir.attachment'].sudo().browse(attachment_id)
            if attachment.index_content != 'image':
                pdf = base64.decodebytes(attachment.datas)
                pdfhttpheaders = [('Content-Type', 'application/pdf'), ('Content-Length', len(pdf))]
                return request.make_response(pdf, headers=pdfhttpheaders)
            else:
                return attachment.datas.decode("utf-8")
        return False

        # Pagina para mostrar documents/presentations

    @http.route('/documents_presentations', type='http', auth='public', website=True)
    def show_documents_presentations(self, **kw):
        Event = request.env['event.event'].sudo()
        track_ids = request.env['event.track.speaker'].sudo().search([
            ('partner_id', '=', request.env.user.partner_id.id)
        ]).mapped('event_track_ids')
        event_track_type_ids = request.env['event.track.type'].sudo().search([])
        theme_tag_ids = request.env['df_event_virtual_fair.theme.tag'].sudo().search([])

        """ Listando los estados en los cuales los tipos son is_done o is_accepted """
        state_published = Event.get_state_is_accepted()
        state_published.extend(Event.get_state_is_done())
        state_published.extend(Event.get_state_is_cancel())

        datas = {}
        datas['type_presentations'] = event_track_type_ids
        datas['thematic'] = theme_tag_ids

        return http.request.render('df_website_front.documents_presentations', {
            'tracks': track_ids,
            'track_states': list(set(state_published))
        })

        # Pagina para editar documents/presentations

    @http.route(['/info_documents_presentations', '/<int:track_id>/info_documents_presentations' ], type='http', auth='public', website=True)
    def show_info_documents_presentations(self, track_id=None, **kw):
        datas = {}
        if track_id:
            EventTrack = request.env['event.track'].sudo()
            datas = {}
            event_track_id = EventTrack.browse(track_id)

            event_ids = request.env['event.event'].sudo().search([])
            theme_tag_ids = request.env['df_event_virtual_fair.theme.tag'].sudo().search([])
            track_type_ids = request.env['event.track.type'].sudo().search([])
            location_ids = request.env['event.track.location'].sudo().search([])

            if event_track_id:
                datas['event_track_id'] = event_track_id
                datas['session_name'] = event_track_id.name
                datas['session_duration'] = event_track_id.duration
                datas['session_date_and_time'] = event_track_id.date
                datas['event'] = event_track_id.event_id
                datas['presentation'] = event_track_id.event_track_type_id
                datas['text_description'] = event_track_id.description_short
                datas['events_track'] = event_ids
                datas['concurrent_event'] = event_track_id.event_id
                datas['locations'] = location_ids
                datas['concurrent_location'] = event_track_id.location_id
                datas['thematics'] = theme_tag_ids
                datas['concurrent_thematic'] = event_track_id.theme_tag_ids
                datas['type_presentations'] = track_type_ids
                datas['track_id'] = track_id

            else:
                datas['event_track_id'] = None
                datas['session_name'] = None
                datas['session_duration'] = None
                datas['session_date_and_time'] = None
                datas['event'] = None
                datas['presentation'] = None
                datas['text_description'] = None
                datas['events_track'] = None
                datas['concurrent_event'] = None
                datas['locations'] = None
                datas['concurrent_location'] = None
                datas['thematics'] = None
                datas['concurrent_thematic'] = None
                datas['type_presentations'] = None
                datas['track_id'] = None
        return http.request.render('df_website_front.info_documents_presentations', datas)


    @http.route(['''/evento/event_registrations'''], type='http', auth="public", website=True,csrf=False)
    def get_event_track(self, event_id, **post):
          tracks = {}
          if post.get('elem_id', False):
             registrations = request.env['event.registration'].sudo().search([('partner_id', '=', request.env.user.partner_id.id)]).browse(int(post['elem_id'])).get_speaker_json()
          return json.dumps(tracks)
    
    @http.route(['/evento/edit_status_registrations'], type='http', auth="public", website=True,
                csrf=False)
    def edit_status_registrations(self, event_id=None, **post):
        if post.get('elem_id', False):
            registrations = request.env['event.registration'].sudo().search([('partner_id', '=', request.env.user.partner_id.id)]).browse(int(post['elem_id'])).get_speaker_json()
            elem_update = {}
            if registrations:
                if registrations.status == 'Cancel':
                    statusRegistrations = 'draft'
                else:
                    statusRegistrations = 'cancel'   
                    
                elem_update.update({
                    'name': statusRegistrations,
                })
            registrations.sudo().write(elem_update)
        return json.dumps(
            {'success': True, 'message': 10})
