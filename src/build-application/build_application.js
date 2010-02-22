﻿/**
 * @fileoverview
 * (This file was autogenerated by opprotoc)
 * 
 * The application is created in two steps:
 *
 * Step 1: All objects that do not depend on the services available from the
 *         debuggee. The only exception is the scope service, as it is needed
 *         to query the debuggee about what services it provides. All scope
 *         debuggees run the scope service, and it can not be disabled.
 *
 * Step 2: All service objects are created, based on their counterpart on
 *         the debuggee side. The second step uses
 *         a pattern where each service has a build function in
 *         "app.builders.<servuce class name>.<service version>.
 *         The builders are called as soon as service information have been
 *         received from the scope service. It's possible to hook up a callback
 *         after the second step has finished. The callback can either be
 *         passed as an argument to the build_application call, or by defining
 *         a function named window.app.on_services_created, which
 *         will be called automatically
 *
 * 
 * There is an other moment to hook up a callback. 
 * That is when all services are sucessfully enabled.
 * The callback can either be passed to the build_application call 
 * as second argument or by defining a function named 
 * window.app.on_services_enabled
 * 
 */
if( window.app )
{
  throw "window.app does already exist";
}
window.app = {};


window.app.build_application = function(on_services_created, on_services_enabled)
{
  /**
   * A callback helper for String.prototype.replace for the reg exp /(^|-)[a-z]/
   */
  var re_replace_first_and_dash = function(match)
  {
    return match[match.length-1].toUpperCase();
  }

  /**
   * Make an appropriate class name based on name
   */
  var get_class_name = function(name)
  {
    return name.replace(/(^|-)[a-z]/g, re_replace_first_and_dash);
  }

  /**
   * This callback is invoked when host info is received from the debuggee.
   *
   */
  var on_host_info_callback = function(service_descriptions)
  {
    var 
    service_name = '',
    service = null,
    class_name = '',
    re_version = /(^\d+\.\d+)(?:\.\d+)?$/,
    version = null,
    i = 0,
    builder = null;

    for (service_name in service_descriptions)
    {
      if (service_name != "scope")
      {
        service = service_descriptions[service_name];
        version = re_version.exec(service.version);
        version = version && version[1] || 0;        
        class_name = get_class_name(service_name); 
        // the initial message map is set in cls.debug.guess_message_map
        if(window.ini.debug && 
            window.message_maps[service_name] && 
            window.message_maps[service_name].versions &&
            window.message_maps[service_name].versions[version])
        {
          window.message_maps[service_name] = window.message_maps[service_name].versions[version];
          window.message_maps[service_name].versions = null;
        }
        builder = window.app.builders[class_name] && window.app.builders[class_name][version];
        if (builder) 
        {
          builder(service);
        }
      }
    }
    window.app.post('services-created', {'service_description': service_descriptions});
    if (window.app.on_services_created)
    {
      window.app.on_services_created(service_descriptions);
    }
    if (on_services_created)
    {
      on_services_created(service_descriptions);
    }
  }

  var create_raw_interface = function(service_name)
  {
    var service_class = function()
    {
      this.name = service_name;
      this.is_implemented = false;
    }
    var service_implementation = function(){};
    service_implementation.prototype = new cls.ServiceBase();
    service_class.prototype = new service_implementation();
    service_class.prototype.constructor = service_class;
    window.cls.Messages.apply(service_class.prototype);
    window.services.add(new service_class());
  }

  // ensure that the static methods on cls.ServiceBase exist.
  new cls.ServiceBase();





  // global objects
  window.tagManager = new window.cls.TagManager();
  window.cls.Messages.apply(this);
 
  // create window.services namespace and register it.
  cls.ServiceBase.register_services(new cls.Namespace("services"));
  [
    'scope',
    'console-logger',
    'ecmascript-logger',
    'http-logger',
    'exec',
    'window-manager',
    'url-player',
    'ecmascript-debugger'
  ].forEach(create_raw_interface);
  var params = this.helpers.parse_url_arguments();
  if(params.debug)
  {
    cls.debug.create_debug_environment(params);
  }
  var namespace = cls.Scope && cls.Scope["1.0"];
  window.app.helpers.implement_service(namespace);
  window.services.scope.set_host_info_callback(on_host_info_callback);
  window.services.scope.set_services_enabled_callback(on_services_enabled);

  // create the client
  if(window.services.scope)
  {
    window.client = new cls.Client();
    client.beforeUIFrameworkSetup();
    window.ui_framework.setup();
    client.setup(); 
    messages.post('application-setup');
  }
  else
  {
    throw "scope service couldn't be created, application creation aborted";
  }
}

