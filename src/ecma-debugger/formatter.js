var simple_js_parser=new function()
{
  var parser=null;
  var __source=null;
  var __buffer='';
  var __pointer=0;
  var __char=String.fromCharCode
  var __type=''; // WHITESPACE, LINE_TERMINATOR, NUMBER, STRING, PUNCTUATOR, DIV_PUNCTUIATOR, IDENTIFIER, REG_EXP
  var __previous_type='';
  var __string_delimiter=0;
  var __cbo_onread=null;
  var __cbo_online=null;
  var __cbo_onfinish=null;

  var WHITESPACE=
  {
    '\u0009': 1, //  Tab <TAB>
    '\u000B': 1, //  Vertical Tab <VT>
    '\u000C': 1, //  Form Feed <FF>
    '\u0020': 1, //  Space <SP>
    '\u00A0': 1  //  No-break space <NBSP>
  }

  var LINETERMINATOR=
  {
    '\u000A': 1, //  Line Feed <LF>
    '\u000D': 1, //  Carriage Return <CR>
    '\u000D\u000A': 1,
    '\u2028': 1, //  Line separator <LS>
    '\u2029': 1 //  Paragraph separator <PS>
  }

  var NUMBER=
  {
    '0': 1,
    '1': 1,
    '2': 1,
    '3': 1,
    '4': 1,
    '5': 1,
    '6': 1,
    '7': 1,
    '8': 1,
    '9': 1
  }

  var PUNCTUATOR=
  {
    '{': 1,
    '}': 1,
    '(': 1,
    ')': 1,
    '[': 1,
    ']': 1,
    ';': 1,
    ',': 1,
    '<': 1,
    '>': 1,
    '=': 1,
    '!': 1,
    '+': 1,
    '-': 1,
    '*': 1,
    '%': 1,
    '&': 1,
    '|': 1,
    '^': 1,
    '~': 1,
    '?': 1,
    ':': 1,
    '.': 1
  }

  var PUNCTUATOR_2=
  {
    '=': 1,
    '+': 1,
    '-': 1,
    '<': 1,
    '>': 1,
    '&': 1,
    '|': 1
  }

  var STRING_DELIMITER=
  {
    '"': 1,
    '\'': 1
  }

  var HEX_NUMBER=
  {
    '0': 1,
    '1': 1,
    '2': 1,
    '3': 1,
    '4': 1,
    '5': 1,
    '6': 1,
    '7': 1,
    '8': 1,
    '9': 1,
    'a': 1,
    'b': 1,
    'c': 1,
    'd': 1,
    'e': 1,
    'f': 1,
    'A': 1,
    'B': 1,
    'C': 1,
    'D': 1,
    'E': 1,
    'F': 1
  }



  var REG_EXP_FLAG=
  {
    'g': 1,
    'i': 1,
    'm': 1
  }

  var default_parser=function(c)
  {
    var CRLF='';
    while(c)
    {
      if(c in WHITESPACE)
      {
        read_buffer();
        __type='WHITESPACE';
        do
        {
          __buffer+=c;
          c=__source.charAt(++__pointer);
        }
        while (c in WHITESPACE);
        read_buffer();
        __type='IDENTIFIER';
      }

      if(c in LINETERMINATOR)
      {
        read_buffer();
        CRLF=c;
        CRLF+=c=__source.charAt(++__pointer);
        if(CRLF in LINETERMINATOR)
        {
          c=__source.charAt(++__pointer);
        }
        if(__cbo_online)
        {
          __cbo_online();
        }
        continue;
      }
    
      if(c in NUMBER)
      {
        read_buffer();
        __buffer+=c;
        __type='NUMBER';
        c=__source.charAt(++__pointer);
        if(c=='x' || c=='X') 
        {
          __buffer+=c;
          c=number_hex_parser(__source.charAt(++__pointer));
        }
        else
        {
          c=number_dec_parser(c);
        }
        continue;
      }

      if(c in STRING_DELIMITER)
      {
        read_buffer();
        __string_delimiter=c;
        __buffer+=c;
        __type='STRING';
        string_parser(__source.charAt(++__pointer));
        c=__source.charAt(++__pointer);
        continue;
      }  
      
      if(c=='.')
      {
        read_buffer();
        __buffer+=c;
        c=__source.charAt(++__pointer);
        if(c in NUMBER)
        {
          __type='NUMBER';
          c=number_dec_parser(c);
          continue;
        }
        else
        {
          __type='PUNCTUATOR';
          read_buffer();
          __type='IDENTIFIER';
          continue;
        }
      }
      
      if(c in PUNCTUATOR)
      {
        read_buffer();
        __type='PUNCTUATOR';
        do
        {
          __buffer+=c;
          c=__source.charAt(++__pointer);
        }
        while (c in PUNCTUATOR_2);
        read_buffer();
        __previous_type=__type;
        __type='IDENTIFIER';
        continue;
      }

      if(c=='/') 
      {
        read_buffer();
        __buffer+=c;
        c=__source.charAt(++__pointer);
        if(c=='*')  
        {
          __buffer+=c;
          __type='COMMENT';
          multiline_comment_parser(__source.charAt(++__pointer));
          c=__source.charAt(++__pointer)
          
          continue;
        }
        if(c=='/')  
        {
          __buffer+=c;
          __type='COMMENT';
          c=singleline_comment_parser(__source.charAt(++__pointer));
          continue;
        }
        if( __previous_type=='IDENTIFIER' || __previous_type=='NUMBER' )
        {
          __type='DIV_PUNCTUIATOR';
          if(c=='=') 
          {
            __buffer+=c;
            read_buffer();
            c=__source.charAt(++__pointer);
          }
          else
          {
            read_buffer();
          }
          __type='IDENTIFIER';
          continue;
        }
        __type='REG_EXP';
        c=reg_exp_parser(c);
        continue;
      }
      do
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
      }
      while (c && !(c in PUNCTUATOR  || c=='/' || c in LINETERMINATOR  || c in WHITESPACE));

    }
    read_buffer();
  }

  var number_hex_parser=function(c)
  {
    while(c in HEX_NUMBER)
    {
      __buffer+=c;
      c=__source.charAt(++__pointer);
    }
    read_buffer();
    __previous_type=__type;
    __type='IDENTIFIER';
    return c;
  }

  var number_dec_parser=function(c)
  {
    while(c in NUMBER || c=='.')
    {
      __buffer+=c;
      c=__source.charAt(++__pointer);
    }
    if(c=='e' || c=='E')  
    {
      __buffer+=c;
      c=__source.charAt(++__pointer);
      if(c=='+' || c=='-') 
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
      }
      while(c in NUMBER)
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
      }
    }
    read_buffer();
    __previous_type='NUMBER';
    __type='IDENTIFIER';
    return c;
  }



  var string_parser=function(c)
  {
    while(c)
    {
      if(c=='\\')  //\u005C
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
        __buffer+=c;
        c=__source.charAt(++__pointer);
      }
      if(c==__string_delimiter)
      {
        __buffer+=c;
        read_buffer();
        __previous_type='STRING';
        __type='IDENTIFIER';
        break;
      }
      __buffer+=c;
      c=__source.charAt(++__pointer);
    }
  }


  var multiline_comment_parser=function(c)
  {
    var CRLF='';
    while(c)
    {
      if(c in LINETERMINATOR)
      {
        read_buffer();
        CRLF=c;
        CRLF+=c=__source.charAt(++__pointer);
        if(CRLF in LINETERMINATOR)
        {
          c=__source.charAt(++__pointer);
        }
        if(__cbo_online)
        {
          __cbo_online();
        }
        continue;
      }
      if(c=='*')
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
        __buffer+=c;
        if(c=='/')  
        {
          read_buffer();
          __previous_type='COMMENT';
          __type='IDENTIFIER';
          break;
        }
        continue;
      }
      __buffer+=c;
      c=__source.charAt(++__pointer);
    }
  }


  var singleline_comment_parser=function(c)
  {
    var CRLF='';
    while(c)
    {
      if(c in LINETERMINATOR) 
      {
        read_buffer();
        __previous_type='COMMENT';
        __type='IDENTIFIER';
        CRLF=c;
        CRLF+=c=__source.charAt(++__pointer);
        if(CRLF in LINETERMINATOR)
        {
          c=__source.charAt(++__pointer);
        }
        if(__cbo_online)
        {
          __cbo_online();
        }
        return c;
      }
      __buffer+=c;
      c=__source.charAt(++__pointer);
    }
  }

  var reg_exp_parser=function(c)
  {
    while(c)
    {
      if(c=='\\') 
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
        __buffer+=c;
        c=__source.charAt(++__pointer);
      }
      if(c=='/') 
      {
        __buffer+=c;
        c=__source.charAt(++__pointer);
        while(c in REG_EXP_FLAG)
        {
          __buffer+=c;
          c=__source.charAt(++__pointer);
        }
        read_buffer();
        __previous_type='REG_EXP';
        __type='IDENTIFIER';
        return c;
      }
      __buffer+=c;
      c=__source.charAt(++__pointer);
    }
  }

  var read_buffer=function()
  {
    if(__buffer)
    {
      if(__cbo_onread)
      {
        __cbo_onread(__type, __buffer);
      }
      if(__type=='IDENTIFIER')
      {
        __previous_type=__type;
      }
    }
    __buffer='';
  }

  this.parse=function(source, cbo)
  {
    ret='';
    if(cbo)
    {
      __cbo_onread=cbo.onread;
      __cbo_online=cbo.onlineterminator;
      __cbo_onfinish=cbo.onfinish;
    }
    parser=default_parser;
    __previous_type='';
    __type='IDENTIFIER';
    __source=new String(source);
    var length=__source.length;
    __pointer=0;
    parser(__source.charAt(__pointer));
    if(__cbo_onfinish)
    {
      return __cbo_onfinish();
    }
  }
}

/* end file */
