(function()
{
  var self = this;

  this.tab = function(obj, is_active_tab)
  {
    return ['tab', 
      ['input', 'type', 'button', 'value', obj.name, 'handler', 'tab', ],
      ( obj.has_close_button ? ['input', 'type', 'button', 'handler', 'close-tab', ] : [] ), 
      'ref-id', obj.ref_id
    ].concat(is_active_tab ? ['class', 'active'] : [] );
  }

  this.filters = function(filters)
  {
    var ret = ['toolbar-filters'], filter = '', i = 0;
    for( ; filter = filters[i]; i++)
    {
      ret[ret.length] = ['input', 'autocomplete', 'off', 'type', 'text', 'handler', filter.handler, 'title', filter.title];
    }
    return ret;
  }

  this.buttons = function(buttons)
  {
    var ret = ['toolbar-buttons'], button = '', i = 0;
    for( ; button = buttons[i]; i++)
    {
      ret[ret.length] = 
        ['input', 
          'type', 'button', 
          'handler', button.handler, 
          'title', button.title
        ].concat(
            button.id ? ['id', button.id] : [],
            button.disabled ? ['disabled', 'disabled'] : [],
            button.param ? ['param', button.param] :[] );
    }
    return ret;
  }

  this.switches = function(switches)
  {
    var ret = ['toolbar-switches'], _switch = '', i = 0;
    var arr = null, setting = null, key = '';
    for( ; _switch = switches[i]; i++)
    {
      arr = _switch.split('.');
      if( arr.length > 1 )
      {
        setting = settings[arr[0]];
        key = arr[1];
        
        ret[ret.length] = 
          ['input', 
            'type', 'button', 
            'handler', 'toolbar-switch', 
            'title', setting.label_map[key],
            'key', _switch,
            'is-active', setting.get(key) ? 'true' : 'false',
            'class', 'switch'
          ];
      }
    }
    return ret;
  }

  this.toolbarSeparator = function()
  {
    return ['toolbar-separator'];
  }

  this['top-statusbar'] = function(ui_obj)
  {
    return [ 
      ['div', 'id', ui_obj.spin_animator.getId(),'title', 'status indicator for the browser and the debugger'], 
      this.configButton('top-settings'), ['info']
    ]
  }


  this['window-statusbar'] = function()
  {
    return [ ['info']]
  }

  this.configButton = function(handler)
  {
    return ['input', 'type', 'button', 'handler', handler, 'title', 'Configurations'];
  }

  this.tabs = function(obj)
  {
    var ret = [];
    var tab = null, i = 0;
    for( ; tab = obj.tabs[i]; i++)
    {
      ret[ret.length] = this.tab(tab, obj.activeTab == tab.ref_id)
    }
    return ret;
  }

  this.viewMenu = function()
  {
    return ['ui-menu', ['h2', 'Views', 'handler', 'show-menu', 'tabindex', '1'], 'id', 'main-view-menu'];
  }

  this['top-tabs'] = function(obj)
  {
    //alert(tab.tabs.length)
    var ret = [].
      // this is a quick hack
      concat( [ templates.buttons(toolbars['main-view-top-tab'] && toolbars['main-view-top-tab'].buttons || [])] );
    var tab = null, i = 0;
    for( ; tab = obj.tabs[i]; i++)
    {
      ret[ret.length] = this.tab(tab, obj.activeTab == tab.ref_id)
    }
    return ret;
  }

  this.settings = function(view_arr)
  {
    var 
      ret = ['settings-container'], 
      view_id = null, 
      view = null,
      i = 0;
    for( ; view_id = view_arr[i]; i++)
    {
      if(settings[view_id])
      {
        view = views[view_id];
        ret[ret.length] = this.setting(view_id, view.name, view.isvisible());
      }
    }
    return ret;
    
  }

  // this will be called as a method from a setting object

  this.setting = function(view_id, view_name, is_unfolded)
  {
    
    var ret = ['settings', self.settingsHeader(view_id, view_name, is_unfolded)];
    if( is_unfolded )
    {
      
      var setting = settings[view_id];
      var settings_map = setting.setting_map;
      var cat_name = '';
      if(setting.template)
      {
        ret[ret.length] = setting.template();
      }
      else
      {
        // so far only checkboxes
        for( cat_name in settings_map ) 
        {
          ret[ret.length] = this[cat_name](setting, settings_map[cat_name]);
        }
      }

    }
    return ret;
  }

  this.settingsHeader = function(view_id, view_name, is_unfolded)
  {
    return ['settings-header', 
        ['input', 
          'type', 'button', 
          'handler', 'toggle-setting', 
          'view-id', view_id,
      /* i think something is not jet clear here. 
          Is this id really needed?
          Will it work for composited views? */
          'tab-id', view_id  
        ].concat(is_unfolded ? ['class', 'unfolded'] : []), 
      view_name];
  }

  this.checkboxes = function(setting, checkbox_arr)
  {
    var checkboxes = ['checkboxes'], arr = null, view_id = '', key = '', i = 0;
    for( ; key = checkbox_arr[i]; i++)
    {
      if( key.indexOf('.') == -1 )
      {
        checkboxes[checkboxes.length] = 
          this.settingCheckbox
          (
            setting.view_id, 
            key, 
            setting.get(key), 
            setting.label_map[key]
          );
      }
      else
      {
        arr = key.split('.');
        view_id = arr[0];
        key = arr[1];
        checkboxes[checkboxes.length] = 
          this.settingCheckbox
          (
            view_id, 
            key, 
            settings[view_id].get(key), 
            settings[view_id].label_map[key],
            setting.view_id
          );
      }
    }
    return checkboxes;
  }

  this.settingCheckbox = function(view_id, key, value, label, host)
  {
    var input = ['input', 
        'type', 'checkbox', 
        'handler', 'checkbox-setting', 
        'name', key,
        'view-id', view_id
      ];
    if( value )
    {
      input.splice(input.length, 0, 'checked', 'checked');
    }
    if( host )
    {
      input.splice(input.length, 0, 'host-view-id', host);
    }
    return ['checkbox', ['label', input, label ] ];
  }

  this._window = function(win)
  {
    return ['window',
        this.window_header(views[win.view_id].name),
        this.window_shadows(),
        ['window-control', 'handler', 'window-scale-top-left'],
        ['window-control', 'handler', 'window-scale-top'],
        ['window-control', 'handler', 'window-scale-top-right'],
        ['window-control', 'handler', 'window-scale-right'],
        ['window-control', 'handler', 'window-scale-bottom'],
        ['window-control', 'handler', 'window-scale-bottom-right'],
        ['window-control', 'handler', 'window-scale-bottom-left'],
        ['window-control', 'handler', 'window-scale-left'],
      'id', win.id, 
      'style', 
      'top:' + win.top + 'px;' +
      'left: ' + win.left + 'px;' +
      'width: '+ win.width + 'px;' +
      'height: ' + win.height + 'px;',
      'view_id', win.view_id
    ]
  }

  this.window_header = function(name)
  {
    return ['window-header',   
        ['window-control', 'handler', 'window-close'],
        name,
      'handler', 'window-move'
    ]
  }

  this.window_shadows = function()
  {
    return ['window-shadows',
      ['window-shadow', 'class', 'top-left'],
      ['window-shadow', 'class', 'top'],
      ['window-shadow', 'class', 'top-right'],
      ['window-shadow', 'class', 'left'],
      ['window-shadow', 'class', 'right'],
      ['window-shadow', 'class', 'bottom-left'],
      ['window-shadow', 'class', 'bottom'],
      ['window-shadow', 'class', 'bottom-right']
      ];
  }

}).apply(window.templates? window.templates : ( window.templates = {} ));