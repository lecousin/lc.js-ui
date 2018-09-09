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

lc.app.onDefined(["lc.ui.Component", "lc.ui.Choice"], function() {
	
	lc.core.extendClass("lc.ui.DropDown", [lc.ui.Component], 
		function(container, doNotConfigure, doNotBuild) {
			this.menu = new lc.ui.Menu(document.createElement("DIV"), true, true);
			this.popin = new lc.ui.Popin(document.createElement("DIV"));
			lc.css.addClass(this.popin.container, "lc-pop-in-contextual");
			this.popin.container.appendChild(this.menu.container);
			this.popin.addExtension(lc.ui.Popin.AutoHide);
			
			// transfer options/extensions to menu and pop-in
			for (var i = 0; i < container.attributes.length; ++i) {
				var a = container.attributes.item(i);
				if (a.nodeName.toLowerCase().startsWith("lc-menu-"))
					this.menu.container.setAttribute(a.nodeName, a.nodeValue);
				else if (a.nodeName.toLowerCase().startsWith("lc-pop-in-"))
					this.popin.container.setAttribute(a.nodeName, a.nodeValue);
			}
			var list = lc.css.getClasses(container);
			for (var i = 0; i < list.length; ++i) {
				var c = list[i];
				if (c.toLowerCase().startsWith("lc-menu-"))
					lc.css.addClass(this.menu.container, c);
				else if (c.toLowerCase().startsWith("lc-pop-in-"))
					lc.css.addClass(this.popin.container, c);
			}
			
			Object.defineProperty(this, "value", {
				get: function() {
					var sel = this.menu.getSelection();
					if (sel.length == 0) return undefined;
					return this.getItemValue(sel[0]);
				},
				set: function(value) {
					var items = this.menu.getItems();
					var item = null;
					for (var i = 0; i < items.length; ++i)
						if (this.getItemValue(items[i]) == value) {
							item = items[i];
							break;
						}
					if (!item)
						lc.log.warn("lc.ui.DropDown", "Set value to " + value + " but no item has this value. Ignored.");
					else
						this.menu.select(item);
				}
			});
			
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-dropdown",
			value: null,
			$emptySelection: null,
			
			configure: function() {
				this.registerEvents(["selectionChanged"]);
				// TODO if name attribute, create a hidden input with this select value
				
				this.popin.getExtension(lc.ui.Popin.AutoHide).ignoreClickOnElements.push(this.container);

				this._width = 20;
				this._height = 15;
				this.$emptySelection = document.createElement("DIV");

				this.menu.performConfiguration();
				this.popin.performConfiguration();
				
				this.popin.attachTo(this.container);
				this.popin.attachVertical = "bottom-start";
				this.popin.attachHorizontal = "left-start";
				this.popin.forceOrientation = false;
				
				lc.events.listen(this.container, "click", new lc.async.Callback(this, function() {
					this.popin.toggleShow();
				}));
				
				this.menu.on("selectionChanged", new lc.async.Callback(this, this._menuItemSelected));
				this.menu.on("itemAdded", new lc.async.Callback(this, this._menuItemAdded));
				this.menu.on("itemRemoved", new lc.async.Callback(this, this._computeSize));
				
				this.popin.on("show", new lc.async.Callback(this, function() { lc.css.addClass(this.container, "dropdown-open"); }));
				this.popin.on("hide", new lc.async.Callback(this, function() { lc.css.removeClass(this.container, "dropdown-open"); }));
			},
			
			build: function() {
				while (this.container.childNodes.length > 0)
					this.menu.container.appendChild(this.container.childNodes[0]);
				this.menu.performBuild();
				this.popin.performBuild();
				this._computeSize();
				this._menuItemSelected();
			},
			
			getItemValue: function(item) {
				if (typeof item.value !== 'undefined') return item.value;
				var e = this.menu.getItemOriginalElement(item);
				if (e.hasAttribute("value"))
					return e.getAttribute("value");
				return undefined;
			},
			
			_menuItemSelected: function() {
				this.$setContentFromSelection();
				if (this.container.childNodes.length > 0) {
					this.container.childNodes[0].style.minWidth = this._width + 'px';
					this.container.childNodes[0].style.minHeight = this._height + 'px';
				}
				this.trigger("selectionChanged");
			},
			
			$setContentFromSelection: function() {
				var sel = this.menu.getSelection();
				var item = sel.length > 0 ? sel[0] : null;
				lc.html.empty(this.container);
				if (item) {
					var element = this.menu.getItemOriginalElement(item).cloneNode(true);
					this.container.appendChild(element);
					this.popin.hide();
				} else {
					this.container.appendChild(this.$emptySelection);
				}
			},
			
			_menuItemAdded: function(menu, item) {
				this._computeItemSize(item);
				if (item.element.__select_menu_item_width > this._width) this._width = item.element.__select_menu_item_width;
				if (item.element.__select_menu_item_height > this._height) this._height = item.element.__select_menu_item_height;
				if (this.container.childNodes.length > 0 && this.isBuilt()) {
					this.container.childNodes[0].style.minWidth = this._width + 'px';
					this.container.childNodes[0].style.minHeight = this._height + 'px';
				}
			},
			
			_computeItemSize: function(item) {
				var e = this.menu.getItemOriginalElement(item).cloneNode(true);
				e.style.position = "fixed";
				e.style.top = "-10000px";
				e.style.left = "-10000px";
				document.body.appendChild(e);
				item.element.__select_menu_item_width = e.offsetWidth;
				item.element.__select_menu_item_height = e.offsetHeight;
				document.body.removeChild(e);
			},
			
			_computeSize: function() {
				var w = 20, h = 15;
				var items = this.menu.getItems();
				for (var i = 0; i < items.length; ++i) {
					if (typeof items[i].element.__select_menu_item_width === 'undefined')
						this._computeItemSize(items[i]);
					if (items[i].element.__select_menu_item_width > w) w = items[i].element.__select_menu_item_width;
					if (items[i].element.__select_menu_item_height > h) h = items[i].element.__select_menu_item_height;
				}
				this._width = w;
				this._height = h;
				if (this.container.childNodes.length > 0 && this.isBuilt()) {
					this.container.childNodes[0].style.minWidth = this._width + 'px';
					this.container.childNodes[0].style.minHeight = this._height + 'px';
				}
			},
						
			destroy: function() {
				lc.ui.Component.prototype.destroy.call(this);
				lc.ui.Choice.prototype.destroy.call(this);
				this.$emptySelection = null;
				this.menu.destroy();
				this.menu = null;
				this.popin.destroy();
				this.popin = null;
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.DropDown);
	
	lc.core.extendClass("lc.ui.DropDown.Extension", lc.ui.Component.Extension, function() {}, {
	});
});
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

lc.app.onDefined(["lc.ui.Menu.Extension"], function() {
	lc.core.extendClass("lc.ui.Menu.SubMenu", [lc.ui.Menu.Extension],
		function() {
		}, {
			extensionName: "sub-menu",
			priority: -5000, // very low, so we can add the arrow at the end
			
			init: function(menu) {
				var items = menu.getItems();
				for (var i = 0; i < items.length; ++i)
					this.beforeItemAdded(menu, items[i]);
				
				this._previousCreateItem = menu.createItem;
				menu.createItem = function(element) {
					if (element.hasAttribute("sub-menu"))
						element.setAttribute("not-selectable","true");
					return this.getExtension(lc.ui.Menu.SubMenu)._previousCreateItem.call(this, element);
				};
			},
			
			_handleSubMenu: function(menu, item) {
				if (item.subMenu) return;
				var element = menu.getItemOriginalElement(item);
				if (!element.hasAttribute("sub-menu")) return;
				for (var i = 0; i < element.childNodes.length; ++i) {
					if (element.childNodes[i].nodeType != 1) continue;
					var ctx = lc.Context.get(element.childNodes[i], true);
					if (!ctx || typeof ctx['lc.ui.Component'] === 'undefined') continue;
					var comp = ctx['lc.ui.Component'];
					if (lc.core.instanceOf(comp, lc.ui.Menu)) {
						item.subMenu = comp;
						element.removeChild(element.childNodes[i]);
						break;
					}
				}
				if (!item.subMenu) return;
				item.subMenu.parentMenu = menu;
				lc.ui.Menu.SubMenu._itemSelected(menu); // cancel any pending selection on sub-menus
				lc.css.addClass(item.element, "clickable");
				lc.css.addClass(item.element, "lc-menu-sub-menu");
				lc.events.listen(item.element, "click", item._subMenuClick = new lc.async.Callback(item, function() {
					if (!this.subMenuPopin) {
						var div = document.createElement("DIV");
						div.appendChild(this.subMenu.container);
						div.className = "lc-pop-in-contextual";
						this.subMenuPopin = new lc.ui.Popin(div);
						this.subMenuPopin.attachTo(this.element);
						var s = getComputedStyle(this.subMenu.parentMenu.container);
						if (typeof s["flexDirection"] !== 'undefined' && s["flexDirection"] == "row") {
							this.subMenuPopin.attachVertical = "bottom-start";
							this.subMenuPopin.attachHorizontal = "left-start";
						} else {
							this.subMenuPopin.attachVertical = "top-start";
							this.subMenuPopin.attachHorizontal = "right-start";
						}
						this.subMenuPopin.addExtension(lc.ui.Popin.AutoHide).ignoreClickOnElements.push(this.element);
						this.subMenu.on("selectionChanged", item._subMenuSelectionChanged = new lc.async.Callback(this, function() {
							if (this.subMenu.getSelection().length > 0) {
								this.subMenuPopin.hide();
								lc.ui.Menu.SubMenu._itemSelected(this.subMenu);
							}
						}));
					}
					this.subMenuPopin.toggleShow();
				}));
			},
			
			itemCreated: function(menu, item) {
				this._handleSubMenu(menu, item);
			},
			
			beforeItemAdded: function(menu, item) {
				this._handleSubMenu(menu, item);
				// append arrow at the end
				var div = document.createElement("DIV");
				div.className = "lc-menu-sub-menu-arrow";
				item.element.appendChild(div);
			},
			
			destroy: function(menu) {
				menu.createItem = this._previousCreateItem;
				this._previousCreateItem = null;
				var items = menu.getItems();
				for (var i = 0; i < items.length; ++i) {
					var item = items[i];
					if (item.subMenu) {
						var element = menu.getItemOriginalElement(item);
						element.setAttribute("sub-menu", "");
						element.appendChild(item.subMenu.container);
						if (item._subMenuSelectionChanged)
							item.subMenu.unlisten("selectionChanged", item._subMenuSelectionChanged);
						item.subMenu.parentMenu = null;
						item.subMenu = null;
						item.subMenuPopin.destroy();
						item.subMenuPopin = null;
						lc.css.removeClass(item.element, "lc-menu-sub-menu");
						lc.css.removeClass(item.element, "clickable");
						lc.events.unlisten(item.element, "click", item._subMenuClick);
						item._subMenuClick = null;
					}
					for (var j = 0; j < item.element.childNodes.length; ++j)
						if (item.element.childNodes[j].nodeType == 1 && lc.css.hasClass(item.element.childNodes[j], "lc-menu-sub-menu-arrow")) {
							lc.html.remove(item.element.childNodes[j]);
							j--;
						}
				}
			}
		}
	);
	
	lc.Extension.Registry.register(lc.ui.Menu, lc.ui.Menu.SubMenu);
	
	lc.ui.Menu.SubMenu._itemSelected = function(menu) {
		var m = menu;
		while (m.parentMenu) m = m.parentMenu;
		var unselect = function(m) {
			if (m !== menu) m.unselectAll();
			var items = m.getItems();
			for (var i = 0; i < items.length; ++i)
				if (items[i].subMenu)
					unselect(items[i].subMenu);
		};
		unselect(m);
	}
});

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
			lc.html.remove(panel.collapseDiv);
			panel.collapseDiv = null;
			lc.ui.Component.Extension.call(this, panel);
		}
	});

	lc.Extension.Registry.register(lc.ui.Panel, lc.ui.Panel.Collapsible);
	
});
lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.Panel", lc.ui.Component, 
		function(container, doNotConfigure, doNotBuild) {
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-panel",
			
			configure: function() {
				this.header = document.createElement("DIV");
				this.header.className = "lc-panel-header";
				this.content = document.createElement("DIV");
				this.content.className = "lc-panel-content";
				
				this.titleDiv = document.createElement("DIV");
				this.titleDiv.className = "lc-panel-title";
				this.header.appendChild(this.titleDiv);
				this.leftDiv = document.createElement("DIV");
				this.leftDiv.className = "lc-panel-header-left";
				this.header.appendChild(this.leftDiv);
				this.rightDiv = document.createElement("DIV");
				this.rightDiv.className = "lc-panel-header-right";
				this.header.appendChild(this.rightDiv);
			},
			
			build: function() {
				while (this.container.childNodes.length > 0) {
					var e = this.container.removeChild(this.container.childNodes[0]);
					if (e.nodeType != 1) continue;
					if (e.nodeName == "TITLE") {
						while (e.childNodes.length > 0)
							this.titleDiv.appendChild(e.removeChild(e.childNodes[0]));
					} else if (e.nodeName == "CONTENT") {
						while (e.childNodes.length > 0)
							this.content.appendChild(e.removeChild(e.childNodes[0]));
					}
				}
				this.container.appendChild(this.header);
				this.container.appendChild(this.content);
			},
			
			destroy: function() {
				lc.events.destroyed(this.header);
				this.header = null;
				this.titleDiv = null;
				this.leftDiv = null;
				this.rightDiv = null;
				lc.events.destroyed(this.content);
				this.content = null;
				lc.ui.Component.prototype.destroy.call(this);
			}
			
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Panel);

	lc.core.extendClass("lc.ui.Panel.Extension", lc.ui.Component.Extension, function() {}, {
	});

});
lc.app.onDefined(["lc.ui.Popin.Extension"], function() {
	lc.core.extendClass("lc.ui.Popin.AutoHide", [lc.ui.Popin.Extension],
		function() {
			this.ignoreClickOnElements = [];
		}, {
			extensionName: "auto-hide",
			
			ignoreClickOnElements: null,
			
			init: function(popin) {
				this.popin = popin;
				this.onautohide = new lc.async.Callback(this, function(event) {
					var p = event.target;
					while (p != null && p != document.body && p.parentNode != p) {
						if (p == this.popin.container || this.ignoreClickOnElements.indexOf(p) >= 0)
							return;
						p = p.parentNode;
					}
					this.popin.hide();
				});
			},
			
			afterShow: function() {
				lc.events.listen(document.body, "click", this.onautohide, true);
			},
			
			afterHide: function() {
				lc.events.unlisten(document.body, "click", this.onautohide, true);
			},
			
			destroy: function() {
				lc.events.unlisten(document.body, "click", this.onautohide, true);
				this.onautohide = null;
				this.ignoreClickOnElements = null;
				this.popin = null;
			}
		}
	);
	
	lc.Extension.Registry.register(lc.ui.Popin, lc.ui.Popin.AutoHide);
});