/**
  * The builders for each service and version.
  * These calls can also be used to create other parts of the application
  * which support a given service version.
  * It is recommended ( but not required ) that classes which support a given
  * service version are organized in an appropirate namespace, like
  * ls.<service class name>.<service version>.
  */
window.app.builders = {};
window.app.builders.ConsoleLogger || ( window.app.builders.ConsoleLogger = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.ConsoleLogger["2.0"] = function(service)
{
  var namespace = cls.ConsoleLogger && cls.ConsoleLogger["2.0"];
  if(namespace)
  {
    window.app.helpers.implement_service(namespace);
    window.error_console_data = new namespace.ErrorConsoleData();
    window.error_console_data.bind();
    // TODO proper namespace handling for views
    ErrorConsoleView.roughViews.createViews();
  }
}

window.app.builders.EcmascriptDebugger || ( window.app.builders.EcmascriptDebugger = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.EcmascriptDebugger["5.0"] = function(service)
{
  var namespace = cls.EcmascriptDebugger && cls.EcmascriptDebugger["5.0"];
  window.app.helpers.implement_service(namespace);
  window.runtimes = new namespace.Runtimes();
  window.runtimes.bind();
  window.stop_at = new namespace.StopAt();
  window.stop_at.bind();
  window.host_tabs = new namespace.HostTabs();
  window.host_tabs.bind();
  window.hostspotlighter = new namespace.Hostspotlighter();
  window.hostspotlighter.bind();

  window.local_storage_data = new cls.LocalStorageData();
  new cls.LocalStorageView('local_storage', 'Local Storage', 'scroll');
  new cls.CookiesView('cookies', 'Cookies', 'scroll');
}

window.app.builders.EcmascriptLogger || ( window.app.builders.EcmascriptLogger = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.EcmascriptLogger["2.0"] = function(service)
{
  var namespace = cls.EcmascriptLogger && cls.EcmascriptLogger["2.0"];
  window.app.helpers.implement_service(namespace);
}

window.app.builders.Exec || ( window.app.builders.Exec = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.Exec["2.0"] = function(service)
{
  var namespace = cls.Exec && cls.Exec["2.0"];
  window.app.helpers.implement_service(namespace);
}

window.app.builders.HttpLogger || ( window.app.builders.HttpLogger = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.HttpLogger["2.0"] = function(service)
{
  var namespace = cls.HttpLogger && cls.HttpLogger["2.0"];
  if(namespace)
  {
    window.app.helpers.implement_service(namespace);
    (new namespace.ParseMessges()).bind();
  }
}

window.app.builders.WindowManager || ( window.app.builders.WindowManager = {} );
/**
  * @param {Object} service the service description of the according service on the host side
  */
window.app.builders.WindowManager["2.0"] = function(service)
{
  var namespace = cls.WindowManager && cls.WindowManager["2.0"];
  if(namespace)
  {
    window.app.helpers.implement_service(namespace);
    window.window_manager_data = new namespace.WindowManagerData();
    window.window_manager_data.bind();
    window.windowsDropDown = new namespace.WindowsDropDown();
    namespace.DebuggerMenu.prototype = new CstSelectWithAction();
    new namespace.DebuggerMenu('debugger-menu', 'debugger-menu');
  }
}


window.app.helpers = {};

window.app.helpers.implement_service = function(namespace)
{
  if(namespace && namespace.Service && window.services[namespace.name])
  {
    namespace.Service.apply(window.services[namespace.name].constructor.prototype);
    window.services[namespace.name].is_implemented = true;
  }
}

window.app.helpers.parse_url_arguments = function()
{
  /* 
    supported arguments:
      - debug
      - log-filter
  */
  var 
  args = location.search.slice(1).split(';'), 
  params = {}, 
  arg = '', 
  i = 0;

  for( ; arg = args[i]; i++)
  {
    arg = arg.split('=');
    params[arg[0].replace(/^ +/, '').replace(/ +$/, '')] = 
      arg[1] && arg[1].replace(/^ +/, '').replace(/ +$/, '') || true;
  }
  return params;
}


window.onload = function()
{
  window.clearTimeout(window.load_screen_timeout);
  window.app.build_application();
}

