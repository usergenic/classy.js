/*

  Classy.js
  
  Version: 0.0.1
  Author: Brendan Baldwin <brendan@usergenic.com>
  
  Classy is a templating tool for injecting data into an
  html document by mapping json key names to CSS classes
  referenced in the DOM.
  
  It relies on the jQuery library to insulate the logic
  from un-necessary redundant browser-specific pollution.
  
  For more information visit : http://classy.usergenic.com

*/

/*
  You can rename Classy to whatever you want, right here...
*/
var Classy = (function(){
  
  /*
    You can override the attribute names and
    defaults that Classy uses by setting your
    own Classy.config.* values in your scripts.
  */
  var config = {
    'class_attr'           : 'class',
    'default_map_target'   : ['text'],
    'index_attr'           : 'data-index',
    'map_attr'             : 'data-map',
    'member_attr'          : 'data-member',
    'template_wrapper_tag' : 'div'
  };

  /*
    Support namespace includes secondary
    functions for Classy and is not intended 
    for use as a public API.  Subject to
    change often.
  */
  var support = {

    /*
      Returns an array of CSS class names attached to
      an element.
    */
    'classesOf':function(element){
      var value = jQuery(element).attr(config.class_attr);
      if(this.isBlank(value)) return([]);
      return jQuery.trim(value).split(/ +/);
    },

    /*
      Determines which of 3 categories a
      value falls into:
        - "hash" (json object: aka {"key":"value"})
        - "array" (array: aka ["item0","item1","item2"])
        - "simple" (number, string, null, other object)
    */
    'getType':function(value){
      var basic_type = typeof value;
      switch(basic_type){
        case("object"):
          if(value == null)
            return "simple";
          if(value.constructor.toString().indexOf("Array") == -1)
            return "hash";
          return "array";
        default:
          return "simple";
      }
    },

    /*
      Determine if the value is null, an empty string,
      empty array, or empty object.
    */
    'isBlank':function(value){
      if(this.getType(value)=="simple"){
        return value == null || value == "";
      }
      else {
        return this.sizeOf(value)==0;
      }
    },

    /*
      Determine if the value is neither null, an empty
      string, empty array, or empty object.
    */
    'isPresent':function(value){
      return !this.isBlank(value);
    },
    
    /*
      Parses the map_attr for the element and returns
      the referenced target for the class_name provided.
      If no explicit mapping is defined, returns the
      value of default_map_target from config.
    */
    'mapTargets':function(template, class_name){
      var map_string = jQuery(template).attr(config.map_attr);
      if(typeof map_string == "string"){
        var map_targets = null;
        var map_strings = jQuery.trim(map_string).split(/;/);
        jQuery.each(map_strings, function(i, map_string){
          var targets = map_string.split(/:/);
          var name = targets.shift();
          targets = targets.join(":").split(/,/);
          if(name == class_name){
            map_targets = targets;
            return false;
          }
        });
        if(map_targets){
          return map_targets;
        }
      }
      return config.default_map_target;
    },

    /*
      Returns the count of items in an object or array
      by using the native for x in y implementation.
    */
    'sizeOf':function(value){
      if(this.getType(value)=="array"){
        return value.length;
      }
      var size=0;
      for(var i in value){ size++; }
      return size;
    }
    
  };

  var classy = {

    /*
      Given a json data hash and a template element or
      html string source, return it in a jQuery object
      with data injected into the appropriate nooks and
      crannies.  Yes, cranny is a technical term.  look
      it up.  or don't.  nobody cares.
    */
    'apply':function(template, data){
      return jQuery(template).each(function(){
        var template = jQuery(this);
        var classes = support.classesOf(this);
        var array_or_hash_applied = false;
        jQuery.each(classes, function(i, class_name){
          var value = data[class_name];
          if(typeof value != 'undefined'){
            switch(support.getType(value)){
              case "hash":
                classy.applyHashValue(template, class_name, value, data);
                array_or_hash_applied = true;
                break;
              case "array":
                classy.applyArrayValue(template, class_name, value, data);
                array_or_hash_applied = true;
                break;
              case "simple":
                classy.applySimpleValue(template, class_name, value, data);
                break;
            }
          }
        });
        if(!array_or_hash_applied){
          jQuery(this).children().each(function(){
            classy.apply(this, data);
          });
        }
      });
    },

    /*
      An array is applied by doing one of two things:
        1. If the element has a corresponding member_attr, we will
           do a trick by applying a new context where the class_name
           is replaced with the key in member_attr.  this defers the
           array/cloning magic to situation 2...
        2. With no member_attr, the matching element is replaced with
           a collection of the number of items in the array applied
           to the element as template source.
    */
    'applyArrayValue':function(template, class_name, value, data){
      template = jQuery(template);
      var scoped_data = {};
      var member_name = template.attr(config.member_attr);
      var index_name = template.attr(config.index_attr);

      if(support.isPresent(member_name)){
        jQuery.extend(scoped_data, data);
        delete scoped_data[class_name];
        scoped_data[member_name] = value;
        this.apply(template, scoped_data);
        return template;
      }

      jQuery.each(value, function(i, value){
        scoped_data = {};
        jQuery.extend(scoped_data, data);
        if(support.isPresent(index_name)){
          scoped_data[index_name] = i;
        }
        var clone = template.clone();
        switch(support.getType(value)){
          case "hash":
            classy.applyHashValue(clone, class_name, value, scoped_data); 
            break;
          case "array":
            classy.applyArrayValue(clone, class_name, value, scoped_data);
            break;
          case "simple":
            classy.applySimpleValue(clone, class_name, value, scoped_data);
            break;
        }
        template.before(clone);
      });
      template.remove();
      return template;
    },

    /*
      A hash is applied by updating the context data for sub-elements
      by using values from the hash.  In many ways this is like the
      scope change which occurs when using the with() operator in
      JavaScript.
    */
    'applyHashValue':function(template, class_name, value, data){
      template = jQuery(template);
      this.mapHashValuesToTarget(template, class_name, value);
      var scoped_data = {};
      jQuery.extend(scoped_data, data);
      delete scoped_data[class_name];
      jQuery.extend(scoped_data, value);
      return this.apply(template, scoped_data); 
    },

    /*
      A simple value is applied to the attribute(s) of the
      element provided, based on mapping which may be present
      in the map_attr or the default_map_target.
    */
    'applySimpleValue':function(template, class_name, value, data){
      template = jQuery(template);
      var targets = support.mapTargets(template, class_name);
      var classy = this;
      jQuery.each(targets, function(i, target){
        classy.mapSimpleValueToTarget(template, target, value);
      });
      return template;
    },

    'config':config,

    'mapHashValuesToTarget':function(template, class_name, hash){
      jQuery.each(hash, function(key, value){
        var class_chain = class_name+'.'+key;
        var value_type = support.getType(value);
        switch(value_type){
          case "hash":
            classy.mapHashValuesToTarget(template, class_chain, value);
            break;
          case "array": /* unsupported at this time */
            break;
          case "simple":
            var targets = support.mapTargets(template, class_chain);
            jQuery.each(targets, function(i, target){
              classy.mapSimpleValueToTarget(template, target, value);
            });
        }
      });
    },

    /*
      Right now Classy supports only one kind of content transformation
      via the substitution notation, whereby the target attribute name
      is suffixed with brackets containing the target of the substitution.
      In order to make it easy to extend Classy, it feels like this
      should be abstracted out, but there is at present no time or demand
      for such a thing, so the following code is more hacky than it should
      be.
    */
    'mapSimpleValueToTarget':function(template, target, value){
        var target_with_replace_spec = target.match(/^([^\[]+)\[([^\]]+)\]$/);
        if(target_with_replace_spec){
          target_with_replace_spec.shift();
          target = target_with_replace_spec.shift();
          var replace_spec = target_with_replace_spec.shift();
          var pre_replace_value = "";
          switch(target){
            case "text":
              pre_replace_value = template.text();
              break;
            case "html":
              pre_replace_value = template.html();
              break;
            case "none":
              pre_replace_value = "";
              break; 
            default:
              pre_replace_value = template.attr(target);
          }
          var target_value = pre_replace_value.replace(replace_spec, value);
        }
        else {
          var target_value = value;
        }
        switch(target){
          case "text":
            template.text(target_value);
            break;
          case "html":
            template.html(target_value);
            break;
          case "none":
            break;
          default:
            template.attr(target, target_value);
        };
    },

    /*
      Given data in a json hash and a string containing
      a classy html template, returns generated html.
    */
    'render':function(template, data){
      template = jQuery(
        '<'+config.template_wrapper_tag+'>'+
        template+
        '</'+config.template_wrapper_tag+'>'
      );
      this.apply(template, data);
      return template.html();
    },

    'support':support

  };

  return classy;

})();

