﻿/**
 * @fileoverview
 * Message handling class definition and singleton instansiation.
 *
 */

/**
 * @class
 * <p>
 * Message broker singleton. There is a single, global message object instance.
 * Code can subscribe to event notifications on the object, as well as
 * dispatch messages. There can be an arbitrary number of listeners for any
 * message.
 * </p>
 * <p>
 *    Known messages:
 * </p>
 *
 * <dl>
 *
 *     <dt>application-setup</dt>
 *     <dd>If the application was set up</dd>
 *
 *     <dt>active-tab</dt>
 *     <dd>When the debug context changes or the top runtime of the active window changes. This will happen if a link is clicked in the active window. Payload: array msg.activeTab</dd>
 *
 *     <dt>host-state</dt>
 *     <dd>State of the host. Payload: msg.state = 'disconnected' | 'ready' | waiting'</dd>
 *
 *     <dt>show-view</dt>
 *     <dd>a view was created. Payload: id msg.view</dd>
 *
 *     <dt>remove-view</dt>
 *     <dd>a view was removed. Payload: id msg.view</dd>
 *
 *     <dt>view-created</dt>
 *     <dd>Payload: msg.id, msg.container</dd>
 *
 *     <dt>view-destroyed</dt>
 *     <dd>Payload: msg.id</dd>
 *
 *     <dt>action-mode-changed</dt>
 *     <dd>Payload: msg.mode, msg.id</dd>
 *
 *     <dt>runtime-stopped</dt>
 *     <dd>Payload: msg.id</dd>
 *
 *     <dt>runtime-selected</dt>
 *     <dd>Payload: msg.id</dd>
 *
 *     <dt>runtime-destroyed</dt>
 *     <dd>Payload: msg.id</dd>
 *
 *     <dt>thread-stopped-event</dt>
 *     <dd>Payload: msg.stop_at</dd>
 *
 *     <dt>thread-continue-event</dt>
 *     <dd>Payload: msg.stop_at</dd>
 *
 *     <dt>script-selected</dt>
 *     <dd>A runtime was selected. Payload: msg.rt_id, msg.script_id</dd>
 *
 *     <dt>element-selected</dt>
 *     <dd>An element was selected. Payload: msg.obj_id, msg.rf_id</dd>
 *
 *     <dt>setting-changed</dt>
 *     <dd>A setting has changed. Payload: msg.id, msg.key</dd>
 *
 *     <dt>list-search-context</dt>
 *     <dd>Payload: msg.data_id, msg.obj_id, msg.depth</dd>
 *
 *     <dt>active-inspection-type</dt>
 *     <dd>Payload: msg.inspection_type</dd>
 *
 *     <dt>resize</dt>
 *     <dd>Payload: None</dd>
 *
 *     <dt>reset-state</dt>
 *     <dd>the application cuts the current connection and aits for a new one. Payload: None</dd>
 *
 *     <dt>view-scrolled</dt>
 *     <dd>A (virtual) view has scrolled. Payload: msg.id, msg.top_line, msg.bottom_line</dd>
 *
 *     <dt>window-updated</dt>
 *     <dd>a host window has changed. Payload: msg.window_id, msg.title, msg.window_type, msg.opener_id</dd>
 * </dl>
 *  
 */
var messages = new function()
{
  var __listeners = {};
  
  /**
   * Add a message listener
   * @param key {String} The name of the message to listen for
   * @param cb {function} The callback to call when message is received
   */
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
  
  /**
   * Remove a listener for a specific message.
   * @param key {String} the name of the message to dispatch
   * @param cb {Object} the callback function for the message.
   */
  this.removeListener = function(key, cb)
  {
    var cur = null, listeners = __listeners[ key ], i = 0;
    if( listeners )
    {
      for( ; cur = listeners[i]; i++)
      {
        if (cur == cb)
        {
          listeners.splice(i, 1);
          i--;
        }
      }
    }
  }

  /**
   * Post a message to all its listeners, optionally with a payload. The
   * payload object gets an extra "type" key with the name of the message
   * @param key {String} the name of the message to dispatch
   * @param msg {Object} the payload to the message. Optional
   */
  this.post = function( key, msg )
  {
    msg = msg || {};
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