﻿cls = window.cls || (window.cls = {});

/**
  * @constructor 
  * @extends ViewBase
  */

cls.CommandLineViewTest = function(id, name, container_class, html, default_handler)
{

  var self = this;

  var __container = null;
  var __console_output = null;
  var __console_input = null;
  var __prefix = null;
  var __textarea = null;
  var __textarea_value = '';

  var submit_buffer = [];
  var line_buffer = [];
  var line_buffer_cursor = 0;

  var __selection_start = -1;
  var __selection_end = 0;

  var __is_tab = false;

  var console_output_data = [];

  var is_debug = false;
  var toolbar_visibility = true;

  var cons_out_render_return_val = function(entry)
  {
    if( __console_output )
    {
      if( is_debug && entry.obj_id )
      {
        __console_output.render
        (
          [
            'pre',
            entry.value,
            ['d', ' [' + entry.obj_id + ']'],
            'handler', 'inspect-object-link',
            'rt-id', entry.runtime_id.toString(),
            'obj-id', entry.obj_id.toString()
          ]
        );
      }
      else
      {
        if (entry.model)
        {
          if (entry.object_type)
          {
            switch (entry.object_type)
            {
              case 'jsobject':
                __console_output.render(window.templates.inspected_js_object(entry.model, entry.show_root));
                break;
              case 'domenode':
                __console_output.render(window.templates.inspected_dom_node(entry.model));
                break;
            }
          }
          else
          {
            __console_output.render
            (
              [
                'pre',
                entry.value,
                // ['d', ' [' + entry.obj_id + ']'],
                'handler', 'inspect-object-link',
                'rt-id', entry.runtime_id.toString(),
                'obj-id', entry.obj_id.toString()
              ]
            );
          }
        }

        else
        {
          __console_output.render (['pre', entry.value ]);
        }

      }
    }
  }

  var cons_out_render_input = function(entry)
  {
    if( __console_output )
    {
      __console_output.render(['div', entry.value, 'class', 'log-entry']);
    }
  }

  var type_map =
  {
    "return-value": cons_out_render_return_val,
    "input-value": cons_out_render_input
  }

  var cons_out_update = function()
  {
    if( __console_output )
    {
      __console_output.innerHTML = '';
      var entry = null, i = 0;
      for( ; entry = console_output_data[i]; i++ )
      {
        type_map[entry.type](entry);
      }
      __container.scrollTop = __container.scrollHeight;
    };
    if( __textarea )
    {
      __textarea.value = __textarea_value;
      __textarea.selectionEnd = __textarea.selectionStart = __textarea_value.length;
      __textarea.focus();
    };
  }

  var handleEval = function(status, message, runtime_id, obj_id, callback)
  {

    const
    STATUS = 0,
    TYPE = 1,
    VALUE = 2,
    OBJECT_VALUE = 3,
    OBJECT_ID = 0,
    IS_CALLABLE = 1,
    IS_FUNCTION = 2,
    OBJECTVALUE_TYPE = 3,
    PROTOTYPE_ID = 4,
    NAME = 5;

    if (status)
    {
      cons_out_render_return_val
      (
        console_output_data[console_output_data.length] =
        {
          type: "return-value",
          value: ui_strings.S_INFO_NO_JAVASCRIPT_IN_CONTEXT
        }
      );
    }
    else
    {
      var value_type = message[TYPE];

      if( message[STATUS] == 'completed' )
      {
        var return_value = message[VALUE];
        if(return_value || /null|undefined|string/.test(value_type) )
        {
          var value = return_value || '';
          if( !obj_id )
          {
            switch (value_type)
            {
              case 'string':
              {
                
                var delimiter = "\"";
                // Escape ' and " Python command line interpreter style
                if (value.indexOf("\"") != -1) {
                  delimiter = "'";
                  if (value.indexOf("'") != -1) {
                    value = value.replace(/'/g, "\\'");
                  }
                }
                value = delimiter + value + delimiter;
                break;
              }
              case 'null':
              case 'undefined':
              {
                value = value_type;
                break;
              }
            }
            cons_out_render_return_val
            (
              console_output_data[console_output_data.length] =
              {
                type: "return-value",
                value: value
              }
            );
          }

        }
        else if (return_value = message[OBJECT_VALUE])
        {
          var object_id = return_value[OBJECT_ID];
          if(callback)
          {
            callback(runtime_id, object_id, message);
          }
          else
          {
            cons_out_render_return_val
            (
              console_output_data[console_output_data.length] =
              {
                type: "return-value",
                obj_id: object_id,
                runtime_id: runtime_id,
                value: return_value[4],
                model: new cls.InspectableJSObject(runtime_id, object_id, return_value[4]),
                shwo_root: true,
                show_inline: true,
                object_type: 'jsobject'
              }
            );
            __container.scrollTop = __container.scrollHeight;
          }
        }
      }
      else
      {
        var error_id = message[OBJECT_VALUE][OBJECT_ID];
        if( error_id )
        {
          var tag = tagManager.set_callback(null, handleError, [message[STATUS]]);
            services['ecmascript-debugger'].requestExamineObjects(tag, [runtime_id, [error_id]]);
        }
      }
    }
  }

  var handleError = function(status, message, error_name)
  {
    const
    OBJECT_LIST = 0,
    // sub message ObjectInfo
    PROPERTY_LIST = 1,
    // sub message Property
    PROPERTY_NAME = 0,
    PROPERTY_VALUE = 2;

    var
    obj = message[OBJECT_LIST][0],
    props = obj && obj[PROPERTY_LIST] || [],
    prop = null,
    i = 0,
    error_msg = window.helpers.service_class_name(error_name) + "\n" ;

    if(props)
    {
      for( ; prop = props[i]; i++)
      {
        if(prop[PROPERTY_VALUE])
        {
          error_msg += prop[PROPERTY_NAME] + ": " + prop[PROPERTY_VALUE] + "\n";
        }
      }
    }
    cons_out_render_return_val
    (
      console_output_data[console_output_data.length] =
      {
        type: "return-value",
        value: error_msg
      }
    );
    __container.scrollTop = __container.scrollHeight;
  }

  var markup = "" +
    "<div class='padding'>" +
      "<div class='console-output'></div>" +
      "<div class='console-input' handler='console-focus-input'>" +
        "<span class='commandline-prefix'>&gt;&gt;&gt; </span>" +
        "<div><textarea handler='commandline' rows='1' title='hold shift to add a new line'></textarea></div>" +
      "</div>" +
    "</div>";

  var templates = {};

  templates.consoleInput = function(entry)
  {
    var lines_count = entry.msg.split(/\r?\n/).length;
    var line_head = '>>>';
    while( --lines_count > 1 )
    {
      line_head += '\n...';
    }
    return [['div', line_head], ['pre', entry.msg]];
  }

  eventHandlers.click['console-focus-input'] = function(event, ele)
  {
    ele.getElementsByTagName('textarea')[0].focus();
  }



  var _dir_object = function(entry)
  {
    cons_out_render_return_val(console_output_data[console_output_data.length] = entry);
  }

  var _dir_node = function(entry)
  {
    cons_out_render_return_val(console_output_data[console_output_data.length] = entry);
  }

  var dir_obj = function(rt_id, obj_id, message)
  {


    var entry =
    {
      type: "return-value",
      obj_id: obj_id,
      runtime_id: rt_id,
      value: message[3][4],
      model: new cls.InspectableJSObject(rt_id, obj_id),
      show_root: false,
      show_inline: true,
      object_type: 'jsobject'
    };
    var cb = _dir_object.bind(null, entry);
    entry.model.expand(cb);

    /*
    messages.post('active-inspection-type', {inspection_type: 'object'});
    // if that works it should be just inspection
    topCell.showView(views.inspection.id);
    messages.post('object-selected', {rt_id: rt_id, obj_id: obj_id});
    */
  }

  var dir_node = function(rt_id, obj_id, message)
  {
    var entry =
    {
      type: "return-value",
      obj_id: obj_id,
      runtime_id: rt_id,
      value: message[3][4],
      model: new cls.InspectableDOMNode(rt_id, obj_id),
      show_root: false,
      show_inline: true,
      object_type: 'domenode'
    };
    var cb = _dir_node.bind(null, entry);
    entry.model.expand(cb, obj_id, "subtree");
  }

  var command_map =
  {
    clear: function(rt_id, frame_id, thread_id, script_string)
    {
      console_output_data = [];
      cons_out_update();
    },
    dir: function(rt_id, frame_id, thread_id, script_string)
    {
      var tag = tagManager.set_callback(null, handleEval, [rt_id, null, dir_obj] );
      services['ecmascript-debugger'].requestEval(tag, [rt_id, thread_id, frame_id, script_string]);
    },
    dirxml: function(rt_id, frame_id, thread_id, script_string)
    {
      var tag = tagManager.set_callback(null, handleEval, [rt_id, null, dir_node] );
      services['ecmascript-debugger'].requestEval(tag, [rt_id, thread_id, frame_id, script_string]);
    }
  };

  var submit = function(input)
  {
    var
    frame = window.stop_at.getSelectedFrame(),
    rt_id = frame ? frame.runtime_id : runtimes.getSelectedRuntimeId(),
    frame_id = frame ? frame.index : 0,
    thread_id = frame ? frame.thread_id : 0,
    script_string  = '',
    command = '',
    opening_brace = 0,
    closing_brace = 0,
    tag = 0;

    if(rt_id)
    {
      script_string  = submit_buffer.join('');
      opening_brace = script_string.indexOf('(');
      command = ( opening_brace != -1 && script_string.slice(0, opening_brace) || '' ).
        replace(/ +$/, '').replace(/^ +/, '');
      closing_brace = script_string.lastIndexOf(')');
      if ( command && command in command_map && closing_brace != -1 )
      {
        command_map[command](rt_id, frame_id, thread_id, script_string.slice(opening_brace + 1, closing_brace));
      }
      else if( !/^\s*$/.test(script_string) )
      {
        tag = tagManager.set_callback(null, handleEval, [rt_id] );
        services['ecmascript-debugger'].requestEval(tag, [rt_id, thread_id, frame_id, script_string]);
      }
      submit_buffer = [];
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + " This should never happen");
    }
  }


  var line_buffer_push = function(line)
  {
    line = line.replace(/\r\n/g, "");
    var index = line_buffer.indexOf(line);
    if(index != -1)
    {
      line_buffer.splice(index, 1);
    }
    line_buffer[line_buffer.length] = line;
    if( line_buffer.length > 100 )
    {
      line_buffer = line_buffer.slice(line_buffer.length - 100);
    }
    line_buffer_cursor = line_buffer.length;
  }


  eventHandlers.keydown['commandline'] = function(event)
  {
    /*
      TODO use the Keyhandler Classes
    */
    switch(event.keyCode)
    {
      case 46: // delete
      case 8: // backspace
      {
        __is_tab = false;
      }
      // modifier keys shall not change the autocomplete state
      case 16: // shift
      case 17: // ctrl
      case 18: // alt
      {
        break;
      }
      case 9: // tab
      {
        __is_tab = true;
        break;
      }
      default:
      {
        if( __is_tab )
        {
          if( __selection_start == event.target.selectionStart &&
                  __selection_end == event.target.selectionEnd )
          {
            event.target.selectionStart = __selection_end;
          }
          __is_tab = false;
        }
      }
    }
  }

  eventHandlers.keyup['commandline'] = function(event)
  {
    /*
      TODO use the Keyhandler Classes
    */
    if(event.keyCode == 38 || event.keyCode == 40)
    {
      event.preventDefault();
      return;
    }
    const CRLF = "\r\n";
    var value = event.target.value;
    var lastCRLFIndex = value.lastIndexOf(CRLF);
    if(lastCRLFIndex != -1)
    {
      if ( value.length - 2 != lastCRLFIndex )
      {
        value = value.slice(0, lastCRLFIndex) + value.slice(lastCRLFIndex + 2) + CRLF;
      }
      cons_out_render_input
      (
        console_output_data[console_output_data.length] =
        {
          type: "input-value",
          value: ( submit_buffer.length ? "... " : ">>> " ) + value
        }
      );
      line_buffer_push( submit_buffer[submit_buffer.length] = value );
      if(!event.shiftKey)
      {
        submit();
      }
      __prefix.textContent = submit_buffer.length ? "... " : ">>> ";
      event.target.value = '';
      __container.scrollTop = __container.scrollHeight;
      __textarea.scrollTop = 0;
    }
    __textarea_value = event.target.value;

  }


  eventHandlers.keypress['commandline'] = function(event)
  {
    /*
      TODO use the Keyhandler Classes
    */
    var target = event.target, key_code = event.keyCode;
    if( !(event.shiftKey || event.ctrlKey || event.altKey ) )
    {
      switch(key_code)
      {
        case 38:
        case 40:
        {
          // workaround as long as we don't have support for keyIdentifier
          // event.which is 0 in a keypress event for function keys
          if( !event.which )
          {
            line_buffer_cursor += key_code == 38 ? -1 : 1;
            line_buffer_cursor =
              line_buffer_cursor < 0 ? line_buffer.length-1 : line_buffer_cursor > line_buffer.length-1 ? 0 : line_buffer_cursor;
            __textarea_value = event.target.value = (line_buffer.length ? line_buffer[line_buffer_cursor] : '').replace(/\r\n/g, '');
            event.preventDefault();
            break;
          }
        }
        case 16:
        case 9:
        {
          break;
        }
        default:
        {
          __selection_start = -1;
        }
      }
    }
    if(key_code == 9)
    {
      event.preventDefault();
      if( __selection_start == -1 )
      {
        __selection_start = target.selectionStart;
      }
      var cur_str = target.value.slice(0, __selection_start);
      var suggest = autocomplete.getSuggest(cur_str, event.shiftKey, arguments);
      if( suggest )
      {
        target.value = cur_str + suggest;
        target.selectionStart = __selection_start;
        target.selectionEnd = __selection_end = target.value.length;
      }
    }
  }

  var autocomplete = new function()
  {
    var str_input = '';
    var path = '';
    var id = '';
    var scope = null;
    var current_path = '';
    var match = [];
    var match_cur = 0;
    var local_frame_index = 0;
    var _shift_key = false;
   
    
    const 
    SCRIPT = "(function(path){var a = '', b= ''; for (a in path){b += a + '_,_';}; return b;})(%s)",
    KEY = 0,
    DEPTH = 3;
    
    var make_path_hash = function(rt_id, frame, path)
    {
      return "path_hash_" + (frame ? frame.index : -1) + rt_id + path;
    }

    var handle_stopped_scope = function(status, message, org_args, path_hash)
    {
      // only testing code
      const OBJECT_CHAIN_LIST = 0, OBJECT_LIST = 0, PROPERTY_LIST = 1, NAME = 0;
      scope = (message && 
        (message = message[OBJECT_CHAIN_LIST]) &&
        (message = message[0]) &&
        (message = message[OBJECT_LIST]) &&
        (message = message[0]) &&
        (message = message[PROPERTY_LIST]) ||
        []).map(function(prop){return prop[NAME]});
      current_path = path_hash;
      org_args.callee.apply(null, org_args);
      
    }

    var get_scope = function get_scope(path, old_args, stopped_scope)
    {
      var
      rt_id = runtimes.getSelectedRuntimeId(),
      frame = window.stop_at.getSelectedFrame(),
      frame_id = frame ? frame.index : 0,
      thread_id = frame ? frame.thread_id : 0;

      if (rt_id)
      {
        if (!path && frame === null)
        {
          path = 'this';
        }
        if (make_path_hash(rt_id, frame, path) == current_path)
        {
          return scope;
        }
        if (frame)
        {
          if (!path) // we have to inspected the stopped scope
          {
            // org_args, rt_id, frame_index, path
            var tag = tagManager.set_callback(null, handle_stopped_scope, 
                                              [old_args, make_path_hash(rt_id, frame, path)]);
            services['ecmascript-debugger'].requestExamineObjects(tag, 
                                                                  [rt_id, [frame.scope_id], 0, 1]);
            return null;
          }
        } 
        var tag = tagManager.set_callback(null, handleEvalScope, [make_path_hash(rt_id, frame, path), old_args] );
        services['ecmascript-debugger'].requestEval(tag, [rt_id, thread_id, frame_id, SCRIPT.replace(/%s/, path)]);
      }
      else
      {
        cons_out_render_return_val
        (
          console_output_data[console_output_data.length] =
          {
            type: "return-value",
            value: "Select a window"
          }
        )
      }
      return null;
    }

    var handleEvalScope = function(status, message, path_hash, old_args)
    {
      const
      STATUS = 0,
      TYPE = 1,
      VALUE = 2,
      OBJECT_VALUE = 3;


      if( message[STATUS] == 'completed' )
      {
        if(message[VALUE])
        {
          scope = message[VALUE].split('_,_');
          current_path = path_hash;
          if( !old_args[0].__call_count )
          {
            old_args[0].__call_count = 1;
            old_args.callee.call(null, old_args[0]);
          }
        }
      }
      else
      {
        str_input = current_path = '';
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
          "getting scope failed in autocomplete view-commandline");
      }
    }

    this._move_match_cursor = function(shift_key, delta)
    {
      if(shift_key)
      {
        match_cur -= delta || 1;
        if( match_cur < 0 )
        {
          match_cur = match.length ? match.length - 1 : 0;
        }
      }
      else
      {
        match_cur += delta || 1;
        if( match_cur >= match.length )
        {
          match_cur = 0;
        }
      }
      return shift_key;
    }

    this.getSuggest = function(str, shift_key, old_args)
    {
      if( match.length && shift_key != _shift_key )
      {
        _shift_key = this._move_match_cursor(shift_key, 2);
      }
      if( !str || str != str_input )
      {
        var last_bracket = str.lastIndexOf('['), last_brace = str.lastIndexOf('(');
        last_brace = str.lastIndexOf(')') <= last_brace ? last_brace : -1;
        last_bracket = str.lastIndexOf(']') <= last_bracket ? last_bracket : -1;
        str = str.slice( Math.max(
                  last_brace,
                  last_bracket,
                  str.lastIndexOf('=') ) + 1
                ).replace(/^ +/, '').replace(/ $/, '');

        var
        last_dot = str.lastIndexOf('.'),
        new_path = '',
        new_id = '',
        ret = '';

        if(last_dot > -1)
        {
          new_path = str.slice(0, last_dot);
          new_id = str.slice(last_dot + 1);
        }
        else
        {
          new_id = str;
        }
        if( path != new_path || !scope )
        {
          match = [];
          if( !( scope = get_scope(new_path, old_args) ) )
          {
            return '';
          }
          path = new_path;
        }
        if( !match.length || id != new_id )
        {
          match = [];
          match_cur = 0;
          var prop = '', i = 0;
          for( ; prop = scope[i]; i++)
          {
            if( prop.indexOf(new_id) == 0 )
            {
              match[match.length] = prop;
            }
          }
          id = new_id;
        }
        str_input = str;

      }
      ret = match[match_cur] || '';
      this._move_match_cursor(shift_key);
      return  ret.slice(id.length);
    }

    this.clear = function(frame_index)
    {
      // it could be that this check is too simple
      // basically the global scope is invalided with a new thread
      // but the tab completion feature is not very helpfull
      // with sites with intervals or timeouts
      if( frame_index > -1 || frame_index != local_frame_index )
      {
        local_frame_index = frame_index;
        str_input = '';
        path = '';
        id = '';
        scope = null;
        current_path = '';
        match = [];
        match_cur = 0;
      }
    };


  };

  this.createView = function(container)
  {
    is_debug = ini.debug;
    checkToolbarVisibility();
    container.innerHTML = markup;
    container.scrollTop = container.scrollHeight;
    __container = container;
    __console_output = container.getElementsByTagName('div')[1];
    __console_input = container.getElementsByTagName('div')[2];
    __prefix = __console_input.getElementsByTagName('span')[0];
    __textarea = container.getElementsByTagName('textarea')[0];
    cons_out_update();
  }

  this.ondestroy = function()
  {
    __console_output = null;
    __console_input = null;
    __prefix = null;
  }

  var onFrameSelected = function(msg)
  {
    autocomplete.clear(msg.frame_index);
  }

  var onConsoleMessage = function(msg)
  {
    if( settings['command_line'].get('show-ecma-errors') && msg['source'] == 'ecmascript')
    {
      cons_out_render_return_val
      (
        console_output_data[console_output_data.length] =
        {
          type: "return-value",
          value: msg['context'] + '\n' + msg['description']
        }
      );
      if(__container)
      {
        __container.scrollTop = __container.scrollHeight;
      }
    }
  }

  var checkToolbarVisibility = function(msg)
  {
    var isMultiRuntime = host_tabs.isMultiRuntime();
    if( toolbar_visibility != isMultiRuntime )
    {
      topCell.setTooolbarVisibility('command_line', toolbar_visibility = isMultiRuntime );
    }
  }

  messages.addListener('frame-selected', onFrameSelected);
  messages.addListener('console-message', onConsoleMessage);
  messages.addListener('active-tab', checkToolbarVisibility);

  this.init(id, name, container_class, html, default_handler);

}

