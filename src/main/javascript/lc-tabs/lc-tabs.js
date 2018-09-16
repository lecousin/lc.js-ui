// load from template
// static
// load from url

// can be changed from hash
// from history
// links to change a view

lc.app.onDefined("lc.ui.Component", function() {

	lc.core.extendClass("lc.ui.Tabs", [lc.ui.Component],
		function(container, doNotConfigure, doNotBuild){
			this.menu = new lc.ui.Menu(document.createElement("DIV"), true, true);
			this.view = new lc.ui.View(document.createElement("DIV"), true, true);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		},{
			componentName: "lc-tabs",
			
			configure: function() {
				// TODO
				this.menu.performConfiguration();
				this.menu.applyStyle("tab-folder");
				this.view.performConfiguration();
			},
			
			build: function() {
				this.menu.performBuild();
				this.view.performBuild();

				while (this.container.childNodes.length > 0) {
					var node = this.container.removeChild(this.container.childNodes[0]);
					if (node.nodeType == 1) {
						if (node.nodeName == "TAB") {
							this.createTabFromElement(node);
							continue;
						}
						lc.log.warn("lc.ui.Tabs", "Unexpected element " + node.nodeName + " in a lc-tabs");
					}
					lc.events.destroyed(node);
				}
				
				this.container.appendChild(this.menu.container);
				this.container.appendChild(this.view.container);
				
				// if nothing selected, select the first one
				if (this.menu.getSelection().length == 0 && this.menu.getNbItems() > 0)
					this.menu.selectItem(this.menu.getItemAt(0));
			},
			
			createTabFromElement: function(element) {
				var item, page;
				while (element.childNodes.length > 0) {
					var node = element.removeChild(element.childNodes[0]);
					if (node.nodeType == 1) {
						if (node.nodeName == "HEADER") {
							if (item) {
								lc.log.error("lc.ui.Tabs", "Several header elements in a tab");
								continue;
							}
							item = this.menu.buildItem(node);
							continue;
						} else if (node.nodeName == "VIEW") {
							if (page) {
								lc.log.error("lc.ui.Tabs", "Several view elements in a tab");
								continue;
							}
							page = this.view.createPageFromElement(node);
							continue;
						} else {
							lc.log.warn("lc.ui.Tabs", "Unexpected element " + node.nodeName + " in a tab");
						}
					}
					lc.events.destroyed(node);
				}
				if (!item) {
					lc.log.error("lc.ui.Tabs", "Missing header element in a tab");
					if (page) this.view.removePage(page);
					return;
				}
				if (!page) {
					lc.log.error("lc.ui.Tabs", "Missing view element in a tab");
					this.menu.removeItem(item);
					return;
				}
				item.on("selectedChanged", new lc.async.Callback(this, function(item, page) {
					if (!item.selected) return;
					this.view.showPage(page);
				}, [item, page]));
			},
			
			destroy: function() {
				this.menu.destroy();
				this.menu = null;
				this.view.destroy();
				this.view = null;
				lc.ui.Component.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Tabs);
});
