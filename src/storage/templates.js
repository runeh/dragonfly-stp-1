﻿window.templates = window.templates || {};

window.templates.storage = function(storages, storage_id, storage_title)
{
  /*
  storages
  {
    "stoarge_id": <storage id>,
    "<rt-id>":
    {
      "rt_id": <rt-id>,
      "storage":
      [
        {
          "key": <key>,
          "value": <value>,
          "type": <type>
        },
        ...
      ]
    },
    ...
  }
    
  window.runtimes.getRuntime(<rt-id>)
  {
    "runtime_id": <rt-id>,
    "html_frame_path": <frame-path>,
    "window_id": <window-id>,
    "object_id": <object-id>,
    "uri": <uri>,
    "is_top": <is-top-runtime>,
    "title": <title>,
  }
  */

  var rt_id = '', storage = null, rt = null, ret = [];
  for (rt_id in storages)
  {
    if((storage = storages[rt_id]) && (rt = window.runtimes.getRuntime(storage.rt_id)))
    {
      ret.push(
      ['div',
        ['table',
          window.templates.storage_domain_header(rt),
          storage.storage.map(window.templates.storage_item),
          ['tr', 
            ['th',
              window.templates.storage_button({title: 'Add', handler: 'storage-add-key'}),
              window.templates.storage_button({title: 'Update', handler: 'storage-update'}),
              window.templates.storage_button({label: 'Delete all', handler: 'storage-delete-all'}),
              'colspan', '3',
              'class', 'single-control'
            ]
          ],
          'data-rt-id', rt_id,
          'data-storage-id', storage_id,
          'class', 'storage-table'
        ],
        'class', 'storage-domain'
      ]);
    }
  }
  return  ['div', ret, 'class', 'padding'];
}

window.templates.storage_domain_header = function(rt)
{
  return ['caption', rt.title || window.helpers.shortenURI(rt.uri).uri];
}

window.templates.storage_item = function(entry, index, storage_arr)
{
  const MAX_LENGTH = 40;
  var value = entry.value, pos = value.indexOf('\n');
  if(pos > -1)
  {
    value = value.slice(0, pos).replace(/\r$/, '') + ' ...';
  }
  return (
  ['tr',
    ['td', entry.key, 'class', 'key'],
    ['td', 
      value,
      'edit-handler', 'storage-edit',
      'class', 'value'],
    ['td', 
      window.templates.storage_button({title: 'Delete', handler: 'storage-delete'}),
      'class', 'control'
    ],
    'data-storage-key', entry.key
  ]);
}

window.templates.storage_item_edit = function(item, index)
{
  return (
  ['tr',
    ['td',
      ['h4', item.key],
      ['_auto_height_textarea', item.value],
      ['p',
        window.templates.storage_button({label: 'Save', handler: 'storage-save'}),
        window.templates.storage_button({label: 'Cancel', handler: 'storage-edit-cancel'}),
      ],
      'class', 'storage-edit',
      'colspan', '3'
    ],
    'data-storage-key', item.key,
  ]);
}

window.templates.storage_item_add = function()
{
  return (
  ['tr',
    ['td',
      ['h4', ['_html5_input', 'data-placeholder', '<new key>', 'class', 'new-key']],
      ['_auto_height_textarea', 'data-placeholder', '<new value>'],
      ['p',
        window.templates.storage_button({label: 'Save', handler: 'storage-save'}),
        window.templates.storage_button({label: 'Cancel', handler: 'storage-edit-cancel'}),
      ],
      'class', 'storage-edit',
      'colspan', '3'
    ],
  ]);
}

window.templates.storage_button = function(action)
{
  return (
  ['input', 
    'type', 'button',
    'handler', action.handler
  ].
  concat(action.label ? ['value', action.label] : []).
  concat(action.title ? ['title', action.title] : []));
}
