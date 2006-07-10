/*
 * ***** BEGIN LICENSE BLOCK *****
 * Version: ZPL 1.1
 *
 * The contents of this file are subject to the Zimbra Public License
 * Version 1.1 ("License"); you may not use this file except in
 * compliance with the License. You may obtain a copy of the License at
 * http://www.zimbra.com/license
 *
 * Software distributed under the License is distributed on an "AS IS"
 * basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
 * the License for the specific language governing rights and limitations
 * under the License.
 *
 * The Original Code is: Zimbra Collaboration Suite Web Client
 *
 * The Initial Developer of the Original Code is Zimbra, Inc.
 * Portions created by Zimbra are Copyright (C) 2005 Zimbra, Inc.
 * All Rights Reserved.
 *
 * Contributor(s):
 *
 * ***** END LICENSE BLOCK *****
 */

function Com_Zimbra_Email() {
}

Com_Zimbra_Email.prototype = new ZmZimletBase();
Com_Zimbra_Email.prototype.constructor = Com_Zimbra_Email;

Com_Zimbra_Email.prototype.init =
function() {
	this._contacts = this._appCtxt.getApp(ZmZimbraMail.CONTACTS_APP).getContactList();
};

Com_Zimbra_Email.prototype._getHtmlContent =
function(html, idx, obj) {
	var content = null;
	if (obj instanceof ZmEmailAddress) {
		if (this._appCtxt.get(ZmSetting.CONTACTS_ENABLED)) {
			var contact = this._contacts.getContactByEmail(obj.address);
			if (contact) {
				content = contact.getFullName();
			}
		}
		if (!content) {
			content = obj.toString();
		}
	} else {
		content = obj;
	}
	html[idx++] = AjxStringUtil.htmlEncode(content);
	return idx;
};

Com_Zimbra_Email.prototype.toolTipPoppedUp =
function(spanElement, contentObjText, matchContext, canvas) {
	var toolTip;
	var addr = (contentObjText instanceof ZmEmailAddress) ? contentObjText.address : contentObjText;
	var contact;
	if (this._appCtxt.get(ZmSetting.CONTACTS_ENABLED) && (contact = this._contacts.getContactByEmail(addr))) {
		toolTip = contact.getToolTip(addr);
	} else {
		toolTip = "<b>Email: </b>" + AjxStringUtil.htmlEncode(contentObjText.toString());
	}
	canvas.innerHTML = toolTip;
};

Com_Zimbra_Email.prototype.getActionMenu =
function(obj, span, context) {

	// call base class first to get the action menu
	var actionMenu = ZmZimletBase.prototype.getActionMenu.call(this, obj, span, context);

	// bug fix #5262 - Change action menu item for contact depending on whether
	// email address is found in address book or not.
	if (this._contacts) {
		var addr = (obj instanceof ZmEmailAddress) ? obj.getAddress() : obj;
		var found = (this._contacts.getContactByEmail(addr) != null);
		var newOp = found ? ZmOperation.EDIT_CONTACT : ZmOperation.NEW_CONTACT;
		var newText = found ? null : ZmMsg.AB_ADD_CONTACT;
		ZmOperation.setOperation(actionMenu, "NEWCONTACT", newOp, newText);
	}

	return actionMenu;
};

Com_Zimbra_Email.prototype.clicked =
function(spanElement, contentObjText, matchContext, canvas) {
	// TODO need a way to get ev so we can use ev.shiftKey below
	var inNewWindow = this._appCtxt.get(ZmSetting.NEW_WINDOW_COMPOSE);//|| ev.shiftKey;
	var cc = this._appCtxt.getApp(ZmZimbraMail.MAIL_APP).getComposeController();
	cc.doAction(ZmOperation.NEW_MESSAGE, inNewWindow, null, contentObjText + ZmEmailAddress.SEPARATOR);
};

Com_Zimbra_Email.prototype.menuItemSelected = function(itemId) {
	switch (itemId) {
		case "SEARCH":
			this._searchListener();
			break;
		case "SEARCHBUILDER":
			this._browseListener();
			break;
		case "NEWEMAIL":
			this._composeListener();
			break;
		case "NEWCONTACT":
			this._contactListener();
			break;
		case "NEWFILTER":
			this._filterListener();
			break;
		case "GOTOURL":
			this._goToUrlListener();
			break;
	}
};

Com_Zimbra_Email.prototype._getAddress =
function(obj) {
	if (obj.constructor == ZmEmailAddress) {
		return obj.address;
	} else {
		return obj;
	}
};

Com_Zimbra_Email.prototype._contactListener =
function() {
	var contact;
	var capp = this._appCtxt.getApp(ZmZimbraMail.CONTACTS_APP);

	if (this._actionObject) {
		contact = (this._actionObject instanceof ZmContact)
			? this._actionObject
			: capp.getContactList().getContactByEmail(this._actionObject.address);
	} else {
		contact = new ZmContact(this._appCtxt);
		contact.initFromEmail(this._actionObject);
	}

	capp.getContactController().show(contact);
};

Com_Zimbra_Email.prototype._composeListener =
function() {
	// TODO need a way to get ev so we can use ev.shiftKey below
	var inNewWindow = this._appCtxt.get(ZmSetting.NEW_WINDOW_COMPOSE);//|| ev.shiftKey;
	var cc = this._appCtxt.getApp(ZmZimbraMail.MAIL_APP).getComposeController();
	cc.doAction(ZmOperation.NEW_MESSAGE, inNewWindow, null, this._getAddress(this._actionObject) + ZmEmailAddress.SEPARATOR);
};

Com_Zimbra_Email.prototype._browseListener =
function() {
	this._appCtxt.getSearchController().fromBrowse(this._getAddress(this._actionObject));
};

Com_Zimbra_Email.prototype._searchListener =
function() {
	this._appCtxt.getSearchController().fromSearch(this._getAddress(this._actionObject));
};

Com_Zimbra_Email.prototype._filterListener =
function() {
	var rule = new ZmFilterRule();
	rule.addCondition(new ZmCondition(ZmFilterRule.C_FROM, ZmFilterRule.OP_IS, this._getAddress(this._actionObject)));
	rule.addAction(new ZmAction(ZmFilterRule.A_KEEP));
	var dialog = this._appCtxt.getFilterRuleDialog();
	dialog.popup(rule);
};

Com_Zimbra_Email.prototype._goToUrlListener =
function() {
	var parts = (this._getAddress(this._actionObject)).split("@");
	if (parts.length) {
		var domain = parts[parts.length - 1];
		var pieces = domain.split(".");
		var url = (pieces.length <= 2) ? 'www.' + domain : domain;
		this._actionUrl = "http://" + url;
	}
	if (this._actionUrl) {
		window.open(this._actionUrl, "_blank", "menubar=yes,resizable=yes,scrollbars=yes");
	} else {
		this.displayStatusMessage("Unable to create URL from email.");
	}
};