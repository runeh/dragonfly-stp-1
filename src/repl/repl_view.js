window.cls = window.cls || (window.cls = {});

/**
 * @constructor
 * @extends ViewBase
 */

cls.ReplView = function(id, name, container_class, html, default_handler) {
  this._resolver = new PropertyFinder();
  this._data = new cls.ReplData(this);
  this._service = new cls.ReplService(this, this._data);
  this._linelist = null;
  this._textarea = null;
  this._lastupdate = null;
  this._current_input = "";
  this._current_scroll = 0;
  this._container = null;

  this.ondestroy = function()
  {
    this._lastupdate = 0;
    this._current_input = this._textarea.value;
  };

  this.createView = function(container)
  {
    if (!this._lastupdate)
    {
      var markup = "" +
        "<div class='padding'>" +
          "<div class='repl-output' handler='focus-repl'><ul id='repl-lines'></ul></div>" +
          "<div class='repl-input'>" +
            "<span class='repl-prefix'>&gt;&gt;&gt; </span>" +
            "<div><textarea rows='1' title='hold shift to add a new line'></textarea></div>" +
          "</div>" +
        "</div>";

      container.innerHTML = markup;

      this._linelist = container.querySelector("#repl-lines");
      this._textarea = container.querySelector("textarea");
      this._textarea.addEventListener("keydown", this._handle_input.bind(this), false);
      this._textarea.addEventListener("keypress", this._handle_keypress.bind(this), false);
      this._textarea.value = this._current_input;
      this._container = container;
      this._container.addEventListener("click", this._focus_input.bind(this), false);
    }


    this._update();
  };

  this._update = function()
  {
    var now = new Date().getTime();
    var entries = this._data.get_log(this._lastupdate);
    this._lastupdate = now;

    for (var n=0, e; e=entries[n]; n++)
    {
      switch(e.type) {
        case "input":
          this.render_input(e.data);
          break;
        case "string":
          this.render_string(e.data);
          break;
        case "exception":
          this.render_error(e.data);
          break;
        case "iobj":
          this.render_inspectable_object(e.data);
          break;
        case "pobj":
          this.render_pointer_to_object(e.data);
          break;
      default:
          this.render_string("unknown");
      }
    }
  };

  this._focus_input = function()
  {
    this._textarea.focus();
  };

  this.render_object = function(rt_id, obj_id)
  {

  };

  this.render_pointer_to_object = function(data)
  {
    this._add_line([
                     'pre',
                     data.rootname,
                     'handler', 'inspect-object-link',
                     'rt-id', data.rt_id.toString(),
                     'obj-id', data.obj_id.toString()
          ]
    );
  };

  this.render_inspectable_object = function(data)
  {
    var rt_id = data.rt_id, obj_id=data.obj_id, name=data.rootname;
    var v = new cls.InspectableObjectView(rt_id, obj_id, name);
    var div = document.createElement("div");
    div.render(v.render()); // fixme: superflous div.
    this._add_line(div);
  };

  this.render_error = function(data)
  {
    this.render_string(data.message + ".\n" + data.stacktrace);
  };

  this.render_string = function(str)
  {
    var ele = document.createTextNode(str);
    this._add_line(ele);
  };

  this.render_input = function(str)
  {
    this.render_string(">>> " + str);
  };

  this.set_current_input = function(str)
  {
    this._textarea.textContent = str;
  };

  this.display_completion = function() {

  };

  this._add_line = function(elem_or_template)
  {
    var line = document.createElement("li");

    if (elem_or_template.nodeType === undefined)
    {
      line.render(elem_or_template);
    }
    else
    {
      line.appendChild(elem_or_template);
    }

    this._linelist.appendChild(line);
    this._container.scrollTop = this._container.scrollHeight;
  };

  this._handle_input = function(evt)
  {
    if (evt.keyCode == 13)
    {
      var input = this._textarea.value;
      // trim leading and trailing whitespace
      input = input.replace(/^\s*/, "").replace(/$\s*/, "");
      this._textarea.value = "";
      this._service.handle_input(input);
    }
    else if (evt.keyCode == 9)
    {

    }


  }.bind(this);

  this._handle_keypress = function(evt)
  {

    if (evt.keyCode == 9)
    {
      evt.preventDefault();

      var partial = new PropertyFinder();
      partial.find_props(this._handle_completer.bind(this), this._textarea.value);

    }
  };

  this._handle_completer = function(props)
  {
    if (props.scope)
    {
      var localpart = props.input.slice(props.scope.length+1);
    }
    else
    {
      var localpart = props.input;
    }

    //opera.postError("Local part is " + localpart)

    var matches = props.props.filter(function(e) {
      return e.indexOf(localpart) == 0;
    });

    this.render_string(matches.sort().join(", "));
  };

  this.init(id, name, container_class, html, default_handler);
};
cls.ReplView.prototype = ViewBase;


