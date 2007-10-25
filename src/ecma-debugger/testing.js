var testing = new function()
{
   var self = this;

   var __selected_runtime = '';



  var spotlight = function(event)
  {
    commands.spotlight(__selected_runtime, event['object-id']);
    if( window.__times_spotlight__ ) 
    {
      debug.profileSpotlight();
    }
  }

  this.view = new function()
  {
    var self = this;
    var container_id = 'testing';


      
    this.update = function()
    {
      var container = document.getElementById(container_id);
      if( container )
      {
        container.innerHTML = '';
        container.render
        (
          [
            ['p', 
              ['input', 
                'type', 'button',
                'value', 'set event handler',
                'onclick', function()
                {
                  __selected_runtime = runtimes.getSelectedRuntimeId();
                  if(__selected_runtime)
                  {
                    tabs.activeTab.addEventListener(this.nextSibling.value, spotlight);
                  }
                  else
                  {
                    alert('please select a runtime in "Runtimes"');
                  }
                }
              ], ['input', 'value', 'mouseover']
            ],
            ['p', 
              ['input', 
                'type', 'button',
                'value', 'remove event handler',
                'onclick', function()
                {
                  commands.clearSpotlight(__selected_runtime);
                  tabs.activeTab.removeEventListener(this.nextSibling.value, spotlight);
                }
              ], ['input', 'value', 'mouseover']
            ]
          ]
        );
      }
    }
    
  }



}