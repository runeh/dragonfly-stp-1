(function()
{
  /* extends window.templates interface */

  this.inspected_js_object = function(model, show_root, path){};

  /* constants */

  const
  // sub message ObjectInfo 
  VALUE = 0,
  PROPERTY_LIST = 1,
  // sub message ObjectValue 
  OBJECT_ID = 0,
  CLASS_NAME = 4,
  // sub message Property 
  NAME = 0,
  PROPERTY_TYPE = 1,
  PROPERTY_VALUE = 2,
  OBJECT_VALUE = 3,
  // added fields
  MAX_VALUE_LENGTH = 30;

  /* private */

  var _pretty_print_object = function(model, tree, obj_id, ret)
  {
    ret || (ret = []);
    var data = model.get_data(obj_id);
    if (data)
    {
      ret.push("<examine-objects data-id='" + model.id + "' >");
      for (var proto = null, i = 0; proto = data[i]; i++)
      {
        ret.push("<div class='prototype' data-proto-index='" + i + "'>");
        // skip the first object description
        if (i)
          ret.push("<div class='prototype-chain-object'>", proto[VALUE][CLASS_NAME], "</div>");
        _pretty_print_properties(model, tree.protos && tree.protos[i] || {}, proto[PROPERTY_LIST] || [], ret);
        ret.push("</div>");
      }
      ret.push("</examine-objects>");
    };
    return ret;
  };

  var _pretty_print_properties = function(model, tree, property_list, ret)
  {
    var value = '', type = '', short_val = '', obj_id = 0;
    for (var prop = null, i = 0; prop = property_list[i]; i++)
    {
      value = prop[PROPERTY_VALUE];
      switch (type = prop[PROPERTY_TYPE])
      {
        case "number":
        case "boolean":
        {
          ret.push(
            "<item>" +
              "<key class='no-expander'>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
              "<value class='" + type + "'>" + value + "</value>" +
            "</item>"
          );
          break;
        }
        case "string":
        {
          short_val = value.length > MAX_VALUE_LENGTH ? 
                        value.slice(0, MAX_VALUE_LENGTH) + '�"' : '';
          value = helpers.escapeTextHtml(value).replace(/'/g, '&#39;');
          if (short_val)
          {
            ret.push(
              "<item>" +
                "<input type='button' handler='expand-value'  class='folder-key'/>" +
                "<key>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
                "<value class='" + type + "' data-value='" + value + "'>" +
                  "\"" + helpers.escapeTextHtml(short_val) +
                "</value>" +
              "</item>"
            );
          }
          else
          {
            ret.push(
              "<item>" +
                "<key class='no-expander'>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
                "<value class='" + type + "'>\"" + value + "\"</value>" +
              "</item>"
            );
          }
          break;
        }
        case "null":
        case "undefined":
        {
          ret.push(
            "<item>" +
              "<key class='no-expander'>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
              "<value class='" + type + "'>" + type + "</value>" +
            "</item>"
          );
          break;
        }
        case "object":
        {
          obj_id = prop[OBJECT_VALUE][OBJECT_ID];
          ret.push(
            "<item obj-id='" + obj_id + "'>" +
            "<input " +
              "type='button' " +
              "handler='examine-object'  " +
              "class='folder-key' "
          );
          if (tree.hasOwnProperty(prop[NAME])) // 'in' is true for all non enumarables
            ret.push("style='background-position: 0px -11px') ");
          ret.push(
            "/>" +
            "<key>" + helpers.escapeTextHtml(prop[NAME]) + "</key>" +
            "<value class='object'>" + prop[OBJECT_VALUE][CLASS_NAME] + "</value>"
          );
          if (tree.hasOwnProperty(prop[NAME]))
            _pretty_print_object(model, tree[prop[NAME]], obj_id, ret);
          ret.push("</item>");
          break;
        }
      }
    }
  };

  /* implementation */

  this.inspected_js_object = function(model, show_root, path)
  {
    if (typeof show_root === 'boolean')
      path = show_root ? null : [model.get_root_path()];
    var tree = model.get_subtree(path);
    return _pretty_print_object(model, tree, tree.object_id).join('');
  }

}).apply(window.templates || (window.templates = {}));
