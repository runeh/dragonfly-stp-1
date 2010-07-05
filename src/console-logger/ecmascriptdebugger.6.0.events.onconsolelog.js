// Autogenerated by hob
window.cls || (window.cls = {});
cls.EcmascriptDebugger || (cls.EcmascriptDebugger = {});
cls.EcmascriptDebugger["6.0"] || (cls.EcmascriptDebugger["6.0"] = {});

cls.EcmascriptDebugger["6.0"].ConsoleLogInfo = function(arr)
{
  this.runtimeID = arr[0];
  /**
    * This value indicates which function was called:
    *
    * 1 - console.log
    * 2 - console.debug
    * 3 - console.info
    * 4 - console.warn
    * 5 - console.error
    * 6 - console.assert
    * 7 - console.dir
    * 8 - console.dirxml
    * 9 - console.group
    * 10 - console.groupCollapsed
    * 11 - console.groupEnded
    * 12 - console.count
    */
  this.type = arr[1];
  /**
    * The list of values passed to the function as arguments.
    */
  this.valueList = (arr[2] || []).map(function(item)
  {
    return new cls.EcmascriptDebugger["6.0"].Value(item);
  });
  /**
    * The position the function was called.
    */
  this.position = arr[3] ? new cls.EcmascriptDebugger["6.0"].Position(arr[3]) : null;
};

cls.EcmascriptDebugger["6.0"].Value = function(arr)
{
  this.value = arr[0];
  this.objectValue = arr[1] ? new cls.EcmascriptDebugger["6.0"].ObjectValue(arr[1]) : null;
};

cls.EcmascriptDebugger["6.0"].ObjectValue = function(arr)
{
  this.objectID = arr[0];
  this.isCallable = arr[1];
  /**
    * type, function or object
    */
  this.type = arr[2];
  this.prototypeID = arr[3];
  /**
    * The class of the object.
    */
  this.className = arr[4];
  /**
    * If the object is a function, this is the name of
    * the variable associated with that function (if any).
    */
  this.functionName = arr[5];
};

cls.EcmascriptDebugger["6.0"].Position = function(arr)
{
  this.scriptID = arr[0];
  this.lineNumber = arr[1];
};

