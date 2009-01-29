﻿var cls = window.cls || ( window.cls = {} );

cls.JsSourceView = function(id, name, container_class)
{

  // TODO this view can just be visible once at the time otherwise there will be problems
  // this must be refactored. line_arr, state_arr, breakpoints must be added to the script object
  // getting context values must move out of this class
  // split out one general class to handle partial view ( yield count of lines )

  var self = this;
  var frame_id = 'js-source';
  var container_id = 'js-source-content';
  var container_line_nr_id = 'js-source-line-numbers';
  var scroll_id = 'js-source-scroller';
  var scroll_container_id = 'js-source-scroll-container';
  var container_breakpoints_id = 'break-point-container';
  var horizontal_scoller = 'js-source-scroll-content';

  var context = {};

  var setup_map =
  [
    {
      id: frame_id,
      property: 'height',
      target: 'container-height',
      getValue: function(){return document.getElementById(this.id).clientHeight}
    },
    {
      id: 'test-line-height',
      property: 'lineHeight',
      target: 'line-height',
      getValue: function(){return parseInt(document.getElementById(this.id).currentStyle[this.property])}
    },
    {
      id: 'test-scrollbar-width',
      target: 'scrollbar-width',
      getValue: function(){return ( 100 - document.getElementById(this.id).offsetWidth )}
    }
  ];

  var script = {};

  var source_content = null;

  var line_numbers = null;

  var max_lines = 0;

  

  var __current_line = 0;
  var __current_pointer = 0;
  var __current_pointer_type = 0;  // 2 for top frame, else 4

  var __scroll_interval = 0;
  var __scrollEvent = 0;
  var __target_scroll_top = -1;

  var __keyEvent = 0;

  var __isHorizontalScrollbar = false;

  var __timeoutUpdateLayout = 0;

  var templates = {};

  var __timeout_clear_view = 0;
  var __container = null;
  var view_invalid = true;

  templates.line_nummer_container = function(lines)
  {
    var ret = ['ul'], i = 0;
    for( ; i<lines; i++)
    {
      ret[ret.length] = templates.line_nummer();
    }
    return ret.concat(['id', container_line_nr_id]);
  }

  templates.line_nummer = function()
  {
    return ['li',
      ['input', 'disabled', 'disabled'],
      ['span', 'handler', 'set-break-point'],
    ];
  }

  var updateLineNumbers = function(fromLine)
  {
    var lines = line_numbers.getElementsByTagName('input'), line = null, i=0;
    var breakpoints = line_numbers.getElementsByTagName('span');
    if( script.breakpoints )
    {
      for( ; line = lines[i]; i++)
      {
        line.value = fromLine++;
      }
      updateBreakpoints();
    }
    else
    {
      lines[0].value = 1;
    }
  }

  var clearLineNumbers = function()
  {
    var lines = line_numbers.getElementsByTagName('input'), line = null, i=0;
    
    var breakpoints = line_numbers.getElementsByTagName('span');


    for( ; line = lines[i]; i++)
    {
      if( i == 0 )
      {
        line.value = '1';
      }
      else
      {
        line.value = '';
      }
      breakpoints[i].style.removeProperty('background-position');
    }


  }

  var updateBreakpoints = function()
  {
    var breakpoints = line_numbers.getElementsByTagName('span'), breakpoint = null, i=0;
    var script_breakpoints = script.breakpoints;
    var line_height = context['line-height'];
    if( script_breakpoints )
    {
      for( ; breakpoint = breakpoints[i]; i++)
      {
        if( script_breakpoints[ __current_line + i ] )
        {
          breakpoint.style.backgroundPosition=
            '0 ' + ( -1 * script_breakpoints[ __current_line + i ] * line_height ) + 'px';
        }
        else
        {
          breakpoint.style.removeProperty('background-position');
        }
      }
    }
  }

  this.createView = function(container)
  {
    // TODO this must be refactored
    // the challenge is to do as less as possible in the right moment
    
    view_invalid = view_invalid 
    && script.id 
    && runtimes.getSelectedScript() 
    && runtimes.getSelectedScript() != script.id 
    || !runtimes.getSelectedScript();
    if( view_invalid )
    {
      script = {};
      __current_line = 0;
      __current_pointer = 0;
      __current_pointer_type = 0; 
    }
    __container = container;
    frame_id = container.id;
    container.innerHTML = \
      "<div id='js-source-scroll-content'>"+
        "<div id='js-source-content'></div>"+
      "</div>"+
      "<div id='js-source-scroll-container' handler='scroll-js-source'>"+
        "<div id='js-source-scroller'></div>"+
      "</div>";
    if( !context['line-height'] )
    {
      context['line-height'] = defaults['js-source-line-height'];
      context['scrollbar-width'] = defaults['scrollbar-width'];
    }
    context['container-height'] = parseInt(container.style.height);
    var set = null, i = 0;
    source_content = document.getElementById(container_id);
    if(source_content)
    {
      max_lines = context['container-height'] / context['line-height'] >> 0;
      var lines = document.getElementById(container_line_nr_id);
      if( lines )
      {
        lines.parentElement.removeChild(lines);
      }
      container.render(templates.line_nummer_container(max_lines || 1));
      line_numbers = document.getElementById(container_line_nr_id);

      var selected_script_id = runtimes.getSelectedScript();  

      if(selected_script_id && selected_script_id != script.id)
      {
        var stop_at = runtimes.getStoppedAt(selected_script_id);
        if(stop_at && stop_at[0])
        {
          var line = parseInt( stop_at[0]['line-number'] );
          var plus_lines = max_lines <= 10 
            ? max_lines / 2 >> 0 
            : 10;
          this.showLine(selected_script_id, line - plus_lines);
          this.showLinePointer( line, true );
        }
        else
        {
          this.showLine(selected_script_id, 0);
        }
      }
      else if( script.id )
      {
        setScriptContext(script.id, __current_line);
        this.showLine( script.id, __current_line );
      }
      else
      {
        updateLineNumbers(0);
      }
      
    }
  }

  this.onresize = function(container)
  {
    if(this.isvisible())
    {
      this.createView(container);
      messages.post('view-created', {id: this.id, container: container});
    }
  }


  var updateLayout = function()
  {
    // not used
    if( source_content && source_content.innerHTML )
    {
      source_content.innerHTML = '';
    }
    if( !__timeoutUpdateLayout )
    {
      __timeoutUpdateLayout = setTimeout(__updateLayout, 60);
    }
  }

  var __updateLayout = function()
  {
    if( script.line_arr )
    {
      self.setup();
      setScriptContext(script.id, __current_line);
      self.showLine(script.id, __current_line);
    }
    else
    {
      self.setup(1);
    }
    __timeoutUpdateLayout = 0;
  }

  var getMaxLineLength = function()
  {
    var time = new Date().getTime();
    var i = 0, 
      max = 0, 
      max_index = 0, 
      previous = 0, 
      line_arr = script.line_arr, 
      length = line_arr.length;
    for( ; i < length; i++)
    {
      if( ( line_arr[i] - previous ) > max )
      {
        max = line_arr[i] - previous;
        max_index = i;
      }
      previous = line_arr[i];
    }
    return max_index;
  }

  var setScriptContext = function(script_id, line_nr)
  {
    source_content.innerHTML = "<div style='visibility:hidden'>" +
      simple_js_parser.parse(script, getMaxLineLength() - 1, 1).join('') + "</div>";
    var scrollWidth = source_content.firstChild.firstChild.scrollWidth;
    var offsetWidth = source_content.firstChild.firstChild.offsetWidth;

    if( scrollWidth > offsetWidth )
    {
      max_lines = ( context['container-height'] - context['scrollbar-width'] )/ context['line-height'] >> 0;
      document.getElementById(scroll_container_id).style.bottom = context['scrollbar-width'] + 'px';
      source_content.style.width = scrollWidth +'px';
    }
    else
    {
      max_lines = context['container-height'] / context['line-height'] >> 0;
      document.getElementById(scroll_container_id).style.removeProperty('bottom');
      source_content.style.removeProperty('width');
    }
    
    if( max_lines > script.line_arr.length )
    {
      max_lines = script.line_arr.length;
    }
    var lines = document.getElementById(container_line_nr_id);

    if( lines )
    {
      lines.parentElement.removeChild(lines);
    }
    document.getElementById(frame_id).render(templates.line_nummer_container(max_lines));
    line_numbers = document.getElementById(container_line_nr_id);
    source_content.style.height = ( context['line-height'] * max_lines ) +'px';

    var scrollHeight = script.line_arr.length * context['line-height'];
    document.getElementById(scroll_id).style.height = scrollHeight + 'px';
    if( scrollHeight > context['line-height'] * max_lines )
    {
      document.getElementById(horizontal_scoller).style.right =
        context['scrollbar-width'] + 'px';
    }
    else
    {
      document.getElementById(horizontal_scoller).style.right = '0px';
    }

    return true;
  }

  var clearScriptContext = function()
  {
    max_lines = 1;
    document.getElementById(scroll_container_id).style.removeProperty('bottom');
    source_content.style.removeProperty('width');
    var lines = document.getElementById(container_line_nr_id);
    lines.parentElement.removeChild(lines);
    document.getElementById(frame_id).render(templates.line_nummer_container(max_lines));
    document.getElementById(scroll_id).style.height = 'auto';
    document.getElementById(horizontal_scoller).style.right = '0px';
  }



  this.showLine = function(script_id, line_nr) // return boolean for the visibility of this view
  {
    // too often called?


    if( __timeout_clear_view )
    {
      __timeout_clear_view = clearTimeout( __timeout_clear_view );
    }

    var is_visible = ( source_content = document.getElementById(container_id) ) ? true : false; 
    
    if( script.id != script_id )
    {
      var script_obj = runtimes.getScript(script_id);

      if( script_obj )
      {
        if( !script_obj.line_arr )
        {
          script_obj.source_data = new String(script_obj['script-data']);
          script_obj.line_arr = [];
          script_obj.state_arr = [];
          pre_lexer(script_obj);
        }
        script =
        {
          id: script_id,
          source: script_obj.source_data,
          line_arr: script_obj.line_arr,
          state_arr: script_obj.state_arr,
          breakpoints: [],
          has_context: false
        }
        var b_ps = runtimes.getBreakpoints(script_id), b_p = '';
        if( b_ps )
        {
          for( b_p in b_ps )
          {
            script.breakpoints[parseInt(b_p)] = 1;
          }
        }
        __current_pointer = 0;
        __current_pointer_type = 0;
        if( is_visible )
        {
          script.has_context = setScriptContext(script_id, line_nr);
        }
        
        messages.post('script-selected', {script: script});

      }
      else
      {
        opera.postError("script source is missing for given id in views.js_source.showLine");
        return;
      }
    }
    if( line_nr < 1 )
    {
      line_nr = 1;
    }
    else if( line_nr > script.line_arr.length - max_lines )
    {
      line_nr = script.line_arr.length - max_lines + 1;
    }
    __current_line = line_nr;
    if( is_visible )
    {
      if( !script.has_context )
      {
        script.has_context = setScriptContext(script_id, line_nr);
      }
      source_content.innerHTML = 
        simple_js_parser.parse(script, line_nr - 1, max_lines - 1).join(''); 
      updateLineNumbers(line_nr);


      if(  !__scroll_interval )
      {
        var scroll_container = document.getElementById(scroll_container_id), 
          scroll_lines = scroll_container.scrollTop / context['line-height'] >> 0; 
        if ( ( scroll_lines < __current_line - 5 ) || ( scroll_lines > __current_line + 6 ) ) 
        {
          __target_scroll_top = scroll_container.scrollTop = (__current_line - 1 ) * context['line-height'];
        }
      }
    }
    view_invalid = false;
    
    return is_visible;

  }
  
  this.getTopLine = function()
  {
    return __current_line;
  }

  this.getMaxLines = function()
  {
    return max_lines;
  }

  this.getBottomLine = function()
  {
    return __current_line + max_lines;
  }

  /* first allays use showLine */
  this.showLinePointer = function(line, is_top_frame)
  {
    var script_breakpoints = script.breakpoints;
    // TODO fix from Johannes. Why is that needed?
    if (!script_breakpoints) {
      return;
    }
    if( __current_pointer )
    {
      script_breakpoints[ __current_pointer ] -= __current_pointer_type;
    }
    __current_pointer = line;
    __current_pointer_type = is_top_frame ? 2 : 4;
    if( !script_breakpoints[ line ] )  script_breakpoints[ line ] = 0;
    script_breakpoints[ line ] += __current_pointer_type;
    updateBreakpoints();
  }

  this.clearLinePointer = function()
  {
    if( __current_pointer )
    {
      script.breakpoints[ __current_pointer ] -= __current_pointer_type;
    }
    __current_pointer = 0;
    __current_pointer_type = 0;
  }

  this.addBreakpoint = function(line)
  {
    if( !script.breakpoints[ line ] )  script.breakpoints[ line ] = 0;
    script.breakpoints[line] += 1;
    updateBreakpoints();
  }

  this.removeBreakpoint = function(line)
  {
    script.breakpoints[line] -= 1;
    updateBreakpoints();
  }

  this.scroll = function()
  {
    if( view_invalid )
    {
      return;
    }
    if(!__scroll_interval && script.id)
    {
      __scroll_interval = setInterval(__scroll, 60);
    }
    __scrollEvent = new Date().getTime() + 100;
    
  }

  var __scroll = function()
  {
    var top = document.getElementById(scroll_container_id).scrollTop;
    if( __target_scroll_top == top )
    {
      __scroll_interval = clearInterval(__scroll_interval);
    }
    else
    {
      __target_scroll_top = -1;
      var target_line = ( top / context['line-height'] >> 0 ) + 1;
      if( __keyEvent )
      {
        
        target_line = __keyEvent;     
      }
      if(new Date().getTime() > __scrollEvent )
      {
        __scroll_interval = clearInterval(__scroll_interval);
        self.showLine( script.id, target_line);
        __keyEvent = 0;
      }
      else
      {
        self.showLine( script.id, ( ( __current_line + target_line ) / 2 ) >> 0);
      }
    }
  }
  
  this.scrollUp = function()
  {
    __keyEvent = __current_line - 38;
    if( __keyEvent < 1 ) __keyEvent = 1;
    self.scroll();
  }

  this.scrollDown = function()
  {
    __keyEvent = __current_line + 38;
    self.scroll();
  }

  this.getCurrentScriptId = function()
  {
    return script.id;
  }

  this.getCurrentScriptId = function()
  {
    return script.id;
  }

  this.clearView = function()
  {
    if( !__timeout_clear_view )
    {
      __timeout_clear_view = setTimeout( __clearView, 50);
    }
  }

  var __clearView = function()
  {
    if( ( source_content = document.getElementById(container_id) ) && source_content.parentElement )
    {
      var 
      divs = source_content.parentElement.parentElement.getElementsByTagName('div'), 
      div = null, 
      i = 0;

      source_content.innerHTML = '';
      for( ; div = divs[i]; i++)
      {
        div.removeAttribute('style');
      }
      clearLineNumbers();
    }
    self.clearLinePointer();
    __current_line = 0;
    __timeout_clear_view = 0;
    view_invalid = true;      
  }

  var onRuntimeDestroyed = function(msg)
  {
    // TODO this is not good, clean up the the local script
    if( script && runtimes.getRuntimeIdWithScriptId(script.id) == msg.id )
    {
      __clearView();
    }

  }
  

  this.init(id, name, container_class);
  messages.addListener('update-layout', updateLayout);
  messages.addListener('runtime-destroyed', onRuntimeDestroyed);

}

