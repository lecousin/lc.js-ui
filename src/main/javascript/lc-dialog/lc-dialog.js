lc.app.onDefined("lc.ui.Popin", function() {

	/**
	 * A dialog is simply a pop-in containing a panel.
	 * It means that both extensions of pop-in and panel may be respectively applied.
	 */
	lc.core.extendClass("lc.ui.Dialog", [lc.ui.Popin],
		function(container, doNotConfigure, doNotBuild){
			var panelContainer = document.createElement("DIV");
			for (var i = 0; i < container.attributes.length; ++i) {
				var a = container.attributes.item(i);
				if (a.nodeName.startsWith("lc-panel-"))
					panelContainer.setAttribute(a.nodeName, a.nodeValue);
			}
			this.panel = new lc.ui.Panel(panelContainer, true, true);
			lc.ui.Popin.call(this, container, doNotConfigure, doNotBuild);
		},{
			componentName: "lc-dialog",
			
			configure: function() {
				this.panel.performConfiguration();
				
				// when the panel is destroyed, the dialog should be destroyed
				lc.events.listen(this.panel.container, "destroy", new lc.async.Callback(this, function() {
					this.destroy();
				}));
				
				lc.ui.Popin.prototype.configure.call(this);
			},
			
			build: function() {
				// move content into the panel
				while (this.container.childNodes.length > 0)
					this.panel.container.appendChild(this.container.removeChild(this.container.childNodes[0]));
				
				// put the panel inside the pop-in
				this.container.appendChild(this.panel.container);

				this.panel.performBuild();
				lc.ui.Popin.prototype.build.call(this);
			},
			
			close: function() {
				this.destroy();
			},
			
			destroy: function() {
				if (!this.panel) return;
				this.panel.destroy();
				this.panel = null;
				lc.ui.Popin.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Dialog);
	
	lc.ui.Dialog.load = function(url, fromElement) {
		var future = new lc.async.Future();
		var u = fromElement ? lc.ui.navigation.resolveUrl(fromElement, url) : url;
		lc.resources.html(u).onsuccess(function (html) {
			var div = document.createElement("DIV");
			lc.ui.navigation.setUrl(div, u);
			div.innerHTML = html;
			var dialogs = div.getElementsByTagName("LC-DIALOG");
			if (dialogs.length != 1) {
				lc.log.error("lc.ui.Dialog", "" + dialogs.length + " dialog(s) found in " + u);
				return;
			}
			var dialog = dialogs[0];
			lc.html.processor.process(div).onsuccess(function() {
				future.success(lc.ui.Component.get(dialog));
			});
		});
		return future;
	};
});
