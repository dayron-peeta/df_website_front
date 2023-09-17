# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.

from odoo import api, fields, models, _


class EventRegistration(models.Model):
    _inherit = 'event.registration'

    type_attendees = fields.Selection(
        selection='_get_type_attendees',
        validate=False,
        string='Type attendee')

    @api.model
    def _get_type_attendees(self):
        return self.env['type.attendee.registration'].get_installed()
