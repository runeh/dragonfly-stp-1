﻿/**
  * @constructor 
  */

// TODO clean up pretty printing, does contain much too much code history

var stylesheets = new function()
{
  var self = this;
  // document.styleSheets dict with runtime-id as key
  var __sheets = {};
  // document.styleSheets[index].cssRules with runtime-id and index as keys
  var __rules = {};
  var __indexMap = null;
  var __indexMapLength = 0;
  var __sortedIndexMap = [];
  var __initialValues = [];
  var __shorthandIndexMap = [];
  var __selectedRules = null;
  var __colorIndex = 0;

  var __new_rts = null;
  var __top_rt_id = '';
  var __on_new_stylesheets_cbs = {};
  
  var line_height_index = 0;

  var onResetState = function()
  {
    __sheets = {};
    __rules = {};
    __indexMap = null;
    __indexMapLength = 0;
    __sortedIndexMap = [];
    __initialValues = [];
    __shorthandIndexMap = [];
    __selectedRules = null;
    __colorIndex = 0;
  }
  
  const
  SHEET_OBJECT_ID = 0, // TODO use the right obj-id
  SHEET_DISABLED = 1, 
  SHEET_HREF = 2, 
  SHEET_MEDIA_LIST = 3,  
  SHEET_OWNERNODE = 4, 
  SHEET_OWNERRULE = 5,  
  SHEET_PARENT_STYLESHEET = 6, 
  SHEET_TITLE = 7, 
  SHEET_TYPE = 8,
  UNKNOWN_RULE = 0,
  STYLE_RULE= 1,
  CHARSET_RULE = 2,
  IMPORT_RULE = 3,
  MEDIA_RULE = 4,
  FONT_FACE_RULE = 5,
  PAGE_RULE = 6,
  COMMON = 11,
  // TODO <property> was introduced later, need to be cleaned up.
  MARKUP_KEY = "<property><key>",
  MARKUP_KEY_OW = "<property class='overwritten'><key>",
  MARKUP_KEY_CLOSE = "</key>: ",
  MARKUP_VALUE = "<value>",
  MARKUP_VALUE_OW = "<value>",
  MARKUP_VALUE_CLOSE = "</value>;</property>",
  MARKUP_PROP_NL = "",
  MARKUP_IMPORTANT = " !important",
  MARKUP_SPACE = " ",
  MARKUP_EMPTY = "",
  HEADER = 0,
  COMP_STYLE = 0,
  CSS = 1,
  PROP_LIST = 1,
  VAL_LIST = 2,
  PRIORITY_LIST = 3,
  OVERWRITTEN_LIST = 4,
  SEARCH_LIST = 6,
  HAS_MATCHING_SEARCH_PROPS = 7;
  
  var
  SHORTHAND = [];

  var short_hand_counts =
  {
    "background": 6,
    "list-style": 4,
    "font": 7
  }

  var initials = 
  {
    "background-attachment": "scroll",
    "background-color": "transparent",
    "background-image": "none",
    "background-position": "0% 0%",
    "background-repeat": "repeat",
    "list-style-image": "none",
    "list-style-position": "outside",
    "list-style-type": "disc",
    "font-family": "",
    "font-size": "medium",
    "font-style": "normal",
    "font-variant": "normal",
    "font-weight": "400", // TODO this is a bug, see Bug 319914
    "line-height": "normal"
  };

  var short_hand_props = 
  {
    'font': 1,
    'padding': 1,
    'margin': 1,
    'list-style': 1,
    'border': 1,
    'border-top': 1,
    'border-right': 1,
    'border-bottom': 1,
    'border-left': 1,
    'border-width': 1,
    'border-style': 1,
    'border-color': 1,
    'background': 1,
    'outline': 1
  }

  var special_default_values = {}; 

  special_default_values["border-bottom-color"] = 
  special_default_values["border-left-color"] = 
  special_default_values["border-right-color"] = 
  special_default_values["border-top-color"] = function(data, value)
  {
    return value == data[__colorIndex];
  }
  


  
  
/*
 RULE ::=    UNKNOWN-RULE
          | STYLE-RULE-MULTIPLE
          | CHARSET-RULE
          | IMPORT-RULE
          | MEDIA-RULE
          | FONT-FACE-RULE
          | PAGE-RULE

; http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleRule

STYLE-RULE-MULTIPLE ::= "["
                         "[" STYLE-RULE-HEADER-MULTIPLE "],"
                         "[" INDEX-LIST "],"
                         "[" VALUE-LIST "],"
                         "[" PRIORITY-LIST "]"
                        "]"

STYLE-RULE-HEADER-MULTIPLE ::= STYLESHEET-ID "," RULE-ID "," RULE-TYPE "," SELECTOR-LIST "," SPECIFICITY-LIST

*/

  const
  RULE_HEADER = 0,
  INDENT = '  ';
  
  /*
    TODO create shorthands should probably be removed 
    as soon as we get the source stylesheets.
    if not the shorthand code needs cleanup.
  */
  var shorthands = {};
  
  shorthands.padding = shorthands.margin = function(prop, index_list, value_list, priority_list)
  {
    var
    consistent_pri_flag = priority_list[1] == priority_list[2] &&
        priority_list[1] == priority_list[3] && priority_list[1] == priority_list[4];
    // ensures as well that all 4 properties are set ( if not it's not a shorthand ) 
    if(consistent_pri_flag)
    {
      var
      priority_flag = priority_list[1] ? MARKUP_IMPORTANT : MARKUP_EMPTY,
      top_bottom = value_list[1] == value_list[3],
      left_right = value_list[2] == value_list[4];
      
      if(top_bottom && left_right && value_list[1] == value_list[2])
      {
        return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                  MARKUP_VALUE + value_list[1] + priority_flag + MARKUP_VALUE_CLOSE; 
      }
      if(top_bottom && left_right)
      {
        return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                  MARKUP_VALUE + value_list[1] + MARKUP_SPACE + value_list[2] + priority_flag + MARKUP_VALUE_CLOSE; 
      }
      if(left_right)
      {
        return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                MARKUP_VALUE + value_list[1] + MARKUP_SPACE + value_list[2] + MARKUP_SPACE +
                value_list[3] +  priority_flag + MARKUP_VALUE_CLOSE;
      }
      return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                MARKUP_VALUE + value_list[1] + MARKUP_SPACE + value_list[2] + MARKUP_SPACE +
                value_list[3] + MARKUP_SPACE + value_list[4] + priority_flag + MARKUP_VALUE_CLOSE;
    }
    else
    {
      var ret = '', i = 1;
      for( ; i < index_list.length; i++ )
      {
        if(value_list[i])
        {
          ret += ( ret ? MARKUP_PROP_NL : "" ) +
            INDENT +
            MARKUP_KEY + __indexMap[index_list[i]] + MARKUP_KEY_CLOSE +
            MARKUP_VALUE + value_list[i] + ( priority_list[i] ? MARKUP_IMPORTANT : MARKUP_EMPTY) +
            MARKUP_VALUE_CLOSE;
        }
      }
      return ret;
    }
  }
  
  
  
  shorthands.fallback = function(index, value, priority_flag)
  {
    return INDENT +
      MARKUP_KEY + __indexMap[index] + MARKUP_KEY_CLOSE +
      MARKUP_VALUE + value + ( priority_flag ? MARKUP_IMPORTANT : MARKUP_EMPTY) + MARKUP_VALUE_CLOSE;
  }
  
  shorthands.border = function(prop, index_list, value_list, priority_list)
  {
    
    var
    key_list = ['border-top', 'border-right', 'border-bottom', 'border-left'],
    key_type_list = ['border-width', 'border-style', 'border-color'],
    is_short_width = value_list[1] && value_list[4] && value_list[7] && value_list[10] && 1 || 0,
    is_short_style = value_list[2] && value_list[5] && value_list[8] && value_list[11] && 1 || 0,
    is_short_color = value_list[3] && value_list[6] && value_list[9] && value_list[12] && 1 || 0,
    is_short_type = is_short_width + is_short_style + is_short_color == 1,
    short_value_list = [],
    is_short_priority_list = [],
    short_priority_list = [],
    i = 1,
    j = 0,
    index_short = 0,
    previous_value = '',
    is_short_short = true,
    is_all_and_consistent_pri_flag = true, 
    priority_flag = '',
    ret = '',
    _0_1_ = false,
    _2_3_ = false,
    three_equals = null;
    
    if( is_short_type ) // border-width or border-style or border-color 
    {
      
      i = is_short_color && 2 || is_short_style && 1 || 0;

      
      
      if( priority_list[i+1] == priority_list[i+4] && priority_list[i+1] == priority_list[i+7] &&
            priority_list[i+1] == priority_list[i+10])
      {
        priority_flag = priority_list[i+1] ? MARKUP_IMPORTANT : MARKUP_EMPTY;
        if( value_list[i+1] == value_list[i+4] && value_list[i+1] == value_list[i+7] &&
              value_list[i+1] == value_list[i+10])
        {
          
          return INDENT + MARKUP_KEY + key_type_list[i] + MARKUP_KEY_CLOSE +
                  MARKUP_VALUE + value_list[i+1] + priority_flag + MARKUP_VALUE_CLOSE;
        }
        else // eg border-width: 10px 8px 8px 10px
        {
          return INDENT + MARKUP_KEY + key_type_list[i] + MARKUP_KEY_CLOSE +
                  MARKUP_VALUE + value_list[i+1] + MARKUP_SPACE + value_list[i+4] +
                  MARKUP_SPACE + value_list[i+7] + MARKUP_SPACE + value_list[i+10] +
                  priority_flag + MARKUP_VALUE_CLOSE;
        }
      }
      else
      {
        for( j = 1; j < 11; j+=3 )
        {
          ret += ( ret ? MARKUP_PROP_NL : "" ) +
            this.fallback(index_list[i+j], value_list[i+j], priority_list[i+j]);
        }
        return ret;
      }
    }
    // border-top or border-right or border-bottom or border-left or border
    for( i = 1; i < 13; i+=3 )
    {
      if(value_list[i] && value_list[i+1] && value_list[i+2])
      {
        if( is_short_priority_list[index_short] = priority_list[i] == priority_list[i+1] &&
          priority_list[i] == priority_list[i+2] )
        {
          short_priority_list[index_short] = priority_list[i] ? MARKUP_IMPORTANT : MARKUP_EMPTY;
          short_value_list[index_short] =
            value_list[i+1] == 'none'
            ? value_list[i+1]
            : value_list[i] + MARKUP_SPACE + value_list[i+1] + MARKUP_SPACE + value_list[i+2];
        }
        else
        {
          short_value_list[index_short] = i;
        }

      }
      is_short_short = is_short_short && is_short_priority_list[index_short];
      if(index_short && is_short_short)
      {
        is_short_short = previous_value && previous_value == short_value_list[index_short];
      }
      is_all_and_consistent_pri_flag = 
        is_all_and_consistent_pri_flag && 
        ( index_short
        ? is_short_priority_list[index_short - 1] == is_short_priority_list[index_short]
        : is_short_priority_list[index_short] );
      previous_value = short_value_list[index_short];
      index_short++;
    }
    if(is_short_short)
    {
      return INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                MARKUP_VALUE + short_value_list[0] + MARKUP_VALUE_CLOSE;
    }
    else if(is_all_and_consistent_pri_flag) // check for three identical values
    {
      _0_1_ = short_value_list[0] == short_value_list[1];
      _2_3_ = short_value_list[2] == short_value_list[3];
      three_equals = 
      [
        _2_3_ && short_value_list[1] == short_value_list[2],
        _2_3_ && short_value_list[0] == short_value_list[2],
        _0_1_ && short_value_list[0] == short_value_list[3],
        _0_1_ && short_value_list[0] == short_value_list[2],
      ]
        
      for( i = 0; i < 4 && !three_equals[i]; i++ );
      if( i != 4 )
      {
        return  INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE +
                MARKUP_VALUE + 
                ( i 
                  ? short_value_list[0] + short_priority_list[0] 
                  : short_value_list[1] + short_priority_list[1] )  +
                MARKUP_VALUE_CLOSE +
                MARKUP_PROP_NL +
                INDENT + MARKUP_KEY + key_list[i] + MARKUP_KEY_CLOSE + 
                MARKUP_VALUE + short_value_list[i] + short_priority_list[i] + MARKUP_VALUE_CLOSE;
      }
    }
    for( i = 0; i < 4; i++ )
    {
      if(short_value_list[i])
      {
        if(is_short_priority_list[i])
        {
          ret += ( ret ? MARKUP_PROP_NL : "" ) +
                  INDENT + MARKUP_KEY + key_list[i] + MARKUP_KEY_CLOSE + 
                  MARKUP_VALUE + short_value_list[i] + short_priority_list[i] + MARKUP_VALUE_CLOSE;              
        }
        else
        {
          for( j = short_value_list[i]; j < short_value_list[i] + 3; j++ )
          {
            ret += ( ret ? MARKUP_PROP_NL : "" ) +
                    this.fallback(index_list[j], value_list[j], priority_list[j]);              
          }
        }
      }

    }
    return ret;
  }
  
  shorthands.font = shorthands['list-style'] = shorthands.background = function(prop, index_list, value_list, priority_list)
  {
    var 
    priority_flag = -1, 
    count = short_hand_counts[prop], 
    i = 1, 
    short_values = '', 
    ret = '';
    // check priority flags
    for( ; i < count; i++ )
    {
      if(value_list[i])
      {
        if(priority_flag == -1)
        {
          priority_flag = priority_list[i];
        }
        else if(priority_flag != priority_list[i])
        {
          break;
        }
      }
      else
      {
        // it's not a short hand, some values are missing
        break;
        
      }
    }
    if( i == count )
    {
      priority_flag = priority_flag ? MARKUP_IMPORTANT : MARKUP_EMPTY;
      for( i = 0; i < count; i++ )
      {
        if(value_list[i] && value_list[i] != initials[__indexMap[index_list[i]]] )
        {
          short_values +=
          ( short_values ? ( __indexMap[index_list[i]] == 'line-height' ? '/' : ' ' ) : '' ) + value_list[i];
        }
      }
      ret += ( ret ? MARKUP_PROP_NL : "" ) +
              INDENT + MARKUP_KEY + prop + MARKUP_KEY_CLOSE + 
              MARKUP_VALUE + ( short_values ? short_values : initials[__indexMap[index_list[1]]] )  + priority_flag + MARKUP_VALUE_CLOSE; 
    }
    else
    {
      for( i = 1; i < count; i++ )
      {
        if(value_list[i])
        {
          ret += ( ret ? MARKUP_PROP_NL : "" ) +
                  this.fallback(index_list[i], value_list[i], priority_list[i]);   
        }
      } 
    }
    return ret;
  }
  
  
  
  
  var prettyPrintRule = [];

  prettyPrintRule[COMMON] = function(rule, do_shortcuts, search_active)
  {
    const
    HEADER = 0,
    INDEX_LIST = 1,
    VALUE_LSIT = 2,
    PROPERTY_LIST = 3;
    
    var ret = '',
    index_list = rule[INDEX_LIST],
    value_list = rule[VALUE_LSIT],
    priority_list = rule[PROPERTY_LIST],
    overwrittenlist = rule[OVERWRITTEN_LIST],
    search_list = rule[SEARCH_LIST],
    length = index_list.length, i = 0,
    index = 0,
    s_h_index = [],
    s_h_value = [],
    s_h_priority = [],
    s_h_prop = '',
    s_h_count = 0;


    
    for( ; i < length; i++ )
    {
      index = index_list[i];
      if( search_active && !search_list[i] )
      {
        continue;
      }
      if( do_shortcuts && SHORTHAND[index] )
      {
        if( __shorthandIndexMap[index] == 'font' )
        {
          SHORTHAND[line_height_index] = 5;
        }
        s_h_index = [];
        s_h_value = [];
        s_h_priority = [];
        s_h_prop = __shorthandIndexMap[index];
        s_h_count = 0;
        do
        {
          if( __shorthandIndexMap[index] != 'line-height' && 
                        __shorthandIndexMap[index] != s_h_prop )
          {
            ret += ( ret ? MARKUP_PROP_NL : "" ) +
              shorthands[s_h_prop](s_h_prop, s_h_index, s_h_value, s_h_priority);
            s_h_count = s_h_count % 4;
            while(s_h_prop == 'border' && s_h_count)
            {
              ret += ( ret ? MARKUP_PROP_NL : MARKUP_EMPTY ) +
                INDENT +
                MARKUP_KEY_OW + __indexMap[index_list[i - s_h_count]] + MARKUP_KEY_CLOSE +
                MARKUP_VALUE_OW + value_list[i - s_h_count] + ( priority_list[i - s_h_count] ? MARKUP_IMPORTANT : "") + MARKUP_VALUE_CLOSE; 
              s_h_count--;
            }
            SHORTHAND[line_height_index] = __shorthandIndexMap[index] == 'font' ? 5 : 0;
            s_h_index = [];
            s_h_value = [];
            s_h_priority = [];
            s_h_prop = __shorthandIndexMap[index];
            s_h_count = 0;
          }
          s_h_index[SHORTHAND[index]] = index;
          s_h_value[SHORTHAND[index]] = value_list[i];
          s_h_priority[SHORTHAND[index]] = priority_list[i];
          index = index_list[++i];
          s_h_count++;
        }
        while( SHORTHAND[index] );

        ret += ( ret ? MARKUP_PROP_NL : MARKUP_EMPTY ) +
          shorthands[s_h_prop](s_h_prop, s_h_index, s_h_value, s_h_priority);
        s_h_count = s_h_count % 4;
        while(s_h_count)
        {
          ret += ( ret ? MARKUP_PROP_NL : MARKUP_EMPTY ) +
            INDENT +
            MARKUP_KEY_OW + __indexMap[index_list[i - s_h_count]] + MARKUP_KEY_CLOSE +
            MARKUP_VALUE_OW + value_list[i - s_h_count] + ( priority_list[i - s_h_count] ? MARKUP_IMPORTANT : "") + MARKUP_VALUE_CLOSE; 
          s_h_count--;
        }
        SHORTHAND[line_height_index] = 0;
      }
      else
      {
        // css inspector does not shorthand properties
        // perhaps later
        // protocol-4: overwrittenlist is now the STATUS, the meaning is inverted, 1 means applied
        if( overwrittenlist && overwrittenlist[i] )
        {
          ret += ( ret ? MARKUP_PROP_NL : MARKUP_EMPTY ) +
            INDENT +
            MARKUP_KEY + __indexMap[index] + MARKUP_KEY_CLOSE +
            MARKUP_VALUE + value_list[i] + ( priority_list[i] ? MARKUP_IMPORTANT : "") + MARKUP_VALUE_CLOSE; 
  
        }
        else
        {
          ret += ( ret ? MARKUP_PROP_NL : MARKUP_EMPTY ) +
            INDENT +
            MARKUP_KEY_OW + __indexMap[index] + MARKUP_KEY_CLOSE +
            MARKUP_VALUE_OW + value_list[i] + ( priority_list[i] ? MARKUP_IMPORTANT : "") + MARKUP_VALUE_CLOSE;   
        }
      }
    }
    return ret;
  }

  prettyPrintRule[UNKNOWN_RULE] = function(rule, do_shortcuts)
  {
    return '';
  }
  prettyPrintRule[STYLE_RULE] = function(rule, do_shortcuts)
  {
    return "<rule rule-id='" + rule[HEADER][1] + "'>" + 
      "<selector>" + rule[HEADER][3].join(', ') + "</selector>" + 
      " {\n" + 
      prettyPrintRule[COMMON](rule, do_shortcuts) +
      "\n}</rule>";
  }
  
  prettyPrintRule[CHARSET_RULE] = function(rule, do_shortcuts)
  {
    return 'TODO';
  }
  
  /*
  e.g.: @import url("bluish.css") projection, tv;
  IMPORT-RULE ::= "[[" STYLESHEET-ID "," RULE-ID "," RULE-TYPE "," HREF "," MEDIA-LIST "," STYLESHEET-ID "]]"
  */

  prettyPrintRule[IMPORT_RULE] = function(rule, do_shortcuts)
  {
    return "<import-rule rule-id='" + rule[0][1] + "' imported-sheet='" + rule[0][5] + "'>" +
              "<span class='import-rule'>@import url(\"" + rule[0][3] + "\") " +
              rule[0][4].join(', ') + "</span>" +
            "</import-rule>";
  }

  /*
    MEDIA-RULE ::= "[[" MEDIA-RULE-HEADER "],[" RULE-LIST "]]"
    MEDIA-RULE-HEADER ::= STYLESHEET-ID "," RULE-ID "," RULE-TYPE "," MEDIA-LIST
  */

  prettyPrintRule[MEDIA_RULE] = function(rule, do_shortcuts)
  {
    var ret = '', _rule = null, header = null, i = 0;
    for( ; _rule = rule[1][i]; i++)
    {
      ret += prettyPrintRule[_rule[RULE_HEADER][2]](_rule, do_shortcuts);
    }
    return "<media-rule rule-id='" + rule[0][1] + "'>" +
              "<media>@media " + rule[0][3].join(', ') + "   </media>{" +
              "<rules>" + ret + "</rules>" +
            "}</media-rule>";
  }

  /*
  FONT_FACE-RULE ::= "["
                     "[" FONT_FACE-RULE-HEADER "]"
                     "[" INDEX-LIST "]"
                     "[" VALUE-LIST "]"
                     "[" PRIORITY-LIST "]"
                   "]"
  FONT_FACE-RULE-HEADER ::= STYLESHEET-ID "," RULE-ID "," RULE-TYPE
  */

  prettyPrintRule[FONT_FACE_RULE] = function(rule, do_shortcuts)
  {

    return "<font-face-rule rule-id='" + rule[HEADER][1] + "'>" +
              "<at>@font-face</at> {\n" +
              prettyPrintRule[COMMON](rule, do_shortcuts) +
            "\n}</font-face-rule>";
  }

  /*
  PAGE-RULE ::= "["
                  "[" PAGE-RULE-HEADER "]"
                  "[" INDEX-LIST "]"
                  "[" VALUE-LIST "]"
                  "[" PRIORITY-LIST "]"
                "]"
  PAGE-RULE ::= STYLESHEET-ID "," RULE-ID "," RULE-TYPE "," SPECIFICITY "," PAGE-SELECTOR "," PSEUDO-CLASS
  */
  
  prettyPrintRule[PAGE_RULE] = function(rule, do_shortcuts)
  {
    return "<page-rule rule-id='" + rule[HEADER][1] + "'>" +
              "<at>@page</at>" + 
              ( rule[0][4] ? "<selector>" + rule[HEADER][4] + "</selector>" : "" ) + 
              " {\n" +
              prettyPrintRule[COMMON](rule, do_shortcuts) +
            "\n}</page-rule>";
  }
  
  
  this.prettyPrintRules = function(rules, do_shortcuts)
  {
    var ret = '', rule = null, header = null, i = 0;
    if(rules.length)
    {
      for( ; rule = rules[i]; i++)
      {
        ret += prettyPrintRule[rule[RULE_HEADER][2]](rule, do_shortcuts);
      }
      return "<stylesheet stylesheet-id='" + rules[0][0][0] + "' runtime-id='" + rules['runtime-id'] + "'>" 
                + ret + "</stylesheet>";
    }
    else
    {
      return "<div class='info-box'><p>" + 
                  ui_strings.S_INFO_STYLESHEET_HAS_NO_RULES + "</p></div>";
    }
  }

  var prettyPrintCat = [];
  
  var prettyPrintCat_2 = [];
  

  prettyPrintCat_2[COMP_STYLE] = prettyPrintCat[COMP_STYLE] = function(data, search_active)
  {
    
    var ret = "", i = 0, index = 0, prop = '', value = '';
    // setProps is used to force the display if a given property is set 
    // also if it has the initial value
    var setProps = elementStyle.getSetProps();
    var hideInitialValue = settings['css-inspector'].get('hide-initial-values');
    var hide_shorthands = settings['css-inspector'].get('hide-shorthands'); // TODO make a setting
    var serach_map = search_active && elementStyle.getSearchMap() || [];
    var is_not_initial_value = false;
    var display = false;

    for ( ; i <  __indexMapLength; i++ )
    {
      index = __sortedIndexMap[i];
      prop = __indexMap[index];
      value = data[index];
      is_not_initial_value = 
        hideInitialValue
        && value
        && value != __initialValues[index] 
        && !( prop in special_default_values &&  special_default_values[prop](data, value) )
        || false;
      display = 
        ( 
          !hideInitialValue 
          || setProps[index] 
          || is_not_initial_value 
        )
        && !( hide_shorthands && short_hand_props[prop] )
        && !( search_active && !serach_map[index] );
      if( display )
      {
        ret += ( ret ? MARKUP_PROP_NL : "" ) +
              MARKUP_KEY + prop + MARKUP_KEY_CLOSE + 
              MARKUP_VALUE + value + MARKUP_VALUE_CLOSE;
      }
      
    } 
    return ret;
  }
  
  prettyPrintCat_2[CSS] = function(data, search_active)
  {
    var 
      node_casc = null, 
      i = 0, 
      ret = '', 
      j = 0, 
      css_style_dec = null,
      rt_id = data.rt_id,
      node_casc_header = null,
      style_dec_list = null,
      style_dec = null;

    for( ; node_casc = data[i]; i++)
    {

      if( search_active && !node_casc[HAS_MATCHING_SEARCH_PROPS] )
      {
        continue;
      }

      if( i )
      {
        ret += "<h2>inherited from <b>" + node_casc[0][1] + "</b></h2>";
      }
      
      node_casc_header = node_casc[0];
      style_dec_list = node_casc[1];
      for( j = 0; style_dec = style_dec_list[j]; j++)
      {
        ret += prettyPrintStyleDec[style_dec[0][0]](rt_id, node_casc_header, style_dec, search_active);
      }

    }
    return ret;
  }
  
  // for protocol-4
  const
  PROT_4_USER_AGENT = 1, // default
  PROT_4_LOCAL = 2, // user
  PROT_4_AUTHOR = 3, // author
  PROT_4_ELEMENT = 4; // inline
  
  var prettyPrintStyleDec = [];


  prettyPrintStyleDec[PROT_4_USER_AGENT] = 
  function(rt_id, node_casc_header, style_dec, search_active)
  {
    return "<rule>" +
            "<stylesheet-link class='pseudo'>default values</stylesheet-link>" +
      "<inline-style>" + node_casc_header[1] + "</inline-style>" + 
      " {\n" + 
          prettyPrintRule[COMMON](style_dec, false, search_active) +
      "\n}</rule>";
  }

  prettyPrintStyleDec[PROT_4_LOCAL] = 
  function(rt_id, node_casc_header, style_dec, search_active)
  {
    return "<rule>" +
            "<stylesheet-link class='pseudo'>local user stylesheet</stylesheet-link>" +
      "<inline-style>" + style_dec[0][2] + "</inline-style>" + 
      " {\n" + 
          prettyPrintRule[COMMON](style_dec, false, search_active) +
      "\n}</rule>";
  }


  prettyPrintStyleDec[PROT_4_AUTHOR] = 
  function(rt_id, node_casc_header, style_dec, search_active)
  {
    var 
    ret = '', 
    header = null, 
    i = 0, 
    sheet = self.getSheetWithObjId(rt_id, style_dec[HEADER][1]);
  
    if( sheet )
    {
      if( !search_active || style_dec[HAS_MATCHING_SEARCH_PROPS]  )
      {
        ret += "<rule rule-id='" + style_dec[HEADER][2] + "'>" + 
          "<stylesheet-link rt-id='" + sheet[0] + "'"+
            " index='" + sheet[1] + "' handler='display-rule-in-stylesheet'>" + sheet[2] + 
          "</stylesheet-link>" +
          "<selector>" + style_dec[HEADER][5] + "</selector>" + 
          " {\n" + 
              prettyPrintRule[COMMON](style_dec, false, search_active) +
          "\n}</rule>";
      }
    }
    else
    {
      opera.postError(ui_strings.DRAGONFLY_INFO_MESSAGE +
        'stylesheet is missing in stylesheets, prettyPrintStyleDec[PROT_4_AUTHOR]');
    }

    return ret;
  }


  prettyPrintStyleDec[PROT_4_ELEMENT] = 
  function(rt_id, node_casc_header, style_dec, search_active)
  {
    return "<rule>" + 
      "<inline-style>element.style</inline-style>" + 
      " {\n" + 
          prettyPrintRule[COMMON](style_dec, false, search_active) +
      "\n}</rule>";
  }

  this.prettyPrintCat = function(cat_index, data, org_args, search_active)
  {
    if(!__sheets[data.rt_id])
    {
      var tag = tagManager.setCB(null, handleGetAllStylesheets, [data.rt_id, org_args]);
      services['ecmascript-debugger'].getAllStylesheets( tag, data.rt_id, 'json' );
      return '';
    }
    if( !__indexMap )
    {
      var tag = tagManager.setCB(null, handleGetIndexMap, [org_args]);
      services['ecmascript-debugger'].getIndexMap( tag, 'json' );
      return '';
    }
    return prettyPrintCat_2[cat_index](data, search_active);
  }
  
  this.getStylesheets = function(rt_id, org_args)
  {
    if(__sheets[rt_id])
    {
      return __sheets[rt_id];
    }
    if( org_args && runtime_onload_handler.check(rt_id, org_args) )
    {
      if( !__indexMap )
      {
        var tag = tagManager.setCB(null, handleGetIndexMap, []);
        services['ecmascript-debugger'].getIndexMap( tag, 'json' );
      }
      var tag = tagManager.setCB(null, handleGetAllStylesheets, [rt_id, org_args]);
      services['ecmascript-debugger'].getAllStylesheets( tag, rt_id, 'json' );
      return null;
    }
  }

  this.hasStylesheetsRuntime = function(rt_id)
  {
    return __sheets[rt_id] && true || false;
  }

  this.getSheetWithObjId = function(rt_id, obj_id)
  {
    if(__sheets[rt_id])
    {
      var sheet = null, i = 0;
      for( ; sheet = __sheets[rt_id][i]; i++)
      {
        if( sheet[SHEET_OBJECT_ID] == obj_id )
        {
          return [
            rt_id, 
            i, 
            ( sheet[SHEET_HREF] && /\/([^/]*$)/.exec(sheet[SHEET_HREF])[1] 
              || sheet[SHEET_TITLE] 
              || 'stylesheet ' + i)
          ];  
        }
      }
      return null;
    }
  }

  this.getSheetWithRtIdAndIndex = function(rt_id, index)
  {
    return __sheets[rt_id] && __sheets[rt_id][index] || null;
  }
  
  this.getRulesWithSheetIndex = function(rt_id, index, org_args)
  {
    if(__rules[rt_id][index])
    {
      return __rules[rt_id][index];
    }
    else
    {
      var tag = tagManager.setCB(null, handleGetRulesWithIndex, [rt_id, index, org_args]);
      var sheet_id = __sheets[rt_id][index][SHEET_OBJECT_ID];
      services['ecmascript-debugger'].getCSSRules( tag, rt_id, sheet_id, 'json' );
      return null;
    }
  }
  
  this.setSelectedSheet = function(rt_id, index, rules, rule_id)
  {
    __selectedRules =
    {
      runtime_id: rt_id,
      index: index,
      rules: rules,
      rule_id: rule_id || ''
    }
    window['cst-selects']['stylesheet-select'].updateElement();

  }
  
  this.getSelectedSheet = function(org_args)
  {
    if( __selectedRules )
    {
      return __selectedRules;
    }
    if( org_args )
    {
      onNewStylesheets(__top_rt_id, [null, selectFirstSheet, __top_rt_id, 0, org_args]);
    }
    return null;
  }

  var selectFirstSheet = function(rt_id, index, org_args)
  {
    var rules = stylesheets.getRulesWithSheetIndex(rt_id, index, arguments);
    if(rules)
    {
      self.setSelectedSheet(rt_id, index, rules);
      org_args.callee.apply(null, org_args);
    }
  }

  this.hasSelectedSheetRuntime = function(rt_id)
  {
    return __selectedRules && __selectedRules.runtime_id == rt_id || false;
  }
  
  this.isSelectedSheet = function(rt_id, index)
  {
    
    return ( __selectedRules && rt_id == __selectedRules.runtime_id &&
              index == __selectedRules.index && true || false );
  }
  
  var handleGetIndexMap = function(xml, org_args)
  {
    var json = xml.getNodeData('index');
    if( json )
    {
      window.css_index_map = __indexMap = eval('(' + json +')');
      window.inherited_props_index_list = [];
      var prop = '', i = 0;
      var temp = [];
      for( ; prop = __indexMap[i]; i++)
      {
        temp[i] = {index: i, key : prop};
        __initialValues[i] = css_initial_values[prop];
        if( prop in css_inheritable_properties )
        {
          inherited_props_index_list[i] = true;
        }
        switch (prop)
        {
          case 'color':
          {
            __colorIndex = i;
            break;
          }
          // margin
          case 'margin-top':
          {
            SHORTHAND[i] = 1;
            __shorthandIndexMap[i] = 'margin';
            break;
          }
          case 'margin-right':
          {
            SHORTHAND[i] = 2;
            __shorthandIndexMap[i] = 'margin';
            break;
          }
          case 'margin-bottom':
          {
            SHORTHAND[i] = 3;
            __shorthandIndexMap[i] = 'margin';
            break;
          }
          case 'margin-left':
          {
            SHORTHAND[i] = 4;
            __shorthandIndexMap[i] = 'margin';
            break;
          }
          // padding
          case 'padding-top':
          {
            SHORTHAND[i] = 1;
            __shorthandIndexMap[i] = 'padding';
            break;
          }
          case 'padding-right':
          {
            SHORTHAND[i] = 2;
            __shorthandIndexMap[i] = 'padding';
            break;
          }
          case 'padding-bottom':
          {
            SHORTHAND[i] = 3;
            __shorthandIndexMap[i] = 'padding';
            break;
          }
          case 'padding-left':
          {
            SHORTHAND[i] = 4;
            __shorthandIndexMap[i] = 'padding';
            break;
          }
          // border top
          case 'border-top-width':
          {
            SHORTHAND[i] = 1;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-top-style':
          {
            SHORTHAND[i] = 2;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-top-color':
          {
            SHORTHAND[i] = 3;
            __shorthandIndexMap[i] = 'border';
            break;
          }
          // border rigth
          case 'border-right-width':
          {
            SHORTHAND[i] = 4;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-right-style':
          {
            SHORTHAND[i] = 5;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-right-color':
          {
            SHORTHAND[i] = 6;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          // border bottom
          case 'border-bottom-width':
          {
            SHORTHAND[i] = 7;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-bottom-style':
          {
            SHORTHAND[i] = 8;
            __shorthandIndexMap[i] = 'border';
            break;
          }
          case 'border-bottom-color':
          {
            SHORTHAND[i] = 9;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          // border left
          case 'border-left-width':
          {
            SHORTHAND[i] = 10;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-left-style':
          {
            SHORTHAND[i] = 11;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          case 'border-left-color':
          {
            SHORTHAND[i] = 12;
            __shorthandIndexMap[i] = 'border';          
            break;
          }
          // background
          case 'background-color':
          {
            SHORTHAND[i] = 1;
            __shorthandIndexMap[i] = 'background';          
            break;
          }
          case 'background-image':
          {
            SHORTHAND[i] = 2;
            __shorthandIndexMap[i] = 'background';          
            break;
          }
          case 'background-attachment':
          {
            SHORTHAND[i] = 3;
            __shorthandIndexMap[i] = 'background';          
            break;
          }
          case 'background-repeat':
          {
            SHORTHAND[i] = 4;
            __shorthandIndexMap[i] = 'background';          
            break;
          }
          case 'background-position':
          {
            SHORTHAND[i] = 5;
            __shorthandIndexMap[i] = 'background';          
            break;
          }
          
/// 'list-style-type'> || <'list-style-position'> || <'list-style-image'
          // list-style
          
          case 'list-style-type':
          {
            SHORTHAND[i] = 1;
            __shorthandIndexMap[i] = 'list-style';          
            break;
          }
          case 'list-style-position':
          {
            SHORTHAND[i] = 2;
            __shorthandIndexMap[i] = 'list-style';          
            break;
          }
          case 'list-style-image':
          {
            SHORTHAND[i] = 3;
            __shorthandIndexMap[i] = 'list-style';          
            break;
          }
          
          // [ [ <'font-style'> || <'font-variant'> || <'font-weight'> ]? <'font-size'> [ / <'line-height'> ]? <'font-family'> ] |
          case 'font-style':
          {
            SHORTHAND[i] = 1;
            __shorthandIndexMap[i] = 'font';          
            break;
          }
          case 'font-variant':
          {
            SHORTHAND[i] = 2;
            __shorthandIndexMap[i] = 'font';          
            break;
          }
          case 'font-weight':
          {
            SHORTHAND[i] = 3;
            __shorthandIndexMap[i] = 'font';          
            break;
          }
          case 'font-size':
          {
            SHORTHAND[i] = 4;
            __shorthandIndexMap[i] = 'font';          
            break;
          }
          case 'line-height':
          {
            line_height_index = i;
            SHORTHAND[i] = 0; // | 5
            __shorthandIndexMap[i] = 'font';          
            break;
          }
          case 'font-family':
          {
            SHORTHAND[i] = 6;
            __shorthandIndexMap[i] = 'font';          
            break;
          }

          

          


        }
        
      
      }
      temp.sort(function(a,b){return a.key < b.key ? -1 : a.key > b.key ? 1 : 0});
      for( i = 0; prop = temp[i]; i++)
      {
        __sortedIndexMap[i] = prop.index;
        
      }
      __indexMapLength = __indexMap.length;
      if( org_args && ( !org_args[0].__call_count || org_args[0].__call_count == 1 )  )
      {
        org_args[0].__call_count = org_args[0].__call_count ? org_args[0].__call_count + 1 : 1;
        org_args.callee.apply(null, org_args)
      }
    } 
  }
  
  var handleGetRulesWithIndex = function(xml, rt_id, index, org_args)
  {
    var json = xml.getNodeData('rule-list');

    if( json )
    {
      __rules[rt_id][index] = eval('(' + json +')');
      __rules[rt_id][index]['runtime-id'] = rt_id;
      if(org_args && !org_args[0].__call_count)
      {
        org_args[0].__call_count = 1
        org_args.callee.apply(null, org_args);
      }
    } 
  }
  
  var handleGetAllStylesheets = function(xml, rt_id, org_args)
  {
    var json = xml.getNodeData('stylesheets');

    if( json )
    {
      __sheets[rt_id] = eval('(' + json +')');
      __sheets[rt_id]['runtime-id'] = rt_id;
      __rules[rt_id] = [];
      if(org_args && !org_args[0].__call_count )
      {
        org_args[0].__call_count = 1;
        org_args.callee.apply(null, org_args);
      }
    }   
  }

  var onRuntimeDestroyed = function(msg)
  {
    if( __selectedRules &&  __selectedRules.runtime_id == msg.id )
    {
      views.stylesheets.clearAllContainers();
    }
  }

  var onNewStylesheets = function(rt_id, cb_arr/* obj, cb_method, arg 1, arg 2, ... */)
  {
    // cb_arr: [cb_obj, cb_method, arg 1, arg 2, ... ]
    if(__on_new_stylesheets_cbs[rt_id])
    {
      __on_new_stylesheets_cbs[rt_id][__on_new_stylesheets_cbs[rt_id].length] = cb_arr;
    }
    else
    {
      cb_arr[1].apply(cb_arr[0], cb_arr.slice(2));
    }
  }

  var updateOnNewStylesheets = function(rt_ids) // rt_ids is an array
  {
    var 
    rt_id_c_1 = '',
    rt_id_c_2 = '',
    i = 0;

    for( rt_id_c_1 in __on_new_stylesheets_cbs )
    {
      for( i = 0; ( rt_id_c_2 = rt_ids[i] ) && rt_id_c_1 != rt_id_c_2 ; i++ );
      if( !rt_id_c_2 )
      { 
        delete __on_new_stylesheets_cbs[rt_id_c_1];
      }
    }
    for( i = 0; rt_id_c_1 = rt_ids[i]; i++ )
    {
      if( ! ( rt_id_c_1 in __on_new_stylesheets_cbs ) )
      {
        __on_new_stylesheets_cbs[rt_id_c_1] = [];
      }
    }
    __new_rts = rt_ids;
    if( rt_ids[0] != __top_rt_id )
    {

      __top_rt_id = rt_ids[0];
      __selectedRules = null;
      views['stylesheets'].update();
    }
  }

  var checkNewRts = function(obj)
  {
    var 
    cursor = null, 
    cbs = null,
    cb = null,
    i = 0;

    for( i = 0; cursor = __new_rts[i]; i++)
    {
      if( !__sheets[cursor] )
      {
        delete obj.__call_count;
        self.getStylesheets(cursor, arguments);
      }
      else
      {
        if( cbs = __on_new_stylesheets_cbs[cursor] )
        {
          for( i = 0; cb = cbs[i]; i++)
          {
            cb[1].apply(cb[0], cb.slice(2));
          }
          delete __on_new_stylesheets_cbs[cursor];
        }
      }
    }
  }

  var onActiveTab = function(msg)
  { 
    if( __selectedRules  )
    {
      var rt_id = __selectedRules.runtime_id, cur_rt_id = '', i = 0;

      for( ; ( cur_rt_id = msg.activeTab[i] ) && cur_rt_id != rt_id ; i++);
      if( !cur_rt_id )
      {
        views.stylesheets.clearAllContainers();
      }
    }
    updateOnNewStylesheets(msg.activeTab.slice(0));
    checkNewRts({});
  }

  this.getSortedProperties = function()
  {
    var ret = [], i = 0, dashs = [], value = '';

    for ( ; i <  __indexMapLength; i++ )
    {
      value = __indexMap[__sortedIndexMap[i]];
      if( value.indexOf('-') == 0 )
      {
        dashs[dashs.length] = value;
      }
      else
      {
        ret[ret.length] = value;
      }
    }
    return ret.concat(dashs);
  }
  
  messages.addListener('runtime-destroyed', onRuntimeDestroyed);
  messages.addListener('active-tab', onActiveTab);

  messages.addListener('reset-state', onResetState);
  
}