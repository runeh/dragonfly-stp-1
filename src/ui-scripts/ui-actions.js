var EventHandler = function(type)
{
  if(!window.eventHandlers)
  {
    window.eventHandlers = {};
  }
  if(window.eventHandlers[type])
  {
    return;
  }

  window.eventHandlers[type] = {};

  var handler = function(event)
  {
    var ele = event.target, handler = ele.getAttribute('handler'), container = null;
    while( !handler && ( ele = ele.parentElement ) )
    {
      handler = ele.getAttribute('handler');
    }
    if( handler && eventHandlers[type][handler] )
    {
      if( type == 'click' && /toolbar-buttons/.test(ele.parentNode.nodeName) )
      {
        container = 
          document.getElementById(ele.parentNode.parentNode.id.replace('toolbar', 'container'));
      }
      eventHandlers[type][handler](event, ele, container);
    }
  }

  this.post = function(handler, event)
  {
    if(eventHandlers[type][handler])
    {
      eventHandlers[type][handler](event);
    }
  }

  document.addEventListener(type, handler, false);
}

new EventHandler('click');
new EventHandler('change');
new EventHandler('input');
new EventHandler('keyup');
new EventHandler('keydown');
new EventHandler('mousedown');

/***** click handler *****/

eventHandlers.click['tab'] = function(event, target)
{
  target = target.parentElement;
  var tabs = UIBase.getUIById(target.parentElement.getAttribute('ui-id'));
  var view_id = target.getAttribute('ref-id');
  if( tabs )
  {
    tabs.setActiveTab(view_id);
    messages.post("show-view", {id: view_id});
  }
  else
  {
    opera.postError("tabs is missing in eventHandlers.click['tab'] in ui-actions");
  }
}

eventHandlers.click['close-tab'] = function(event, target)
{
  target = target.parentElement;
  var container = target.parentElement;
  var tabs = UIBase.getUIById(target.parentElement.getAttribute('ui-id'));
  tabs.removeTab(target.getAttribute('ref-id'));
}

eventHandlers.click['settings-tabs'] = function(event, target)
{
  var tabs = UIBase.getUIById(target.parentElement.getAttribute('ui-id'));
  windows.showWindow('window-3', 'Settings', templates.settings(tabs), 200, 200, 200, 200);
}

eventHandlers.click['toggle-setting'] = function(event)
{
  var target = event.target;
  var old_setting = target.parentElement.parentElement;
  var view_id = target.getAttribute('view-id');
  var view = views[view_id];
  var setting = document.render(templates.setting( view_id, view.name, !target.hasClass('unfolded') ));
  old_setting.parentElement.replaceChild(setting, old_setting);
}



eventHandlers.click['show-window'] = function(event)
{
  var target = event.target;
  var view_id = target.getAttribute('view-id');
  target.parentNode.parentNode.parentNode.removeChild(target.parentNode.parentNode);
  UIWindowBase.showWindow(view_id);
}

eventHandlers.click['top-settings'] = function(event)
{
  UIWindowBase.showWindow('settings_view');
}

eventHandlers.click['documentation'] = function(event)
{
  views.documentation.setURL( event.target.getAttribute('param'))
  UIWindowBase.showWindow('documentation');
}

eventHandlers.mousedown['toolbar-switch'] = function(event)
{
  var target = event.target;
  var arr = target.getAttribute('key').split('.');
  var setting = arr[0], key = arr[1];
  var is_active = !( target.getAttribute('is-active') == 'true' && true || false );
  settings[setting].set(key, is_active);
  views.settings_view.syncSetting(setting, key, is_active);
  views[setting].update();
  messages.post("setting-changed", {id: setting, key: key});
  target.setAttribute('is-active', is_active ? 'true' : 'false');
}



/***** change handler *****/

eventHandlers.change['checkbox-setting'] = function(event)
{
  var ele = event.target;
  var view_id = ele.getAttribute('view-id');
  settings[view_id].set(ele.name, ele.checked);
  views[view_id].update();
  var host_view = ele.getAttribute('host-view-id');
  if( host_view )
  {
    views.settings_view.syncSetting(view_id, ele.name, ele.checked);
  }
  messages.post("setting-changed", {id: view_id, key: ele.name});
}



