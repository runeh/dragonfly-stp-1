﻿var Slider = function(container, slider_base_id, slider_id, min, max)
{  
  /* interface */
  this.onz = function(z){};
  //read and write
  this.z; 
  
  /* constructor */
  this._init(container, slider_base_id, slider_id, min, max);
};

Slider.prototype = new function()
{
  
  this._onmousemoveinterval = function(event)
  {
    if (this._is_active)
    {
      if (this._event)
      {
        var z = 
          (this._event.clientY - 
          this._delta - 
          this._ref_element.getBoundingClientRect().top) / 
          this._pixel_range * this._range + 
          this._min;
        z = z > this._max ? this._max : z < this._min ? this._min : z;
        if (z != this.z)
        {
          this.onz(this.z = z);
        }
      }
    }
    else
    {
      window.clearInterval(this._interval);
      this._interval = 0;
      this._event = null;
    }
  }

  this._onmousemove = function(event)
  {
    this._event = event;
  }
  
  this._update_z = function(z)
  {
    this._element.style.top = ((z - this._min) / this._range * this._pixel_range) + "px";
  }
  
  this._onmousedown = function(event)
  {
    if (!this._interval && !this._is_active)
    {
      var target_box = this._element.getBoundingClientRect();
      this._delta = event.clientY - target_box.top - (target_box.height / 2 >> 0);
      document.addEventListener('mousemove', this._onmousemove_bound, false);
      document.addEventListener('mouseup', this._onmouseup_bound, false);
      this._interval = window.setInterval(this._onmousemoveinterval_bound, 30);
      this._is_active = true;
    }
  }
  
  this._onmouseup = function(event)
  {
    this._is_active = false;
    document.removeEventListener('mousemove', this._onmousemove_bound, false);
    document.removeEventListener('mouseup', this._onmouseup_bound, false);
  }
  
  this._onremove = function()
  {
    this._element.removeEventListener('mousedown', this._onmousedown_bound, false);
    this._ref_element.removeEventListener('DOMnoderemoved', this._onremove_bound, false);
    this._ref_element = null;
    this._element = null;      
    this._onmousedown_bound = null;
    this._onmousemove_bound = null;
    this._onmouseup_bound = null;
    this._onremove_bound = null;
    this._onmousemoveinterval_bound = null;
  }
  
  this._init = function(container, slider_base_class, slider_class, min, max)
  {
    if (container instanceof Element)
    {
      container.render(window.templates.slider(slider_base_class, slider_class));
      this._ref_element = document.getElementsByClassName(slider_base_class)[0];
      this._element = document.getElementsByClassName(slider_class)[0];    
      this._min = min;
      this._max = max;
      this._pixel_range = this._ref_element.getBoundingClientRect().height;
      this._range = max - min;
      this._z = 0;    
      this._onmousedown_bound = this._onmousedown.bind(this);
      this._onmousemove_bound = this._onmousemove.bind(this);
      this._onmouseup_bound = this._onmouseup.bind(this);
      this._onremove_bound = this._onremove.bind(this);
      this._onmousemoveinterval_bound = this._onmousemoveinterval.bind(this);
      this._element.addEventListener('mousedown', this._onmousedown_bound, false);
      // TODO
      //this._ref_element.addEventListener('DOMNodeRemoved', this._onremove_bound, false);
    }
  }
  
  this.__defineSetter__('z', function(value)
  {
    this.__z = value;
    if (typeof value == 'number' && 
        !isNaN(value) &&
        value >= this._min && 
        value <= this._max)
      this._update_z(value);
  });
  
  this.__defineGetter__('z', function()
  {
    return this.__z;
  });
};