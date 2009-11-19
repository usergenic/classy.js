# Classy

A jQuery powered utility library for mapping JSON data structures into
html templates.  Its a little like XSLT using JSON, but way simpler and
less bloated.  The intent is to make it easy to use purely declarative
html markup to express templates for views.  A major advantage is that
the rules for this markup will be portable to any language.

Here is a simple example of a Classy template:

    <script id="contact_template" type="classy/template">
      <div class="contact">
        <h1 class="name">
          <span class="first"></span>
          <span class="last"></span>
        </h1>
        <ul class="phone_numbers" data-member="phone_number">
          <li class="phone_number #_phone" data-map="phone_number.type:class[#]">
            <span class="number"></span>
          </li>
        </ul>
      </div>
    </script>

And here is some javascript:

    var template = $($('#contact_template').html());
    Classy.apply(template,{
      'contact':{
        'name':{
          'first':'Mister',
          'last':'Mystery'
        },
        'phone_numbers':[
          {
            'number':'(666) 666-6666',
            'type':'mobile'
          },
          {
            'number':'(555) 555-5555',
            'type':'home'
          }
        ]
      }
    });
    $('body').insert(template);

And then you get this in the document body:

      <div class="contact">
        <h1 class="name">
          <span class="first">Mister</span>
          <span class="last">Mystery</span>
        </h1>
        <ul class="phone_numbers" data-member="phone_number">
          <li class="phone_number mobile_phone" data-map="phone_number.type:class[#]">
            <span class="number">(666) 666-6666</span>
          </li>
          <li class="phone_number home_phone" data-map="phone_number.type:class[#]">
            <span class="number">(555) 555-5555</span>
          </li>
        </ul>
      </div>

You can do things like target specific attributes:
      
      var data = {'url':'http://usergenic.com','name':'My Site'};
      var html = Classy.render('<a class="name url" data-map="url:href" />', data);

The value of html is now:

      <a class="name url" data-map="url:href "href="http://usergenic.com">My Site</a>

Anyways, I'll expand this little example at some point.  But now I have to
actually *use* Classy to do some work.

--Brendan

