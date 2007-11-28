(function()
{
  var Service = function(name)
  {
    var self = this;

    var messages = [];

    this.onreceive = function(xml) // only called if there is a xml
    {
      if( self[xml.documentElement.nodeName] )
      {
        self[xml.documentElement.nodeName](xml)
      }
      else
      {
        opera.postError('error in console, genericEventListener');
      }
    }


    this['message'] = function(message) 
    {
      window.console_messages.handle(message);
    }


    // constructor calls

    this.initBase(name);
    
    if( ! client)
    {
      opera.postError('client must be created in ecma comsole.js');
      return;
    }
    client.addService(this);
    
  }



  /*

  <?xml version="1.0"?>
  <message>
  <time>1194441921</time>
  <uri>file://localhost/d:/cvs-source/scope/http-clients/ecma-debugger/tests/test-console.html</uri>
  <context>Inline script thread</context>
  <severity>error</severity>
  <source>ecmascript</source>
  <description xml:space="preserve">Error:
  name: ReferenceError
  message: Statement on line 2: Undefined variable: b
  Backtrace:
    Line 2 of inline#1 script in file://localhost/d:/cvs-source/scope/http-clients/ecma-debugger/tests/test-console.html
      b.b = 'hallo';
  </description>
  </message>


  <message>
  <time>1194442013</time>
  <uri>file://localhost/d:/cvs-source/scope/http-clients/ecma-debugger/tests/test-console.html</uri>
  <context>Inlined stylesheet</context>
  <severity>information</severity>
  <source>css</source>
  <description xml:space="preserve">xxcolor is an unknown property

  Line 2:
    body {xxcolor:red}
    --------------^</description></message>

  */

  Service.prototype = ServiceBase;
  new Service('console-logger');

})()

var console_messages = new function()
{
  var msgs = [];
  
  this.handle = function(message_event)
  {
    var message = {};
    //alert(new XMLSerializer().serializeToString(message_event))
    var children = message_event.documentElement.childNodes, child=null, i=0, value = '';
    for ( ; child = children[i]; i++)
    {
      message[child.nodeName] = child.textContent;
      
    }
    msgs[msgs.length] = message;
    views.console.update();
  }

  this.getMessages = function()
  {
    return msgs;
  }
  
};


window.views = window.views || {};

views.console = new function()
{
  var container_id = 'console-view';
  this.update = function()
  {
    var container = document.getElementById( container_id ); 
    if( container )
    {
      container.innerHTML = '';
      container.renderInner(templates.messages(console_messages.getMessages()));
    }
  }
}