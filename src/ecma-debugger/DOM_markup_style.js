﻿/**
  * @constructor 
  * @extends ViewBase
  * @see DOM_tree_style this class can be dynamically exchanged with DOM_tree_style
  */

var DOM_markup_style = function(id, name, container_class)
{
  var self = this;

  const 
  ID = 0, 
  TYPE = 1, 
  NAME = 2, 
  DEPTH = 3,
  NAMESPACE = 4, 
  VALUE = 4, 
  ATTRS = 5,
  ATTR_PREFIX = 0,
  ATTR_KEY = 1, 
  ATTR_VALUE = 2,
  CHILDREN_LENGTH = 6, 
  PUBLIC_ID = 4,
  SYSTEM_ID = 5,
  INDENT = "  ",
  LINEBREAK = '\n';

  var getIndent = function(count)
  {
    var ret = '';
    if(count)
    {
      count--;
    }
    while(count)
    {
      ret += INDENT;
      count--;
    }
    return ret;
  }

  this.scrollTargetIntoView = function()
  {
    var target = document.getElementById('target-element');
    if(target)
    {
      document.getElementById('target-element').scrollIntoView();
      while( !/container/.test(target.nodeName) && ( target = target.parentElement) );
      if(target)
      {
        target.scrollTop -= 100;
      }
    }
  }

  this.updateTarget = function(ele, obj_id)
  {
    if(ele)
    {
      var target = document.getElementById('target-element');
      if(target)
      {
        target.removeAttribute('id');
      }
      if(/<\//.test(ele.firstChild.nodeValue))
      {
        while( ( ele = ele.previousSibling ) && ele.getAttribute('ref-id') != obj_id );
      }
      if(ele)
      {
        ele.id = 'target-element';
      }
      topCell.statusbar.updateInfo(dom_data.getCSSPath());
    }
    else
    {
      opera.postError("missing implementation in updateTarget in views['dom-inspector']");
      // TODO
    }
  }

  var formatProcessingInstructionValue = function(str, force_lower_case)
  {
    
    var r_attrs = str.split(' '), r_attr = '', i=0, attrs = '', attr = null;
    
    for( ; i < r_attrs.length; i++)
    {
      if(r_attr = r_attrs[i])
      {
        attr = r_attr.split('=');
        attrs += " <span class='key'>" + 
          ( force_lower_case ? attr[0].toLowerCase() : attr[0] ) + 
          "</span>=<span class='value'>" + 
          attr[1] + 
          "</span>";
      }
    }
    return attrs;
  }



  var getDoctypeName = function(data)
  {
    var node = null, i = 0;
    for( ; node = data[i]; i++)
    {
      if( node[TYPE] == 1 )
      {
        return node[NAME];
      }
    }
  }

  this.createView = function(container)
  {

    if( container.hasClass('tree-style') )
    {
      container.removeClass('tree-style');
    }
    var data = dom_data.getData();

    var tree = '', i = 0, node = null, length = data.length;
    
    var target = dom_data.getCurrentTarget();

    var attrs = null, attr = null, k = 0, key = '';

    var is_open = 0;
    var has_only_one_child = 0;
    var one_child_value = ''
    var current_depth = 0;
    var child_pointer = 0;
    var child_level = 0;
    var j = 0;
    var children_length = 0;

    var closing_tags = [];

    

    var force_lower_case = settings[this.id].get('force-lowercase');
    var show_comments = settings[this.id].get('show-comments');
    var show_attrs = settings[this.id].get('show-attributes');
    var node_name = '';
    var tag_head = '';
    var class_name = '';
    var re_formatted = /script|style|#comment/i;

    if( ! data.length )
    {
      container.innerHTML = "<div class='padding'><p></p></div>";
    }
    else
    {
      for( ; node = data[i]; i += 1 )
      {
        while( current_depth > node[DEPTH] )
        {
          tree += closing_tags.pop();
          current_depth--;
        }
        current_depth = node[ DEPTH ];
        children_length = node[ CHILDREN_LENGTH ];
        child_pointer = 0;
        node_name =  ( node[NAMESPACE] ? node[NAMESPACE] + ':': '' ) +  node[ NAME ];
        if( force_lower_case )
        {
          node_name = node_name.toLowerCase();
        }
        switch ( node[ TYPE ] )
        {
          case 1:  // elemets
          {
            if( show_attrs )
            {
              attrs = '';
              for( k = 0; attr = node[ATTRS][k]; k++ )
              {
                attrs += " <span class='key'>" + 
                  ( attr[ATTR_PREFIX] ? attr[ATTR_PREFIX] + ':' : '' ) + 
                  ( force_lower_case ? attr[ATTR_KEY].toLowerCase() : attr[ATTR_KEY] ) + 
                  "</span>=<span class='value'>\"" + 
                  attr[ATTR_VALUE] + 
                  "\"</span>";
              }
            }
            else
            {
              attrs = '';
            }

            child_pointer = i + 1;

            is_open = ( data[ child_pointer ] && ( node[ DEPTH ] < data[ child_pointer ][ DEPTH ] ) );
            if( is_open ) 
            {
              has_only_one_child = 1;
              one_child_value = '';
              child_level = data[ child_pointer ][ DEPTH ];
              for( ; data[child_pointer] &&  data[ child_pointer ][ DEPTH ] == child_level; child_pointer += 1 )
              {
                one_child_value += data[ child_pointer ] [ VALUE ];
                if( data[ child_pointer ][ TYPE ] != 3 )
                {
                  has_only_one_child = 0;
                  one_child_value = '';
                  break;
                }
              }
            }

            if( is_open )
            {
              if( has_only_one_child )
              {
                class_name = re_formatted.test(node_name) ? " class='pre-wrap'" : '';
                tree += "<div " + ( node[ ID ] == target ? "id='target-element'" : '' ) + 
                        " style='margin-left:" + 16 * node[ DEPTH ] + "px;' "+
                        "ref-id='"+ node[ ID ] + "' handler='spotlight-node' " +
                        class_name + ">"+
                        "<span class='node'>&lt;" + node_name +  attrs + "&gt;</span>" +
                        one_child_value + 
                        "<span class='node'>&lt;/" + node_name + "&gt;</span>" +
                        "</div>";
                i = child_pointer - 1;
              }
              else
              {
                tree += "<div " + ( node[ ID ] == target ? "id='target-element'" : '' ) + 
                        " style='margin-left:" + 16 * node[ DEPTH ] + "px;' "+
                        "ref-id='"+node[ ID ] + "' handler='spotlight-node'>"+
                        ( node[ CHILDREN_LENGTH ] ? 
                          "<input handler='get-children' type='button' class='open'>" : '' ) +
                        "<span class='node'>&lt;" + node_name + attrs + "&gt;</span>" +
                        "</div>";

                closing_tags.push("<div class='node' style='margin-left:" + 
                                  ( 16 * node[ DEPTH ] ) + "px;' " +
                                  "ref-id='"+node[ ID ] + "' handler='spotlight-node'>" +
                                  "&lt;/" + node_name + "&gt;" +
                                  "</div>");
              }

            }
            else
            {
            tree += "<div " + ( node[ ID ] == target ? "id='target-element'" : '' ) + 
                    " style='margin-left:" + 16 * node[ DEPTH ] + "px;' "+
                    "ref-id='"+ node[ ID ] + "' handler='spotlight-node'>"+
                    ( children_length ? 
                      "<input handler='get-children' type='button' class='close'>" : '' ) +
                    "<span class='node'>&lt;" + node_name + attrs + ( children_length ? '' : '/' ) + "&gt;</span>" +
                    "</div>";
            }
            break;
          }

          case 7:  // processing instruction
          {
            tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' " +      
              "class='processing-instruction'>&lt;?" + node[NAME] + ' ' + 
              formatProcessingInstructionValue(node[VALUE], force_lower_case) + "?&gt;</div>";
            break;

          }

          case 8:  // comments
          {
            if( show_comments )
            {
              if( !/^\s*$/.test(node[ VALUE ] ) )
              {
                tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' " +      
                        "class='comment pre-wrap'>&lt;!--" + node[ VALUE ] + "--&gt;</div>";
              }
            }
            break;

          }

          case 9:  // document node
          {
            /* makes not too much sense in the markup view
            tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' " +      
              ">#document</div>";
            */
            break;

          }

          case 10:  // doctype
          {
            tree += "<div style='margin-left:" + 16 * node[ DEPTH ] + "px;' class='doctype'>"+
                    "&lt;!doctype " + getDoctypeName(data) +
                    ( node[PUBLIC_ID] ? 
                      ( " PUBLIC " + "\"" + node[PUBLIC_ID] + "\"" ) :"" ) +
                    ( node[SYSTEM_ID] ?  
                      ( " \"" + node[SYSTEM_ID] + "\"" ) : "" ) +
                    "&gt;</div>";
            break;
          }

          default:
          {
            if( !/^\s*$/.test(node[ VALUE ] ) )
            {
              tree += "<div style='margin-left:" + ( 16 * node[ DEPTH ] )  + "px;'>" + 
                      node[ VALUE ]/*.replace(/[\x0A\x09\x0D]/g, '').replace(/ +/g, ' ')*/ + "</div>";
            }
          }

        }
      }
      
      while( closing_tags.length )
      {
        tree += closing_tags.pop();
      }
      var scrollTop = container.scrollTop;
      ( 
        container.firstChild ? 
        container.firstChild : 
        container.render(['div', 'class', 'padding']) 
      ).innerHTML = tree;
      container.scrollTop = scrollTop;
      
      topCell.statusbar.updateInfo(dom_data.getCSSPath());
      
    }

    

    
  }



}