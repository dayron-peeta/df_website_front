# -*- coding: utf-8 -*-
# Part of Odoo. See LICENSE file for full copyright and licensing details.
from odoo import fields, models


class Partner(models.Model):
    _inherit = 'res.partner'

    theme_tag_id = fields.Many2one('df_event_virtual_fair.theme.tag', string="Theme tag")
    theme_tag_ids = fields.Many2many('df_event_virtual_fair.theme.tag', column1='partner_id',
                                     column2='theme_tag_id', string="Theme tag")

    participation_objective_ids = fields.Many2many("df_event_virtual_fair.participation.objective",
                                                   "participation_objective_partner_rel", "partner_id",
                                                   "participation_objective_id")
