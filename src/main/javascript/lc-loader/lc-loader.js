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
			},
			
			build: function() {
				lc.html.empty(this.container);
				this.container.innerHTML = lc.ui.Loader.templates[this.template];
				this.container.className = "lc-loader " + this.template;
			}
		}
	);
	
	lc.ui.Loader.templates = {};
	lc.ui.Loader.templates["three-balls"] = "<div></div><div></div><div></div>";
	lc.ui.Loader.defaultTemplate = "three-balls";
	
	lc.ui.Component.Registry.register(lc.ui.Loader);
	
});
