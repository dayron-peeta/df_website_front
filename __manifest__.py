{
    'name': "df_website_front",

    'summary': """ Website management """,

    'description': """ Website management """,

    'author': "DESOFT",
    'website': "http://www.yourcompany.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/14.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'Uncategorized',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['website_event', 'df_event_virtual_fair', 'website', 'df_website_event_blog', 'df_event_request',
                'website_event_track', 'survey','portal'],

    # always loaded
    'data': [
        'views/views.xml',
        'views/res_partner_views.xml',
        'views/main_templates.xml',
        'views/new_templates.xml',
        'views/event_templates.xml',
        'views/user_sign_in_templates.xml',
        'views/event_one_templates.xml',
        'views/event_main_templates.xml',
        'views/forum_templates.xml',
        'views/committee_templates.xml',
        'views/sponsor_templates.xml',
        'views/event_news_detail.xml',
        'views/contact_us_templates.xml',
        'views/event_talk_proposal_templates.xml',
        'views/search_event.xml',
        'views/scroll_button.xml',
        'templates/templates_home.xml',
        'templates/event_templates.xml',
        'templates/modal_template.xml',
        'templates/user_profile.xml',
        'templates/stand_profile.xml',
        'templates/lateral_bottom_menu.xml',
        'templates/event_stands_templates.xml',
        'templates/loader_template.xml',
        'templates/chat_template.xml',
        'templates/event_lobby.xml',
        'templates/exhibitor_template.xml',
        'templates/event_track_templates_agenda.xml',
        'templates/participant_templates.xml',
        'templates/survey_templates.xml',
        'templates/event_user_sign_in_templates.xml',
        'templates/poster_tracks.xml',
        'templates/poster_track_detail.xml',
        'templates/participant_company_templates.xml',
        'templates/documents_presentations.xml',
        'templates/info_documents_presentations.xml',
        'views/assets.xml',
        'security/ir.model.access.csv',
        'data/groups_website_template.xml',
        'data/ir_ui_view_groups.xml',
        'data/template_event_default.xml'
    ]
}