cls.JsSourceView.prototype = ViewBase;
new cls.JsSourceView('js_source', ui_strings.M_VIEW_LABEL_SOURCE, 'scroll js-source');


cls.helper_collection || ( cls.helper_collection = {} );

cls.helper_collection.getSelectedOptionText = function()
{
  // TODO handle runtimes with no scripts
  var selected_script_id = runtimes.getSelectedScript();
  if( selected_script_id )
  {
    var script = runtimes.getScript(selected_script_id);
    var display_uri = helpers.shortenURI(script['uri']);
    if( script )
    {
      return ( 
        display_uri.uri
        ? display_uri.uri
        : ui_strings.S_TEXT_ECMA_SCRIPT_SCRIPT_ID + ': ' + script['script-id'] 
      )
    }
    else
    {
      opera.postError('missing script in getSelectedOptionText in cls.ScriptSelect');
    }
  }
  return '';
}


cls.ScriptSelect = function(id, class_name)
{

  var selected_value = "";

  var stopped_script_id = '';

  this.getSelectedOptionText = cls.helper_collection.getSelectedOptionText;

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
        opera.postError('no runtime selected')
        return;
      }
      return templates.runtimes(_runtimes, 'script', [stopped_script_id, runtimes.getSelectedScript()]);
    }
  }

  this.checkChange = function(target_ele)
  {
    var script_id = target_ele.getAttribute('script-id');

    if(script_id)
    {
      // TODO is this needed?
      runtimes.setSelectedScript( script_id );
      topCell.showView(views.js_source.id);
    }
    else
    {
      opera.postError("missing script id in handlers['display-script']")
    }
    selected_value = target_ele.textContent;
    // TODO
    
    return true;
  }

  // this.updateElement

  var onThreadStopped = function(msg)
  {
    stopped_script_id = msg.stop_at['script-id'];
  }

  var onThreadContinue = function(msg)
  {
    stopped_script_id = '';
  }

  var onApplicationSetup = function()
  {
    eventHandlers.change['set-tab-size']({target: {value:  settings.js_source.get('tab-size')}});
  }

  messages.addListener("thread-stopped-event", onThreadStopped);
  messages.addListener("thread-continue-event", onThreadContinue);
  messages.addListener("application-setup", onApplicationSetup);
  

  this.init(id, class_name);
}

