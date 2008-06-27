/**
  * @constructor 
  */

var Editor = function()
{
  // assert: a element wich is editable has a monospace font

  // TODO make it more general so it can be used for other views then just the css inspector
  var self = this;

  const 
  SELECTION = 1,
  TOKEN = 2,
  VALUE = 3;

  this.base_style =
  {
    'font-family': '',
    'line-height': 0,
    'font-size': 0
  }
 
  this.char_width = 0;
  this.line_height = 0;
  this.cssText = '';
  this.textarea_container = null;
  this.textarea = null;
  
  this.host_element_border_padding_left = 0;
  this.host_element_border_padding_top = 0;

  this.tab_context_value = '';
  this.tab_context_tokens = null;

  this.context_cur_prop = '';
  this.context_cur_value = '';
  this.context_cur_priority = '';
  this.context_cur_text_content = '';

  this.last_suggets_type = null;
  this.suggets_count = 0;
  this.suggets_iterate = false;
  this.property_list_length = 0;

  this.colors = new Colors();
 
  this.get_base_style = function(ele)
  {
    var
    style = getComputedStyle(ele, null),
    props = ['font-family', 'line-height', 'font-size'],
    prop = null,
    i = 0,
    span = document.createElement('test-element'),
    cssText = 'display:block;position:absolute;left:-100px;top:0;white-space:pre;';
 
    for( ; prop = props[i]; i++)
    {
      this.base_style[prop] = style.getPropertyValue(prop);
      cssText += prop +':' + this.base_style[prop] + ';';
    }
    span.textContent = '1234567890';
    document.documentElement.appendChild(span);
    span.style.cssText = cssText;
    this.char_width = span.offsetWidth / 10;
    this.base_style['line-height'] = ( this.line_height = span.offsetHeight ) + 'px';
    document.documentElement.removeChild(span);

    // host element style
    this.host_element_border_padding_left = 
      parseInt(style.getPropertyValue('padding-left')) +
      parseInt(style.getPropertyValue('border-left-width'));
    this.host_element_border_padding_top = 
      parseInt(style.getPropertyValue('padding-top')) +
      parseInt(style.getPropertyValue('border-top-width'));

    cssText = '';
    for( prop in this.base_style )
    {
      cssText += prop +':' + this.base_style[prop] + ';';
    }
    this.textarea_container = document.createElement('textarea-container');
    this.textarea = this.textarea_container.
      appendChild(document.createElement('textarea-inner-container')).
      appendChild(document.createElement('textarea'));
    this.textarea.style.cssText = cssText;
    this.textarea.oninput = input_handler;
  }

  this.getAllTokens = function()
  {
    const
    SPACE = 1,
    COMMA = 2,
    BRACKET_OPEN = 3,
    BRACKET_CLOSE = 4,
    END = 5,
    SEMICOLON = 6;

    var 
    re_str = /(?:"(?:[^"]|\\")*")|(?:'(?:[^']|\\')*')/g,
    re_token = /([^,] +)|(, *)|(\( *)|(\))|($)|(;)/g,
    value = this.textarea.value,
    cur_pos = 0,
    last_pos = 0,
    next_pos = 0,
    // last char would be ;
    char_pos = value.length - 2,
    match_str = null,
    match_token = null,
    ret = [];

    re_str.lastIndex = 0;
    match_str = re_str.exec(value);
    

    if( ( cur_pos = value.indexOf(':', 0) ) > -1 )
    {
      // TODO should test if pos is in match_token string
      //ret[ret.length] = value.slice(0, cur_pos);
      ret.splice(0, 0, value.slice(0, cur_pos), 0, cur_pos);

      cur_pos++;
      while( value.charAt(cur_pos) == ' ' )
      {
        cur_pos++;
      }
      re_token.lastIndex = cur_pos;
      while( match_token = re_token.exec(value)  )
      {
        if( match_str && match_str.index <= re_token.lastIndex + 1 )
        {
          ret.splice(ret.length, 0, match_str.index, re_str.lastIndex);
          re_token.lastIndex = re_str.lastIndex;
          match_str = re_str.exec(value);
        }
        else if( match_token[BRACKET_OPEN] )
        {
          cur_pos = re_token.lastIndex;
        }
        else if( match_token.index > cur_pos )
        {
          ret.splice(ret.length, 0, cur_pos, match_token.index  + ( match_token[SPACE] ? 1 : 0 ));
        }
        if( match_token.index > char_pos )
        {
          break;
        }
        cur_pos = re_token.lastIndex;
      }
    }
    else
    {
      ret.splice(0, 0, value, 0, value.length);
    }
    return ret;
  }

  this.getNextToken = function(char_pos)
  {
    var 
    re_str = /(?:"(?:[^"]|\\")*")|(?:'(?:[^']|\\')*')/g,
    re_token = /([^,] +)|(, *)|(\( *)|(\))|($)|(;)/g,
    value = this.textarea.value,
    cur_pos = 0,
    last_pos = 0,
    next_pos = 0,
    match_str = null,
    match_token = null;

    re_str.lastIndex = 0;
    match_str = re_str.exec(value);
    
    // last char would be ;
    if(char_pos >= value.length - 1)
    {
      char_pos = value.length - 2;
    }

    if( ( cur_pos = value.indexOf(':', 0) ) > -1 )
    {
      // TODO should test if pos is in match_token string
      if( cur_pos >= char_pos )
      {
        return {start: 0, end: cur_pos};
      }
      cur_pos++;
      while( value.charAt(cur_pos) == ' ' )
      {
        cur_pos++;
      }
      re_token.lastIndex = cur_pos;
      while( match_token = re_token.exec(value) )
      {
        if( match_str && match_str.index <= re_token.lastIndex + 1 )
        {
          if(re_str.lastIndex >= char_pos)
          {
            return {start: match_str.index, end: re_str.lastIndex};
          }
          re_token.lastIndex = re_str.lastIndex;
          match_str = re_str.exec(value);
          continue;
        }
        if( match_token.index > char_pos )
        {
          if( match_token[3] )
          {
            cur_pos = re_token.lastIndex;
            continue;
          }
          return {start:cur_pos, end: match_token.index + ( match_token[1] ? 1 : 0 )};
        }
        
        cur_pos = re_token.lastIndex;
      }
    }
    return null;
  }

  this.getProperties = function()
  {
    var 
    re_str = /(?:"(?:[^"]|\\")*")|(?:'(?:[^']|\\')*')/g,
    re_token = /(;)|($)/g,
    re_important = / *!important/,
    value = this.textarea.value,
    last_pos = 0,
    cur_pos = 0,
    important_pos = 0,
    prop = '',
    val = '',
    priority = 0,
    match_str = null,
    match_token = null,
    match_important = null,
    ret = [];

    while( ( cur_pos = value.indexOf(':', last_pos) ) > -1 )
    {
      prop = value.slice(last_pos, cur_pos);
      // TODO should test if pos is in match_token string
      cur_pos++;
      while( value.charAt(cur_pos) == ' ' || value.charAt(cur_pos) == '\n' )
      {
        cur_pos++;
      }
      re_str.lastIndex = re_token.lastIndex = cur_pos;
      match_str = re_str.exec(value);
     
      while( match_token = re_token.exec(value) )
      {
        if( match_str && match_token.index < re_str.lastIndex )
        {
          re_token.lastIndex = re_str.lastIndex;
          match_str = re_str.exec(value);
          continue;
        }
        break;
      }
      if( match_token )
      {
        val = value.slice(cur_pos, re_token.lastIndex - ( match_token[1] ? 1 : 0 ) );
        priority = 0;
        if(  match_important =  re_important.exec(val) )
        {
          val = val.slice(0, match_important.index );
          priority = 1;
        }
        ret.splice(ret.length, 0, prop, val, priority);

        last_pos = re_token.lastIndex;
        if( last_pos + 1 >= value.length )
        {
          break;
        }
      }
    }
    if( last_pos  < value.length && ( val = value.slice(last_pos) ) )
    {
      ret[ret.length] = val;
    }
    return ret;
  }

  this.getCharPosition = function(event)
  {

    var 
    box = this.textarea.getBoundingClientRect(),
    left = event.clientX - box.left,
    top = event.clientY - box.top,
    charOffset = 0,
    cur_top = this.line_height,
    previous_line_chars = 0,
    re = /[ -/\n,]/g,
    match = null,
    prev_match_index = 0,
    value = this.textarea.value,
    max_line_char = this.textarea.offsetWidth / this.char_width >> 0;

    re.lastIndex = 0;

    while( top > cur_top && ( match = re.exec(value) ) )
    {
      if( match.index - previous_line_chars > max_line_char )
      {
        previous_line_chars = prev_match_index + 1;
        cur_top += this.line_height;
      }
      prev_match_index = match.index;
    }

    

    if( top < cur_top )
    {
      charOffset = 
        previous_line_chars + ( ( left - ( left % this.char_width ) ) / this.char_width );
    }

    var selection = this.getNextToken(charOffset);

    if(selection)
    {
      this.textarea.selectionStart = selection.start;
      this.textarea.selectionEnd = selection.end;
      
    }


  }
 
  this.edit = function(event, ref_ele)
  {
    var ele = ref_ele || event.target;
    if( !this.base_style['font-size'] )
    {
      this.get_base_style(ref_ele || ele);
    }
    if( this.textarea_container.parentElement )
    {
      this.submit();
    }
    this.context_rt_id = ele.parentElement.parentElement.getAttribute('rt-id');
    this.context_rule_id = ele.parentElement.getAttribute('rule-id');
    var textContent = ele.textContent;


    
    

    this.context_cur_text_content = this.textarea.value = ele.textContent;

    var props = this.getProperties();

    this.context_cur_prop = props[0] || '';
    this.context_cur_value = props[1] || '';
    this.context_cur_priority = props[2] || 0;

    this.last_suggets_type = '';


    this.textarea.style.height = ( ele.offsetHeight  ) + 'px';
    ele.textContent = '';
    ele.appendChild(this.textarea_container);
    // only for click events
    if( event )
    {
      this.getCharPosition(event);
      this.textarea.focus();
    }
  }

  this.nav_next = function(event, action_id)
  {
    var  
    cur_pos = this.textarea.selectionEnd,
    i = 1;

    if( this.textarea.value != this.tab_context_value )
    {
      this.tab_context_tokens = this.getAllTokens();
      this.tab_context_value = this.textarea.value;
    }
    if( this.tab_context_tokens)
    {
      for( ; i < this.tab_context_tokens.length; i += 2 )
      {
        if( this.tab_context_tokens[i+1] > cur_pos )
        {
          this.textarea.selectionStart = this.tab_context_tokens[i];
          this.textarea.selectionEnd = this.tab_context_tokens[i+1];
          return true;
        }
      }
    }
    return false;
  }

  this.nav_previous = function(event, action_id)
  {
    var  
    cur_pos = this.textarea.selectionStart,
    i = 1;

    if( this.textarea.value != this.tab_context_value )
    {
      this.tab_context_tokens = this.getAllTokens();
      this.tab_context_value = this.textarea.value;
    }
    if( this.tab_context_tokens)
    {
      for( i = this.tab_context_tokens.length - 1; i > 1; i -= 2 )
      {
        if( this.tab_context_tokens[i] < cur_pos )
        {
          this.textarea.selectionStart = this.tab_context_tokens[i-1];
          this.textarea.selectionEnd = this.tab_context_tokens[i];
          return true;
        }
      }
    }
    return false;
  }

  this.focusFirstToken = function()
  {
    this.tab_context_tokens = this.getAllTokens();
    this.tab_context_value = this.textarea.value;
    if( this.tab_context_tokens && this.tab_context_tokens[2] )
    {
      this.textarea.selectionStart = this.tab_context_tokens[1];
      this.textarea.selectionEnd = this.tab_context_tokens[2];
    }
    else
    {
      this.textarea.selectionStart = 0;
      this.textarea.selectionEnd = 0;
    }
    this.textarea.focus();
  }

  this.focusLastToken = function()
  {
    this.tab_context_tokens = this.getAllTokens();
    this.tab_context_value = this.textarea.value;
    if( this.tab_context_tokens && this.tab_context_tokens[2] )
    {
      this.textarea.selectionStart = this.tab_context_tokens[this.tab_context_tokens.length-2];
      this.textarea.selectionEnd = this.tab_context_tokens[this.tab_context_tokens.length-1];
    }
    else
    {
      this.textarea.selectionStart = this.tab_context_value.length;
      this.textarea.selectionEnd = this.tab_context_value.length;
    }
    this.textarea.focus();
  }

  this.autocomplete = function(event, action_id)
  {
    var  
    cur_start = this.textarea.selectionStart,
    new_start = 0,
    cur_end = this.textarea.selectionEnd,
    value = this.textarea.value,
    cur_token = '',
    i = 1,
    suggest = ''

    if( this.textarea.value != this.tab_context_value )
    {
      this.tab_context_tokens = this.getAllTokens();
      this.tab_context_value = this.textarea.value;
    }
    if( this.tab_context_tokens )
    {
      for( ; i < this.tab_context_tokens.length; i += 2 )
      {
        if( cur_start >= this.tab_context_tokens[i] && cur_start <= this.tab_context_tokens[i+1])
        {
          cur_token = value.slice(this.tab_context_tokens[i], this.tab_context_tokens[i+1]);
          break;
        }
      }
    }

    suggest = this.getSuggest
    (
      this.tab_context_tokens && this.tab_context_tokens[0] || '', 
      this.tab_context_tokens && cur_end <= this.tab_context_tokens[2],
      cur_token,
      cur_start, 
      cur_end, 
      action_id
    );

    if(suggest)
    {

      switch(suggest.replace_type)
      {
        case SELECTION:
        {
          new_start = this.tab_context_tokens[i];
          this.textarea.value = 
            value.slice(0, new_start) + 
            suggest.value +
            value.slice(this.tab_context_tokens[i+1]);
          this.textarea.selectionStart = cur_start;
          this.textarea.selectionEnd = new_start + suggest.value.length;
          break;
        }
        case TOKEN:
        {
          new_start = this.tab_context_tokens[i];
          this.textarea.value = 
            value.slice(0, new_start) + 
            suggest.value +
            value.slice(this.tab_context_tokens[i+1]);
          this.textarea.selectionStart = new_start;
          this.textarea.selectionEnd = new_start + suggest.value.length;
          break;
        }
        case VALUE:
        {
          new_start = this.tab_context_tokens[2] + 2;
          this.textarea.value = 
            this.tab_context_tokens[0] + ': ' + suggest.value;
          this.textarea.selectionStart = new_start;
          this.textarea.selectionEnd = new_start + suggest.value.length;
          break;
        }

      }

      this.textarea.style.height = this.textarea.scrollHeight + 'px';
      this.commit();
    }


    return false;
  }


  this.getSuggest = function(prop_name, is_prop, token, cur_start, cur_end, action_id)
  {
    var 
    re_num = /^(-?)([\d.]+)(.*)$/,
    match = null,
    suggest = null,
    suggest_type = 
      ( is_prop && 'suggest-property' )
      || ( ( match = re_num.exec(token) ) && 'suggest-number' )
      || ('suggest-value'),
    suggest_handler = this[suggest_type];

    suggest_handler.cursor = this.setCursor
    (
      this.suggets_iterate = this.last_suggets_type == suggest_type, 
      suggest_handler.cursor, 
      suggest_handler.matches = this[suggest_type](token, cur_start, cur_end, action_id, match), 
      action_id
    )
    
    this.last_suggets_type = suggest_type;

    suggest = suggest_handler.matches && suggest_handler.matches[suggest_handler.cursor];
    return suggest && {value: suggest, replace_type: suggest_handler.replace_type} || null;



  }

  this.getMatchesFromList = function(list, set)
  {
    var 
    ret = [],
    length = list && list.length || 0,
    i = 0;

    if( length == 1 )
    {
      return list;
    }

    if( length && set)
    {
      for( ; i < length; i++)
      {
        if( list[i].indexOf(set) == 0 )
        {
          ret[ret.length] = list[i];
        }
      }
    }
    else
    {
       ret = list.slice(0);
    }
    return ret;
  }

  this.setCursor = function(iterate, cur_cursor, matches, action_id)
  {
    if( iterate && matches)
    {
      cur_cursor += ( action_id == action_ids.NAV_UP ? -1 : 1 );
      if( cur_cursor > matches.length - 1 )
      {
        cur_cursor = 0;
      }
      else if( cur_cursor < 0 )
      {
        cur_cursor = matches.length - 1;
      }
    }
    else
    {
      cur_cursor = 0;
    }
    return cur_cursor;
  }



  this['suggest-property'] = function(token, cur_start, cur_end, action_id, match)
  {
    if( !this.property_list )
    {
      this.property_list = stylesheets.getSortedProperties();
      this.property_list_length = this.property_list.length;
    }
    return this.getMatchesFromList(this.property_list, this.textarea.value.slice(this.tab_context_tokens[1], cur_start));
  }

  this['suggest-property'].replace_type = SELECTION;
  this['suggest-property'].cursor = 0;
  this['suggest-property'].matches = null;

  this['suggest-number'] = function(token, cur_start, cur_end, action_id, match)
  {
    var is_float = /\.(\d+)/.exec(match[2]);
    if( is_float )
    {
      return [ ( parseFloat(match[1] + match[2]) + ( action_id == action_ids.NAV_UP ? 0.1 : -0.1 ) ).toFixed(is_float[1].length) + match[3]];
    }
    return [ ( parseInt(match[1] + match[2]) + ( action_id == action_ids.NAV_UP ? 1 : -1 ) ).toString() + match[3]];
  }

  this['suggest-number'].replace_type = TOKEN;
  this['suggest-number'].cursor = 0;
  this['suggest-number'].matches = null;

  this['suggest-value'] = function(token, cur_start, cur_end, action_id, match)
  {
    var 
    prop = this.tab_context_tokens[0],
    set = this.tab_context_tokens[3] 
        && this.textarea.value.slice(this.tab_context_tokens[3], cur_start) 
        || '',
    re_hex = /^#([0-9a-f]{6})$/i,
    match = null,
    hsl = null,
    rgb = null;

    if( set == this['suggest-value'].last_set && prop == this['suggest-value'].last_prop )
    {
      return this['suggest-value'].matches;
    }
    this['suggest-value'].last_set = set;
    this['suggest-value'].last_prop = prop;

    if( /color/.test(prop) && token && ( match = re_hex.exec(token) ) )
    {
      this.colors.setHex(match[1]);
      hsl = this.colors.getHSL();
      rgb = this.colors.getRGB(); 
      return [
        match[0],
        ('hsl(' + hsl[0] + ',' + parseInt(hsl[1]) +'%,' + parseInt(hsl[2]) + '%)'),
        ('rgb(' + rgb[0] + ',' + rgb[1] +',' + rgb[2] + ')')
      ].concat(suggest_values['color']);

    }
   
    if( suggest_values[prop] && suggest_values[prop].length )
    {
      return this.getMatchesFromList(suggest_values[prop], set);
    }
    return null;
  }

  this['suggest-value'].replace_type = VALUE;
  this['suggest-value'].cursor = 0;
  this['suggest-value'].matches = null;
  this['suggest-value'].last_set = '';
  this['suggest-value'].last_prop = '';


 
  this.submit = function()
  {
    var 
    props = this.getProperties(), 
    i = 0,
    inner = '';
    
    if( props[i+1] )
    {
      this.textarea_container.parentElement.innerHTML =
        "<key>" + props[i] + "</key>: " +
        "<value>"  + props[i+1] +  ( props[i+2] ? " !important" : "" ) + "</value>;";
    }
    else
    {
      this.textarea_container.parentElement.parentElement.
        removeChild(this.textarea_container.parentElement);
     
    }
  }

  this.commit = function()
  {
    var props = self.getProperties(), 
    i = 0,
    script = "",
    prop = null,
    reset = false;

    while( props.length > 3 )
    {
      reset = true;
      prop = this.textarea_container.parentElement.parentElement.
        insertBefore(document.createElement('property'), this.textarea_container.parentElement);

      prop.innerHTML = "<key>" + props[0] + "</key>: " +
          "<value>"  + props[1] +  ( props[2] ? " !important" : "" ) + "</value>;";
      props.splice(0, 3);

    }
    
    if( reset)
    {
      this.textarea.value =
        props[0] + ( props[1] ? ': ' + props[1] + ( props[2] ? ' !important' : '' ) + ';' : '' );
        
      this.context_cur_text_content =
      this.context_cur_prop =
      this.context_cur_value = '';
      this.context_cur_priority = 0;
    }

    if( props[i+1] )
    {
      script = "rule.style.setProperty(\"" + props[i] + "\", \"" + props[i+1] + "\", " + ( props[i+2] ? "\"important\"" : null )+ ")";
      services['ecmascript-debugger'].eval(0, self.context_rt_id, '', '', script, ["rule", self.context_rule_id]);
    }

  }

  this.enter = function()
  {
    var 
    props = self.getProperties(), 
    keep_edit = false,
    prop = null;
    
    this.last_suggets_type = '';
    if( props && props.length == 3 )
    {
      if( this.textarea.selectionEnd == this.textarea.value.length 
          || this.textarea.selectionEnd >= this.textarea.value.indexOf(';') )
      {
        prop = this.textarea_container.parentElement.parentElement.
          insertBefore(document.createElement('property'), this.textarea_container.parentElement);
        prop.innerHTML = "<key>" + props[0] + "</key>: " +
          "<value>"  + props[1] +  ( props[2] ? " !important" : "" ) + "</value>;";
        this.textarea.value =
        this.context_cur_text_content =
        this.context_cur_prop =
        this.context_cur_value = '';
        this.context_cur_priority = 0;
        keep_edit = true;
      }
      else
      {
        this.textarea_container.parentElement.innerHTML = "<key>" + props[0] + "</key>: " +
          "<value>"  + props[1] +  ( props[2] ? " !important" : "" ) + "</value>;";
      }
    }
    else
    {
      this.textarea_container.parentElement.innerHTML = "";
    }
    
    return keep_edit;

  }

  this.escape = function()
  {
    this.last_suggets_type = '';
    if(this.context_cur_prop)
    {
      this.textarea.value = this.context_cur_text_content;
      this.textarea_container.parentElement.innerHTML =
        "<key>" + this.context_cur_prop + "</key>: " +
        "<value>"  + this.context_cur_value +  
        ( this.context_cur_priority ? " !important" : "" ) + 
        "</value>;";
        return true;
    }
    else
    {
      this.textarea.value = '';
      this.textarea_container.parentElement.innerHTML = '';
      return false;
    }

  }

  var input_handler = function(event)
  {
    this.style.height = this.scrollHeight + 'px';
    self.commit();
  }
}