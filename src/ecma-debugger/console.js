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

  var url_self = location.host + location.pathname;
  
  this.handle = function(message_event)
  {
    var uri = message_event.getNodeData('uri');
    if( uri && uri.indexOf(url_self) == -1 )
    {
      var message = {};
      var children = message_event.documentElement.childNodes, child=null, i=0, value = '';
      for ( ; child = children[i]; i++)
      {
        message[child.nodeName] = child.textContent;
        
      }
      msgs[msgs.length] = message;
      views.console.update();
    }
  }

  this.clear = function()
  {
    msgs = [];
    views.console.update();
  }

  this.getMessages = function()
  {
    return msgs;
  }
  
};



(function()
{

  var View = function(id, name, container_class)
  {
    this.createView = function(container)
    {
      container.innerHTML = '';
      container.renderInner(templates.messages(console_messages.getMessages()));
      container.scrollTop = container.scrollHeight;
    }
    this.init(id, name, container_class);
  }

  View.prototype = ViewBase;

  new View('console', 'Error Console', 'scroll error-console');

  new ToolbarConfig
  (
    'console',
    [
      {
        handler: 'clear-error-console',
        title: 'Clear Error Log'
      }
    ]
  )

new Settings
(
  // id 
  'console', 
  // key-value map
  {
    'css': true, 
    'ecmascript': true
  }, 
  // key-label map
  {
    'css': ' css error messages', 
    'ecmascript': ' ecmascript error messages'
  }, 
  // settings map
  {
    checkboxes:
    [
      'css',
      'ecmascript'
    ]
  }
);

  eventHandlers.click['clear-error-console'] = function(event, target)
  {
    console_messages.clear();
  }

})()