cls.CommandLineViewTest.create_ui_widgets = function()
{

  new Settings
  (
    // id
    'command_line',
    // key-value map
    {
      "show-ecma-errors": true,
    },
    // key-label map
    {
      "show-ecma-errors": ui_strings.S_SWITCH_SHOW_ECMA_ERRORS_IN_COMMAND_LINE
    },
    // settings map
    {
      checkboxes:
      [
        "show-ecma-errors"
      ]
    }
  );

  eventHandlers.click['cmd-focus'] = function(event, target)
  {
    target.getElementsByTagName('textarea')[0].focus();
  }

  new ToolbarConfig
  (
    'command_line',
    null,
    null,
    null,
    [
      {
        handler: 'select-window',
        title: ui_strings.S_BUTTON_LABEL_SELECT_WINDOW,
        type: 'dropdown',
        class: 'window-select-dropdown',
        template: window['cst-selects']['cmd-runtime-select'].getTemplate()
      }
    ]
  );
};

cls.CndRtSelect = function(id, class_name)
{

  var selected_value = "";

  this.getSelectedOptionText = function()
  {
    var selected_rt_id = runtimes.getSelectedRuntimeId();
    if( selected_rt_id )
    {
      var rt = runtimes.getRuntime(selected_rt_id);
      if( rt )
      {
        return rt['title'] || helpers.shortenURI(rt.uri).uri;
      }
    }
    return '';
  }

  this.getSelectedOptionValue = function()
  {

  }

  this.templateOptionList = function(select_obj)
  {
    // TODO this is a relict of protocol 3, needs cleanup
    
    var active_window_id = runtimes.getActiveWindowId();

    if( active_window_id )
    {
      var
      _runtimes = runtimes.getRuntimes(active_window_id),
      rt = null,
      i = 0;

      for( ; ( rt = _runtimes[i] ) && !rt['selected']; i++);
      if( !rt && _runtimes[0] )
      {
        opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'no runtime selected')
        return;
      }
      return templates.runtimes(_runtimes, 'runtime');
    }
    
  }

  this.checkChange = function(target_ele)
  {
    var rt_id = parseInt(target_ele.getAttribute('rt-id'));
    if( rt_id && rt_id != runtimes.getSelectedRuntimeId() )
    {
      runtimes.setSelectedRuntimeId(rt_id);
    }
    return true;
  }

  this.init(id, class_name);
};
