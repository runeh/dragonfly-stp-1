﻿var cls = window.cls || ( window.cls = {} );
// this should go in a own file

/**
 * @constructor
 * @extends BaseActions
 */

cls.CSSInspectorActions = function(id)
{
  var self = this;

  this.__active_container = null;
  this.__target = null;

  this.editor = new Editor(this);

  this.getFirstTarget = function()
  {
    return self.__active_container && self.__active_container.getElementsByTagName('styles')[1].getElementsByTagName('property')[0];
  };

  this.clearSelected = function()
  {
    if (self.__target)
    {
      self.__target.removeClass('selected');
    }
  };

  this.setSelected = function(new_target)
  {
    if (new_target)
    {
      if (self.__target)
      {
        self.__target.removeClass('selected');
      }
      (self.__target = new_target).addClass('selected');
      // TODO setting the navigation must be done more carefully and more generic
      //self.__target.scrollSoftIntoView();
    }
  };

  this.resetTarget = function(new_container)
  {
    if (self.__active_container && self.__target && !self.__active_container.parentNode)
    {
      var
      targets = self.__active_container.getElementsByTagName(self.__target.nodeName),
      target = null,
      i = 0;
      for ( ; (target = targets[i]) && target != self.__target; i++);
      if (target && (target = new_container.getElementsByTagName(self.__target.nodeName)[i]))
      {
        self.__active_container = new_container;
        self.setSelected(target);
      }
    }
  };

  this.moveFocusUp = function(event, target)
  {
    if (self.__target)
    {
      self.setSelected(self.__target.getPreviousWithFilter(self.__active_container,
        self.__target.nodeName.toLowerCase() == 'header' && self.__target.parentElement.getAttribute('handler')
        ? nav_filter.header
        : nav_filter._default));
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        'keyboard_handler: no target to move');
    }
  };

  var nav_filter =
  {
    _default: function(ele)
    {
      return ((ele.nodeName.toLowerCase() == 'property' && ele.parentElement.hasAttribute('rule-id'))
               || ele.nodeName.toLowerCase() == 'header'
               || ele.getAttribute('handler') == 'display-rule-in-stylesheet');
    },

    header: function(ele)
    {
      return ele.nodeName.toLowerCase() == 'header';
    },

    property_editable: function(ele)
    {
      return ele.nodeName.toLowerCase() == 'property' && ele.parentElement.hasAttribute('rule-id');
    }
  };

  this.moveFocusDown = function(event, target)
  {
    if (self.__target)
    {
      self.setSelected(self.__target.getNextWithFilter( self.__active_container,
        self.__target.nodeName.toLowerCase() == 'header' && !self.__target.parentElement.getAttribute('handler')
        ? nav_filter.header
        : nav_filter._default));
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        'keyboard_handler: no target to move');
    }
  };

  this.setActiveContainer = function(event, container)
  {
    self.resetTarget(container);
    self.__active_container = container;
    if (!self.__target || !self.__target.parentElement)
    {
      self.__target = self.getFirstTarget()
    }
    if (self.__target && !self.__target.hasClass('selected'))
    {
      self.setSelected(self.__target);
    }
  };

  this.clearActiveContainer = function()
  {
    self.clearSelected();
  };

  this.edit_css = function(event, target)
  {
    var cat = event.target;

    switch(event.target.nodeName.toLowerCase())
    {
      case 'key':
      case 'value':
      {
        if (event.target.parentElement.parentElement.hasAttribute('rule-id'))
        {
          key_identifier.setModeEdit(self);
          self.setSelected(event.target.parentNode);
          self.editor.edit(event, event.target.parentNode);
        }
        break;
      }
      case 'property':
      {
        if (event.target.parentElement.hasAttribute('rule-id'))
        {
          key_identifier.setModeEdit(self);
          self.setSelected(event.target);
          self.editor.edit(event);
        }
        // execute property click action
        break;
      }
    }
  };

  this['enable-disable-property'] = function enable_disable_property(event, target)
  {
    var is_disabled = target.checked;
    var rule_id = parseInt(target.getAttribute("data-rule-id"));
    var rt_id = parseInt(target.parentNode.parentNode.parentNode.getAttribute("rt-id"));
    var obj_id = parseInt(target.parentNode.parentNode.getAttribute("obj-id"));

    if (is_disabled)
    {
      self.enable_property(rt_id, rule_id, obj_id, target.getAttribute("data-property"));
    }
    else
    {
      self.disable_property(rt_id, rule_id, obj_id, target.getAttribute("data-property"));
    }
  };

  this['css-toggle-category'] = function(event, target)
  {
    if (/header/i.test(target.nodeName))
    {
      target = target.firstChild;
    }
    var cat = target.getAttribute('cat-id'), value = target.hasClass('unfolded');
    var cat_container = target.parentNode.parentNode;
    if (value)
    {
      target.removeClass('unfolded');
      cat_container.removeClass('unfolded');
      var styles = cat_container.getElementsByTagName('styles')[0];
      if (styles)
      {
        styles.innerHTML = "";
      }
    }
    else
    {
      target.addClass('unfolded');
      cat_container.addClass('unfolded');
    }
    self.setSelected(target.parentNode);
    settings['css-inspector'].set(cat, !value);
    window.elementStyle.setUnfoldedCat(cat, !value);
  };

  this['display-rule-in-stylesheet'] = function(event, target)
  {
    var index = parseInt(target.getAttribute('index'));
    var rt_id = target.getAttribute('rt-id');
    var rule_id = target.parentNode.getAttribute('rule-id');
    // stylesheets.getRulesWithSheetIndex will call this function again if data is not avaible
    // handleGetRulesWithIndex in stylesheets will
    // set for this reason __call_count on the event object
    var rules = stylesheets.getRulesWithSheetIndex(rt_id, index, arguments);
    if (rules)
    {
      self.setSelected(target);
      stylesheets.setSelectedSheet(rt_id, index, rules, rule_id);
      topCell.showView(views.stylesheets.id);
    }
  };

  this.target_enter = function(event, action_id)
  {
    if (this.__target)
    {
      this.__target.releaseEvent('click');
    }
  };

  this.nav_previous_edit_mode = function(event, action_id)
  {
    if (!this.editor.nav_previous(event, action_id))
    {
      var new_target =
        this.__target.getPreviousWithFilter(this.__active_container, nav_filter.property_editable);
      if (new_target)
      {
        this.setSelected(new_target);
        this.editor.edit(null, this.__target);
        this.editor.focusLastToken();
      }
    }

    // to stop default action
    return false;
  };

  this.nav_next_edit_mode = function(event, action_id)
  {
    if (!this.editor.nav_next(event, action_id))
    {
      var new_target =
        this.__target.getNextWithFilter(this.__active_container, nav_filter.property_editable);
      if (new_target)
      {
        this.setSelected(new_target);
        this.editor.edit(null, this.__target);
        this.editor.focusFirstToken();
      }
    }

    // to stop default action
    return false;
  };

  this.autocomplete = function(event, action_id)
  {
    this.editor.autocomplete(event, action_id);
    return false;
  };

  this.escape_edit_mode = function(event, action_id)
  {
    if (!this.editor.escape())
    {
      var cur_target = this.__target;
      this.moveFocusUp();
      cur_target.parentElement.removeChild(cur_target);
    }
    key_identifier.setModeDefault(self);
    window.elementStyle.update();

    return false;
  };

  this.blur_edit_mode = function()
  {
    this.escape_edit_mode();
    this.clearActiveContainer();
  };

  this.enter_edit_mode = function(event, action_id)
  {
    if (!this.editor.enter(event, action_id))
    {
      key_identifier.setModeDefault(self);
      window.elementStyle.update();
      if (!this.__target.textContent)
      {
        var cur_target = this.__target;
        this.moveFocusUp();
        cur_target.parentElement.removeChild(cur_target);
      }
    }
    return false;
  };

  this.edit_onclick = function(event)
  {
    if (this.editor)
    {
      if (!this.editor.onclick(event))
      {
        key_identifier.setModeDefault(self);
        window.elementStyle.update();
      }
    }
  };

  /**
   * Sets a single property (and optionally removes another one, resulting in an overwrite).
   *
   * @param {Array} declaration An array according to [prop, value, is_important]
   * @param {String} prop_to_remove An optional property to remove
   * @param {Function} callback Callback to execute when the proeprty has been added
   */
  this.set_property = function set_property(rt_id, rule_id, declaration, prop_to_remove, callback)
  {
    var prop = this.normalize_property(declaration[0]);
    var script = "";

    // TEMP: workaround for CORE-31191: updating a property with !important is discarded
    var style_dec = window.elementStyle.get_style_dec_by_id(rule_id);
    if (style_dec) {
      for (var i = style_dec[1].length; i--; ) {
        if (window.css_index_map[style_dec[1][i]] == declaration[0])
        {
          script += "object.style.removeProperty(\"" + declaration[0] + "\");";
          break;
        }
      }
    }

    script += "object.style.setProperty(\"" +
                  prop + "\", \"" +
                  declaration[1].replace(/"/g, "\\\"") + "\", " +
                  (declaration[2] ? "\"important\"" : null) +
              ");";

    // If a property is added by overwriting another one, remove the other property
    if (prop_to_remove && prop != prop_to_remove)
    {
      script += "object.style.removeProperty(\"" + this.normalize_property(prop_to_remove) + "\");";
    }

    var tag = (typeof callback == "function") ? tagManager.set_callback(null, callback) : 1;
    services['ecmascript-debugger'].requestEval(tag,
      [rt_id, 0, 0, script, [["object", rule_id]]]);
  };

  /**
   * Removes a single property.
   *
   * @param {String} prop_to_remove The property to remove
   * @param {Function} callback Callback to execute when the property has been added
   */
  this.remove_property = function remove_property(rt_id, rule_id, prop_to_remove, callback)
  {
    prop_to_remove = this.normalize_property(prop_to_remove);
    var script = "object.style.removeProperty(\"" + prop_to_remove + "\");";

    var tag = (typeof callback == "function") ? tagManager.set_callback(null, callback) : 1;
    services['ecmascript-debugger'].requestEval(tag,
      [rt_id, 0, 0, script, [["object", rule_id]]]);
  };

  /**
   * Restores all properties to the last saved state.
   */
  this.restore_properties = function restore_properties()
  {
    const INDEX_LIST = 1;
    const VALUE_LIST = 2;
    const PRIORITY_LIST = 3;
    var rule = this.editor.saved_style_dec;
    var rule_id = this.editor.context_rule_id;
    var script = "object.style.cssText=\"\";";

    var len = rule[INDEX_LIST].length;
    for (var i = 0; i < len; i++) {
      var prop = window.css_index_map[rule[INDEX_LIST][i]];
      if (!window.elementStyle.disabled_style_dec_list[rule_id] ||
          !window.elementStyle.has_property(window.elementStyle.disabled_style_dec_list[rule_id], prop)) {
        script += "object.style.setProperty(\"" +
                     prop + "\", \"" +
                     rule[VALUE_LIST][i].replace(/"/g, "'") + "\", " +
                     (rule[PRIORITY_LIST][i] ? "\"important\"" : null) +
                  ");";
      }
    }

    services['ecmascript-debugger'].requestEval(null,
      [this.editor.context_rt_id, 0, 0, script, [["object", rule_id]]]);
  };

  /**
   * Enables one property.
   *
   * @param {String} property The property to enable
   */
  this.enable_property = function enable_property(rt_id, rule_id, obj_id, property)
  {
    const INDEX_LIST = 1;
    const VALUE_LIST = 2;
    const PRIORITY_LIST = 3;

    var id = rule_id || window.elementStyle.get_inline_obj_id(obj_id);
    var disabled_style_dec = window.elementStyle.disabled_style_dec_list[id];
    var style_dec = window.elementStyle.remove_property(disabled_style_dec, property);
    this.set_property(rt_id, rule_id || obj_id, [window.css_index_map[style_dec[INDEX_LIST][0]],
                       style_dec[VALUE_LIST][0],
                       style_dec[PRIORITY_LIST][0]], null, window.elementStyle.update);
  };

  /**
   * Disables one property.
   *
   * @param {String} property The property to disable
   */
  this.disable_property = function disable_property(rt_id, rule_id, obj_id, property)
  {
    var disabled_style_dec_list = window.elementStyle.disabled_style_dec_list;

    var id = rule_id || window.elementStyle.get_inline_obj_id(obj_id);
    var style_dec = rule_id
                  ? window.elementStyle.get_style_dec_by_id(rule_id)
                  : window.elementStyle.get_inline_style_dec_by_id(obj_id);

    if (!disabled_style_dec_list[id])
    {
      disabled_style_dec_list[id] = window.elementStyle.get_new_style_dec();
    }

    window.elementStyle.copy_property(style_dec, disabled_style_dec_list[id], property);
    window.elementStyle.remove_property(style_dec, property);
    this.remove_property(rt_id, rule_id || obj_id, property, window.elementStyle.update);
  };

  /**
   * Normalize a property by trimming whitespace and converting to lowercase.
   *
   * @param {String} prop The property to normalize
   * @returns {String} A normalized property
   */
  this.normalize_property = function normalize_property(prop)
  {
    return (prop || "").replace(/^\s*|\s*$/g, "").toLowerCase();
  };

  this.init(id);

  var onViewCreated = function(msg)
  {
    /*
    if(msg.id == "css-inspector" )
    {

      self.resetTarget();
    }
    */
  }
  messages.addListener('view-created', onViewCreated)
};

