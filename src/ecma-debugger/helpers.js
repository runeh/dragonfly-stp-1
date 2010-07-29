﻿var cls = window.cls || ( window.cls = {} );

/**
 * @fileoverview
 * <strong>fixme: Deprecated. marked for removal</strong>
 */

/**
  * @constructor 
  * @deprecated
  * use EventHandler and BaseActions
  */

window.cls.Helpers = function()
{
  var self = this;


  var handleKeypress = function(event, id)
  {
    event.preventDefault();
    event.stopPropagation();
    var button = document.getElementById(id);
    if(button && !button.disabled)
    {
      button.click();
    }
  }

  // TODO this should be handled with the Keyhandler class
  var keypressListener = function(event)
  {
    if( event.which == 0 )
    {
      switch(event.keyCode)
      {
        case 119: // F8
        {
          event.preventDefault();
          handleKeypress(event, 'continue-run');
          break;
        }
        case 121: // F10
        {
          event.preventDefault();
          handleKeypress(event, 'continue-step-next-line');
          break;
        }
        case 122: // F11
        {
          event.preventDefault();
          if(event.shiftKey)
          {
            handleKeypress(event, 'continue-step-out-of-call');
          }
          else
          {
            handleKeypress(event, 'continue-step-into-call');
          }
          break;
        }
      }
    }
  }

  this.setSelected = function(event)
  {
    var ele=event.target;
    var parent = ele.parentNode;
    var siblings = parent.getElementsByTagName(ele.nodeName), sibling = null, i=0;
    for( ; sibling = siblings[i]; i++)
    {
      if( sibling.parentElement == parent )
      {
        if(sibling == ele) 
        {
          sibling.addClass('selected'); 
        }
        else
        {
          sibling.removeClass('selected'); 
        }
      }
    }
  }

  this.shortenURI = function(uri)
  {
    var ret_uri = uri;
    var title = '';
    var max_length = 40;
    if( ret_uri && ret_uri.length > max_length )
    {
      title = uri;
      ret_uri = uri.split('?')[0];
      if( ret_uri.length > max_length )
      {
        var temp = /\/([^/]+)$/.exec(ret_uri);
        if( temp )
        {
          ret_uri = temp[1];
        }
      }
    }
    return {uri: ret_uri, title: title};
  }

  this.resolveURLS = function(top_url, url)
  {
    return (
        /^.{4,5}:\/\//.test(url) && url
        || /^\//.test(url) && /^.{4,5}:\/\/[^/]*/.exec(top_url)[0] + url
        || top_url.replace(/\?.*$/, '').replace(/#.*$/, '').replace(/\/[^/]*$/, "/") + url );
  }

  this.escapeTextHtml = (function()
  {
    var re_amp = /&/g, re_lt = /</g;
    return function(str)
    {
      return str.replace(re_amp, "&amp;").replace(re_lt, "&lt;");
    }
  })();

  this.escapeAttributeHtml = (function()
  {
    var re_amp = /&/g, re_lt = /</g, re_quot = /"/g;
    return function(str)
    {
      return str.replace(re_amp, "&amp;").replace(re_lt, "&lt;").replace(re_quot, "&amp;quot;");
    }
  })();
  
  this.setCookie = function(key, value, time) 
  {
    document.cookie = (
      key + "=" + encodeURIComponent(value) +
      "; expires=" + 
      ( new Date( new Date().getTime() + ( time || 360*24*60*60*1000 ) ) ).toGMTString() + 
      "; path=/");
  }

  this.getCookie = function(key) 
  {
    var value = new RegExp(key + "=([^;]*)").exec(document.cookie);
    return value && decodeURIComponent(value[1]);
  }

  // mouseover handler in the breadcrumb
  this.breadcrumbSpotlight = function(event)
  {
    var obj_id = parseInt(event.target.getAttribute('obj-id'));
    if(obj_id && /^breadcrumb$/i.test(event.target.parentNode.nodeName))
    {
      hostspotlighter.soft_spotlight(obj_id);
    }
  }
  // mouseover handler in the breadcrumb
  this.breadcrumbClearSpotlight = function(event)
  {
    var obj_id = event.target.getAttribute('obj-id');
    if( obj_id )
    {
      //hostspotlighter.clearSpotlight();
    }
  }

  this.service_dashed_name = function(name)
  {
    for ( var cur = '', i = 0, ret = ''; cur = name[i]; i++)
    {
      ret += /[A-Z]/.test(cur) && ( i ? '-' : '' ) + cur.toLowerCase() || cur;
    }
    return ret;
  }

  this.service_class_name = function(name)
  {
    for ( var cur = '', i = 0, ret = '', do_upper = true; cur = name[i]; i++)
    {
      if(cur == '-')
      {
        do_upper = true;
        continue;
      }
      ret += do_upper && cur.toUpperCase() || cur;
      do_upper = false;
    }
    return ret;
  }

  this.copy_array = function copy_array(item)
  {
    if (Array.isArray(item))
    {
      return item.map(copy_array);
    }
    else
    {
      return item;
    }
  };

  if (!Array.isArray) {
    Array.isArray = function(obj) {
      return Object.prototype.toString.call(o) == "[object Array]";
    };
  }

  document.addEventListener('keypress', keypressListener, true);

}
