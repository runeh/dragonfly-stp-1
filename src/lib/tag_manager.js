﻿/**
 * This file was autogenerated by hob
 *
 * @fileoverview
 * This file contains the tag manager implementation. The tag manager provides
 * methods for associating a specific callback with a s
 * 
 */

window.cls || ( window.cls = {} );

/**
 * @constructor 
 */
window.cls.TagManager = function()
{
  if(arguments.callee.instance)
  {
    return arguments.callee.instance;
  }
  arguments.callee.instance = this;

  const 
  OBJECT = 0, 
  METHOD = 1, 
  ARGS = 2;

  var 
  _counter = 1,
  _tags = [],
  _get_empty_tag = function()
  {
    for(var i = 1; _tags[i]; i++);
    return i;
  };

  /**
   * To set a tagged callback. Arguments are object, method, additional
   * arguments. The method will be called on the object with status and
   * message data as the first and second argument, followed by the
   * additional arguments.
   * @param {Object} obj the object on which the method will be called or null
   * @param {Function} method the callback function
   * @param {Array} args_list the arguments of this list will be added to
   *               status and message data
   * @return {Number} temporary unique tag
   */
  this.setCB = 
  this.set_callback = function(obj, method, args_list)
  {
    var tag = _get_empty_tag();
    _tags[tag] = [obj,  method, args_list || []];
    return tag;
  }

  this.handle_message = function(tag, status, data) 
  {
    var cb_obj = _tags[tag];
    if (cb_obj)
    {
      cb_obj[METHOD].apply(cb_obj[OBJECT], [status, data].concat(cb_obj[ARGS]));
      _tags[tag] = null;
      return true;
    }
    return false;
  }

}
