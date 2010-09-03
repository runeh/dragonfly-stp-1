﻿window.templates = window.templates || {};

(function()
{
  var self = this;
  this.hello = function(enviroment)
  {
    var ret = ['ul'];
    var prop = '';
    var prop_dict =
    {
      "stpVersion": ui_strings.S_TEXT_ENVIRONMENT_PROTOCOL_VERSION,
      "coreVersion": "Core Version",
      "operatingSystem": ui_strings.S_TEXT_ENVIRONMENT_OPERATING_SYSTEM,
      "platform": ui_strings.S_TEXT_ENVIRONMENT_PLATFORM,
      "userAgent": ui_strings.S_TEXT_ENVIRONMENT_USER_AGENT
    }
    for( prop in prop_dict)
    {
      ret[ret.length] = ['li', prop_dict[prop] + ': ' + enviroment[prop]];
    }
    if( ini.revision_number.indexOf("$") != -1 && ini.mercurial_revision )
    {
      ini.revision_number = ini.mercurial_revision;
    }
    ret[ret.length] = ['li', ui_strings.S_TEXT_ENVIRONMENT_DRAGONFLY_VERSION + ': ' + ini.dragonfly_version];
    ret[ret.length] = ['li', ui_strings.S_TEXT_ENVIRONMENT_REVISION_NUMBER + ': ' + ini.revision_number];
    return ['div', ret, 'class', 'padding'];
  }

  this.runtimes = function(runtimes, type, arg_list)
  {
    var ret = [], rt = null, i = 0;
    for( ; rt = runtimes[i]; i++)
    {
      ret[ret.length] = self['runtime-' + type](rt, arg_list);
    }
    return ret;
  }

  this['runtime-runtime'] = function(runtime, arg_list)
  {
    var display_uri = helpers.shortenURI(runtime.uri);

    return [
      'cst-option',
      runtime['title'] || display_uri.uri,
      'rt-id', runtime.runtime_id.toString()
    ].concat( display_uri.title ? ['title', display_uri.title] : [] )
    ;
  }

  this['runtime-script'] = function(runtime, arg_list)
  {
    var
    display_uri = helpers.shortenURI(runtime.uri),
    is_reloaded_window = runtimes.isReloadedWindow(runtime.window_id),
    ret = [
      ['h2', runtime['title'] || display_uri.uri].
      concat( runtime.selected ? ['class', 'selected-runtime'] : [] ).
      concat( display_uri.title ? ['title', display_uri.title] : [] )
    ],
    scripts = runtimes.getScripts(runtime.runtime_id),
    script = null,
    i=0,
    stopped_script_id = arg_list[0],
    selected_script_id = arg_list[1];


    if( scripts.length )
    {
      for( ; script = scripts[i]; i++)
      {

        ret[ret.length] = templates.scriptOption(script, selected_script_id, stopped_script_id);
      }
    }
    /*
    TODO handle runtimes with no scripts
    else
    {
      scripts_container = ['p',
        settings.runtimes.get('reload-runtime-automatically') || is_reloaded_window
        ? ui_strings.S_INFO_RUNTIME_HAS_NO_SCRIPTS
        : ui_strings.S_INFO_RELOAD_FOR_SCRIPT,
        'class', 'info-text'];
    }
    */

    return ret;
  }

  this.scriptOption = function(script, selected_script_id, stopped_script_id)
  {
    var
    display_uri = helpers.shortenURI(script.uri),
    /* script types in the protocol:
       "inline" | "event" | "linked" | "timeout" | "java" | "generated" | "unknown" */
    type_dict =
    {
      "inline": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_INLINE,
      "linked": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_LINKED,
      "unknown": ui_strings.S_TEXT_ECMA_SCRIPT_TYPE_UNKNOWN
    },
    script_type = script.script_type,
    ret = [
      'cst-option',
      ( type_dict[script_type] || script_type ) + ' - ' +
      (
        display_uri.uri
        ? display_uri.uri
        : ui_strings.S_TEXT_ECMA_SCRIPT_SCRIPT_ID + ': ' + script.script_id
      ),
      'script-id', script.script_id.toString()
    ],
    class_name = script.script_id == selected_script_id && 'selected' || '';

    if(stopped_script_id == script.script_id)
    {
      class_name += ( class_name && ' ' || '' ) + 'stopped';
    }

    if( display_uri.title )
    {
      ret.splice(ret.length, 0, 'title', display_uri.title);
    }

    if( class_name )
    {
      ret.splice(ret.length, 0, 'class', class_name);
    }
    /*
    if( script.stop_ats.length )
    {
      ret.splice(ret.length, 0, 'style', 'background-position: 0 0');
    }
    */
    return ret;
  }

  this['runtime-css'] = function(runtime, org_args)
  {
    const
    OBJECT_ID = 0,
    HREF = 2,
    TITLE = 7;

    var
    display_uri = helpers.shortenURI(runtime.uri),
    ret =
    [
      ['h2', runtime['title'] || display_uri.uri].
      concat( display_uri.title ? ['title', display_uri.title] : [] )
    ],
    sheets = stylesheets.getStylesheets(runtime.runtime_id),
    sheet = null,
    i = 0,
    container = [],
    rt_id = runtime.runtime_id,
    title = '';

    if(sheets)
    {
      for( ; sheet = sheets[i]; i++)
      {
        title = sheet[HREF] ? sheet[HREF] : 'inline stylesheet ' + ( i + 1 ) ;
        container[container.length] =
        [
          'cst-option',
          title,
          'runtime-id', '' + rt_id,
          'index', '' + i
        ];
      }
    }
    /*
    else
    {
      container = ['p', ui_strings.S_INFO_DOCUMNENT_LOADING, 'class', 'info-text'];
    }
    */
    //container.splice(container.length, 0, 'runtime-id', runtime.runtime_id);
    ret = ret.concat([container])

    return ret;
  }


  this['runtime-dom'] = function(runtime)
  {
    var display_uri = runtime['title'] || helpers.shortenURI(runtime.uri).uri;
    return (
    [
      'cst-option',
       runtime['title'] || runtime.uri,
      'runtime-id', runtime.runtime_id.toString()
    ].concat( dom_data.getDataRuntimeId() == runtime.runtime_id ? ['class', 'selected-runtime'] : [] ).
      concat( display_uri != runtime.uri ? ['title', runtime.uri] : [] ) )
  }

  this.checkbox = function(settingName, settingValue)
  {
    return ['li',
      ['label',
        ['input',
        'type', 'checkbox',
        'value', settingName,
        'checked', settingValue ?  true : false,
        'handler', 'set-stop-at'
        ],
        settingName
      ]
    ]
  }

  this.frame = function(frame, is_top)
  {
    // %(function name)s line %(line number)s script id %(script id)s
    return ['li',
      ui_strings.S_TEXT_CALL_STACK_FRAME_LINE.
        replace("%(FUNCTION_NAME)s", ( frame.fn_name || ui_strings.ANONYMOUS_FUNCTION_NAME ) ).
        replace("%(LINE_NUMBER)s", ( frame.line || '-' ) ).
        replace("%(SCRIPT_ID)s", ( frame.script_id || '-' ) ),
      'handler', 'show-frame',
      'ref-id', frame.id,

    ].concat( is_top ? ['class', 'selected'] : [] );
  }

  this.configStopAt = function(config)
  {
    var ret =['ul'];
    var arr = ["script", "exception", "error", "abort"], n='', i=0;
    for( ; n = arr[i]; i++)
    {
      ret[ret.length] = this.checkbox(n, config[n]);
    }
    return ['div'].concat([ret]);
  }
/*

MODE ::= "<mode>"
             ( "run" | "step-into-call" | "step-next-line" | "step-out-of-call" )
           "</mode>" ;

           */
  this.continues = function()
  {
    var ret = [];
    ret[ret.length] = self.continueWithMode('run ( F5 )', 'run');
    ret[ret.length] = self.continueWithMode('step into call ( F11 )', 'step-into-call');
    ret[ret.length] = self.continueWithMode('step next line ( F10 )', 'step-next-line');
    ret[ret.length] = self.continueWithMode('step out of call ( Shift F11 )', 'step-out-of-call');
    return ret;
  }

  this.continueWithMode = function(name, mode)
  {
    return ['input',
          'type', 'button',
          'value', '',
          'title', name,
          'mode', mode,
          'id', 'continue-' + mode,
          'handler', 'continue',
          'disabled', true
        ]
  }

  this.examineObject = function( data )
  {
    var prop = null,
    i = 0,
    ret = ['ul'];


    for( i=0 ; prop = data[i]; i++)
    {
      switch(prop.type)
      {
        case 'object':
        {
          ret[ret.length] = self.key_value_folder(prop.key, i);
          break;
        }
        case 'undefined':
        case 'null':
        {
          ret[ret.length] = self.key_value(prop.key, prop.value, prop.type, i);
          break;
        }
        default:
        {
          ret[ret.length] = ret[ret.length] = self.key_value(prop.key, prop.value, prop.type, i);
          break;
        }
      }
    }

    if( window.__profiling__ )
    {
      window.__times__[4] =  new Date().getTime(); // creating markup
    }

    return ret;
  }



  this.key_value = function(key, value, value_class, ref_index)
  {
    return ['li',
        ['span', key, 'class', 'key'],
        ['span', value].concat( value_class ? ['class', value_class] : []),
      'ref_index', ref_index
    ];
  }

  this.key_value_folder = function(key, ref_index)
  {
    return ['li',
      ['input', 'type', 'button', 'handler', 'examine-object', 'class', 'folder-key'],
      ['span', key, 'class', 'key'],
      ['span', 'object', 'class', 'object'],
      'ref_index', ref_index
    ];
  }

  this.breakpoint = function(line_nr, top)
  {
    return ['li',
          'class', 'breakpoint',
          'line_nr', line_nr,
          'style', 'top:'+ top +'px'
        ]
  }


  this.runtimes_dropdown = function(ele)
  {
    return ['div', ['ul', 'id', 'runtimes'], 'class', 'window-container'];
  }

  this.cssInspector = function(categories)
  {
    var ret = [], cat = null, i = 0;
    for( ; cat = categories[i]; i++)
    {
      ret[ret.length] = this.cssInspectorCategory(cat);
    }
    return ret;
  }

  this.cssInspectorCategory = function(cat)
  {
    //<input type="button"  handler="toggle-setting"  view-id="css-inspector"  tab-id="css-inspector"  class="unfolded" />
    var ret = ['category',
        ['header',
          ['input',
            'type', 'button',
            'handler', 'css-toggle-category',
            'cat-id', cat.id
          ].concat( cat.is_unfolded() ? ['class', 'unfolded'] : [] ),
          cat.name,
          'handler', 'css-toggle-category'
        ],
        ['styles']
      ];

    if( cat.is_unfolded() )
    {
      ret.splice(ret.length, 0, 'class', 'unfolded');
    }

    if( cat.handler )
    {
      ret.splice(ret.length, 0, 'handler', cat.handler);
    }

    return ret;


  }


  this['js-script-select'] = function(ui_obj)
  {
    return self['cst-select'](ui_obj.script_select);
  }

  this.breadcrumb = function(model, obj_id, parent_node_chain)
  {

    var
    css_path = model._get_css_path(obj_id, parent_node_chain,
                                   window.settings.dom.get('force-lowercase'),
                                   window.settings.dom.get('show-id_and_classes-in-breadcrumb'),
                                   window.settings.dom.get('show-siblings-in-breadcrumb')),
    ret = ["breadcrumb"],
    i = 0;

    if (css_path)
    {
      for( ; i < css_path.length; i++ )
      {
        ret[ret.length] =
        [
          "span", css_path[i].name,
          'obj-id', css_path[i].id.toString(),
          'handler', 'breadcrumb-link',
          'class', css_path[i].is_parent_offset ? 'parent-offset' : '',
        ];
        ret[ret.length] = css_path[i].combinator;
      }
    }
    ret.push('data-model-id', model.id);
    return ret;
  }

  this.uiLangOptions = function(lang_dict)
  {
    var dict =
    [
      {
        browserLanguge: "be",
        key: "be",
        name: "български език"
      },
      {
        browserLanguge: "cs",
        key: "cs",
        name: "Česky"
      },
      {
        browserLanguge: "da",
        key: "da",
        name: "Dansk"
      },
      {
        browserLanguge: "de",
        key: "de",
        name: "Deutsch"
      },
      {
        browserLanguge: "el",
        key: "el",
        name: "Ελληνικά"
      },
      {
        browserLanguge: "en",
        key: "en",
        name: "English"
      },
      {
        browserLanguge: "es-ES",
        key: "es-ES",
        name: "Español (España)"
      },
      {
        browserLanguge: "es-LA",
        key: "es-LA",
        name: "Español (Latinoamérica)"
      },
      {
        browserLanguge: "et",
        key: "et",
        name: "Eesti keel"
      },
      {
        browserLanguge: "fi",
        key: "fi",
        name: "Suomen kieli"
      },
      {
        browserLanguge: "fr",
        key: "fr",
        name: "Français"
      },
      {
        browserLanguge: "fr-CA",
        key: "fr-CA",
        name: "Français Canadien"
      },
      {
        browserLanguge: "fy",
        key: "fy",
        name: "Frysk"
      },
      {
        browserLanguge: "hi",
        key: "hi",
        name: "हिन्दी"
      },
      {
        browserLanguge: "hr",
        key: "hr",
        name: "Hrvatski"
      },
      {
        browserLanguge: "hu",
        key: "hu",
        name: "Magyar"
      },
      {
        browserLanguge: "id",
        key: "id",
        name: "Bahasa Indonesia"
      },
      {
        browserLanguge: "it",
        key: "it",
        name: "Italiano"
      },
      {
        browserLanguge: "ja",
        key: "ja",
        name: "日本語"
      },
      {
        browserLanguge: "ka",
        key: "ka",
        name: "ქართული"
      },
      {
        browserLanguge: "ko",
        key: "ko",
        name: "한국어"
      },
      {
        browserLanguge: "lt",
        key: "lt",
        name: "Lietuvių kalba"
      },
      {
        browserLanguge: "mk",
        key: "mk",
        name: "македонски јазик"
      },
      {
        browserLanguge: "nb",
        key: "nb",
        name: "Norsk bokmål"
      },
      {
        browserLanguge: "nl",
        key: "nl",
        name: "Nederlands"
      },
      {
        browserLanguge: "nn",
        key: "nn",
        name: "Norsk nynorsk"
      },
      {
        browserLanguge: "pl",
        key: "pl",
        name: "Polski"
      },
      {
        browserLanguge: "pt",
        key: "pt",
        name: "Português"
      },
      {
        browserLanguge: "pt-BR",
        key: "pt-BR",
        name: "Português (Brasil)"
      },
      {
        browserLanguge: "ru",
        key: "ru",
        name: "Русский язык"
      },
      {
        browserLanguge: "sv",
        key: "sv",
        name: "Svenska"
      },
      {
        browserLanguge: "ta",
        key: "ta",
        name: "தமிழ்"
      },
      {
        browserLanguge: "te",
        key: "te",
        name: "తెలుగు"
      },
      {
        browserLanguge: "tr",
        key: "tr",
        name: "Türkçe"
      },
      {
        browserLanguge: "uk",
        key: "uk",
        name: "Українська"
      },
      {
        browserLanguge: "zh-cn",
        key: "zh-cn",
        name: "简体中文"
      },
      {
        browserLanguge: "zh-tw",
        key: "zh-tw",
        name: "繁體中文"
      }
    ],
    lang = null,
    i = 0,
    selected_lang = window.ui_strings.lang_code,
    ret = [];

    for( ; lang = dict[i]; i++)
    {
      ret[ret.length] = ['option', lang.name, 'value', lang.key].
        concat( selected_lang == lang.key ? ['selected', 'selected'] : [] );
    }
    return ret;
  }

}).apply(window.templates);
