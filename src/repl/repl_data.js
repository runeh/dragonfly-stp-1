window.cls = window.cls || (window.cls = {});

cls.ReplData = function(view)
{
  this._repllog = [];
  this._typed_history = [];
  this._view = view;

  this._add_entry = function(type, data)
  {
    var entry = {
      time: (new Date()).getTime(),
      type: type,
      data: data
    };

    this._repllog.push(entry);
    this._view.update();
  };

  this.add_message = function(msg)
  {
    this._add_entry("consolelog", msg);
  };

  /**
   * Input, what was typed, always a string
   */
  this.add_input = function(str)
  {
    this._add_typed_history(str);
    this._add_entry("input", str);
  };

  /**
   * Anything that can be represented as a string without data loss,
   * that is, int, bool, string
   */
  this.add_output_str = function(str) {
    this._add_entry("string", str);
  };

  /**
   * Inspectableobject, as used by dir() and dirxml()
   */
  this.add_output_iobj = function(rt, objid, name) {
    this._add_entry("iobj", {rt_id: rt, obj_id: objid, name: name});
  };

  /**
   * Pointer to object, like when evaluating an object without using dir etc.
   */
  this.add_output_pobj = function(rt, objid, name)
  {
    this._add_entry("pobj", {rt_id: rt, obj_id: objid, name: name});
  };

  this.add_output_valuelist = function(rt, values)
  {
    values.forEach(function(e) {
      e.rt_id = rt;
    });
    this._add_entry("valuelist", values);
  };

  this.add_output_exception = function(message, trace)
  {
    this._add_entry("exception", {message:message, stacktrace:trace});
  };

  this.add_output_trace = function(trace)
  {
    this._add_entry("trace", trace);
  };

  this.add_output_groupstart = function(data)
  {
    this._add_entry("groupstart", data);
  };

  this.add_output_groupend = function(data)
  {
    this._add_entry("groupend", data);
  };


  /**
   * Return a n array of entry objects for the repl input/output history.
   */
  this.get_log = function(after)
  {
    after = after || 0;
    var filterfun = function(e) { return e.time > after; };
    return this._repllog.filter(filterfun);
  };

  /**
   * Return an array of strings that have been typed into to repl.
   * Adjacent duplicates are removed, so [1,2,3,3,2] would become
   * [1,2,3,2]
   */
  this.get_typed_history = function()
  {
    return this._typed_history;
  };

  this._add_typed_history = function(str)
  {
    if (this._typed_history[0] != str)
    {
      this._typed_history.unshift(str);
    }
  };

};
