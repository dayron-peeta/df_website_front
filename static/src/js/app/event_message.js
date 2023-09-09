odoo.define('df_website_front.event_message', function(require) {
    "use strict";

    /* Esto realiza la misma función que $(document).ready(), para una vez que se cargue el DOM se carque el código JS */
    require('web.dom_ready');

    var translation = require('web.translation');
    var _t = translation._t;

    function getMessage(message_id) {
        var message = '';
        switch (message_id) {
            case 1:
                message = _t('There is a speaker with these data for this talk.');
                break;
            case 2:
                message = _t('You have successfully registered. In a few minutes you will receive a confirmation email.');
                break;
            case 3:
                message = _t('There is an institution and legal representative with these data.');
                break;
            case 4:
                message = _t('There is an institution with these data.');
                break;
            case 5:
                message = _t('The representative registered successfully.');
                break;
            case 6:
                message = _t('There is a legal representative with these data.');
                break;
            case 7:
                message = _t('There is a visitor with this data.');
                break;
            case 8:
                message = _t('Data has been successfully logged.');
                break;
            case 9:
                message = _t('Passwords do not match.');
                break;
            case 10:
                message = _t('The data has been registered correctly.');
                break;
            case 11:
                //ha llegado al límite de elementos permitidos.
                message = _t('You have reached the limit of allowed items.');
                break;
            case 12:
                message = _t('Check the required fields.');
                break;
            case 13:
                message = _t('Are you sure you want to delete this item?');
                break;
            case 14:
                message = _t('Accept');
                break;
            case 15:
                message = _t('Cancel');
                break;
            case 16:
                message = _t('Delete');
                break;
            case 17:
                message = _t('The item was successfully removed.');
                break;
            case 18:
                message = _t('You must select at least one booth.');
                break;
            case 19:
                message = _t('There is a participant with this data.');
                break;
            case 20:
                message = _t('Add element');
                break;
            case 21:
                message = _t('Edit element');
                break;
            case 22:
                message = _t('Select product');
                break;
            case 23:
                message = _t('Your appointment request has been sent.');
                break;
            case 24:
                message = _t('Your appointment request has not been sent, please try again later.');
                break;
            case 25:
                message = _t('The payment was made correctly.');
                break;
            case 26:
                message = _t('The payment was not made correctly, please contact the administrator.');
                break;
            case 27:
                message = _t('The borrower you wish to add already exists as an exhibitor, please add a different one.');
                break;
            case 28:
                message = _t('Processing payment');
                break;
            case 29:
                message = _t('No exist message by track');
                break;
            case 30:
                message = _t('Channel ');
                break;
            case 31:
                message = _t('The chat is not available for this chat.');
                break;
            case 32:
                message = _t('Appointment confirmation');
                break;
            case 33:
                message = _t('Cancel appointment');
                break;
            case 34:
                message = _t('The appointment was successfully approved.');
                break;
            case 35:
                message = _t('The appointment was successfully canceled.');
                break;
            case 36:
                message = _t('Pavilion: ');
                break;
            case 37:
                message = _t('Price: ');
                break;
            case 38:
                message = _t('You are already registered for the event.');
                break;
            case 39:
                message = _t('Add document');
                break;
            case 40:
                message = _t('Add image');
                break;
            case 41:
                message = _t('Chat');
                break;
            case 42:
                message = _t('You must select a stand');
                break;
            case 43:
                message = _t('Appointment done');
            case 44:
                message = _t('The appointment was successfully done.');
                break;
            case 45:
                message = _t('Chat is not available for this booth.');
                break;
            case 46:
                message = _t('The speaker has been successfully created.');
                break;
            case 47:
                message = _t('The speaker already exists in this talk.');
                break;
            case 48:
                message = _t('Must add at least one track.');
                break;
            case 49:
                message = _t('Are you sure you want to delete this conference?');
                break;
            case 50:
                message = _t('An error occurred when selecting booth as favorite, please try again later.');
                break;
            case 51:
                message = _t('The booth was correctly selected as a favorite.');
                break;
            case 52:
                message = _t('The booth was correctly deselected as a favorite.');
                break;
            case 53:
                message = _t('My Stand');
                break;
            case 54:
                message = _t('User profile');
                break;
            case 55:
                message = _t('My fair account');
            case 56:
                message = _t('An error occurred while deleting the item, if the error persists contact the administrator.');
                break;
            case 57:
                message = _t('Please enter your email.');
                break;
            case 58:
                message = _t('The conference has been added successfully.');
                break;
            case 59:
                message = _t('The conference was deleted successfully.');
                break;
            case 60:
                message = _t('Add author');
                break;
        }
        return message;
    }

    return {
        'getMessage': getMessage
    }

});