cls.ScriptSelect.prototype = new CstSelect();

new cls.ScriptSelect('js-script-select', 'script-options');



new ToolbarConfig
(
  'js_source',
  [
    {
      handler: 'continue',
      title: ui_strings.S_BUTTON_LABEL_CONTINUE,
      id: 'continue-run',
      disabled: true
    },
    {
      handler: 'continue',
      title: ui_strings.S_BUTTON_LABEL_STEP_INTO,
      id: 'continue-step-into-call',
      disabled: true
    },
    {
      handler: 'continue',
      title: ui_strings.S_BUTTON_LABEL_STEP_OVER,
      id: 'continue-step-next-line',
      disabled: true
    },
    {
      handler: 'continue',
      title: ui_strings.S_BUTTON_LABEL_STEP_OUT,
      id: 'continue-step-out-of-call',
      disabled: true
    }
  ],
  [
    {
      handler: 'js-source-text-search',
      title: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH,
      label: ui_strings.S_INPUT_DEFAULT_TEXT_SEARCH
    }
  ],
  null,
  [
    {
      handler: 'select-window',
      title: ui_strings.S_BUTTON_LABEL_SELECT_WINDOW,
      type: 'dropdown',
      class: 'window-select-dropdown',
      template: window['cst-selects']["js-script-select"].getTemplate()
    }
  ]
);



