# -*- coding: utf-8 -*-
import base64
from odoo import api, fields, models, _
from odoo.exceptions import ValidationError
from odoo.addons.auth_signup.models.res_partner import random_token
from datetime import datetime


class EventRegistration(models.Model):
    _inherit = 'event.registration'

    def _domain_partner_id(self):
        return [('is_blacklist', '=', False), ('id', 'in', self.env['res.users'].search([]).mapped('partner_id').ids)]

    partner_id = fields.Many2one(domain=_domain_partner_id, required=False)
    # partner_gender = fields.Selection([
    #     ('male', 'Male'),
    #     ('feminine', 'Feminine')
    # ], string='Gender',related='partner_id.gender')
    # partner_number_identification = fields.Char(string="CI/Passport",related='partner_id.number_identification')

    parent_name = fields.Char(related='partner_id.parent_id.name', string=_("Company"), store=True)

    country_id = fields.Many2one(
        'res.country',
        related='partner_id.country_id',
        string='Country',
        readonly=True,
        store=True
    )

    # state = fields.Selection(selection_add=[('approved', 'Approved')])

    state = fields.Selection(selection_add=[
        ('draft', 'Unconfirmed'), ('cancel', 'Cancelled'),
        ('open', 'Confirmed'), ('approved', 'Approved'), ('done', 'Attended')],
        string='Status', default='draft', readonly=True, copy=False, tracking=True)

    user_id = fields.Many2one('res.users')

    event_ticket_type_a_code = fields.Char(related='event_ticket_id.type_attendee_registration_id.code')

    category_scientific_id = fields.Many2one('res.partner.title', string="Scientific category",
                                             related="partner_id.category_scientific_id")
    category_educational_id = fields.Many2one('res.partner.title', string="Teaching category",
                                              related="partner_id.category_educational_id")
    category_investigative_id = fields.Many2one('res.partner.title', string="Investigative category",
                                                related="partner_id.category_investigative_id")
    specialty_type_id = fields.Many2one('df_event_virtual_fair.specialty.type', string="Specialty type")
    specialty = fields.Char(related="partner_id.specialty")

    generate_attendee_ids = fields.Many2many("df_event_virtual_fair.generate.attendee",
                                             "df_event_virtual_fair_generate_attendee_event_registration_rel",
                                             "event_registration_id", "generate_attendee_id", string="Attendees",
                                             required=True)
    ci_passport = fields.Char(related="partner_id.ci_passport")

    @api.depends('partner_id', 'partner_id.type_institution_compute')
    def _compute_type_institucion(self):
        for rec in self:
            if rec.partner_id and rec.partner_id.type_institution_compute:
                rec.type_institution = rec.partner_id.type_institution_compute

    type_institution = fields.Char(string="Type of institution", compute=_compute_type_institucion, store=True)

    def action_approved_registration(self):
        # Verificando que el attendee tenga un ticket asociado
        if self.event_ticket_id:
            # Creating the user and sending invitation link
            # and 'speaker' not in self.event_ticket_id.type_attendee_registration_id.code
            if self.user_id:
                self.user_id.active = True
                self.user_id.with_context(create_user=True, import_file=True, virtual_fair=True,
                                          event_registration_id=self.id).sudo().action_reset_password()
                self.state = 'approved'
            # Si es una compañia se aprueba solamente el attendee
            elif self.partner_id.is_company:
                self.state = 'approved'
            # Si es un speaker
            elif 'speaker' in self.event_ticket_id.type_attendee_registration_id.code:
                # Verificando que el attendee tenga partner asociado
                if self.partner_id:
                    # Obteniendo speaker dado el attendee
                    speaker_id = self.env['event.track.speaker'].sudo().search(
                        [('partner_id.id', '=', self.partner_id.id)])
                    state_published = self.env['event.event'].sudo().get_state_is_accepted()
                    state_published.extend(self.env['event.event'].sudo().get_state_is_done())
                    self.state = 'approved'
                    # Aprobando usuario que no ha sido activado y previamente creado
                    if not speaker_id.user_id.active:
                        speaker_id.user_id.active = True
        else:
            raise ValidationError(
                _('Participant %s must have an associated ticket.') % self.partner_id.name)

    def action_confirm(self):
        # Verificando que el attendee tenga un ticket asociado
        if self.event_ticket_id:
            if self.user_id:
                # Activando el usuario
                self.user_id.active = True
                self.partner_id.signup_token = random_token()
                self.partner_id.signup_url = self.partner_id.sudo().with_context(
                    signup_force_type_in_url='reset')._get_signup_url_for_action()[self.partner_id.id]

                self.user_id.with_context(send_email_cert_confirm=True, create_user=True, import_file=True,
                                          virtual_fair=True,
                                          event_registration_id=self.id).sudo().action_reset_password()
        else:
            raise ValidationError(
                _('Participant %s must have an associated ticket.') % self.partner_id.name)
        res = super(EventRegistration, self).action_confirm()
        return res

    def action_cancel(self):
        super(EventRegistration, self).action_cancel()
        template = self.env.ref('df_event_virtual_fair.event_cancel_registration_attendees')
        self.send_emails(template)

    def send_emails(self, template):
        ICP = self.env['ir.config_parameter'].sudo()
        template.with_context(base_url=ICP.get_param('web.base.url')).sudo().send_mail(self.id, force_send=False)

    def create_user_by_attendee(self, vals, active_user=False):
        user_sudo = self.env['res.users'].sudo()
        # Verificando si el usuario existe con el email enviado
        user_aux_id = user_sudo.search([('login', '=', vals['email'])])
        # sino existe usuario se crea
        if not user_aux_id:
            user_create = {
                'login': vals['email'],
                'name': vals['name'],
                'email': vals['email'],
                'active': active_user,
                'type': 'private',
                'groups_id': [(6, 0, [self.env.ref('base.group_public').id])]
            }
            user_id = user_sudo.create(user_create)
            return user_id
        else:
            return False

    """ Este método se sobreescribe ya que con la adición múltiple de eventos en el formulario de registro, 
        lanzaba una excepción de validación la cual era correcta, pero no aplica en este caso """

    @api.constrains('event_id', 'event_ticket_id')
    def _check_event_ticket(self):
        return True

    @api.model
    def create(self, vals_list):
        context = self.env.context.copy()
        # Sino se selecciono partner al attendee
        if not vals_list['partner_id'] and context.get('copy_attendee', False) is False:
            # Se crea un usuario para el email escrito
            user_id = self.create_user_by_attendee(vals_list)
            # Verificar si existe el usuario se le asocia al attendee
            if user_id:
                vals_list['partner_id'] = user_id.partner_id.id
                vals_list['user_id'] = user_id.id
        # Sino existe un pricelist configurado para el producto, mostrar el público
        if not vals_list.get('pricelist_id', False):
            vals_list['pricelist_id'] = self.env.ref('product.list0').id
        if vals_list.get('user_id', False) is False:
            partner_id = self.env['res.partner'].sudo().browse(vals_list['partner_id'])
            user_aux_id = self.env['res.users'].sudo().search([
                ('login', '=', partner_id.email),
                ('active', '=', False)
            ])
            vals_list['user_id'] = user_aux_id.id
        result = super(EventRegistration, self).create(vals_list)
        # Setear el usuario del partner en caso de que exista y no este configurado en el attendee
        if not result.user_id and result.partner_id:
            user_id = result.partner_id.get_user_by_partner(result.partner_id, True)
            if user_id and result.partner_id:
                result.user_id = user_id.id
            # Setear el tipo de institución en caso de que sea un attendee con una entidad asociada
        if result.partner_id.parent_id and result.partner_id.parent_id.type_institution_id:
            result.type_institution = result.partner_id.parent_id.type_institution_id.name
        else:
            result.type_institution = _('Empty')

        # Si se envia un estado especifico, ese es el que tomara el attendee
        if context.get('copy_state', False):
            result.state = context.get('copy_state')

        return result

    def verify_attendee(self, event, partner_id):
        return self.search([('event_id', '=', event.id), ('partner_id', '=', partner_id.id)])

    def insert_area(self, values, partner_id_ind, event, ticket):
        sponsor, exhibitor, visitor, speaker = False, False, False, False
        if ticket.type_attendee_registration_id:
            sponsor = True if 'sponsor' in ticket.type_attendee_registration_id.code else False,
            exhibitor = True if 'exhibitor' in ticket.type_attendee_registration_id.code else False,
            visitor = True if 'visitor' in ticket.type_attendee_registration_id.code else False,
            speaker = True if 'speaker' in ticket.type_attendee_registration_id.code else False
        area_id = self.env['df_event_virtual_fair.area'].search(
            [('partner_id', '=', partner_id_ind.id), ('event_id', '=', event.id)])
        if not area_id:
            # Creando un area
            area_data = {
                'name': partner_id_ind.name,
                'partner_id': partner_id_ind.id,
                'event_id': event.id
            }
            # Creando un área de tipo general para los participantes naturales
            if values.get('registration_mode', False) == 'registration_mode_personal' and exhibitor is False:
                area_data['template_id'] = self.env.ref('df_event_virtual_fair.template_area_general').id
                area_data['area_type_id'] = self.env.ref('df_event_virtual_fair.type_area_4').id
                # Creando un área de tipo stand para los casos que sea un expositor o patrocinador el ticket
            elif sponsor or exhibitor or visitor:
                # Obteniendo los templates, plan o variación dependiendo del ticket seleccionado, y seteando el primero
                template_ids = event.get_templates_by_ticket(ticket)
                if template_ids:
                    area_data['template_id'] = template_ids[0].id
                    plan_datas = event.get_plan_variation_by_template_id(template_ids[0].id)
                    if plan_datas:
                        area_data['plan_id'] = plan_datas['plan_id'].id if plan_datas.get('plan_id', False) else False
                        area_data['event_plan_line_id'] = plan_datas['plan_variation_id'].id if plan_datas.get(
                            'plan_variation_id', False) else False
                    area_data['area_type_id'] = self.env.ref('df_event_virtual_fair.type_area_3').id
                    # Sino tiene template asociado para el type_attendee del ticket y es de un tipo visitor o speaker
                elif not template_ids and (visitor or speaker):
                    area_data['template_id'] = self.env.ref('df_event_virtual_fair.template_area_general').id
                    area_data['area_type_id'] = self.env.ref('df_event_virtual_fair.type_area_4').id
            if area_data.get('template_id', False) and area_data.get('area_type_id', False) and area_data.get('name',
                                                                                                              False):
                self.env['df_event_virtual_fair.area'].sudo().create(area_data)

    def insert_partner_person(self, values, event, ticket, partner_id_company=None):
        partner_obj_sudo, partner_id = self.env['res.partner'].sudo(), self.env['res.partner']
        partner_ind = partner_obj_sudo.verify_unique_contact(values)
        evt_registration = self.env['event.registration'].sudo()
        if values.get('theme_tag_id_all', False) and not isinstance(values['theme_tag_id_all'], list):
            values['theme_tag_id_all'] = values['theme_tag_id_all'].split(',')
        if values.get('theme_tag_track_id_all', False) and not isinstance(values['theme_tag_track_id_all'], list):
            values['theme_tag_track_id_all'] = values['theme_tag_track_id_all'].split(',')
        if not partner_ind:
            partner_cre = {
                'company_type': 'person',
                'name': values.get('name', False),
                'function': values.get('function', False),
                'phone': values.get('phone', False),
                'mobile': values.get('mobile', False),
                'email': values.get('email', False),
                'whatsapp_url': values.get('whatsapp', False),
                'facebook_url': values.get('facebook', False),
                'twitter_url': values.get('twitter', False),
                'instagram_url': values.get('instagram', False),
                'linkedin_url': values.get('linkedin')
            }

            # En el servicio no viene las temáticas
            if values.get('theme_tag_id_all', False):
                partner_cre['theme_tag_ids'] = [(4, int(theme_tag)) for theme_tag in values['theme_tag_id_all']]

            # En el servicio no viene imagen de la persona o entidad que se registra
            if values.get('profile-picture', False):
                partner_cre['image_1920'] = base64.b64encode(values.get('profile-picture', False).read())

            if values.get('economic_activity_id', False) and values.get(
                    'economic_activity_id').sector_id and values.get('registration_mode',
                                                                     False) == 'registration_mode_business':
                partner_cre['industry_id'] = values.get('economic_activity_id').sector_id.id
                partner_cre['economic_activity_id'] = values.get('economic_activity_id').id

            if values.get('country_person_id', False):
                partner_cre['country_id'] = int(values.get('country_person_id'))
            #     # Es necesario porque en el servicio viene con otro nombre
            elif values.get('country_id', False):
                partner_cre['country_id'] = int(values.get('country_id'))
            if partner_id_company:
                partner_cre['type'] = 'contact'
                partner_cre['parent_id'] = partner_id_company.id
            else:
                partner_cre['type'] = 'private'

            if values.get('ci_passport', False):
                partner_cre['ci_passport'] = values.get('ci_passport')

            # if event and event.company_id:
            #     partner_cre['company_id'] = event.company_id.id
            partner_id = self.env['res.partner'].sudo().create(partner_cre)

            # Verificando si el usuario existe con el email enviado
            user_sudo = self.env['res.users'].sudo()
            user_aux_id = user_sudo.search([('login', '=', partner_id.email)])
            if not user_aux_id:
                user_cre = {}
                user_cre['login'] = values.get('email')
                user_cre['groups_id'] = [(6, 0, [self.env.ref('base.group_public').id])]
                user_cre['partner_id'] = partner_id.id
                if partner_id:
                    user_cre['company_id'] = event.company_id.id
                    # hay que poner la compañia en el listado de las permitidas
                    user_cre['company_ids'] = [(4, event.company_id.id)]
                """ Si el usuario es creado mediante un servicio externo, automáticamente se crea activo ya que desde la 
                    aplicación se envían los datos cuando el usuario ya esta aprobado """
                if values.get('app_exter', False):
                    user_cre['active'] = True
                else:
                    user_cre['active'] = False
                # este pass es irrelevante, el usuario se cargara y se autologueara a codigo
                # user_cre['password'] = '123456789'
                user_sudo.with_context(create_user=True, import_file=False).sudo().create(user_cre)

            # Creando area asociada al attendee
            self.insert_area(values, partner_id, event, ticket)
        else:
            if partner_id_company:
                partner_ind.write({
                    'parent_id': partner_id_company.id
                })
            partner_id |= partner_ind
        # Comprobando si el attendee existe
        if not self.verify_attendee(event, partner_id):
            # Insertar attendee
            attendee_cre = {
                'partner_id': partner_id.id,
                'event_ticket_id': ticket.id,
                'event_id': event.id,
                'type_attendees': ticket.type_attendee_registration_id.code
            }

            if values.get('specialty', False):
                attendee_cre['specialty'] = values.get('specialty')

            if values.get('speciality_type', False):
                attendee_cre['specialty_type_id'] = int(values.get('speciality_type'))

            if values.get('scientific_category', False):
                attendee_cre['category_scientific_id'] = int(values.get('scientific_category'))

            if values.get('teaching_category', False):
                attendee_cre['category_educational_id'] = int(values.get('teaching_category'))

            if values.get('investigative_category', False):
                attendee_cre['category_investigative_id'] = int(values.get('investigative_category'))

            country_id, currency_id = False, False
            # Comprobando por que tipo de participación se registro para saber cual es el campo país que se debe
            # seleccionar para la búsqueda de la tarifa del ticket
            if values.get('registration_mode', False) == 'registration_mode_business' and values.get('country_id',
                                                                                                     False):
                country_id = int(values.get('country_id'))
            elif values.get('registration_mode', False) == 'registration_mode_personal' and values.get(
                    'country_person_id', False):
                country_id = int(values.get('country_person_id'))
            if values.get('currency_id', False):
                currency_id = int(values.get('currency_id'))
            # Buscando la lista de precio del producto del ticket seleccionado
            pricelist_item_id = event.get_product_in_pricelist(ticket.product_id.product_tmpl_id.id,
                                                               currency_id, country_id)
            # Verificar si tiene algun pricelist asociado el producto del ticket
            if pricelist_item_id:
                attendee_cre['pricelist_id'] = pricelist_item_id.pricelist_id.id
            else:
                # Sino existe un pricelist configurado para el producto, mostrar el público
                attendee_cre['pricelist_id'] = self.env.ref('product.list0').sudo().id
            if values.get('app_exter', False):
                attendee_cre['state'] = 'open'
            evt_registration.create(attendee_cre)
        else:
            return False
        return partner_id

    def insert_partner_company(self, values):
        partner_obj_sudo, partner_id = self.env['res.partner'].sudo(), self.env['res.partner']
        partner_company = partner_obj_sudo.verify_unique_contact_company(values)
        image_inst = values.get('profile-picture-entity', False)
        # Se quito para que no se seteara el campo name de la empresa: 'name': values.get('inst_name', False),
        partner_company_cre = {
            'company_type': 'company',
            'image_1920': base64.b64encode(image_inst.read()) if image_inst else False,
            'website': values.get('website', False),
            'comment': values.get('comment', False),
            'abbreviation': values.get('acronym', False)
        }
        if values.get('country_id', False):
            partner_company_cre['country_id'] = int(values.get('country_id'))
        if values.get('type_institution_id', False):
            partner_company_cre['type_institution_id'] = int(values.get('type_institution_id'))
        if values.get('industry_id', False):
            partner_company_cre['industry_id'] = int(values.get('industry_id'))
        if values.get('vat', False):
            partner_company_cre['vat'] = values.get('vat')
        if values.get('economic_activity_id', False):
            partner_company_cre['economic_activity_id'] = values.get('economic_activity_id').id
        if values.get('city', False):
            partner_company_cre['city'] = values.get('city')
        if not partner_company:
            partner_company_cre['name'] = values.get('inst_name', False)
            partner_id |= partner_obj_sudo.create(partner_company_cre)
        elif partner_company:
            partner_company.sudo().write(partner_company_cre)
            partner_id |= partner_company
        return partner_id

    def insert_speaker_track(self, event, partner_id, values):
        user_id = partner_id.get_user_by_partner(partner_id, True)
        evt_track_su = self.env['event.track'].sudo()
        partner_id.biography = values.get('biography', False)
        # Creando charla
        track_cre = {
            'event_id': event.id,
            'name': values.get('conference_name_' + str(event.id), False),
            'description': values.get('description_' + str(event.id), False),
            'user_id': user_id.id,
            'event_track_type_id': int(values.get('type_track_name_' + str(event.id))) if values.get(
                'type_track_name_' + str(event.id), False) else None
        }
        speaker_id = self.env['event.track.speaker'].sudo().search(
            [('partner_id', '=', partner_id.id)], limit=1)
        if not speaker_id:
            track_cre.update({
                'event_track_speakers': [(0, 0, {
                    'partner_id': partner_id.id,
                    'user_id': user_id.id
                })]
            })
        else:
            track_cre.update({
                'event_track_speakers': [(4, speaker_id.id)]
            })

        if values.get('conference_file_' + str(event.id), False):
            datas_line = {}
            datas_line['name'] = values.get('conference_file_' + str(event.id)).filename
            datas_line['mimetype'] = values.get('conference_file_' + str(event.id)).mimetype
            datas_line['datas'] = base64.b64encode(values.get('conference_file_' + str(event.id)).read())
            line = (0, 0, datas_line)
            track_cre['document_ids'] = [line]

        if values.get('event_track_type_id', False):
            track_cre['event_track_type_id'] = int(values.get('event_track_type_id'))

        if values.get('theme_tag_track_id_' + str(event.id) + '_all', False):
            theme_tag_ids = [int(theme_tag) for theme_tag in
                             values.get('theme_tag_track_id_' + str(event.id) + '_all').split(',')]
            track_cre['theme_tag_ids'] = [(6, 0, theme_tag_ids)]

        evt_track_su.create(track_cre)
        # Insertar Attendee
        self.insert_attendee(event, partner_id)

    def insert_attendee(self, event, partner_id):
        # Verificando que no exista el attendee en el evento
        attendee_id = self.env['event.registration'].sudo().search(
            [('event_id', '=', event.id), ('partner_id', '=', partner_id.id)])
        if not attendee_id:
            # Insert attendee sino existe
            attendee = {
                'partner_id': partner_id.id,
                'event_id': event.id,
                'name': partner_id.name,
                'email': partner_id.email,
                'phone': partner_id.phone,
                'mobile': partner_id.mobile
            }
            self.env['event.registration'].sudo().create(attendee)

    def insert_sponsor(self, event, partner_id, values, ticket):
        evt_sponsor_su = self.env['event.sponsor'].sudo()
        exist_sponsor = evt_sponsor_su.search([('partner_id', '=', partner_id.id)])
        if not exist_sponsor and partner_id:
            sponsor_cre = {
                'event_id': event.id,
                'name': partner_id.name,
                'partner_id': partner_id.id
            }
            if ticket and ticket.type_attendee_registration_id and ticket.type_attendee_registration_id.sponsor_type_id:
                sponsor_cre['sponsor_type_id'] = ticket.type_attendee_registration_id.sponsor_type_id.id
            evt_sponsor_su.create(sponsor_cre)

    """ 
        Este método permite obtener de manera correcta los tipos de participación y ticket según seleccionado 
        en el registro. devuelve 2 diccionarios con las siguientes relaciones:
        event_type_part = { event_id: type_part }
        event_ticket = { event_id: ticket }
    """

    def get_ticket_by_values(self, event_id, values):
        ticket_id = self.env['event.event.ticket']
        if values.get('ticket_id_event_' + str(event_id), False):
            ticket_id |= ticket_id.browse(int(values.get('ticket_id_event_' + str(event_id))))
        return ticket_id

    def is_event_principal(self, event_id, values):
        principal = False
        if values.get('event-to-participate-event-' + str(event_id.id), False) and event_id.principal:
            principal = True
        return principal

    @api.model
    def create_attendee(self, event, values):
        errors, event_ids = {}, self.env['event.event'].search([('is_published', '=', True)])
        if values.get('email', False):
            for event in event_ids:
                ticket_id = self.get_ticket_by_values(event.id, values)
                if ticket_id:
                    # Insertar datos inciales
                    partner_id_company, partner_id_ind = self.env['res.partner'], self.env['res.partner']
                    # Insertar partner individual
                    if values.get('registration_mode', False) == 'registration_mode_personal':
                        insert_person = self.insert_partner_person(values, event, ticket_id)
                        if insert_person:
                            partner_id_ind |= insert_person
                    # Insertar partner company
                    elif values.get('registration_mode', False) == 'registration_mode_business':
                        partner_id_company |= self.insert_partner_company(values)
                        insert_person = self.insert_partner_person(values, event, ticket_id, partner_id_company)
                        if insert_person:
                            partner_id_ind |= insert_person

                    # Verificando que exista el partner y además no este ya insertado previamente en el sistema
                    if partner_id_ind:
                        # Activar el partner, ya que al asociarlo a un usuario se crea archivado
                        partner_id_ind.sudo().write({
                            'active': True
                        })
                        area_id = self.env['df_event_virtual_fair.area'].search(
                            [('partner_id', '=', partner_id_ind.id), ('event_id', '=', event.id)])
                        if not area_id:
                            # Creando area
                            area_data = {
                                'name': partner_id_ind.name,
                                'partner_id': partner_id_ind.id,
                                'event_id': event.id
                            }
                            # En caso de que se seleccione un stand se crea un area con sus pages
                            if ticket_id and values.get('plan_id', False) and self.is_event_principal(event, values):
                                # Validar que se escogio algun template
                                if ticket_id and values.get('stand_id', False):
                                    area_data['template_id'] = int(values.get('stand_id'))
                                if values.get('plan_id', False):
                                    area_data['plan_id'] = int(values.get('plan_id'))
                                    if values.get('plan_variacion_id', False):
                                        area_data['event_plan_line_id'] = int(values.get('plan_variacion_id'))
                                area_data['area_type_id'] = self.env.ref('df_event_virtual_fair.type_area_3').id
                            else:
                                # En caso de que no se seleccione un stand se crea un area solo con los pages de calendario y acreditado,
                                # además con el tipo de area 'general' y template 'general'
                                area_data['template_id'] = self.env.ref(
                                    'df_event_virtual_fair.template_area_general').id
                                area_data['area_type_id'] = self.env.ref('df_event_virtual_fair.type_area_4').id

                            self.env['df_event_virtual_fair.area'].sudo().create(area_data)

                        # Cuando el ticket seleccionado es de tipo 'speaker' (ponente)
                        if 'speaker' in ticket_id.type_attendee_registration_id.code and partner_id_ind and len(
                                errors) == 0:
                            self.insert_speaker_track(event, partner_id_ind, values)
                        # Cuando el ticket seleccionado es de tipo 'sponsor' (patrocinador)
                        elif 'sponsor' in ticket_id.type_attendee_registration_id.code and partner_id_company and len(
                                errors) == 0:
                            self.insert_sponsor(event, partner_id_company, values, ticket_id)
        else:
            errors['message'] = 57
        return errors

    def get_attendees_by_type(self, event, limit_val=10000, type_a='exhibitor'):
        attendees = []
        if event:
            attendees_aux = self.env['event.registration'].sudo().search(
                [('state', 'in', ['approved', 'done']), ('event_id.id', '=', event.id),
                 ('event_ticket_type_a_code', '!=', False)]).filtered(
                lambda evr: type_a in evr.event_ticket_type_a_code).sorted(lambda evo: evo.name)
            for attendee in attendees_aux:
                if len(attendees) < limit_val:
                    """ Verificando que el expositor es un representante de una empresa """
                    if attendee.partner_id.parent_id and attendee.partner_id.parent_id.image_1920:
                        attendees.append({
                            'id': attendee.id,
                            'name': attendee.partner_id.parent_id.name,
                            'image_1920': attendee.partner_id.parent_id.image_1920,
                            'website': attendee.partner_id.parent_id.website
                        })
                        """ Verificando que el expositor no es un representante de una empresa """
                    else:
                        if attendee.partner_id.image_1920:
                            attendees.append({
                                'id': attendee.id,
                                'name': attendee.partner_id.name,
                                'image_1920': attendee.partner_id.image_1920.decode('utf-8'),
                                'website': attendee.partner_id.website
                            })
                else:
                    break
        return attendees

    # Action wizard copy attendee
    def action_open_wizard_generate_attendees(self):
        form_id = self.env.ref('df_event_virtual_fair.generate_attendees_view_form').id
        return {
            'type': 'ir.actions.act_window',
            'name': _('Generate attendees'),
            'view_mode': 'form',
            'view_type': 'form',
            'view_id': form_id,
            'context': {
                'default_attendee_ids': self.ids
            },
            'res_model': 'df_event_virtual_fair.generate.attendee',
            'target': 'new',
        }

    """ Cambiar a estado draft los attendees seleccionados """

    def action_generate_state_draft(self):
        for rec in self:
            rec.action_set_draft()

    """ Cambiar a estado done (Asistido) los attendees seleccionados """

    def action_generate_state_done(self):
        for rec in self:
            rec.action_set_done()

    """ Cambiar a estado approved (Aprobado) los attendees seleccionados """

    def action_generate_state_approved(self):
        for rec in self:
            rec.action_approved_registration()

    
    def get_registrations_json(self):
        self.ensure_one()
        date = '', []
        if isinstance(self.entry_date, datetime):
            date = self.entry_date.__str__()
        result = {
            'event': self.event_id.name,
            'event_ticket': self.event_ticket_id.name,
            'type_attendees': self.type_attendees,
            'lodging': self.lodging_id.name,
            'room_type': self.room_type_id.name,
            'number_nights': self.number_nights,
            'entry_date': date,
            'companion': self.companion,
            'type_institution': self.type_institution,
            'category_investigative': self.category_investigative_id.name,
            'pricelist': self.pricelist_id.name,
            'invoice': self.invoice_id.name,
            'state': self.state
        }
        return result        
