﻿/**
 * Generic search/higlight component. Used for instance in http logger and
 * console logger to highlight words. Searches through an actual DOM for
 * the target text.
 * @see VirtualTextSearch
 * @see ListTextSearch
 * @constructor 
 */
var TextSearch = function()
{
  const 
  DEFAULT_STYLE = "background-color:#ff0; color:#000;",
  HIGHLIGHT_STYLE = "background-color:#0f0; color:#000;",
  DEFAULT_SCROLL_MARGIN = 50,
  SEARCH_DELAY = 50, // in ms
  MIN_TERM_LENGTH = 3; // search term must be this long or longer

  var 
  self = this, 
  search_term = '',
  input_search_term = '', 
  // collection of span elements. This is so because a hit may cross an
  // element border, so multiple elements needed for highlight.
  search_results = [], 
  cursor = -1,
  container = null,
  __input = null,
  timeouts = new Timeouts(), 

  /**
   * Apply default styles to a span.
   */
  span_set_default_style = function(span)
  {
    span.style.cssText = DEFAULT_STYLE;
  },

  /**
   * Apply highlight styles to a span.
   */
  span_set_highlight_style = function(span)
  {
    span.style.cssText = HIGHLIGHT_STYLE;
  },
  check_parent = function(hit)
  {
    return hit[0].parentElement;
  },
  search_node = function(node)
  {
    var
    text_content = container.textContent.toLowerCase(),
    search_term_length = search_term.length,
    match = text_content.indexOf(search_term),
    last_match = match != -1 && match + search_term_length || 0,
    consumed_total_length = 0,
    to_consume_hit_length = 0,
    span = null,
    search_result = null,
    consume_node = function(node)
    {
      if( node && ( match != -1 || to_consume_hit_length ) )
      {
        switch(node.nodeType)
        {
          case 1:
          {
            consume_node(node.firstChild);
            break;
          }
          case 3:
          {
            if(to_consume_hit_length)
            {
              if( node.nodeValue.length >= to_consume_hit_length )
              {
                node.splitText(to_consume_hit_length);
              }
              to_consume_hit_length -= node.nodeValue.length;
              search_result[search_result.length] = span = document.createElement('span');
              node.parentNode.replaceChild(span, node);
              span.appendChild(node);
              span.style.cssText = DEFAULT_STYLE;
              consumed_total_length += node.nodeValue.length;
              node = span;
            }
            else
            {
              if( match - consumed_total_length < node.nodeValue.length )
              {
                node.splitText(match - consumed_total_length);
                if( ( match = text_content.indexOf(search_term, last_match) ) != -1 )
                {
                  last_match = match + search_term_length;
                }
                to_consume_hit_length = search_term_length;
                search_result = search_results[search_results.length] = [];
              }
              consumed_total_length += node.nodeValue.length;
            }
          }
        }
        consume_node(node.nextSibling);
      }
    };
    consume_node(container);
  },
    
  /**
   * Update status bar with the current state of the search.
   */
  update_status_bar = function()
  {
    if(topCell.statusbar)
    {
      topCell.statusbar.updateInfo(ui_strings.S_TEXT_STATUS_SEARCH.
        replace("%(SEARCH_TERM)s", search_term).
        replace("%(SEARCH_COUNT_TOTAL)s", search_results.length).
        replace("%(SEARCH_COUNT_INDEX)s", ( cursor + 1 )) );
    }
  };

  this.search = function(new_search_term, old_cursor)
  {
    var cur = null, i = 0, parent = null, search_hit = null, j = 0;
    if( new_search_term != search_term )
    {
      search_term = new_search_term;
      if(search_results)
      {
        for( ; cur = search_results[i]; i++)
        {
          for( j = 0; search_hit = cur[j]; j++)
          {
            if( parent = search_hit.parentNode )
            {
              parent.replaceChild(search_hit.firstChild, search_hit);
              parent.normalize();
            }
          }
        }
      }
      search_results = [];
      cursor = -1;
      if( search_term.length >= MIN_TERM_LENGTH )
      {
        if(container)
        {
          search_node(container);
          if( old_cursor && search_results[old_cursor] )
          {
            cursor = old_cursor;
            search_results[cursor].style.cssText = HIGHLIGHT_STYLE;
            update_status_bar();
          }
          else
          {
            if(topCell.statusbar)
            {
              topCell.statusbar.updateInfo(ui_strings.S_TEXT_STATUS_SEARCH_NO_MATCH.
                replace("%(SEARCH_TERM)s", new_search_term));
            }
            self.highlight(true);
          }
        }
      }
      else if(topCell.statusbar)
      {
        topCell.statusbar.updateInfo('');
      }
    }
    
  }

  this.searchDelayed = function(new_search_term)
  {
    timeouts.set(this.search, SEARCH_DELAY, ( input_search_term = new_search_term).toLowerCase());
  }
  
  this.update = function()
  {
    var new_search_term = search_term;
    if( search_term.length >= MIN_TERM_LENGTH )
    {
      search_term = '';
      this.search(new_search_term);
    }
  }

  /**
   * Highlight a search result. The result to highlight is kept in the
   * "cursor" instance variable. If check_position is true the highlight will
   * only be applied to what is visible withing the viewport.
   */
  this.highlight = function(check_position)
  {
    if(search_results.length)
    {
      if( cursor >= 0 ) // if we have a currently highlighted hit..
      {
        // then reset its style to the default
        search_results[cursor].forEach(span_set_default_style);
      }

      if( check_position )
      {
        cursor = 0;
        while( search_results[cursor] && this.getRealOffsetTop(search_results[cursor][0]) < 0  )
        {
          cursor++;
        }
      }
      else
      {
        cursor++;
      }
      if( cursor > search_results.length - 1)
      {
        cursor = 0;
      }
      search_results[cursor].forEach(span_set_highlight_style);
      
      if( !check_position || this.getRealOffsetTop(search_results[cursor][0]) > DEFAULT_SCROLL_MARGIN )
      {
        container.scrollTop += this.getRealOffsetTop(search_results[cursor][0]) - DEFAULT_SCROLL_MARGIN;
      }
      update_status_bar();
    }
  }

  /**
   * Returns the top coordinate of ele in releation to container
   */
  this.getRealOffsetTop = function(ele)
  {
    return ele.getBoundingClientRect().top - container.getBoundingClientRect().top;
  }

  this.revalidateSearch = function()
  {
    if( container && search_term )
    {
      var new_search_term = search_term;
      search_term = '';
      this.search(new_search_term, cursor);
    }
  }

  this.setContainer = function(cont)
  {
    if( container != cont )
    {
      container = cont;
    }
  }

  this.setFormInput = function(input)
  {
    __input = input;
    if(search_term)
    {
      var new_search_term = search_term;
      __input.value = input_search_term;
      __input.parentNode.firstChild.textContent = '';
      search_term = '';
      this.searchDelayed(new_search_term);
    }
  }

  /**
   * Cleanup to be performed when searching has ended
   */
  this.cleanup = function()
  {
    search_results = [];
    cursor = -1;
    __input = container = null;
  }
  
};