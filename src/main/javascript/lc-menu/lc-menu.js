lc.app.onDefined(["lc.ui.Component", "lc.ui.Choice"], function() {
	
	lc.core.extendClass("lc.ui.Menu", [lc.ui.Component, lc.ui.Choice], 
		function(container, doNotConfigure, doNotBuild) {
			lc.ui.Choice.call(this, container, true);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
			this.styles = ["menu-bar", "tab-folder"];
		}, {
			componentName: "lc-menu",
			
			configure: function() {
				this.on("itemAdded", function(that, item) { that.$itemAdded(item); });
			},
			
			build: function() {
				this.buildFromContent(this.container);
			},
			
			buildItem: function(element) {
				if (element.nodeType != 1) return;
				var item = this.createItem(element);
				this.addItem(item);
			},
			
			createItem: function(element) {
				if (!element.hasAttribute("not-selectable"))
					return new lc.ui.Choice.Item.Selectable(this, element);
				return new lc.ui.Choice.Item(this, element);
			},
			
			$itemCreated: function(item) {
				var wrapper = document.createElement("DIV");
				wrapper.appendChild(item.element);
				wrapper._menu_item_element = item.element;
				lc.css.addClass(wrapper, "lc-menu-item-wrapper");
				lc.css.addClass(item.element, "lc-menu-item");
				item.element = wrapper;

				if (lc.core.instanceOf(item, lc.ui.Choice.Item.Selectable)) {
					if (wrapper._menu_item_element.hasAttribute("disabled") && wrapper._menu_item_element.getAttribute("disabled") != "false")
						item.disabled = true;
					if (wrapper._menu_item_element.hasAttribute("selected") && wrapper._menu_item_element.getAttribute("selected") != "false")
						item.selected = true;
				}
				this.callExtensions("itemCreated", this, item);
			},
			
			$itemAdded: function(item) {
				this.callExtensions("beforeItemAdded", this, item);
				var index = this.indexOf(item);
				if (index >= this.container.childNodes.length)
					this.container.appendChild(item.element);
				else
					this.container.insertBefore(item.element, this.getItemAt(index).element);
				this.callExtensions("afterItemAdded", this, item);
			},
			
			getItemOriginalElement: function(item) {
				if (item.element._menu_item_element)
					return item.element._menu_item_element;
				return item.element;
			},
			
			destroy: function() {
				lc.ui.Component.prototype.destroy.call(this);
				lc.ui.Choice.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Menu);
	
	lc.core.extendClass("lc.ui.Menu.Extension", lc.ui.Component.Extension, function() {}, {
		itemCreated: function(menu, item) {},
		beforeItemAdded: function(menu, item) {},
		afterItemAdded: function(menu, item) {}
	});
});