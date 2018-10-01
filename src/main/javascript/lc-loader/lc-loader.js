lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.Loader", [lc.ui.Component],
		function(container, doNotConfigure, doNotBuild) {
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-loader",
			template: null,
			
			configure: function() {
				if (!this.template)
					this.template = this.container.getAttribute("loader-template");
				if (!this.template)
					this.template = lc.ui.Loader.defaultTemplate;
				if (!this.size) {
					var i = parseInt(this.container.getAttribute("loader-size"));
					if (!isNaN(i)) this.size = i;
				}
			},
			
			build: function() {
				lc.html.empty(this.container);
				var template = lc.ui.Loader.templates[this.template];
				
				for (var i = 0; i < template.children; ++i)
					this.container.appendChild(document.createElement("DIV"));
				this.container.className = "lc-loader " + this.template;
				
				var size = this.size;
				if (!size) size = template.defaultSize;
				if (size) {
					if (typeof template.containerSizeAttributes !== 'undefined')
						this.applyTemplateValue(size, this.container, template.containerSizeAttributes);
					if (typeof template.childSizeAttributes !== 'undefined')
						for (var i = 0; i < template.childSizeAttributes.length; ++i)
							this.applyTemplateValue(size, this.container.childNodes[i], template.childSizeAttributes[i]);
				}
			},
			
			applyTemplateValue: function(value, element, attributes) {
				for (var n in attributes) {
					var style = attributes[n].replace("$", value)
					var i = 0;
					while ((i = style.indexOf('@')) >= 0) {
						var j = style.indexOf('@', i + 1);
						if (j < 0) break;
						style = style.substring(0, i) + eval('(' + style.substring(i + 1, j) + ')') + style.substring(j + 1);
					}
					element.style[n] = style;
				}
			},
			
			destroy: function() {
				lc.ui.Component.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Loader.templates = {};
	lc.ui.Loader.templates["three-balls"] = {
		children: 3,
		defaultSize: 10,
		containerSizeAttributes: { height: "$px" },
		childSizeAttributes: [
			{ width: "$px", height: "$px"},
			{ width: "$px", height: "$px"},
			{ width: "$px", height: "$px"}
		]
	}
	lc.ui.Loader.templates["ring"] = {
		children: 4,
		defaultSize: 64,
		containerSizeAttributes: { width: "$px", height: "$px" },
		childSizeAttributes: [
			{ borderWidth: "@$/16@px" },
			{ borderWidth: "@$/16@px" },
			{ borderWidth: "@$/16@px" },
			{ borderWidth: "@$/16@px" }
		]
	
	};
	lc.ui.Loader.templates["dual-ring"] = {
		children: 1,
		defaultSize: 64,
		containerSizeAttributes: { width: "$px", height: "$px" },
		childSizeAttributes: [
			{ borderWidth: "@$/12@px" }
		]
	};
	lc.ui.Loader.templates["roller"] = {
		children: 12,
		defaultSize: 64,
		containerSizeAttributes: { width: "$px", height: "$px" }
	};
	lc.ui.Loader.defaultTemplate = "three-balls";
	
	lc.ui.Component.Registry.register(lc.ui.Loader);
	
});
