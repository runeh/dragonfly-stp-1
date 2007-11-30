var Debug = function(id, name, container_class)
{
  //var d_c = null;
  var self = this;
  var indent='  ';

  var getIndent = function(n)
  {
    var ret = '';
    while(n--) ret += indent;
    return ret;
  }

  var out = [];

  this.createView = function(d_c)
  {
    var first_child = d_c.firstChild || d_c.render(['div', 'class', 'padding']);
    first_child.textContent = out.join('\n');
    /*
    if( string && string.indexOf('<timeout/>') == -1 )
    {
      //d_c=document.getElementById('debug-container');
      d_c.scrollTop = d_c.scrollHeight;
    }
    */
  }

  this.scrollToBottom = function(container)
  {
    container.scrollTop = container.scrollHeight;
  }

  this.output = function(string)
  {
    if(string) out.push(string);
    this.update();
    this.applyToContainers(this.scrollToBottom);


  }

  this.export = function(string)
  {

    window.open('data:text/plain;charset=utf-8,'+encodeURIComponent( out.join('\n') ));

  }

  this.clear = function()
  {
    out = [];
    this.update();
  }

  this.checkProfiling = function()
  {
    if( window.__profiling__ ) 
    {
      window.__times__[5] =  new Date().getTime(); // rendering
      var stamps = ['request', 'response', 'parsing', 'sorting', 'markup', 'rendering'] 
      var stamp = '', i= 0, out = ''; 
      for ( ; stamp = stamps[i]; i++ )
      {
        out += stamp + ': ' + 
          window.__times__[i] + 
          ( i > 0 ? ' delta: ' + ( window.__times__[i] - window.__times__[i-1] ) : '' ) +
          '\n';
      }
      out += 'total delta: ' + ( window.__times__[5] - window.__times__[0] ) + '\n';
      debug.output(out);
    }
    if( window.__times_dom && window.__times_dom.length == 5 ) 
    {
      var stamps = ['click event', 'return object id', 'return object', 'parse xml', 'render view'] 
      var stamp = '', i= 0, out = ''; 
      for ( ; stamp = stamps[i]; i++ )
      {
        out += stamp + ': ' + 
          window.__times_dom[i] + 
          ( i > 0 ? ' delta: ' + ( window.__times_dom[i] - window.__times_dom[i-1] ) : '' ) +
          '\n';
      }
      out += 'total delta: ' + ( window.__times_dom[4] - window.__times_dom[0] ) + '\n';
      //out += 'response text length: ' + ( window.__times_dom.response_length ) + '\n';
      debug.output(out);
    }
  }

  this.profileSpotlight = function()
  {

      window.__times_spotlight__[1] =  new Date().getTime(); // rendering
      var stamps = ['event handle-event', 'command spotlight'] 
      var stamp = '', i= 0, out = ''; 
      for ( ; stamp = stamps[i]; i++ )
      {
        out += stamp + ': ' + 
          window.__times_spotlight__[i] + 
          ( i > 0 ? ' delta: ' + ( window.__times_spotlight__[i] - window.__times_spotlight__[i-1] ) : '' ) +
          '\n';
      }
      debug.output(out);
    
  }

  this.formatXML=function(string)
  {
    string=string.replace(/<\?[^>]*>/, '');
    var re = /([^<]*)(<(\/)?[^>/]*(\/)?>)/g, match = null, indentCount = 0;
   
    var ret = '';
    while(match = re.exec(string))
    {
      if( match[3] )
      {
        indentCount--;
        if( match[1] )
        {
          /*
          if( match[1].length > 20  )
          {
            ret +=  match[1].slice(0, 20) +"..."+ match[2];
          }
          else
          {
            ret +=  match[1] + match[2];
          }
          */
          ret +=  match[1] + match[2];
        }
        else
        {
          ret += '\n' + getIndent(indentCount) + match[0];
        }
      }
      else if(match[4])
      {
        ret += '\n' + getIndent(indentCount) + match[0];
      }
      else
      {
        ret += '\n' + getIndent(indentCount) + match[0];
        indentCount++;
      }
    }
    self.output(ret);
  }

  this.init(id, name, container_class);
}

Debug.init = function()
{
  window.debug = new Debug('debug', 'Debug', 'scroll debug-container');
  new ToolbarConfig
  (
    'debug',
    [
      {
        handler: 'clear-debug-view',
        title: 'clear debug log'
      },
      {
        handler: 'export-debug-log',
        title: 'export debug log'
      }
    ]
  )
  eventHandlers.click['clear-debug-view'] = function(event, target)
  {
    debug.clear();
  }
  eventHandlers.click['export-debug-log'] = function(event, target)
  {
    debug.export();
  }
}

Debug.prototype = ViewBase;
