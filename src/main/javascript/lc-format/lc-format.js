lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.Format", [lc.ui.Component, lc.Configurable],
		function(container, doNotConfigure, doNotBuild) {
			var properties = {
				value: {
					types: ["string"],
					value: "",
					set: function(value, properties) {
						if (!value) value = "";
						properties.value.value = this._createValue(value);
						this._format();
						this.trigger("change", properties.value.value);
					}
				}
			};
			lc.Configurable.call(this, properties);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-format",
			formatter: null,
			
			configure: function() {
				this.registerEvent("change");
			},
			
			build: function() {
				if (this.container.hasAttribute("type")) {
					var format = lc.ui.Formatter.Registry.get(this.container.getAttribute("type"));
					if (format)
						this.formatter = new format();
				}
				if (this.formatter != null)
					this.formatter.configureFromAttributes(this.container);
				this._format();
			},
			
			_createValue: function(value) {
				return this.formatter ? this.formatter.createValue(value) : value;
			},
			
			_format: function() {
				var formatted = this.formatter != null ? this.formatter.formatValue(this.value) : "!no formatter!";
				lc.html.empty(this.container);
				this.container.appendChild(document.createTextNode(formatted));
			},
			
			destroy: function() {
				// TODO
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Format);
	
	lc.core.createClass("lc.ui.Formatter", function() {}, {
		type: null,
		configureFromAttributes: function(element) {},
		createValue: function(str) { return str; },
		formatValue: function(value) { return value; }
	});
	
	lc.ui.Formatter.Registry = {
		formatters: [],
		register: function(formatter) { lc.ui.Formatter.Registry.formatters.push(formatter); },
		get: function(type) {
			for (var i = 0; i < lc.ui.Formatter.Registry.formatters.length; ++i)
				if (lc.ui.Formatter.Registry.formatters[i].prototype.type == type)
					return lc.ui.Formatter.Registry.formatters[i];
			return null;
		}
	};
	
});