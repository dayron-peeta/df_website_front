from odoo import http, _
from odoo.addons.portal.controllers.portal import CustomerPortal
from odoo.http import content_disposition, Controller, request, route


class PortalFair(CustomerPortal):

    @route(['/my', '/my/home'], type='http', auth="user", website=True)
    def home(self, **kw):
        token = request.httprequest.headers.get('X-Event')
        obj_host = request.env['virtual.host.redirection'].search([('name', '=', token)], limit=1)
        if obj_host:
            return request.redirect('/evento/%s/%s/user_profile' % (obj_host.event_id.id, request.env.user.id))
        else:
            return request.redirect('/%s/user_profile' % request.env.user.id)
