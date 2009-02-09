﻿var cls = window.cls || ( window.cls = {} );
// this should go in a own file

/**
  * @constructor 
  * @extends BaseActions
  */

cls.DOMInspectorActions = function(id)
{
  this.view_id = id;

  var self = this;
  var view_container = null;
  var view_container_first_child = null;
  var nav_target = null;
  var selection = null;
  var range = null;



  var nav_filters = 
  {
    attr_text: function(ele)
    {
      switch(ele.nodeName.toLowerCase())
      {
        case 'text':
        case 'key':
        case 'value':
        {
          return true;
        }
        case 'node':
        {
          return !/<\//.test(ele.textContent) && !ele.getElementsByTagName('key')[0];
        }
      }
      return false; 
    },
    left_right:function(ele)
    {
      return \
      /^key|value|input$/.test(ele.nodeName.toLowerCase())
      || ( "text" == ele.nodeName && ele.textContent.length )
      || ( "node" == ele.nodeName && ele.textContent.slice(0,2) != "</" );
    },
    up_down: function(ele, start_ele)
    {
      return \
      ( "input" == ele.nodeName.toLowerCase() && !ele.parentNode.contains(start_ele))
      || ( "node" == ele.nodeName
            && ele.textContent.slice(0,2) != "</"
            && "input" != ele.parentNode.firstElementChild.nodeName.toLowerCase()
          );
    }
  }

  this.editor = null;
  this.editors = 
  {
    "dom-attr-text-editor": new DOMAttrAndTextEditor(nav_filters),
    "dom-markup-editor": new DOMMarkupEditor(nav_filters)
  };

  this.set_editor = function(type)
  {
    if( this.editor )
    {
      this.editor.submit()
    }
    if( !this.editor || this.editor.type != type )
    {
      this.editor = this.editors[type];
    }
  }

  
  this.getFirstTarget = function()
  {    
    return \
      view_container 
      && ( document.getElementById('target-element') || view_container ).
      getElementsByTagName('input')[0];
  }


  this.resetTarget = function(new_container)
  {
    if( view_container && nav_target )
    {
      var tag_name = nav_target.nodeName.toLowerCase();
      this.setSelected
      ( 
        nav_target = 
        new_container.firstChild.getElementsByTagName(tag_name)
        [
          view_container_first_child.getElementsByTagName(tag_name).indexOf(nav_target)
        ]
      );
      view_container = new_container;
      view_container_first_child = new_container.firstChild;
    }
  }

  var onViewCreated = function(msg)
  {
    if(msg.id == self.view_id)
    {
      self.resetTarget(msg.container)
    }
  }

  this.setContainer = function(event, container)
  {
    messages.addListener('view-created', onViewCreated);
    view_container = container;
    view_container_first_child = container.firstChild;
    selection = getSelection();
    range = document.createRange();
    if( event.type == 'click' && /^node|key|value|text|input$/i.test(event.target.nodeName) )
    {
      nav_target = event.target;
    }
    if (!nav_target)
    {
      nav_target = this.getFirstTarget();
    }
    this.setSelected(nav_target);
  }

  this.setSelected = function(new_target)
  {
    var firstChild = null;
    if(new_target)
    {
      nav_target.blur();
      selection.collapse(view_container, 0);
      nav_target = new_target;

      if(new_target.offsetTop + new_target.offsetHeight > view_container.offsetHeight)
      {
        view_container.scrollTop += 
          new_target.offsetTop + new_target.offsetHeight + 30 - view_container.offsetHeight;
      }
      else if(new_target.offsetTop < 0)
      {
        view_container.scrollTop += ( new_target.offsetTop - 30 );
      } 

      switch (new_target.nodeName.toLowerCase())
      {
        case 'node':
        case 'value':
        {
          firstChild = new_target.firstChild;
          range.setStart(firstChild, 1);
          range.setEnd(firstChild, firstChild.nodeValue.length - 1)
          selection.addRange(range);
          break;
        }
        case 'key':
        case 'text':
        {
          range.selectNodeContents(new_target);
          selection.addRange(range);
          break;
        }
        case 'input':
        {
          nav_target.focus();
          break;
        }
      }
    }
    return new_target;
  }

  this.target_enter = function(event, action_id)
  {
    if(nav_target)
    {
      nav_target.releaseEvent
      (
        /^input|node$/i.test(nav_target.nodeName) && "click" || "dblclick"
      );
    }
    return false;
  }

  this.target_ctrl_enter = function(event, action_id)
  {
    if(nav_target && nav_target.nodeName == "node" )
    {
      nav_target.releaseEvent("dblclick");
    }
    return false;
  }

  this.keyhandler_onclick = function(event)
  {
    var target = event.target;
    if(target != nav_target && /^input|node|key|value|text$/i.test(target.nodeName))
    {
      this.setSelected(target);
    }
  }

  this.blur = function(event)
  {
    selection.collapse(document.documentElement, 0);
    view_container = null;
    view_container_first_child = null;
    nav_target = null;
    selection = null;
    range = null;
    messages.removeListener('view-created', onViewCreated);
  }

  this.nav_up = function(event, action_id)
  {
    // TODO if setting of nav target fails
    if( ! this.setSelected( nav_target.getPreviousWithFilter(view_container, nav_filters.up_down) ) )
    {
      view_container.scrollTop = 0;
    }
    return true;
  }

  this.nav_down = function(event, action_id)
  {
    // TODO if setting of nav target fails
    if(!this.setSelected( nav_target.getNextWithFilter(view_container, nav_filters.up_down) ) )
    {
      view_container.scrollTop = view_container.scrollHeight;
    }
    return true;
  }

  this.nav_left = function(event, action_id)
  {
    // TODO if setting of nav target fails
    this.setSelected(nav_target.getPreviousWithFilter(view_container, nav_filters.left_right));
    return true;
  }

  this.nav_right = function(event, action_id)
  {
    // TODO if setting of nav target fails
    this.setSelected(nav_target.getNextWithFilter(view_container, nav_filters.left_right));
    return true;
  }

  this.editDOM = function(event, target)
  {
    switch(event.target.nodeName)
    {
      case 'span':
      {
        if(/^(?:key|value|text|node)$/.test(event.target.parentElement.nodeName) )
        {
          event.target.parentElement.releaseEvent('dblclick');
        }
        break;
      }
      case 'key':
      case 'value':
      case 'text':
      {
        event.preventDefault();
        event.stopPropagation();
        
        key_identifier.setModeEdit(self);
        self.setSelected(event.target.parentNode);
        self.set_editor("dom-attr-text-editor");
        self.editor.edit(event, event.target);
        
        break;
      }
      case 'node':
      {
        var new_target = event.target;
        if(/^<\//.test(new_target.textContent))
        {
          new_target = event.target.getPreviousWithFilter
            (event.target.parentNode.parentNode, self.makeFilterGetStartTag(event.target));
          if( !new_target )
          {
            opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 
              'failed getting start tag in this.editDOM in action_dom.js')
            return;
          }
        }
        event.preventDefault();
        event.stopPropagation();
        key_identifier.setModeEdit(self);
        self.setSelected(new_target.parentNode);
        self.set_editor("dom-markup-editor");
        self.editor.edit(event, new_target);
        /*
        if(event.target.parentElement.hasAttribute('rule-id'))
        {
          key_identifier.setModeEdit(self);
          self.setSelected(event.target);
          self.editor.edit(event);
        }
        */
        // execute property click action
        break;
      }
    }
  }

  this.enter_edit_mode = function(event, action_id)
  {
    if( this.editor.type == "dom-attr-text-editor" )
    {
      this.setSelected(this.editor.submit() || this.getFirstTarget() );
      key_identifier.setModeDefault(self);
      return false;
    }
    else
    {
      return true;
    }
  }

  this.ctrl_enter_edit_mode = function(event, action_id)
  {
    if( this.editor.type == "dom-attr-text-editor" )
    {
      return false;
    }
    else
    {
      this.setSelected(this.editor.submit() || this.getFirstTarget() );
      key_identifier.setModeDefault(self);
      return false;
    }
  }

  this.nav_next_edit_mode = function(event, action_id)
  {
    if( this.editor.type == "dom-attr-text-editor" )
    {
      if( !this.editor.nav_next(event, action_id) )
      {
        key_identifier.setModeDefault(this);
      }
      return false;
    }
    else
    {
      this.editor.nav_next(event, action_id);
    }
    return false;
  }

  this.nav_previous_edit_mode = function(event, action_id)
  {
    if( this.editor.type == "dom-attr-text-editor" )
    {
      if( !this.editor.nav_previous(event, action_id) )
      {
        key_identifier.setModeDefault(this);
      }
      return false;
    }
    else
    {
      return true
    }
  }

  this.escape_edit_mode = function(event, action_id)
  {
    this.setSelected(this.editor.cancel() || this.getFirstTarget() );
    key_identifier.setModeDefault(this);
    return false;
  }

  this.edit_onclick = function(event)
  {
    if( this.editor )
    {
      if( this.editor.onclick(event) )
      {

      }
      else
      {
        key_identifier.setModeDefault(self);
      }
    }
  }

  this.makeFilterGetStartTag = function(start_node)
  {
    var start_tag = start_node.textContent.replace(/[\/>]/g, '');
    var margin_left = start_node.parentElement.style.marginLeft;
    return function(node)
    {
      return (
        node.nodeName == 'node' 
        && node.textContent.indexOf(start_tag) ==  0
        && node.parentElement.style.marginLeft == margin_left
        );
    }
  }

  this.init(id);

};