cls.CSSInspectorActions.prototype = BaseActions;

new cls.CSSInspectorActions('css-inspector');


/**
 * @constructor
 * @extends BaseKeyhandler
 */

cls.CSSInspectorKeyhandler = function(id)
{
  var __actions = actions[id]

  this[this.NAV_LEFT] = this[this.NAV_UP] = __actions.moveFocusUp;

  this[this.NAV_RIGHT] = this[this.NAV_DOWN] = __actions.moveFocusDown;

  this[this.ENTER] = function(event, action_id)
  {
    __actions.target_enter(event, action_id);
  };


  this.focus = __actions.setActiveContainer;/*function(event, container)
  {
    __actions.setActiveContainer(container);
    /*
    if( !__actions.__target )
    {
      __actions.setSelected(__actions.getFirstTarget());
    }
    */ /*
  }*/

  this.blur = __actions.clearActiveContainer;

  this.init(id);
};

cls.CSSInspectorKeyhandler.prototype = BaseKeyhandler;

new cls.CSSInspectorKeyhandler('css-inspector');

/**
 * @constructor
 * @extends BaseEditKeyhandler
 */

cls.CSSInspectorEditKeyhandler = function(id)
{
  var __actions = actions[id]

  this[this.NAV_UP] = this[this.NAV_DOWN] = function(event, action_id)
  {
    __actions.autocomplete(event, action_id);
  };

  this[this.NAV_NEXT] = function(event, action_id)
  {
    __actions.nav_next_edit_mode(event, action_id);
  };

  this[this.NAV_PREVIOUS] = function(event, action_id)
  {
    __actions.nav_previous_edit_mode(event, action_id);
  };

  this[this.ESCAPE] = function(event, action_id)
  {
    __actions.escape_edit_mode(event, action_id);
  };

  this[this.ENTER] = function(event, action_id)
  {
    __actions.enter_edit_mode(event, action_id);
  };

  this.focus = __actions.test;

  this.blur = function()
  {
    __actions.blur_edit_mode();
  };

  this.onclick = function(event)
  {
    __actions.edit_onclick(event)
  };

  this.init(id);
};

cls.CSSInspectorEditKeyhandler.prototype = BaseEditKeyhandler;

new cls.CSSInspectorEditKeyhandler('css-inspector');

eventHandlers.click['edit-css'] = actions['css-inspector'].edit_css;
eventHandlers.click['css-toggle-category'] = actions['css-inspector']['css-toggle-category'];
eventHandlers.click['display-rule-in-stylesheet'] = actions['css-inspector']['display-rule-in-stylesheet'];
eventHandlers.click['enable-disable'] = actions['css-inspector']['enable-disable-property'];

