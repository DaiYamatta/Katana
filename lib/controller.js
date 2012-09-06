var View = App.View;

var extend = App.Utils.extend;

Class('Katana.Core.Controller', {
  have: {
	data: []
  },
	
  methods: {
	initialize: function() {
			
	},
		
	set: function(name, value) {
	  if (typeof(name) === 'object') {
		this.data = extend(this.data, name);
	  } else {
		this.data[name] = value;
	  }
	},
		
	render: function(template, data) {
	  return View.render(template, extend(this.data, data));
	}
  }
});

module.exports = Katana.Core.Controller;
