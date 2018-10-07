lc.app.onDefined(["lc.ui.Component", "lc.ui.Choice"], function() {
	
	lc.core.extendClass("lc.ui.Menu", [lc.ui.Component, lc.ui.Choice], 
		function(container, doNotConfigure, doNotBuild) {
			lc.ui.Choice.call(this, container, true);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-menu",
			
			configure: function() {
			},
			
			build: function() {
				this._dynContent = new lc.ui.DynamicContentBuilder(this.container);
				this._dynContent.on("nodeAdded", new lc.async.Callback(this, function(node) {
					var item = this.buildItem(node.cloneNode(true));
					if (item) node._item = item;
				}));
				this._dynContent.on("nodeRemoved", new lc.async.Callback(this, function(node) {
					if (!node._item) return;
					this.removeItem(node._item);
					node._item = null;
				}));
				this._dynContent.start();
			},
			
			buildItem: function(element) {
				if (element.nodeType != 1) return;
				var item = this.createItem(element);
				this.addItem(item);
				return item;
			},
			
			createItem: function(element) {
				if (!element.hasAttribute("not-selectable"))
					return new lc.ui.Choice.Item.Selectable(this, element);
				return new lc.ui.Choice.Item(this, element);
			},
			
			$addItemElement: function(item) {
				var index = this.indexOf(item);
				if (index >= this.container.childNodes.length)
					this.container.appendChild(item.element);
				else
					this.container.insertBefore(item.element, this.getItemAt(index).element);
			},
			
			destroy: function() {
				if (this._dynContent == null) return;
				this._dynContent.destroy();
				this._dynContent = null;
				lc.ui.Component.prototype.destroy.call(this);
				lc.ui.Choice.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Menu);
	
	lc.core.extendClass("lc.ui.Menu.Extension", [lc.ui.Component.Extension, lc.ui.Choice.Extension], function() {}, {
	});
	
	lc.app.onDefined("lc.ui.style", function() {
		lc.ui.style.registerComponentStyle(lc.ui.Menu, "menu-bar");
		lc.ui.style.registerComponentStyle(lc.ui.Menu, "tab-folder");
	});
});