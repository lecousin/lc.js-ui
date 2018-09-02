lc.app.onDefined("lc.ui.Panel", function() {

	lc.core.extendClass("lc.ui.Panel.Closeable", lc.ui.Panel.Extension,
			function() {
	},{
		priority: -10000, // at the end to ensure the close button will be after other buttons
		extensionName: "closeable",

		postConfigure: function(panel) {
			panel.closeDiv = document.createElement("DIV");
			panel.closeDiv.className = "lc-panel-close";
		},
		
		postBuild: function(panel) {
			lc.events.listen(panel.closeDiv, "click", function() {
				lc.html.remove(panel.container);
			});
			panel.rightDiv.appendChild(panel.closeDiv);
		},
		
		destroy: function(panel) {
			if (!panel.closeDiv) return;
			lc.html.remove(panel.closeDiv);
			panel.closeDiv = null;
			lc.ui.Component.Extension.call(this, panel);
		}
	});
	
	lc.Extension.Registry.register(lc.ui.Panel, lc.ui.Panel.Closeable);
	
});