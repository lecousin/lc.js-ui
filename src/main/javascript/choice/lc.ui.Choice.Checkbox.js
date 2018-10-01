lc.app.onDefined(["lc.ui.Choice.Extension"], function() {
	lc.core.extendClass("lc.ui.Choice.Checkbox", [lc.ui.Choice.Extension],
		function() {
		}, {
			extensionName: "checkbox",
			priority: -5000, // very low so we can add the checkbox at the beginning
			
			init: function(choice) {
				var items = choice.getAllItems();
				for (var i = 0; i < items.length; ++i)
					this.beforeItemAdded(choice, items[i]);
			},
			
			beforeItemAdded: function(choice, item) {
				if (lc.core.instanceOf(item, lc.ui.Choice.Item.Selectable)) {
					var cb = document.createElement("INPUT");
					item._choice_checkbox = cb;
					cb.type = "checkbox";
					cb.checked = item.selected;
					cb.disabled = item.disabled;
					item.insertBefore(cb, 10000);
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
					item._choice_checkbox = cb;
					cb.type = "checkbox";
					cb.style.opacity = "0";
					item.insertBefore(cb, 10000);
				}
			},
			
			destroy: function(choice) {
				var items = choice.getAllItems();
				for (var i = 0; i < items.length; ++i)
					if (items[i]._choice_checkbox) {
						lc.html.remove(items[i]._choice_checkbox);
						items[i]._choice_checkbox = null;
					}
			}
		}
	);
	
	lc.Extension.Registry.register(lc.ui.Choice, lc.ui.Choice.Checkbox);
});
