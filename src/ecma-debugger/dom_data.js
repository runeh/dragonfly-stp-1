var dom_data = new function()
{
  var self = this;

  var view_ids = ['dom-markup-style', 'dom-tree-style'];  // this needs to be handled in a more general and sytematic way.

  var initializedRuntimes = {};

  var data = []; // TODO seperated for all runtimes off the active tab
  var data_runtime_id = '';  // data of a dom tree has always just one runtime
  var current_target = '';

  const 
  ID = 0, 
  TYPE = 1, 
  NAME = 2, 
  NAMESPACE = 3, 
  VALUE = 4, 
  DEPTH = 5, 
  ATTRS = 6, 
  CHILDREN_LENGTH = 7, 
  IS_TARGET = 8, 
  IS_LAST = 9;



  var onActiveTab = function(msg)
  {
    // TODO clean up old tab
    data = []; // this must be split for all runtimes in the active tab
    var view_id = '', i = 0;
    // TODO handle runtimes per tab properly
    data_runtime_id = msg.activeTab[0];
    for( ; view_id = view_ids[i]; i++)
    {
      if(views[view_id].isvisible())
      {
        onShowView({id: view_id})
      }
    }
  }

  var clickHandlerHost = function(event)
  {
    var rt_id = event['runtime-id'], obj_id = event['object-id'];
    messages.post("element-selected", {obj_id: obj_id, rt_id: data_runtime_id});
    current_target = obj_id;
    data = [];
    tag = tagManager.setCB(null, handleGetDOM, [ rt_id ]);
    services['ecmascript-debugger'].inspectDOM( tag, obj_id, 'parent-node-chain-with-children' );
  }

  var handleGetDOM = function(xml, rt_id)
  {
    var json = xml.getNodeData('jsondata');
    if( json )
    {
      data = eval('(' + json +')');
      data_runtime_id = rt_id;
      var view_id = '', i = 0;
      for( ; view_id = view_ids[i]; i++)
      {
        views[view_id].update();
        views[view_id].scrollTargetIntoView();
      }
    }
  }

  var onSettingChange = function(msg)
  {
    var msg_id = msg.id, id = '', i = 0;
    for( ; ( id = view_ids[i] ) && id != msg_id; i++);
    if( id )
    {
      switch (msg.key)
      {
        case 'highlight-on-hover':
        {
          if(settings[id].get(msg.key))
          {
            host_tabs.activeTab.addEventListener('mouseover', spotlight);
          }
          else
          {
            services['ecmascript-debugger'].clearSpotlight(data_runtime_id);
            host_tabs.activeTab.removeEventListener('mouseover', spotlight);
          }
          break;
        }

        case 'find-with-click':
        {
          if(settings[id].get(msg.key))
          {
            host_tabs.activeTab.addEventListener('click', clickHandlerHost);
          }
          else
          {
            host_tabs.activeTab.removeEventListener('click', clickHandlerHost);
          }
          break;
        }

      }
    }
  }

  var onShowView = function(msg)
  {
    var msg_id = msg.id, id = '', i = 0;
    for( ; ( id = view_ids[i] ) && id != msg_id; i++);
    if( id )
    {
      if( !data.length )
      {
        if(settings[id].get('find-with-click'))
        {
          host_tabs.activeTab.addEventListener('click', clickHandlerHost);
        }
        if(settings[id].get('highlight-on-hover'))
        {
          host_tabs.activeTab.addEventListener('mouseover', spotlight);
        }
        var tab = host_tabs.getActiveTab(), rt_id = '', i = 0, tag = 0;
        var init_rt_id = null;
      }
    }
  }

  var onHideView = function(msg)
  {
    
  }

  this.getData = function()
  {
    return data;
  }

  this.getDataRuntimeId = function()
  {
    return data_runtime_id;
  }



  var handleGetChildren = function(xml, runtime_id, object_id)
  {
    var json = xml.getNodeData('jsondata');
    if( json )
    {
      var _data = eval('(' + json +')'), i = 0, view_id = '';
      for( ; data[i] && data[i][ID] != object_id; i += 1 );
      if( data[i] )
      {
        Array.prototype.splice.apply( data, [i + 1, 0].concat(_data) );
        for(i = 0 ; view_id = view_ids[i]; i++)
        {
          views[view_id].update();
        }
      }
      else
      {
        opera.postError('missing refrence');
      }
    }
  }


  this.getChildernFromNode = function(object_id)
  {
    var tag = tagManager.setCB(null, handleGetChildren, [data_runtime_id, object_id]);
    services['ecmascript-debugger'].inspectDOM(tag, object_id, 'children');
  }

  this.closeNode = function(object_id)
  {
    var i = 0, j = 0, level = 0, k = 0, view_id = '';
    for( ; data[i] && data[i][ID] != object_id; i++ );
    if( data[i] )
    {
      level = data[ i ][ DEPTH ];
      i += 1;
      j = i;
      while( data[j] && data[j][ DEPTH ] > level ) j++;
      data.splice(i, j - i);
      for( ; view_id = view_ids[k]; k++)
      {
        views[view_id].update();
      }
    }
    else
    {
      opera.postError('missing refrence');
    }
  }

  this.getSnapshot = function()
  {
    var tag = tagManager.setCB(null, handleSnapshot, [data_runtime_id]);
    var script_data = 'return $'+ data_runtime_id + '.document.documentElement';
    services['ecmascript-debugger'].eval(tag, data_runtime_id, '', '', script_data, ['$' + data_runtime_id, data_runtime_id]);
  }

  var handleSnapshot = function(xml, runtime_id)
  {
    if(xml.getNodeData('status') == 'completed' )
    {
      var tag = tagManager.setCB(null, handleGetDOM, [runtime_id]);
      services['ecmascript-debugger'].inspectDOM( tag, xml.getNodeData('object-id'), 'subtree' );
    }
    else
    {
      opera.postError('handleSnapshot in dom_data has failed');
    }
  }

  var spotlight = function(event)
  {
    services['ecmascript-debugger'].spotlight(event['runtime-id'], event['object-id']);
  }

  this.highlight_on_hover = function(event)
  {
    if(event.target.checked)
    {
      host_tabs.activeTab.addEventListener('mouseover', spotlight);
    }
    else
    {
      services['ecmascript-debugger'].clearSpotlight(data_runtime_id);
      host_tabs.activeTab.removeEventListener('mouseover', spotlight);
    }
  }

  this.setCurrentTarget = function(obj_id)
  {
    // data_runtime_id will fail with more then one runtime per runtime container
    messages.post("element-selected", {obj_id: obj_id, rt_id: data_runtime_id});
    current_target = obj_id;
  }

  this.getCurrentTarget = function(obj_id)
  {
    return current_target;
  }

  this.getCSSPath = function()
  {
    var i = 0, j = -1, path = '';

    if(current_target)
    {
      for( ; data[i] && data[i][ID] != current_target; i ++);
      if( data[i] )
      {
        path = data[i][NAME];
        j = i;
        i --;
        for(  ; data[i]; i --)
        {
          if(data[i][TYPE] == 1)
          {
            if(data[i][ DEPTH] <= data[j][DEPTH])
            {
              path =  data[i][NAME] + ( data[i][DEPTH] < data[j][DEPTH] ? ' > ' : ' + ' ) + path;
              j = i;
            }
          } 
        }
      }
      else
      {
        opera.postError('missing refrence in getCSSPath in dom_data');
      }
      return path;
    }
    
  }

  var postElementSeleceted = function(obj_id, rt_id)
  {
    messages.post("element-selected", {obj_id: obj_id, rt_id: rt_id});
  }

  this.set_click_handler = function(event)
  {
    if(event.target.checked)
    {
      host_tabs.activeTab.addEventListener('click', clickHandlerHost);
    }
    else
    {
      host_tabs.activeTab.removeEventListener('click', clickHandlerHost);
    }
  }
  
  messages.addListener('active-tab', onActiveTab);
  messages.addListener('show-view', onShowView);
  messages.addListener('hide-view', onHideView);
  messages.addListener('setting-changed', onSettingChange);

}