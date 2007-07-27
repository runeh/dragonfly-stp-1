var views = {};

views.runtimes = new function()
{
  var self = this;
  this.update = function()
  {
    var container = document.getElementById('runtime-ids');
    container.innerHTML = '';
    container.render(templates.runtimes(runtimes.getRuntimes()));
  }
}

views.source_code = new function()
{
  var self = this;

  var container_id = 'source-view';

  var __current_script_id = '';

  this.showLine = function(scriptId, line)
  {
    var s_c = document.getElementById(container_id), script = null;
    if( scriptId == __current_script_id )
    {

    }
    else
    {
      script = runtimes.getScript(scriptId);
      if(script)
      {
        __current_script_id = scriptId;
        s_c.setAttribute('script-id', scriptId);
        
        s_c.innerHTML = helpers.formatScript(script['script-data']);
        self.updateBreakpoints();
      }
      else
      {
        opera.postError( "Script id not registered");
      }
    }
    var __line = s_c.getElementsByTagName('li')[line-1];
    var line_pointer = document.getElementById('line-pointer');
    if(__line)
    {
      if(line_pointer)
      {
        line_pointer.parentElement.removeChild(line_pointer);
      }
      line_pointer = s_c.firstChild.render
      (
        ['li', 
          'id', 'line-pointer', 
          'style', 'top:'+ __line.offsetTop +'px'
        ]
      );
      s_c.scrollTop = __line.offsetTop - 100;

    }
    else
    {
      opera.postError( "the script has no according line "+line);
    }
  }

  this.displayScript = function(script_id)
  {
    var s_c = document.getElementById(container_id), script = null;
    if( script_id == __current_script_id )
    {

    }
    else
    {
      script = runtimes.getScript(script_id);
      if(script)
      {
        __current_script_id = script_id;
        s_c.setAttribute('script-id', script_id);
        
        s_c.innerHTML = helpers.formatScript(script['script-data']);
        self.updateBreakpoints();
      }
      else
      {
        opera.postError( "Script id not registered");
      }
    }

  }

  this.updateBreakpoints = function()
  {
    var s_c = document.getElementById(container_id);
    var b_ps = s_c.getElementsByClassName('breakpoint'), b_p = null, i = 0;
    for( ; b_p =b_ps[i]; i++)
    {
      b_p.parentNode.removeChild(b_p);
    }

    var breakpoints = runtimes.getBreakpoints(__current_script_id), cur = '';
    var list = s_c.getElementsByTagName('ol')[0];
    var lines = list.getElementsByTagName('li');
    var line = null;
    var top = 0;
    //alert(breakpoints);
    if(breakpoints)
    {
      for(cur in breakpoints)
      {
        //alert(cur);
        line = lines[parseInt(cur) - 1];
        if(line)
        {
          list.render(templates.breakpoint(cur, line.offsetTop))
        }
        else
        {
          opera.postError('no according line number to breakpoint');
        }
      }
    }


  }
  /*

    this.displayBreakpoint = function(line, id)
  {
    var s_c = document.getElementById('source-view')
    var line = s_c.getElementsByTagName('li')[line-1];
    if(line)
    {
      s_c.firstChild.render
      (
        ['li',
          'class', 'breakpoint',
          'id', 'breakpoint-'+id,
          'style', 'top:'+ line.offsetTop +'px'
        ]
      )
    }

    */

}