new Settings
(
  // id
  'js_source',
  // key-value map
  {
    script: 0, 
    exception: 0, 
    error: 0, 
    abort: 0,
    'tab-size': 4
  }, 
  // key-label map
  {
    script: ui_strings.S_BUTTON_LABEL_STOP_AT_THREAD, 
    exception: ui_strings.S_BUTTON_LABEL_AT_EXCEPTION, 
    error: ui_strings.S_BUTTON_LABEL_AT_ERROR, 
    abort: ui_strings.S_BUTTON_LABEL_AT_ABORT,
    'tab-size': ui_strings.S_LABEL_TAB_SIZE
  }, 
  // settings map
  {
    checkboxes:
    [
      'script',
      'exception',
      'error',
      'abort'
    ],
    customSettings:
    [
      'hr',
      'tab-size'
    ]
  },
  // custom templates
  {
    'hr':
    function(setting)
    {
      return ['hr'];
    },
    'tab-size':
    function(setting)
    {
      return \
      [
        'setting-composite', 
        ['label', 
          setting.label_map['tab-size'] + ': ',
          ['input',
            'type', 'number',
            'handler', 'set-tab-size',
            'max', '8',
            'min', '0',
            'value', setting.get('tab-size')
          ]
        ]
      ];
    }
  }
);

new Switches
(
  'js_source',
  [
    'script',
    'error',
    'threads.log-threads'
  ]
);


(function()
{
  var textSearch = new VirtualTextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'js_source' )
    {
      textSearch.setContainer(msg.container);
      textSearch.setFormInput(views.js_source.getToolbarControl( msg.container, 'js-source-text-search'));
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'js_source' )
    {
      textSearch.cleanup();
    }
  }
  
  var onScriptSeleceted = function(msg)
  {
    textSearch.setScript(msg.script);
  }



  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);
  messages.addListener('script-selected', onScriptSeleceted);
  
  

  eventHandlers.input['js-source-text-search'] = function(event, target)
  {
    textSearch.searchDelayed(target.value);
  }

  eventHandlers.keyup['js-source-text-search'] = function(event, target)
  {
    if( event.keyCode == 13 )
    {
      textSearch.highlight();
    }
  }

})()

eventHandlers.change['set-tab-size'] = function(event, target)
{
  var 
  style = document.styleSheets.getDeclaration("#js-source-content div"),
  tab_size = event.target.value;

  if(style && /[0-8]/.test(tab_size))
  {
    style.setProperty('-o-tab-size', tab_size, 0);
    settings.js_source.set('tab-size', tab_size);
  }
}
