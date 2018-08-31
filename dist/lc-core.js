lc.app.onDefined(["lc.Extendable","lc.events.Producer","lc.context"], function() {
	
	lc.core.extendClass("lc.ui.Component", [lc.Extendable, lc.events.Producer],
		function(container, doNotConfigure, doNotBuild) {
			if (!this.componentName)
				throw "lc.ui.Component must declare its componentName";
			if (typeof container === 'string') {
				this.container = document.getElementById(container);
				if (!this.container) throw "Cannot find lc.ui.Component container id '" + container + "' for component type " + this.componentName;
			} else if (!container)
				this.container = document.createElement("DIV");
			else
				this.container = container;

			lc.context.setAttribute(this.container, "lc.ui.Component", this);

			// TODO lc.addEventListener(this.container, 'destroy', new lc.Callback(function() { if (!this.destroyed) this.destroy(); }, this));
			lc.html.addClass(this.container, this.componentName);
			lc.Extendable.call(this);
			lc.events.Producer.call(this);
			
			if (!doNotConfigure) {
				this.performConfiguration();
				if (!doNotBuild)
					this.performBuild();
			}

		}, {
			componentName: null,
			
			_configured: false,
			
			configure: function() {
			},
			
			_built: false,
			
			build: function() {
			},
			
			performConfiguration: function() {
				// TODO
			},
			
			performBuild: function() {
				// TODO
			}
			
		}
	);
	
});
//# sourceMappingURL=lc-core.js.map