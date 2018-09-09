lc.app.onDefined(["lc.ui.DropDown.Extension"], function() {
	lc.core.extendClass("lc.ui.DropDown.Multiple", [lc.ui.Menu.Extension, lc.Configurable],
		function() {
			var properties = {
				separator: {
					types: ["string","Node"],
					value: ", ",
					set: function(value, properties) {
						properties.separator.value = value;
						this.dropdown.$setContentFromSelection();
					}
				}
			};
			lc.Configurable.call(this, properties);
		}, {
			extensionName: "multiple",
			
			init: function(dropdown) {
				this.dropdown = dropdown;
				dropdown.menu.singleSelection = false;
				this._previousSetContentFromSelection = dropdown.$setContentFromSelection;
				dropdown.$setContentFromSelection = function() {
					var sel = this.menu.getSelection();
					lc.html.empty(this.container);
					if (sel.length == 0)
						this.container.appendChild(this.$emptySelection);
					else {
						var sep = this.getExtension(lc.ui.DropDown.Multiple).separator;
						var content = document.createElement("DIV");
						content.className = "lc-dropdown-multiple-content";
						for (var i = 0; i < sel.length; ++i) {
							var item = sel[i];
							var element = this.menu.getItemOriginalElement(item);
							if (element.hasAttribute("text"))
								element = document.createTextNode(element.getAttribute("text"));
							else
								element = element.cloneNode(true);
							if (i > 0) {
								if (typeof sep === "string") {
									var span = document.createElement("SPAN");
									span.appendChild(document.createTextNode(sep));
									span.className = "lc-dropdown-multiple-separator";
									content.appendChild(span);
								} else
									content.appendChild(sep.cloneNode(true));
							}
							content.appendChild(element);
						}
						this.container.appendChild(content);
					}
				};
				
				Object.defineProperty(dropdown, "values", {
					get: function() {
						var sel = this.menu.getSelection();
						var values = [];
						for (var i = 0; i < sel.length; ++i)
							values.push(this.getItemValue(sel[i]));
						return values;
					},
					set: function(values) {
						var items = this.menu.getItems();
						var sel = [];
						for (var i = 0; i < items.length; ++i)
							if (values.indexOf(this.getItemValue(items[i])) >= 0)
								sel.push(items[i]);
						this.menu.selectItems(sel);
					}
				});
			},
			
			destroy: function(dropdown) {
				this.dropdown = null;
				dropdown.menu.singleSelection = true;
				dropdown.$setContentFromSelection = this._previousSetContentFromSelection;
				delete dropdown["values"];
			}
		}
	);
	
	lc.Extension.Registry.register(lc.ui.DropDown, lc.ui.DropDown.Multiple);
});
