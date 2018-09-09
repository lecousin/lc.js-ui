lc.app.onDefined(["lc.ui.Menu.Extension"], function() {
	lc.core.extendClass("lc.ui.Menu.Checkbox", [lc.ui.Menu.Extension],
		function() {
		}, {
			extensionName: "checkbox",
			priority: -5000, // very low so we can add the checkbox at the beginning
			
			init: function(menu) {
				var items = menu.getItems();
				for (var i = 0; i < items.length; ++i)
					this.beforeItemAdded(menu, items[i]);
			},
			
			beforeItemAdded: function(menu, item) {
				if (lc.core.instanceOf(item, lc.ui.Choice.Item.Selectable)) {
					var cb = document.createElement("INPUT");
					item._menu_checkbox = cb;
					cb.type = "checkbox";
					cb.checked = item.selected;
					cb.disabled = item.disabled;
					item.element.insertBefore(cb, item.element.childNodes[0]);
					cb.onchange = function() {
						item.selected = this.checked;
					};
					item.on("selectedChanged", function() {
						cb.checked = item.selected;
					});
					item.on("disabledChanged", function() {
						cb.disabled = item.disabled;
					});
				} else {
					var cb = document.createElement("INPUT");
					item._menu_checkbox = cb;
					cb.type = "checkbox";
					cb.style.opacity = "0";
					item.element.insertBefore(cb, item.element.childNodes[0]);
				}
			},
			
			destroy: function(menu) {
				var items = menu.getItems();
				for (var i = 0; i < items.length; ++i)
					if (items[i]._menu_checkbox) {
						lc.html.remove(items[i]._menu_checkbox);
						items[i]._menu_checkbox = null;
					}
			}
		}
	);
	
	lc.Extension.Registry.register(lc.ui.Menu, lc.ui.Menu.Checkbox);
});
