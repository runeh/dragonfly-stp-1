﻿

var cls = window.cls || ( window.cls = {} );

/**
  * @constructor 
  * @extends ViewBase
  */
cls.InspectionView = function(id, name, container_class)
{

  var self = this;

  var cur_data = 'frame_inspection_data'; // or object_inspection_data

  this.createView = function(container)
  {
    var 
    data_model = window[cur_data],
    selectedObject = data_model.getSelectedObject(),
    data = null,
    use_filter = settings['inspection'].get("hide-default-properties");
    
    if( selectedObject )
    {
      data = data_model.getData(selectedObject.rt_id, selectedObject.obj_id, -1, arguments);
      if(data)
      {
        delete container.__call_count;
        container.innerHTML = 
          "<examine-objects rt-id='" + selectedObject.rt_id + "' " + 
                "data-id=" + cur_data + " " +
                "obj-id='" + selectedObject.obj_id + "' >" +
              "<start-search-scope></start-search-scope>" +
              data_model.prettyPrint(data, -1, use_filter, data_model.filter_type) + 
              "<end-search-scope></end-search-scope>" +
          "</examine-objects>";
        messages.post
        ( 
          'list-search-context', 
          {
            'data_id': cur_data, 
            'rt_id': selectedObject.rt_id,
            'obj_id': selectedObject.obj_id, 
            'depth': '-1'
          }
        );
      }
    }
    else
    {
      container.innerHTML = "";
    }
  }

  this.clearView = function()
  {
    // TODO
  }

  this.init(id, name, container_class);

  var onActiveInspectionType = function(msg)
  {
    cur_data = msg.inspection_type + '_inspection_data';
  }

  messages.addListener('active-inspection-type', onActiveInspectionType);

}

cls.InspectionView.prototype = ViewBase;
new cls.InspectionView('inspection', ui_strings.M_VIEW_LABEL_FRAME_INSPECTION, 'scroll');



new Settings
(
  // id
  'inspection', 
  // key-value map
  {
    'automatic-update-global-scope': false,
    'hide-default-properties': true
  }, 
  // key-label map
  {
    'automatic-update-global-scope': ui_strings.S_SWITCH_UPDATE_GLOBAL_SCOPE,
    'hide-default-properties': ui_strings.S_BUTTON_LABEL_HIDE_DEFAULT_PROPS_IN_GLOBAL_SCOPE
  },
  // settings map
  {
    checkboxes:
    [
      'hide-default-properties'
    ]
  }
);

new ToolbarConfig
(
  'inspection',
  null,
  [
    {
      handler: 'inspection-text-search',
      title: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER,
      label: ui_strings.S_INPUT_DEFAULT_TEXT_FILTER
    }
  ]
)

new Switches
(
  'inspection',
  [
    "hide-default-properties"
  ]
);

(function()
{
  var listTextSearch = new ListTextSearch();

  var onViewCreated = function(msg)
  {
    if( msg.id == 'inspection' )
    {
      listTextSearch.setContainer(msg.container);
    }
  }

  var onViewDestroyed = function(msg)
  {
    if( msg.id == 'inspection' )
    {
      listTextSearch.cleanup();
    }
  }

  var onListSearchContext = function(msg)
  {
    if( msg.data_id == 'inspection' )
    {
      listTextSearch.onNewContext(msg);
    }
  }

  messages.addListener('view-created', onViewCreated);
  messages.addListener('view-destroyed', onViewDestroyed);

  messages.addListener('list-search-context', onListSearchContext);
  

  eventHandlers.input['inspection-text-search'] = function(event, target)
  {
    listTextSearch.setInput(target);
    listTextSearch.searchDelayed(target.value);
  }
  
  eventHandlers.keyup['inspection-text-search'] = function(event, target)
  {
    listTextSearch.handleKey(event, target);
  }

})()