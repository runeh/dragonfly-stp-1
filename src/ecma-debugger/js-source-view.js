(function(){ window.views = window.views || {}; })();

views.js_source = new function()
{
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
      getValue: function(){return parseInt(document.getElementById(this.id).style.height)}
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

  var __keyEvent = 0;

  var __isHorizontalScrollbar = false;

  var __timeoutUpdateLayout = 0;

  var templates = {};

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
    var script_breakpoints = script.breakpoints;
    if( script_breakpoints )
    {
      for( ; line = lines[i]; i++)
      {
        line.value = fromLine;
        if( script_breakpoints[ fromLine++ ] )
        {
          breakpoints[i].style.backgroundPosition='0 50%';
        }
        else
        {
          breakpoints[i].style.removeProperty('background-position');
        }
      }
      updateBreakpoints();
    }
    else
    {
      lines[0].value = 1;
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

  this.setupBasics = function()
  {
    var frame = document.getElementById(frame_id);
    if( frame )
    {
      frame.innerHTML = "<div id='js-source-scroll-content'>"+
          "<div id='js-source-content'></div>"+
        "</div>"+
        "<div id='js-source-scroll-container' handler='scroll-js-source'>"+
          "<div id='js-source-scroller'></div>"+
        "</div>";
    }
  }

  var updateLayout = function()
  {
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

  this.setup = function(line)
  {
    var set = null, i = 0;
    source_content = document.getElementById(container_id);
    if(source_content)
    {
      source_content.innerHTML = "<div id='test-line-height' style='visibility:hidden'>test<div>"+
        "<div style='position:absolute;width:100px;height:100px;overflow:auto'>"+
        "<div id='test-scrollbar-width' style='height:300px'></div></div>";
      for( ; set = setup_map[i]; i++ )
      {
        context[set.target] = set.getValue();
      }
      source_content.innerHTML = '';
      max_lines = context['container-height'] / context['line-height'] >> 0;

      var lines = document.getElementById(container_line_nr_id);
      if( lines )
      {
        lines.parentElement.removeChild(lines);
      }
      document.getElementById(frame_id).render(templates.line_nummer_container(max_lines));
      line_numbers = document.getElementById(container_line_nr_id);
      if( line )
      {
        updateLineNumbers(line);
      }
    }
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

    var scrollHeight = script.line_arr.length * context['line-height'] + max_lines;

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
  }

  this.showLine = function(script_id, line_nr)
  {
    // too often called?
    if( script.id != script_id )
    {
      script =
      {
        id: script_id,
        source: new String(runtimes.getScriptSource(script_id)),
        line_arr: [],
        state_arr: [],
        breakpoints: []
      }
      pre_lexer(script);
      setScriptContext(script_id, line_nr);
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
    source_content.innerHTML = 
      simple_js_parser.parse(script, line_nr - 1, max_lines - 1).join(''); 
    updateLineNumbers(line_nr);


    if(  !__scroll_interval )
    {
      var scroll_container = document.getElementById(scroll_container_id), 
        scroll_lines = scroll_container.scrollTop / context['line-height'] >> 0; 
      if ( ( scroll_lines < __current_line - 5 ) || ( scroll_lines > __current_line + 6 ) ) 
      {
        scroll_container.scrollTop = (__current_line - 1 ) * context['line-height'];
      }
    }
  }

  /* first allays use showLine */
  this.showLinePointer = function(line, is_top_frame)
  {
    var script_breakpoints = script.breakpoints;
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
    updateBreakpoints();
  }

  this.addBreakpoint = function(line)
  {
    //alert(typeof line);
    if( !script.breakpoints[ line ] )  script.breakpoints[ line ] = 0;
    script.breakpoints[line] += 1;
    updateBreakpoints();
  }

  this.removeBreakpoint = function(line)
  {
    script.breakpoints[line] -= 1;
    //alert(script.breakpoints[line]);
    updateBreakpoints();
  }

  this.scroll = function()
  {
    if(!__scroll_interval && script.id)
    {
      __scroll_interval = setInterval(__scroll, 60);
    }
    __scrollEvent = new Date().getTime() + 100;
    
  }

  var __scroll = function()
  {
    var top = document.getElementById(scroll_container_id).scrollTop;
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

  messages.addListener('update-layout', updateLayout);

}