lc.app.onDefined(["lc.ui.Component"], function() {
	
	lc.core.extendClass("lc.ui.Popin", [lc.ui.Component, lc.Configurable], 
		function(container, doNotConfigure, doNotBuild) {
			var properties = {
				attachVertical: {
					types: ["enum"],
					value: "bottom-start",
					enumValues: ["top-start", "top-end", "middle", "bottom-start", "bottom-end"],
					set: function(value, properties) {
						if (!value) return;
						if (value.toLowerCase() == 'top-start') value = 'top-start';
						else if (value.toLowerCase() == 'top-end') value = 'top-end';
						else if (value.toLowerCase() == 'middle') value = 'middle';
						else if (value.toLowerCase() == 'bottom-start') value = 'bottom-start';
						else if (value.toLowerCase() == 'bottom-end') value = 'bottom-end';
						else {
							lc.log.warn("lc.ui.Popin", "Unknown attachVertical value: " + value);
							return;
						}
						if (properties.attachVertical.value == value) return;
						properties.attachVertical.value = value;
						if (this.isShown()) this._computePosition();
					}
				},
				attachHorizontal: {
					types: ["enum"],
					value: "left-start",
					enumValues: ["left-start", "left-end", "center", "right-start", "right-end"],
					set: function(value, properties) {
						if (!value) return;
						if (value.toLowerCase() == 'left-start') value = 'left-start';
						else if (value.toLowerCase() == 'left-end') value = 'left-end';
						else if (value.toLowerCase() == 'center') value = 'center';
						else if (value.toLowerCase() == 'right-start') value = 'right-start';
						else if (value.toLowerCase() == 'right-end') value = 'right-end';
						else {
							lc.log.warn("lc.ui.Popin", "Unknown attachHorizontal value: " + value);
							return;
						}
						if (properties.attachHorizontal.value == value) return;
						properties.attachHorizontal.value = value;
						if (this.isShown()) this._computePosition();
					}
				},
				forceOrientation: {
					types: ["boolean"],
					value: false,
					set: function(value, properties) {
						if (typeof value !== 'boolean') return;
						if (properties.forceOrientation.value === value) return;
						properties.forceOrientation.value = value;
						if (this.isShown()) this._computePosition();
					}
				}
			};
			lc.Configurable.call(this, properties);
			
			this._attachment = null;
			this._shown = false;
			
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-pop-in",
			
			configure: function() {
				this.registerEvents(["show", "hide"]);
				this._recomputePosition = new lc.async.Callback(this, this._computePosition);
			},
			
			build: function() {
				document.body.appendChild(this.container);
				if (this.container.hasAttribute("attach-to")) {
					var elem = document.getElementById(this.container.getAttribute("attach-to"));
					if (elem)
						this.attachTo(elem);
					else
						lc.log.warn("lc.ui.Popin", "pop-in attached to element id '" + this.container.getAttribute("attach-to") + "' but it does not exist.");
				}
				if (this.container.hasAttribute("attach-orientation")) {
					var s = this.container.getAttribute("attach-orientation");
					var i = s.indexOf(',');
					if (i < 0)
						this.attachVertical = s.trim();
					else {
						var a = s.substring(0, i).trim();
						if (a.length > 0) this.attachVertical = a;
						a = s.substring(i + 1).trim();
						if (a.length > 0) this.attachHorizontal = a;
					}
				}
			},
			
			attachTo: function(element) {
				this._attachment = element;
			},
			
			show: function() {
				if (this._shown) return;
				var animation = lc.animation.animate(this.container);
				this.callExtensions("beforeShow");
				this._shown = true;
				this._computePosition();
				if (this._attachment) {
					lc.events.listen(window, 'resize', this._recomputePosition);
					lc.events.listen(window, 'scroll', this._recomputePosition);
					var p = this._attachment.parentNode;
					while (p && p != document.body) {
						lc.events.listen(p, 'scroll', this._recomputePosition);
						p = p.parentNode;
					}
				}
				this.callExtensions("afterShow", animation);
				this.trigger("show", animation);
			},
			
			showAttached: function(attachedTo, verticalAttachment, horizontalAttachment) {
				this.attachTo(attachedTo);
				this.setAttachmentOrientation(verticalAttachment, horizontalAttachment);
				this.show();
			},
			
			hide: function() {
				if (!this._shown) return;
				var animation = lc.animation.animateReverse(this.container);
				this.callExtensions("beforeHide");
				this._shown = false;
				animation.ondone(new lc.async.Callback(this, function() { this.container.style.display = "none"; }));
				if (this._attachment) {
					lc.events.unlisten(window, 'resize', this._recomputePosition);
					lc.events.unlisten(window, 'scroll', this._recomputePosition);
					var p = this._attachment.parentNode;
					while (p && p != document.body) {
						lc.events.unlisten(p, 'scroll', this._recomputePosition);
						p = p.parentNode;
					}
				}
				this.callExtensions("afterHide", animation);
				this.trigger("hide", animation);
			},
			
			isShown: function() {
				return this._shown;
			},
			
			isHidden: function() {
				return !this._shown;
			},
			
			toggleShow: function() {
				if (this.isShown()) this.hide();
				else this.show();
			},
			
			_computePosition: function() {
				this.container.style.maxHeight = "";
				this.container.style.overflowY = "";
				this.container.style.maxWidth = "";
				this.container.style.overflowX = "";
				this.container.style.display = "block";
				//this.container.style.position = "absolute";
				this.container.style.position = "fixed";

				// check max width and height
				if (this.container.offsetHeight > window.innerHeight * 0.9) {
					this.container.style.maxHeight = Math.floor(window.innerHeight * 0.9) + 'px';
					this.container.style.overflowY = "auto";
				}
				if (this.container.offsetWidth > window.innerWidth * 0.9) {
					this.container.style.maxWidth = Math.floor(window.innerWidth * 0.9) + 'px';
					this.container.style.overflowX = "auto";
				}
				
				var pos;
				if (this._attachment) {
					//pos = lc.layout.getAbsolutePosition(this._attachment);
					var rect = this._attachment.getBoundingClientRect();
					pos = { x: rect.left, y: rect.top };
					switch (this.attachVertical) {
					case "top-start": break;
					case "top-end": pos.y -= this.container.offsetHeight; break;
					case "bottom-start": pos.y += this._attachment.offsetHeight; break;
					case "bottom-end": pos.y += this._attachment.offsetHeight - this.container.offsetHeight; break;
					case "middle": pos.y += (this._attachment.offsetHeight / 2) - (this.container.offsetHeight / 2); break;
					}
					switch (this.attachHorizontal) {
					case "left-start": break;
					case "left-end": pos.x -= this.container.offsetWidth; break;
					case "right-start": pos.x += this._attachment.offsetWidth; break;
					case "right-end": pos.x += this._attachment.offsetWidth - this.container.offsetWidth; break;
					case "center": pos.x += (this._attachment.offsetWidth / 2) - (this.container.offsetWidth / 2); break;
					}
					if (!this.forceOrientation) {
						if (pos.y + this.container.offsetHeight > window.innerHeight) {
							if (window.innerHeight - pos.y >= 75) {
								this.container.style.maxHeight = (window.innerHeight - pos.y) + 'px';
								this.container.style.overflowY = "auto";
							} else {
								// force position on top
								pos.y = rect.top - this.container.offsetHeight;
							}
						}
						if (pos.y < 0) pos.y = 0;

						if (pos.x + this.container.offsetWidth > window.innerWidth) {
							if (window.innerWidth - pos.x >= 75) {
								this.container.style.maxWidth = (window.innerWidth - pos.x) + 'px';
								this.container.style.overflowX = "auto";
							} else {
								// force position on left
								pos.x = rect.left - this.container.offsetWidth;
							}
						}
						if (pos.x < 0) pos.x = 0;
					}
					
					lc.css.removeClass(this.container, "lc-animate-down");
					lc.css.removeClass(this.container, "lc-animate-up");
					lc.css.removeClass(this.container, "lc-animate-left");
					lc.css.removeClass(this.container, "lc-animate-right");
					if (pos.y <= rect.top) lc.css.addClass(this.container, "lc-animate-up");
					else lc.css.addClass(this.container, "lc-animate-down");
					if (pos.x <= rect.left) lc.css.addClass(this.container, "lc-animate-left");
					if (pos.x >= rect.left + this._attachment.offsetWidth) lc.css.addClass(this.container, "lc-animate-right");
				} else
					pos = { x: 0, y: 0 };
				this.container.style.top = pos.y + "px";
				this.container.style.left = pos.x + "px";
				this.callExtensions("afterPosition", pos);
			},
			
			destroy: function() {
				if (this._shown) this.hide();
				this._attachment = null;
				lc.ui.Component.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Popin);
	
	lc.core.extendClass("lc.ui.Popin.Extension", lc.ui.Component.Extension, function() {}, {
		beforeShow: function() {},
		afterShow: function(animation) {},
		beforeHide: function() {},
		afterHide: function(animation) {},
		afterPosition: function(position) {}
	});
});
lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.ProgressBar", [lc.ui.Component, lc.Configurable],
		function(container, doNotConfigure, doNotBuild) {
			var properties = {
				total: {
					types: ["integer"],
					value: 1,
					set: function(total, properties) {
						if (!total) total = 1;
						if (typeof total == 'string')
							total = parseInt(total);
						if (total <= 0) total = 1;
						properties.total.value = total;
						this.updateBar();
					}
				},
				position: {
					types: ["integer"],
					value: 0,
					set: function(pos, properties) {
						if (!pos) pos = 0;
						if (typeof pos == 'string')
							pos = parseInt(pos);
						properties.position.value = pos;
						this.updateBar();
					}
				},
				percentTextVisible: {
					types: ["boolean"],
					value: false,
					set: function(visible, properties) {
						properties.percentTextVisible.value = visible ? true : false;
						this.percentTextContainer.style.display = visible ? "" : "none";
					}
				},
				text: {
					types: ["string","Node"],
					value: "",
					set: function(text, properties) {
						if (!text) text = '';
						properties.text.value = text;
						if (typeof text == 'string')
							text = document.createTextNode(text);
						lc.html.empty(this.textContainer);
						this.textContainer.appendChild(text);
					}
				},
				subText: {
					types: ["string","Node"],
					value: "",
					set: function(text, properties) {
						if (!text) text = '';
						properties.subText.value = text;
						if (typeof text == 'string')
							text = document.createTextNode(text);
						lc.html.empty(this.subTextContainer);
						this.subTextContainer.appendChild(text);
					}
				}
			};
			lc.Configurable.call(this, properties);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-progress-bar",

			configure: function() {
				this.textContainer = document.createElement("DIV");
				this.textContainer.className = "progressText";
				this.barContainer = document.createElement("DIV");
				this.barContainer.className = "progressBarContainer";
				this.bar = document.createElement("DIV");
				this.bar.className = "progressBar";
				this.barContainer.appendChild(this.bar);
				this.subTextContainer = document.createElement("DIV");
				this.subTextContainer.className = "progressSubText";
				this.percentTextContainer = document.createElement("DIV");
				this.percentTextContainer.className = "progressPercentTextContainer";
				this.barContainer.appendChild(this.percentTextContainer);
				this.percentText = document.createElement("DIV");
				this.percentText.className = "progressPercentText";
				this.percentTextContainer.appendChild(this.percentText);
				if (this.container.hasAttribute("percent-text"))
					this.percentTextVisible = this.container.getAttribute("percent-text") == "true";
				this.percentTextContainer.style.display = this.percentTextVisible ? "" : "none";
			},
			
			build: function() {
				var a;
				a = this.container.getAttribute("text");
				if (a) this.text = a;
				a = this.container.getAttribute("subText");
				if (a) this.subText = a;
				a = this.container.getAttribute("total");
				if (a) this.total = a;
				a = this.container.getAttribute("position");
				if (a) this.position = a;
				this.container.appendChild(this.textContainer);
				this.container.appendChild(this.barContainer);
				this.container.appendChild(this.subTextContainer);
				this.updateBar();
			},
			
			updateBar: function() {
				this.bar.style.width = (this.position * 100 / this.total) + '%';
				var percent = Math.floor(this.position * 100 / this.total);
				this.percentText.innerHTML = percent + ' %';
			},
			
			destroy: function() {
				lc.UIComponent.prototype.destroy.call(this);
				this.textContainer = null;
				this.barContainer = null;
				this.bar = null;
				this.subTextContainer = null;
				this.percentTextContainer = null;
				this.percentText = null;
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.ProgressBar);

	lc.core.extendClass("lc.ui.ProgressBar.Extension", lc.ui.Component.Extension, function() {}, {
	});

});
lc.core.createClass("lc.ui.Choice.Item",
	function(parent, element) {
		Object.defineProperty(this, "parent", {
			writable: false,
			value: parent
		});
		this.element = element;
		var c = this.getChoice();
		if (!c) throw new Error("lc.ui.Choice.Item must be created in the scope of a lc.ui.Choice (its parent or ancestor must be a Choice)");
		parent.$childCreated(this);
		c.$itemCreated(this);
	}, {
		parent: null,
		element: null,
		
		getChoice: function() {
			var p = this.parent;
			while (p != null && lc.core.instanceOf(p, lc.ui.Choice.ItemContainer)) {
				if (lc.core.instanceOf(p, lc.ui.Choice))
					return p;
				p = p.parent;
			}
			return null;
		},
		
		destroy: function() {
			if (this.parent) this.parent.removeItem(this);
			this.parent = null;
			if (this.element) lc.html.remove(this.element);
			this.element = null;
		}
	}
);

lc.core.extendClass("lc.ui.Choice.Item.Selectable", [lc.ui.Choice.Item, lc.events.Producer],
	function(parent, element) {
		lc.events.Producer.call(this);
		
		Object.defineProperty(this, "selected", {
			get: function() {
				return this.getChoice().isSelected(this);
			},
			set: function(value) {
				if (value) this.getChoice().selectItem(this);
				else this.getChoice().unselectItem(this);
			}
		});

		var dis = false;
		Object.defineProperty(this, "disabled", {
			get: function() {
				return dis;
			},
			set: function(value) {
				if (value) {
					dis = true;
					this.getChoice().unselectItem(this);
					lc.css.addClass(this.element, "disabled");
					this.trigger("disabledChanged", this);
				} else {
					dis = false;
					lc.css.removeClass(this.element, "disabled");
					this.trigger("disabledChanged", this);
				}
			}
		});
		
		this.registerEvents(["selectedChanged", "disabledChanged"]);

		lc.ui.Choice.Item.call(this, parent, element);
		
		lc.css.addClass(this.element, "selectable");
		lc.events.listen(this.element, "click", new lc.async.Callback(this, function() {
			if (this.disabled) return;
			var c = this.getChoice();
			if (c) c.toggleSelection(this);
		}));
		this.createListenersFromElement(element);
	}, {
		selected: false,
		disabled: false,
		
		destroy: function() {
			lc.events.Producer.prototype.destroy.call(this);
			lc.ui.Choice.Item.prototype.destroy.call(this);
		}
	}
);

lc.core.extendClass("lc.ui.Choice.ItemContainer", [lc.events.Producer],
	function() {
		lc.events.Producer.call(this);
		this._items = [];
		this.registerEvents(["itemAdded", "itemRemoved"]);
	}, {
		_items: null,
		
		addItem: function(item, index) {
			if (typeof index != 'number' || index >= this._items.length)
				this._items.push(item);
			else
				this._items.splice(index, 0, item);
			this.trigger("itemAdded", [this, item]);
		},

		getItems: function() {
			return this._items.slice();
		},
		
		indexOf: function(item) {
			return this._items.indexOf(item);
		},
		
		getItemAt: function(index) {
			if (index < 0 || index >= this._items.length)
				return null;
			return this._items[index];
		},

		removeItem: function(item) {
			var i = this._items.indexOf(item);
			if (i < 0) return false;
			this._items.splice(i, 1);
			this.trigger("itemRemoved", [this, item]);
			item.parent = null;
			item.destroy();
			return true;
		},
		
		getLeaves: function(list) {
			for (var i = 0; i < this._items.length; ++i) {
				if (lc.core.instanceOf(this._items[i], lc.ui.Choice.ItemContainer))
					this._items[i].getLeaves(list);
				else
					list.push(this._items[i]);
			}
		},
		
		$childCreated: function(item) {
			// nothing by default
		},
		
		buildFromContent: function(container) {
			var content = [];
			while (container.childNodes.length > 0)
				content.push(container.removeChild(container.childNodes[0]));
			for (var i = 0; i < content.length; ++i)
				this.buildItem(content[i]);
		},
		
		buildItem: function(element) {
			// by default, create a simple item
			var item = new lc.ui.Choice.Item(this, element);
			this.addItem(item);
		},
		
		destroy: function() {
			if (this._items === null) return;
			lc.events.Producer.prototype.destroy.call(this);
			for (var i = 0; i < this._items.length; ++i)
				this._items[i].destroy();
			this._items = null;
		}
	}
);

lc.core.extendClass("lc.ui.Choice", [lc.ui.Choice.ItemContainer, lc.events.Producer],
	function(singleSelection) {
		lc.ui.Choice.ItemContainer.call(this);
		lc.events.Producer.call(this);
		this._singleSelection = singleSelection;
		this.registerEvents(["selectionChanged"]);
		this._selection = [];
		
		Object.defineProperty(this, "singleSelection", {
			get: function() { return this._singleSelection; },
			set: function(single) {
				if (this._singleSelection == single) return;
				this._singleSelection = single;
				if (single)
					while (this._selection.length > 1)
						this.unselect(this._selection[1]);
			}
		});
	}, {
		_selection: null,
		_singleSelection: false,
		
		_selectItem: function(item) {
			if (!item) return false;
			if (!lc.core.instanceOf(item, lc.ui.Choice.Item.Selectable)) return false;
			if (item.selected) return false;
			if (item.disabled) return false;
			if (this._singleSelection)
				while (this._selection.length > 0)
					this._unselectItem(this._selection[0]);
			this._selection.push(item);
			lc.css.addClass(item.element, "selected");
			item.trigger("selectedChanged", [this, item]);
			return true;
		},
		
		_unselectItem: function(item) {
			if (!item) return false;
			var i = this._selection.indexOf(item);
			if (i < 0) return false;
			this._selection.splice(i, 1);
			lc.css.removeClass(item.element, "selected");
			item.trigger("selectedChanged", [this, item]);
			return true;
		},
		
		selectItem: function(item) {
			var changed;
			if (changed = this._selectItem(item))
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		selectItems: function(items) {
			var changed = false;
			for (var i = 0; i < items.length; ++i)
				changed |= this._selectItem(items[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},

		selectAll: function() {
			if (this._singleSelection)
				throw new Error("Cannot call selectAll on single selection choice");
			return this.selectItems(this.getItems());
		},
		
		unselectItem: function(item) {
			var changed;
			if (changed = this._unselectItem(item))
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		unselectItems: function(items) {
			var changed = false;
			for (var i = 0; i < items.length; ++i)
				changed |= this._unselectItem(items[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},

		unselectAll: function() {
			return this.unselectItems(this.getItems());
		},
		
		toggleSelection: function(item) {
			if (this.isSelected(item))
				this.unselectItem(item);
			else
				this.selectItem(item);
		},
		
		isSelected: function(item) {
			return this._selection.indexOf(item) >= 0;
		},
		
		getSelection: function() {
			return this._selection.slice();
		},
		
		$itemCreated: function(item) {
			// nothing by default
		},
		
		destroy: function() {
			lc.ui.Choice.ItemContainer.prototype.destroy.call(this);
			lc.events.Producer.prototype.destroy.call(this);
			this._selection = null;
		}
		
	}
);

lc.app.onDefined(["lc.Extendable","lc.events.Producer","lc.Context"], function() {
	
	lc.core.extendClass("lc.ui.Component", [lc.Extendable, lc.events.Producer],
		function(container, doNotConfigure, doNotBuild) {
			if (!this.componentName)
				throw "lc.ui.Component must declare its componentName";
			if (typeof container === 'string') {
				this.container = document.getElementById(container);
				if (!this.container) throw "Cannot find lc.ui.Component container id '" + container + "' for component type " + this.componentName;
			} else if (!container)
				this.container = document.createElement("DIV");
			else
				this.container = container;

			lc.Context.get(this.container).addProperty("lc.ui.Component", this);

			lc.events.listen(this.container, 'destroy', new lc.async.Callback(this, this.destroy));
			lc.css.addClass(this.container, this.componentName);
			lc.Extendable.call(this);
			lc.events.Producer.call(this);
			
			this.registerEvents([
				"configured",
				"built"
			]);
			
			if (!doNotConfigure) {
				this.performConfiguration();
				if (!doNotBuild)
					this.performBuild();
			}

		}, {
			componentName: null,
			styles: null,
			
			_configured: false,
			
			configure: function() {
			},
			
			isConfigured: function() {
				return this._configured;
			},
			
			_built: false,
			
			build: function() {
			},
			
			isBuilt: function() {
				return this._built;
			},
			
			performConfiguration: function() {
				this.callExtensions("preConfigure", this);
				this.createListenersFromElement(this.container);
				this.configure();
				this._configured = true;
				this.callExtensions("postConfigure", this);
				this.trigger("configured", this);
			},
			
			performBuild: function() {
				this.callExtensions("preBuild", this);
				this.build();
				this._built = true;
				this.callExtensions("postBuild", this);
				this.trigger("built", this);
			},
			
			applyStyle: function(name) {
				var classes = lc.css.getClasses(this.container);
				for (var i = 0; i < classes.length; ++i)
					if (classes[i].startsWith(this.componentName + "-style-"))
						lc.css.removeClass(this.container, classes[i]);
				if (name)
					lc.css.addClass(this.container, this.componentName + "-style-" + name);
			},
			
			destroy: function() {
				if (this._destroyed) return;
				this._destroyed = true;
				this.callExtensions("destroyed", this);
				lc.Extendable.prototype.destroy.call(this);
				var ctx = lc.Context.get(this.container, true);
				if (ctx) ctx.removeProperty("lc.ui.Component");
				while (this.container.childNodes.length > 0) {
					var child = this.container.removeChild(this.container.childNodes[0]);
					if (child.nodeType == 1)
						lc.events.destroyed(child);
				}
				this.container = null;
				lc.events.Producer.prototype.destroy.call(this);
			}
			
		}
	);

	lc.core.namespace("lc.ui.Component.Registry", {
		components: [],
		_listeners: [],
		
		register: function(constructor) {
			if (!constructor.prototype.componentName)
				throw "Missing componentName";
			lc.ui.Component.Registry.components.push(constructor);
			lc.async.Callback.callListeners(lc.ui.Component.Registry._listeners, constructor);
		},
		
		onComponentRegistered: function(listener) {
			for (var i = 0; i < lc.ui.Component.Registry.components.length; ++i)
				lc.async.Callback.callListeners(listener, lc.ui.Component.Registry.components[i]);
			lc.ui.Component.Registry._listeners.push(listener);
		}
	});

	lc.core.extendClass("lc.ui.Component.Extension", lc.Extension, function() {}, {
		extensionName: null,
		
		detect: function(component) {
			return lc.css.hasClass(component.container, component.componentName + "-" + this.extensionName) ||
				component.container.hasAttribute(component.componentName + "-" + this.extensionName);
		},
		
		init: function(component) {
			lc.css.addClass(component.container, component.componentName + "-" + this.extensionName);
			if (component.isConfigured())
				this.postConfigure(component);
			if (component.isBuilt())
				this.postBuild(component);
		},

		preConfigure: function(component) {},
		postConfigure: function(component) {},
		preBuild: function(component) {},
		postBuild: function(component) {},
		destroyed: function(component) {
			lc.css.removeClass(component.container, component.componentName + "-" + this.extensionName);
		}
	});
	
	lc.ui.Component.preProcessComponent = function(element, elementStatus, globalStatus) {
		if (element.nodeType != 1) return;
		var ctx = lc.Context.get(element, true);
		if (ctx && ctx.hasProperty("lc.ui.Component")) return;
		var newElement = null;
		for (var i = 0; i < lc.ui.Component.Registry.components.length; ++i) {
			if (element.nodeName.toLowerCase() == lc.ui.Component.Registry.components[i].prototype.componentName.toLowerCase()) {
				lc.log.trace("lc.ui.Component", "pre-processing component from element " + element.nodeName);
				newElement = new lc.ui.Component.Registry.components[i](element, true, true).container;
				break;
			}
			if (lc.css.hasClass(element, lc.ui.Component.Registry.components[i].prototype.componentName.toLowerCase())) {
				lc.log.trace("lc.ui.Component", "pre-processing component from element having CSS class " + lc.ui.Component.Registry.components[i].prototype.componentName.toLowerCase());
				newElement = new lc.ui.Component.Registry.components[i](element, true, true).container;
				break;
			}
		}
		if (!newElement) return;
		lc.Context.get(element)["lc.ui.Component"].performConfiguration();
		// if the component replaced the element, we must resume the HTML processing with the new element
		if (newElement != element)
			for (var i = 0; i < newElement.childNodes.length; ++i)
				if (newElement.childNodes[i].nodeType == 1)
					lc.html.processor.process(newElement.childNodes[i]);
	};
	
	lc.ui.Component.postProcessComponent = function(element, elementStatus, globalStatus) {
		var ctx = lc.Context.get(element, true);
		var component = lc.Context.getValue(element, "lc.ui.Component");
		if (!component) return;
		component.performBuild();
	};
	
	lc.html.processor.addPreProcessor(lc.ui.Component.preProcessComponent, 1000);
	lc.html.processor.addPostProcessor(lc.ui.Component.postProcessComponent, 1000);
	
	lc.ui.Component.getInstances = function(type, element) {
		var list = [];
		if (!element) element = document.body;
		lc.ui.Component.getInstancesRecursive(type, element, list);
		return list;
	};
	
	lc.ui.Component.getInstancesRecursive = function(type, element, found) {
		var component = lc.Context.getValue(element, "lc.ui.Component");
		if (component && (!type || lc.core.instanceOf(component, type)))
			found.push(component);
		for (var i = 0; i < element.childNodes.length; ++i)
			lc.ui.Component.getInstancesRecursive(type, element.childNodes[i], found);
	};
	
});
//# sourceMappingURL=lc-ui.js.map