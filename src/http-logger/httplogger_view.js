/**
 * HTTP logger view code.
 * Defines views for request list, header info etc.
 *
 */

/**
  * @constructor 
  * @extends ViewBase
  */

cls.RequestListView = function(id, name, container_class)
{
    var self = this;
    

    this.isPaused = false;
    this.selectedRequestId = null;

    this.createView = function(container)
    {
        var log = HTTPLoggerData.getLog();
        container.innerHTML = "" +
           this._createTable(log) +
            "";
    }
    
    this._createTable = function(log)
    {
        var strings = [];
        var sel = HTTPLoggerData.getSelectedRequestId();
        strings.push("<tr><th>#</th><th>host</th><th>path</th><th>method</th><th>status</th><th>time</th></tr>");
        if (log.length)
        {
            for (var n=0, entry; entry=log[n]; n++)
            {
                var current = (sel && sel==entry.id)
                strings.push(
                   "<tr handler='request-list-select' data-requestid=\"" + entry.id + "\" class='" +(current ? "selected-request" : "") + "' >" +
                        "<th>" + (n+1) + "</th>" +
                        "<td>" + entry.request.headers.Host + "</td>" +
                        "<td>" + entry.request.path + "</td>" +
                        "<td>" + entry.request.method + "</td>" +
                        "<td>" + (entry.response ? entry.response.status : "-") + "</td>" +
                        "<td>" + (entry.response ? entry.response.time - entry.request.time : "-") + "</td>" +
                    "</tr>"
                )
            }
        }
        else
        {
            strings.push("<tr><th>0</th><td colspan='5'>No logged requests yet</td></tr>");
        }
        return "<table id='request-table'>\n" + strings.join("") + "</table>";
    }

    this.init(id, name, container_class);

}

cls.RequestListView.prototype = ViewBase;
new cls.RequestListView('request_list', ui_strings.M_VIEW_LABEL_REQUEST_LOG, 'scroll');


eventHandlers.click['request-list-select'] = function(event, target)
{
    var sel = HTTPLoggerData.getSelectedRequestId();
    var id = target.getAttribute("data-requestid");
    if (sel && sel==id)
    {
        HTTPLoggerData.clearSelectedRequest();
    }
    else
    {
        HTTPLoggerData.setSelectedRequestId(id);
    }
    //opera.postError("REQ ID: " + id)
}


new Settings
(
  // id
  'request_list', 
  // kel-value map
  {
    'pause-resume-request-list-update': true
  }, 
  // key-label map
  {
    'pause-resume-request-list-update':  "#STR Pause/resume"
  },
  // settings map
  {
  }
);

new ToolbarConfig
(
    'request_list',
    [
      {
        handler: 'clear-request-list',
        title: ui_strings.S_BUTTON_CLEAR_REQUEST_LOG
      }
    ],
    [
      {
        handler: 'request-list-filter',
        title: "#STR filter request"
      }
    ]
);

new Switches
(
  'request_list',
  [
    'pause-resume-request-list-update'
  ]
)

eventHandlers.click['clear-request-list'] = function(event, target)
{
    HTTPLoggerData.clearLog();
}

cls.RequestOverviewView = function(id, name, container_class)
{
    var self = this;

    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();
        if (req)
        {
            container.innerHTML = "<div class='padding'><h1>" + this.name + "</h1>This is the request info for " + req.request.headers["Host"] + req.request.path + "</div>";





        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
            
        }
    }
    
    this.init(id, name, container_class);

}

cls.RequestOverviewView .prototype = ViewBase;
new cls.RequestOverviewView ('request_overview', ui_strings.M_VIEW_LABEL_REQUEST_INFO, 'scroll');

cls.RequestRawView = function(id, name, container_class)
{
    var self = this;

    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();
        if (req)
        {
            container.clearAndRender(['div', [
                                                ['h1', this.name],
                                                ['code',
                                                    ['pre',
                                                        req.request.raw
                                                    ]
                                                ]
                                            ],
                                     'class', 'padding'
                                    ]
                                    );
        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
        }
    }
    
    this.init(id, name, container_class);
}

cls.RequestRawView.prototype = ViewBase;
new cls.RequestRawView('request_info_raw', ui_strings.M_VIEW_LABEL_RAW_REQUEST_INFO, 'scroll');


cls.ResponseRawView = function(id, name, container_class)
{
    var self = this;

    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();
        if (req)
        {
            container.clearAndRender(['div', [
                                                ['h1', this.name],
                                                ['code',
                                                    ['pre',
                                                        req.response.raw
                                                    ]
                                                ]
                                            ],
                                     'class', 'padding'
                                    ]
                                    );
        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
        }
    }
    
    this.init(id, name, container_class);
}


cls.ResponseRawView.prototype = ViewBase;
new cls.ResponseRawView('response_info_raw', ui_strings.M_VIEW_LABEL_RAW_RESPONSE_INFO, 'scroll');


cls.RequestHeadersView = function(id, name, container_class)
{
    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();

        if (req)
        {
            container.clearAndRender(['div', [
                                               ['h1', this.name],
                                               window.templates.header_definition_list(req.request.headers),
                                            ],
                                      'class', 'padding'
                                     ]
                                    );
        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
        }
    }
    
    this.init(id, name, container_class);
}


cls.RequestHeadersView.prototype = ViewBase;
new cls.RequestHeadersView('request_info_headers', ui_strings.M_VIEW_LABEL_REQUEST_HEADERS, 'scroll');

cls.ResponseHeadersView = function(id, name, container_class)
{
    this.createView = function(container)
    {
        var req = HTTPLoggerData.getSelectedRequest();

        if (req && req.response)
        {
            container.clearAndRender(['div', [
                                               ['h1', this.name],
                                               window.templates.header_definition_list(req.response.headers),
                                            ],
                                      'class', 'padding'
                                     ]
                                    );
        }
        else
        {
            container.clearAndRender(['div', [
                                                 ['h1', this.name],
                                                 ui_strings.S_TEXT_NO_REQUEST_SELECTED,
                                             ],
                                      'class', 'padding'
                                     ]
                                    );
        }
    }
    
    this.init(id, name, container_class);
}


cls.ResponseHeadersView.prototype = ViewBase;
new cls.ResponseHeadersView('response_info_headers', ui_strings.M_VIEW_LABEL_RESPONSE_HEADERS, 'scroll');