cls.DOMInspectorActions.prototype = BaseActions;

new cls.DOMInspectorActions('dom'); // the view id


/**
  * @constructor 
  * @extends BaseKeyhandler
  */

cls.DOMInspectorKeyhandler = function(id)
{

  var __actions = actions[id];

  this[this.NAV_UP] =  function(event, action_id)
  {
    return __actions.nav_up(event, action_id);
  }
  this[this.NAV_DOWN] = function(event, action_id)
  {
    return __actions.nav_down(event, action_id);
  }
  this[this.NAV_LEFT] = function(event, action_id)
  {
    return __actions.nav_left(event, action_id);
  }

  this[this.NAV_RIGHT] = function(event, action_id)
  {
    return __actions.nav_right(event, action_id);
  }

  this[this.ENTER] = function(event, action_id)
  {
    return __actions.target_enter(event, action_id);
  }

  this[this.CTRL_ENTER] = function(event, action_id)
  {
    return __actions.target_ctrl_enter(event, action_id);
  }

  this.focus = function(event, container)
  {
    __actions.setContainer(event, container);
  }
  this.blur = function(event)
  {
    __actions.blur(event);
  }
  this.onclick = function(event)
  {
    __actions.keyhandler_onclick(event);
  }
  
  this.init(id);
};

