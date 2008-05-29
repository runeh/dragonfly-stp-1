(function()
{
  View = function(id, name, container_class, html, default_handler)
  {

    var self = this;

    var __frame_index = -1;

    var __console_output = null;
    var __console_input = null;
    var __prefix = null;

    var submit_buffer = [];
    var line_buffer = [];
    var line_buffer_cursor = 0;

    var __selection_start = -1;



    var handleEval = function(xml, runtime_id, obj_id)
    {
      var value_type = xml.getNodeData('data-type');
      var status = xml.getNodeData('status');
      if( status == 'completed' )
      {
        var return_value = xml.getElementsByTagName('string')[0];
        if(return_value)
        {
          var value = return_value.firstChild && return_value.firstChild.nodeValue || ''; 
          if( !obj_id )
          {
            switch (value_type)
            {
              case 'string':
              {
                value = '"' + value + '"';
                break;
              }
              case 'null':
              case 'undefined':
              {
                value = value_type;
                break;
              }
            }
          }
          __console_output.render
          (
            ['pre', value ].concat( 
                      obj_id 
                      ? ['handler', 'inspect-object-link', 'rt-id', runtime_id, 'obj-id', obj_id] 
                      : [] )
          );
          var container = __console_output.parentNode.parentNode;
          container.scrollTop = container.scrollHeight;
        }
        else if (return_value = xml.getElementsByTagName('object-id')[0])
        {
          var object_id = return_value.textContent;
          var object_ref_name = "$" + object_id;
          var tag = tagManager.setCB(null, handleEval, [runtime_id, object_id] );
          var script_string  = "return " + object_ref_name + ".toString()";
          services['ecmascript-debugger'].eval(
            tag, runtime_id, '', '', "<![CDATA["+script_string+"]]>", [object_ref_name, object_id]);
        }
      }
      else
      {
        var error_id = xml.getNodeData('object-id');
        if( error_id )
        {
          var tag = tagManager.setCB(null, handleError);
          services['ecmascript-debugger'].examineObjects(tag, runtime_id, error_id);
        }
      }
      
    }

    var handleError = function(xml)
    {
      var return_value = xml.getElementsByTagName('string')[0];
      if(return_value)
      {
        __console_output.render(['pre', return_value.firstChild.nodeValue]);
        var container = __console_output.parentNode.parentNode;
        container.scrollTop = container.scrollHeight;
      }
    }

    var markup = "\
      <div class='padding'>\
        <div class='console-output'></div>\
        <div class='console-input' handler='console-focus-input'>\
          <span class='commandline-prefix'>&gt;&gt;&gt; </span>\
          <div><textarea handler='commandline' rows='1' title='hold shift to add a new line'></textarea></div>\
        </div>\
      </div>";

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

    var submit = function(input)
    {
      var 
      rt_id = runtimes.getSelectedRuntimeId(),
      frame_id = '', 
      thread_id = '';

      if(rt_id)
      {
        if( __frame_index > -1 )
        {
          frame_id = __frame_index;
          thread_id = stop_at.getThreadId();

          //opera.postError(JSON.stringify(frame_inspection.getSelectedObjectData()));
        }
        var tag = tagManager.setCB(null, handleEval, [rt_id] );
        var script_string  = submit_buffer.join('');
        services['ecmascript-debugger'].eval(tag, rt_id, thread_id, frame_id, "<![CDATA["+script_string+"]]>");
        submit_buffer = [];
      }
      else
      {
        alert('select a runtime');
      }
    }



    var line_buffer_push = function(line)
    {
      line_buffer[line_buffer.length] = line.replace(/\r\n/g, "");
      if( line_buffer.length > 100 )
      {
        line_buffer = line_buffer.slice(line_buffer.length - 100);
      }
      line_buffer_cursor = line_buffer.length;
    }

    eventHandlers.keyup['commandline'] = function(event)
    {
      if(event.keyCode == 38 || event.keyCode == 40)
      {
        
        line_buffer_cursor += event.keyCode == 38 ? -1 : 1;
        line_buffer_cursor = 
          line_buffer_cursor < 0 ? line_buffer.length-1 : line_buffer_cursor > line_buffer.length-1 ? 0 : line_buffer_cursor;
        event.target.value = (line_buffer.length ? line_buffer[line_buffer_cursor] : '').replace(/\r\n/g, ''); 
        event.preventDefault();
        return;
      }
      const CRLF = "\r\n";
      var value = event.target.value;
      var lastCRLFIndex = value.lastIndexOf(CRLF);
      if(lastCRLFIndex != -1)
      {
        if ( value.length -2 != lastCRLFIndex )
        {
          value = value.slice(0, lastCRLFIndex) + value.slice(lastCRLFIndex + 2) + CRLF;
        }
        __console_output.render(
          ['div', ( submit_buffer.length ? "... " : ">>> " ) + value, 'class', 'log-entry']);
        line_buffer_push( submit_buffer[submit_buffer.length] = value );
        if(!event.shiftKey)
        {
          submit();
        }
        __prefix.textContent = submit_buffer.length ? "... " : ">>> ";
        event.target.value = '';
        var container = __console_output.parentNode.parentNode;
        container.scrollTop = container.scrollHeight;
      }

    }

    
    eventHandlers.keypress['commandline'] = function(event)
    {
      var target = event.target;
      switch(event.keyCode)
      {
        case 16:
        {
          break;
        }
        case 9:
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
          }
          break;
        }
        default:
        {
          __selection_start = -1;
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
     
      
      const 
      SCRIPT = "(function(){var a = '', b= ''; for( a in %s ){ b += a + '_,_'; }; return b; })()",
      KEY = 0,
      DEPTH = 3;

      var get_scope = function(path, old_args)
      {
        
        var 
        rt_id = runtimes.getSelectedRuntimeId(),
        frame_id = '', 
        thread_id = '';

        if(rt_id)
        {
          if( !path && __frame_index == -1 )
          {
            path = 'this';
          }
          if( __frame_index.toString() + rt_id + path == current_path )
          {
            return scope;
          }
          if( __frame_index > -1 )
          {
            frame_id = __frame_index;
            thread_id = stop_at.getThreadId();
            if( !path )
            {
              var selectedObject = frame_inspection.getSelectedObject()
              var data = frame_inspection.getData(selectedObject.rt_id, selectedObject.obj_id, -1, arguments);
              if( data )
              {
                var i = 2, prop = null;
                scope = [];
                for( ; prop = data[i]; i++ )
                {
                  if( prop[DEPTH] == 0 )
                  {
                    scope[scope.length] = prop[KEY];
                  }
                }
                current_path = __frame_index.toString() + rt_id + path;
                return scope;
              }
              else
              {
                return null;
              }
            }
          }
          var tag = tagManager.setCB(null, handleEvalScope, [__frame_index, rt_id, path, old_args] );
          services['ecmascript-debugger'].eval(tag, rt_id, thread_id, 
            frame_id, "<![CDATA["+SCRIPT.replace(/%s/, path)+"]]>");
        }
        else
        {
          alert('select a window');
        }
        return null;
      }

      var handleEvalScope = function(xml, __frame_index, rt_id, path, old_args)
      {
        var status = xml.getNodeData('status');
        if( status == 'completed' )
        {
          var return_value = xml.getElementsByTagName('string')[0];
          if(return_value)
          {
            scope = return_value.textContent.split('_,_');
            current_path = __frame_index.toString() + rt_id + path;
            if( !old_args[0].__call_count )
            {
              old_args[0].__call_count = 1;
              old_args.callee.call(null, old_args[0]);
            }
          }
        }
        else
        {
           opera.postError("getting scope failed in autocomplete view-commandline");
        }
      }

      this.getSuggest = function(str, shift_key, old_args)
      {
        if( !str || str != str_input )
        {
          var last_dot = str.lastIndexOf('.'), new_path = '', new_id = '', ret = '';
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
        if(shift_key)
        {
          match_cur--;
          if( match_cur < 0 )
          {
            match_cur = match.length ? match.length - 1 : 0;
          }
        }
        else
        {
          match_cur++;
          if( match_cur >= match.length )
          {
            match_cur = 0;
          }
        }

        return  ret.slice(id.length);
      }

      this.clear = function(frame_index)
      {
        // it could be that this check is too simple
        // basically the global scope is invalided with a new thread
        // but the tab completion feature is not very helpfull 
        // with sites with intervals or timeouts
        if( frame_index == -1 && frame_index != local_frame_index )
        {
          local_frame_index = -1;
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
      container.innerHTML = markup;
      container.scrollTop = container.scrollHeight;
      __console_output = container.getElementsByTagName('div')[1];
      __console_input = container.getElementsByTagName('div')[2];
      __prefix = __console_input.getElementsByTagName('span')[0];
    }

    this.ondestroy = function()
    {
      __console_output = null;
      __console_input = null;
      __prefix = null;
    }

    var onFrameSelected = function(msg)
    {
      __frame_index = msg.frame_index;
      autocomplete.clear(__frame_index);
    }

    messages.addListener('frame-selected', onFrameSelected);

    this.init(id, name, container_class, html, default_handler);

  }

  View.prototype = ViewBase;
  new View('command_line', ui_strings.VIEW_LABEL_COMMAND_LINE, 'scroll', '', 'cmd-focus');

  eventHandlers.click['cmd-focus'] = function(event, target)
  {
    target.getElementsByTagName('textarea')[0].focus();
  }
})()