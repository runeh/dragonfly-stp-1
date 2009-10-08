﻿/**
 * @fileoverview
 */

var cls = window.cls || ( window.cls = {} );

/**
  * Window manager service class
  * @constructor 
  * @extends ServiceBase
  */
/* */
cls.ExecService = function(name)
{
  var self = this;

  this.onreceive = function(xml) // only called if there is a xml
  {
    if( ini.debug )
    {
      debug.logEvents(xml);
    }
    if( self[xml.documentElement.nodeName] )
    {
      self[xml.documentElement.nodeName](xml)
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        "window manager not handled: " + new XMLSerializer().serializeToString(xml))
    }
  }

  // events




  this.screen_watcher = function(win_id)
  {
    this.post("<exec><screen-watcher>" +
        "<window-id>"+ window.window_manager_data.debug_context +"</window-id>" +
        "<timeout>" + 1 + "</timeout>" +
        "<area>" +
          "<x>" + 20 + "</x>" + // horizontal offset
          "<y>" + 20 + "</y>" + // vertical offset
          "<w>" + 40 + "</w>" + // width
          "<h>" + 40 + "</h>" + // height
        "</area>" +
      "</screen-watcher></exec>");

  }


  this.postAction = function(action, param)
  {
    this.post("<exec><action><name>" + action + "</name><param>" + param + "</param></action></exec>");
  }



  // constructor calls

  this.initBase(name);
  
  if( ! client)
  {
    opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE + 'client does not exist');
    return;
  }
  
  client.addService(this);

}

cls.ExecService.prototype = ServiceBase;
new cls.ExecService('exec');


/* *
var cls = window.cls || ( window.cls = {} );

// for testing the window manager service

cls.WindowManagerTestView = function(id, name, container_class)
{
  var self = this;
  this.createView = function(container)
  {
    var 
    markup = \
      "<div>" +
        "<input value='New Page'>" +
        "<input type='button' value='post action' handler='exec-action'>" +
      "</div>";


    container.innerHTML = "<div class='padding'>" + markup + "</div>";

  }
  this.init(id, name, container_class);
}

cls.WindowManagerTestView.prototype = ViewBase;
new cls.WindowManagerTestView('test_exec', 'Test Exec', 'scroll test-exec');

eventHandlers.click['exec-action'] = function(event, target)
{
  services['exec'].postAction(target.previousElementSibling.value);
}
*/

