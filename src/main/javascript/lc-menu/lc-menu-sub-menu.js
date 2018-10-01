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
				
				menu.extensionOverridesMethod(this, "createItem", function(element) {
					if (element.hasAttribute("sub-menu"))
						element.setAttribute("not-selectable","true");
					return this.callPreviousImplementation(this.getExtension(lc.ui.Menu.SubMenu), "createItem", [element]);
				});
			},
			
			_handleSubMenu: function(menu, item) {
				if (item.subMenu) return;
				var element = item.itemElement;
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
				var items = menu.getItems();
				for (var i = 0; i < items.length; ++i) {
					var item = items[i];
					if (item.subMenu) {
						var element = item.itemElement;
						element.setAttribute("sub-menu", "");
						element.appendChild(item.subMenu.container);
						if (item._subMenuSelectionChanged)
							item.subMenu.unlisten("selectionChanged", item._subMenuSelectionChanged);
						item.subMenu.parentMenu = null;
						item.subMenu = null;
						if (item.subMenuPopin)
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
