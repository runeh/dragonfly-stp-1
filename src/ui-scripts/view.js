var ViewBase = new function()
{
  var self = this;
  var id_count = 1;

  var ids = [];

  var getId = function()
  {
    return 'view-' + (id_count++).toString();
  }

  this.getSingleViews = function()
  {
    var 
      id = '', 
      i = 0,
      ret = [];
    for( ; id = ids[i]; i++)
    {
      if(views[id].type == 'single-view' && !views[id].ishidden_in_menu)
      {
        ret[ret.length] = id;
      }
    }
    return ret;
  }

  this._delete = function(id)
  {
    var 
    _id = '', 
    i = 0;
    for( ; ( _id = ids[i] ) && _id != id; i++);
    if(_id)
    {
      ids.splice(i, 1);
      return true;
    }
    return false;
  }

  this.init = function(id, name, container_class, html)
  {
    this.id = id || getId();
    this.name = name;
    this.container_class = container_class;
    this.inner = html;  // only for testing;
    this.container_ids = [];
    this.type = this.type || 'single-view';
    if(!window.views)
    {
      window.views = {};
    }
    window.views[id] = this;
    ids[ids.length] = this.id;
  }

  this.addContainerId = function(id)
  {
    this.container_ids[this.container_ids.length] = id;
  }

  this.removeContainerId = function(id)
  {
    var id_c = '', i = 0;
    for( ; ( id_c = this.container_ids[i] ) && id_c != id; i++);
    if( id_c )
    {
      this.container_ids.splice(i, 1);
    }
  }

  this.createView = function(container)
  {
    container.innerHTML = this.inner;
  }

  this.update = function(ele) // for testing
  {
    if( ele )
    {
      this.createView(ele);
    }
    else
    {
      var id = '', i = 0, container = null;
      
      for( ; id = this.container_ids[i]; i++)
      {
        container = document.getElementById(id);
        if( container )
        {
          this.createView(container);
        }
      }
    }
  }

  this.applyToContainers = function(fn) // for testing
  {

    var id = '', i = 0, container = null;
    
    for( ; id = this.container_ids[i]; i++)
    {
      container = document.getElementById(id);
      if( container )
      {
        fn(container);
      }
    }
    
  }

  this.isvisible = function() // for testing
  {
    var id = '', i = 0;
    for( ; id = this.container_ids[i]; i++)
    {
      if( document.getElementById(id) )
      {
        return true;
      }
    }
    return false;
  }

  this.onresize = function()
  {

  }

}


var View = function(id, name, container_class, html)
{
  this.init(id, name, container_class, html);
}

View.prototype = ViewBase;





