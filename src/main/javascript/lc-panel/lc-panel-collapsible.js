lc.app.onDefined("lc.ui.Panel", function() {

	lc.core.extendClass("lc.ui.Panel.Collapsible", lc.ui.Panel.Extension,
	function() {
	},{
		priority: -1000,
		extensionName: "collapsible",
		
		postConfigure: function(panel) {
			panel.collapseDiv = document.createElement("DIV");
			panel.collapseDiv.className = "lc-panel-collapse lc-panel-expanded";

			panel.collapse = function() {
				lc.animation.collapseHeight(this.content, 500).ondone(new lc.async.Callback(this, function() {
					this.content.style.height = "0px";
					this.content.style.paddingTop = "0px";
					this.content.style.paddingBottom = "0px";
					this.content.style.overflow = "hidden";
				}));
				lc.css.removeClass(this.collapseDiv, "lc-panel-expanded");
				lc.css.addClass(this.collapseDiv, "lc-panel-collapsed");
			};
			
			panel.expand = function() {
				this.content.style.height = "";
				this.content.style.paddingTop = "";
				this.content.style.paddingBottom = "";
				this.content.style.overflow = "";
				lc.animation.expandHeight(this.content, 500);
				lc.css.addClass(this.collapseDiv, "lc-panel-expanded");
				lc.css.removeClass(this.collapseDiv, "lc-panel-collapsed");
			};
			
			panel.toggleCollapsed = function() {
				if (this.isExpanded())
					this.collapse();
				else
					this.expand();
			};
			
			panel.isCollapsed = function() {
				return lc.css.hasClass(this.collapseDiv, "lc-panel-collapsed");
			};
			
			panel.isExpanded = function() {
				return !this.isCollapsed();
			};
		},
		
		postBuild: function(panel) {
			lc.events.listen(panel.collapseDiv, "click", new lc.async.Callback(panel, panel.toggleCollapsed));
			panel.rightDiv.appendChild(panel.collapseDiv);
		},
		
		destroy: function(panel) {
			if (!panel.collapseDiv) return;
			lc.events.destroyed(panel.collapseDiv);
			if (panel.collapseDiv.parentNode)
				panel.collapseDiv.parentNode.removeChild(panel.collapseDiv);
			panel.collapseDiv = null;
			lc.ui.Component.Extension.call(this, panel);
		}
	});

	lc.Extension.Registry.register(lc.ui.Panel, lc.ui.Panel.Collapsible);
	
});