// Autogenerated by hob
window.cls || (window.cls = {});
cls.Scope || (cls.Scope = {});
cls.Scope["1.1"] || (cls.Scope["1.1"] = {});

cls.Scope["1.1"].ServiceInfo = function(arr)
{
  this.commandList = (arr[0] || []).map(function(item)
  {
    return new cls.Scope["1.1"].CommandInfo(item);
  });
  this.eventList = (arr[1] || []).map(function(item)
  {
    return new cls.Scope["1.1"].EventInfo(item);
  });
};

cls.Scope["1.1"].CommandInfo = function(arr)
{
  this.name = arr[0];
  this.number = arr[1];
  this.messageID = arr[2];
  this.responseID = arr[3];
};

cls.Scope["1.1"].EventInfo = function(arr)
{
  this.name = arr[0];
  this.number = arr[1];
  this.messageID = arr[2];
};

