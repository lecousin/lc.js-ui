lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.Panel", lc.ui.Component, 
		function(container, doNotConfigure, doNotBuild) {
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-panel",
			
			configure: function() {
				this.header = document.createElement("DIV");
				this.header.className = "lc-panel-header";
				this.content = document.createElement("DIV");
				this.content.className = "lc-panel-content";
				
				this.titleDiv = document.createElement("DIV");
				this.titleDiv.className = "lc-panel-title";
				this.header.appendChild(this.titleDiv);
				this.leftDiv = document.createElement("DIV");
				this.leftDiv.className = "lc-panel-header-left";
				this.header.appendChild(this.leftDiv);
				this.rightDiv = document.createElement("DIV");
				this.rightDiv.className = "lc-panel-header-right";
				this.header.appendChild(this.rightDiv);
			},
			
			build: function() {
				while (this.container.childNodes.length > 0) {
					var e = this.container.removeChild(this.container.childNodes[0]);
					if (e.nodeType != 1) continue;
					if (e.nodeName == "HEADER") {
						while (e.childNodes.length > 0)
							this.titleDiv.appendChild(e.removeChild(e.childNodes[0]));
					} else if (e.nodeName == "CONTENT") {
						while (e.childNodes.length > 0)
							this.content.appendChild(e.removeChild(e.childNodes[0]));
					}
				}
				this.container.appendChild(this.header);
				this.container.appendChild(this.content);
			},
			
			destroy: function() {
				lc.events.destroyed(this.header);
				this.header = null;
				this.titleDiv = null;
				this.leftDiv = null;
				this.rightDiv = null;
				lc.events.destroyed(this.content);
				this.content = null;
				lc.ui.Component.prototype.destroy.call(this);
			}
			
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Panel);

	lc.core.extendClass("lc.ui.Panel.Extension", lc.ui.Component.Extension, function() {}, {
	});

});