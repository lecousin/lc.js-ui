lc.app.onDefined("lc.ui.Panel", function() {

	lc.core.extendClass("lc.ui.Panel.Footer", lc.ui.Panel.Extension,
			function() {
	},{
		extensionName: "footer",

		postConfigure: function(panel) {
			panel.footer = document.createElement("DIV");
			panel.footer.className = "lc-panel-footer";
			panel.extensionOverridesMethod(this, "buildFromElement", function(e) {
				if (e.nodeType == 1 && e.nodeName == "FOOTER") {
					while (e.childNodes.length > 0)
						this.footer.appendChild(e.removeChild(e.childNodes[0]));
					return;
				}
				this.callPreviousImplementation(this.getExtension(lc.ui.Panel.Footer), "buildFromElement", [e]);
			});
		},
		
		postBuild: function(panel) {
			panel.container.appendChild(panel.footer);
		},
		
		destroy: function(panel) {
			if (!panel.footer) return;
			lc.html.remove(panel.footer);
			panel.footer = null;
			lc.ui.Component.Extension.call(this, panel);
		}
	});
	
	lc.Extension.Registry.register(lc.ui.Panel, lc.ui.Panel.Footer);
	
});