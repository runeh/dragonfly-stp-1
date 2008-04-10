/*
  messages so far:

  - "active-tab" a runtime was selected array msg.activeTab
  - "show-view" a view was created id msg.view
  - "hide-view" a view was removed id msg.view
  - "setting-changed" a setting has changed msg.id view_id, msg.key key
  - "host-state" msg.state = 'disconnected' | 'ready' | waiting';
  - "element-selected" msg.obj_id, msg.rt_id
  - "view-created" msg.id, msg.container
  - "view-destroyed" msg.id
  - "runtime-stopped" msg.id
  - "runtime-selected" msg.id
  - "list-search-context" msg.data_id, msg.obj_id, msg.depth

*/

var messages = new function()
{
  var __listeners = {};
  this.addListener = function(key, cb)
  {
    if( __listeners[ key ] )
    {
      __listeners[ key ].push( cb );
    }
    else
    {
      __listeners[ key ] = [ cb ];
    }
  }
  this.removeListener = function(key)
  {

  }
  this.post = function( key, msg )
  {
    var listeners = __listeners[ key ], cb = null, i = 0;
    msg.type = key;
    if( listeners )
    {
      for( ; cb = listeners[i]; i++)
      {
        cb(msg);
      }
    }
  }
}