cls.DOMInspectorKeyhandler.prototype = BaseKeyhandler;

new cls.DOMInspectorKeyhandler('dom');

/**
  * @constructor 
  * @extends BaseEditKeyhandler
  */

cls.DOMInspectorEditKeyhandler = function(id)
{

  var __actions = actions[id]

  this[this.NAV_PREVIOUS] = function(event, action_id)
  {
    return __actions.nav_previous_edit_mode(event, action_id);
  }

  this[this.NAV_NEXT] = function(event, action_id)
  {
    return __actions.nav_next_edit_mode(event, action_id);
  }
  
  this[this.ENTER] = function(event, action_id)
  {
    return __actions.enter_edit_mode(event, action_id);
  }

  this[this.CTRL_ENTER] = function(event, action_id)
  {
    return __actions.ctrl_enter_edit_mode(event, action_id);
  }
  
  this[this.ESCAPE] = function(event, action_id)
  {
    return __actions.escape_edit_mode(event, action_id);
  }

  this.blur = function(event)
  {
    if( __actions.editor )
    {
      __actions.editor.submit();
    }
  }

  this.onclick = function(event)
  {
    __actions.edit_onclick(event);
  }

  this.init(id);
};

cls.DOMInspectorEditKeyhandler.prototype = BaseEditKeyhandler;

new cls.DOMInspectorEditKeyhandler('dom');

eventHandlers.dblclick['edit-dom'] = actions['dom'].editDOM;