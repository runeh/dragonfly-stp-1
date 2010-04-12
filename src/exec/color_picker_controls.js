﻿eventHandlers.click['utils-color-picker'] = function(event, target)
{
  var is_active = window.color_picker_data.get_active_state();
  window.color_picker_data.set_active_state(!is_active);
  event.target.value = is_active && "Start" || "Stop";
}

eventHandlers.change["set-color-picker-scale"] = function(event, target)
{
  window.views.color_picker.set_scale(parseInt(target.value));
}

eventHandlers.change["update-area"] = function(event, target)
{
  window.views.color_picker.set_screenshot_dimension(target.value);
}

eventHandlers.change["update-average"] = function(event, target)
{
  window.views.color_picker.set_average_dimension(parseInt(target.value));
}

eventHandlers.click["color-picker-picked"] = function(event, target)
{
  window.views.color_picker.pick_color(event, target);
}

eventHandlers.click["color-picker-store-color"] = function(event, target)
{
  window.views.color_picker.store_selected_color();
}

eventHandlers.click["color-picker-set-stored-color"] = function(event, target)
{
  var color = event.target.getAttribute('data-stored-color');
  if(color)
  {
    window.views.color_picker.set_stored_color(color);
  }
}

eventHandlers.click["color-picker-manage-stored-colors"] = function(event, target)
{
  window.views.color_picker.manage_stored_colors();
}

eventHandlers.click["color-picker-manage-stored-colors-done"] = function(event, target)
{
  window.views.color_picker.manage_stored_colors_done();
}

eventHandlers.click["delete-stored-color"] = function(event, target)
{
  var index = parseInt(event.target.parentNode.getAttribute('data-color-index'));
  window.views.color_picker.delete_stored_color(index);
}

eventHandlers.click["color-picker-reset-default-values"] = function(event, target)
{
  window.views.color_picker.reset_default_values();
}

