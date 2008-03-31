var action_handler = new function()
{
  var handler = function(event)
  {
    var ele = event.target, handler = ele.getAttribute('handler');
    while( !handler && ( ele = ele.parentElement ) )
    {
      handler = ele.getAttribute('handler');
    }
    if( handler && handlers[handler] )
    {
      handlers[handler](event, ele);
    }
  }

  var handlers = {};
  /*
"<examine-objects>" 
  "<tag>" UNSIGNED "</tag>"
  "<runtime-id>" UNSIGNED "</runtime-id>" 
  "<object-id>" UNSIGNED "</object-id>"*
"</examine-objects>"

  {
    var msg = "<runtimes>";
    var tag = tagManager.setCB(this, parseRuntime);
    msg += "<tag>" + tag +"</tag>";
    var i=0, r_t=0;
    for ( ; r_t = arguments[i]; i++)
    {
      msg += "<runtime-id>" + r_t +"</runtime-id>";
    }
    msg += "</runtimes>";
    proxy.POST("/" + service, msg);
  }

  <LI 
  handler="show-frame" 
  runtime_id="1" 
  argument_id="0" 
  scope_id="0" 
  line="3" 
  script_id="1">anonymous line 3 script id 1</LI>

  */

  handlers['show-frame'] = function(event)
  {
    var frame = stop_at.getFrame(event.target['ref-id']);
    // is this schabernack? each frame can be in a different runtime
    var runtime_id = stop_at.getRuntimeId();
    
    if(frame)
    {
      views.frame_inspection.clearView();
      var tag = tagManager.setCB(
        null, 
        responseHandlers.examinFrame, 
        [runtime_id, frame.argument_id, frame.this_id]
        );
      services['ecmascript-debugger'].examineObjects( tag, runtime_id, frame.scope_id );
      if( event.type == 'click' )
      {
        helpers.setSelected(event);
        if( frame.script_id )
        { // assert view.js_source is visible
          views.js_source.showLine( frame.script_id, frame.line - 10 );
          views.js_source.showLinePointer( frame.line, frame.id == 0 );
        }
        else
        {
          views.js_source.clearView();
        }
      }
    }
    else
    {
      opera.postError("missing frame in 'show-frame' handler");
    }

    
  }

  handlers['examine-object'] = function(event)
  {
    var ele = event.target.parentNode, 
      list = null, 
      path_arr = [], 
      cur = ele, 
      par = cur;
    do
    {
      cur = par;
      path_arr.unshift( parseInt( cur.getAttribute( 'ref_index' ) ) );
    }
    while ( ( par = cur.parentElement ) && ( par = par.parentElement ) && par.id != 'examine-objects' );
    var obj = frame_inspection.getObject(path_arr);
    //alert(path_arr +' '+obj);
    if( !obj )
    {
      opera.postError("Error in action_handler handlers['examine-object']");
    }
    if(obj.items.length)
    {
      obj.items = []; // that should be done in frame_inspection
      views.frame_inspection.clearView(path_arr);
      event.target.style.removeProperty('background-position');
    }
    else
    {
      var runtime_id = frame_inspection.getRuntimeId();
      var tag = tagManager.setCB(null, responseHandlers.examinObject, [runtime_id, path_arr]);
      services['ecmascript-debugger'].examineObjects( tag, runtime_id, obj.value );
      event.target.style.backgroundPosition = '0 -11px';
    }
  }

  handlers['show-global-scope'] = function(event) // and select runtime
  {
    var ele = event.target;
    var runtime = runtimes.getRuntimeIdWithURL(ele.firstChild.nodeValue);
    if( runtime )
    {
      views.frame_inspection.clearView();
      frame_inspection.setNewFrame(runtime['runtime-id'] );
      var tag = tagManager.setCB(null, responseHandlers.examinObject, [ runtime['runtime-id'] ]);
      services['ecmascript-debugger'].examineObjects( tag,  runtime['runtime-id'], runtime['object-id'] );
      runtimes.setSelectedRuntime( runtime );
      host_tabs.setActiveTab(runtime['runtime-id']);
      views.runtimes.update();
    }
  }

  handlers['show-scripts'] = function(event)  
  {
    var runtime_id = event.target.getAttribute('runtime_id');
    var scripts = runtimes.getScripts(runtime_id);
    var scripts_container = event.target.parentNode.getElementsByTagName('ul')[0];
    var script = null, i=0;
    if(scripts_container)
    {
      event.target.parentNode.removeChild(scripts_container);
      event.target.style.removeProperty('background-position');
      runtimes.setUnfolded(runtime_id, 'script', false);
    }
    else
    {
      scripts_container =['ul'];
      for( ; script = scripts[i]; i++)
      {
        scripts_container.push(templates.scriptLink(script));
      }
      event.target.parentNode.render(scripts_container);
      event.target.style.backgroundPosition = '0 -11px';
      runtimes.setUnfolded(runtime_id, 'script', true);
    }
  }
  
  handlers['show-stylesheets'] = function(event, target, call_count)
  {
    var rt_id = target.getAttribute('runtime_id');
    var sheets = stylesheets.getStylesheets(rt_id, arguments);
    if(sheets)
    {
      var container = event.target.parentNode.getElementsByTagName('ul')[0];
      var sheet = null, i = 0;
      if(container)
      {
        target.parentNode.removeChild(container);
        target.style.removeProperty('background-position');
        runtimes.setUnfolded(rt_id, 'css', false);
      }
      else
      {
        container = ['ul'];
        for( ; sheet = sheets[i]; i++)
        {
          container.push(templates.sheetLink(sheet, i));
        }
        event.target.parentNode.render(container);
        event.target.style.backgroundPosition = '0 -11px';
        runtimes.setUnfolded(rt_id, 'css', true);
      }
      
    }

    
  }
  
  handlers['display-stylesheet'] = function(event, target, call_count)
  {
    var index = parseInt(target.getAttribute('index'));
    var rt_id = target.parentNode.parentNode.firstChild.getAttribute('runtime_id');
    var rules = stylesheets.getRulesWithSheetIndex(rt_id, index, arguments);
    if(rules)
    {
      stylesheets.setSelectedSheet(rt_id, index, rules);
      topCell.showView(views.stylesheets.id);
      helpers.setSelected(event);
    }
  }

  handlers['show-runtimes'] = function(event)  
  {
    var window_id = event.target.parentNode.getAttribute('window_id');
    var rts = runtimes.getRuntimes(window_id);
    var runtime_container = event.target.parentNode.getElementsByTagName('ul')[0];
    var rt = null, i=0;
    var template_type = event.target.parentNode.parentNode.getAttribute('template-type');
    if(runtime_container)
    {
      event.target.parentNode.removeChild(runtime_container);
      event.target.style.removeProperty('background-position');
      runtimes.setWindowUnfolded(window_id, false);
    }
    else
    {
      event.target.parentNode.render(templates.runtimes(rts, template_type));
      event.target.style.backgroundPosition = '0 -11px';
      runtimes.setWindowUnfolded(window_id, true);
    }
  }

  handlers['show-dom'] = function(event, target)
  {
    var rt_id = target.parentNode.getAttribute('runtime_id');
    var window_id = target.parentNode.parentNode.parentNode.getAttribute('window_id');
    
    if(rt_id)
    {
      topCell.showView('dom-markup-style');
      if( runtimes.getActiveWindowId() != window_id )
      {
        host_tabs.setActiveTab(window_id);
      }
      else
      {
        dom_data.getDOM(rt_id);
      }
      
    }
  }

  handlers['display-script'] = function(event)
  {
    var id  = event.target.getAttribute('script-id');

    if(id)
    {
      // topCell.showView(views.stylesheets.id);
      //views.js_source.showLine(id, 0);
      helpers.setSelected(event);
      var runtime_container = event.target.parentElement.parentElement.getElementsByTagName('span')[0];
      var runtime = runtimes.getRuntimeIdWithURL(runtime_container.firstChild.nodeValue); 
      runtimes.setSelectedScript( runtime, id );
      if( runtime_container && !runtime_container.hasClass('selected-runtime') )
      {
        handlers['show-global-scope']({target: runtime_container});
      }
      views.js_source.update();

      
    }
    else
    {
      opera.postError("missing script id in handlers['display-script']")
    }
  }

  handlers['select-window'] = function(event)
  {
    var parent = event.target.parentNode;
    var id  = parent.getAttribute('window_id');
    helpers.setSelected({target: parent});
    host_tabs.setActiveTab(id);
  }

  handlers['continue'] = function(event)
  {
    views.js_source.clearView();
    views.callstack.clearView();
    views.frame_inspection.clearView();
    stop_at.__continue(event.target.id.slice(9));
  }

  handlers['set-stop-at'] = function(event)
  {
    stop_at.setUserStopAt(event.target.value, event.target.checked);
  }

  handlers['set-break-point'] = function(event)
  {
    var line = event.target.parentElement.children[0].value;
    var script_id = views.js_source.getCurrentScriptId();
    if( line )
    {
      if( runtimes.hasBreakpoint(script_id, line) )
      {
        runtimes.removeBreakpoint(script_id, line);
        views.js_source.removeBreakpoint(line);
      }
      else
      {
        runtimes.setBreakpoint(script_id, line);
        views.js_source.addBreakpoint(parseInt(line));
      }
    }
  }

  handlers['drop-down'] = function(event)
  {
    var ele = event.target;
    var drop_down = document.getElementById('drop-down-view');
    var type = ele.getAttribute('ref');
    if(drop_down)
    {
      //document.body.removeChild(drop_down.parentNode);
    }
    else
    {
      switch(type)
      {
        case 'runtimes':
        {
          if( windows.showWindow('runtimes', 'Runtimes', templates.runtimes_dropdown(ele)) )
          {
            views.runtimes.update();
          }
          break;
        }
        case 'console':
        {
          if( windows.showWindow('console', 'Console', ['div', 'class', 'window-container', 'id', 'console-view']) )
          {
            views.console.update();
          }
          break;
        }
        case 'environment':
        {
          if( windows.showWindow('environment', 'Environment', ['div', 'class', 'window-container', 'id', 'view-environment']) )
          {
            views.environment.update();
          }
          break;
        }
        case 'dom-inspector':
        {
          if( windows.showWindow('dom-inspector', 'DOM Inspector', templates.domInspector()/*['div', 'class', 'window-container', 'id', 'view-dom-inspector']*/) )
          {
            views['dom-inspector'].update();
          }
          break;
        }
        case 'configuration':
        {
          if( windows.showWindow('configuration', 'Stop At', ['div', 'class', 'window-container', 'id', 'configuration']) )
          {
            views.configuration.update();
          }
          break;
        }
        case 'debug':
        {
          if( windows.showWindow
            (
              'debug', 
              'Debug', 
              ['div', 
                ['input', 
                  'type', 'button', 
                  'value', 'clear output', 
                  'onclick', 'debug.clear()'],
                ['input', 
                  'type', 'button', 
                  'value', 'export', 
                  'onclick', 'debug.export()'],
                ['pre', 'id', 'debug'],
              'class', 'window-container', 'id', 'debug-container']
            )
          )
          {
            window.debug.output();
          }
          break;
        }

        case 'testing':
        {
          if( windows.showWindow('Testing', 'Testing', ['div', 'class', 'window-container', 'id', 'testing']) )
          {
            
            testing.view.update();
          }
          break;
        }

        case 'command-line':
        {
          if( windows.showWindow
            (
              'command-line', 
              'Command Line', 
              ['div', 
                ['div',
                  ['input', 
                    'type', 'button', 
                    'value', 'eval', 
                    'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<eval>\\n  <tag>1</tag>\\n  <runtime-id></runtime-id>\\n  <thread-id></thread-id>\\n  <frame-id></frame-id>\\n  <script-data></script-data>\\n</eval>';"],
                  ['input', 
                    'type', 'button', 
                    'value', 'set breakpoint', 
                    'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<add-breakpoint>\\n  <breakpoint-id> x </breakpoint-id>\\n  <source-position>\\n    <script-id> x </script-id>\\n    <line-number> x </line-number>\\n  </source-position>\\n</add-breakpoint>';"],
                  ['input', 
                    'type', 'button', 
                    'value', 'examine obj', 
                    'onclick', "this.parentNode.parentNode.getElementsByTagName('textarea')[0].value='<examine-objects>\\n  <tag>1</tag>\\n  <runtime-id>x</runtime-id>\\n  <object-id>x</object-id>\\n</examine-objects>';"],
                  ['input', 
                    'type', 'button', 
                    'value', 'post', 
                    'style', 'margin-left:10px',
                    'onclick', 'services[\'ecmascript-debugger\'].postCommandline()'],
                'style', 'text-align: right'],
                ['div', ['textarea'], 'id', 'command-line-container'],
              'class', 'window-container', 'id', 'command-line']
            )
          )
          {
            window.debug.output();
          }
          break;
        }       
      }
    }

  }

  handlers['get-children'] = function(event)
  {
    var container = event.target.parentNode;
    var level = ( parseInt(container.style.marginLeft) || 0 ) / 16;
    var level_next = ( container.nextSibling && parseInt(container.nextSibling.style.marginLeft) || 0 ) / 16;
    var ref_id = container.getAttribute('ref-id');
    if(level_next > level)
    {
      dom_data.closeNode(ref_id);
    }
    else
    {
      dom_data.getChildernFromNode(ref_id);
    }
    
  }

  handlers['spotlight-node'] = function(event, current_target)
  {
    var rt_id = dom_data.getDataRuntimeId(); // is this the correst way?
    var obj_id = current_target.getAttribute('ref-id');
    if(obj_id && !handlers['spotlight-node'].timeout )
    {
      services['ecmascript-debugger'].spotlight(rt_id, obj_id, true);
      handlers['spotlight-node'].timeout = setTimeout(handlers['spotlight-node'].clearSpotlight, 800, rt_id);
      dom_data.setCurrentTarget(obj_id);
      views['dom-markup-style'].updateTarget(current_target);
    }
  }

  handlers['spotlight-node'].timeout = 0;
  handlers['spotlight-node'].clearSpotlight = function(rt_id)
  {
    services['ecmascript-debugger'].clearSpotlight(rt_id);
    handlers['spotlight-node'].timeout = 0;
  }

  handlers['create-all-runtimes'] = function()
  {
    services['ecmascript-debugger'].createAllRuntimes();
  }

  handlers['update-global-scope'] = function(event)
  {
    handlers['show-frame']({'target': { 'ref-id': 0 } });
  }

  handlers['dom-inspection-export'] = function(event)
  {
    export_data.data = views['dom-markup-style'].exportMarkup();
    topCell.showView('export_data');
  }
/*
<category>
          <header>
            <input type="button"  handler="css-toggle-category"  cat-id="computedStyle"  class="unfolded" />
            computed style
          </header>
          <styles/>
        </category>
        */
  handlers['css-toggle-category'] = function(event, target)
  {
    var cat = target.getAttribute('cat-id'), value = target.hasClass('unfolded');
    var cat_container = target.parentNode.parentNode;
    if( value )
    {
      target.removeClass('unfolded');
      cat_container.removeClass('unfolded');
      var styles = cat_container.getElementsByTagName('styles')[0];
      if( styles )
      {
        styles.innerHTML = "";
      }
    }
    else
    {
      target.addClass('unfolded');
      cat_container.addClass('unfolded');
    }
    elementStyle.setUnfoldedCat( cat , !value);
    settings['css-inspector'].set(cat, !value);
  }



  this.post = function(handler, event)
  {
    if(handlers[handler])
    {
      handlers[handler](event);
    }
  }

  document.addEventListener('click', handler, false);
}
