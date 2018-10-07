lc.app.onDefined(["lc.ui.Component"], function() {
	
	lc.core.extendClass("lc.ui.DropDown", [lc.ui.Component], 
		function(container, doNotConfigure, doNotBuild) {
			this.menu = new lc.ui.Menu(document.createElement("DIV"), true, true);
			this.popin = new lc.ui.Popin(document.createElement("DIV"), true, true);
			lc.css.addClass(this.popin.container, "lc-pop-in-contextual");
			this.popin.container.appendChild(this.menu.container);
			this.popin.addExtension(lc.ui.Popin.AutoHide);
			this.popin.addExtension(lc.ui.Popin.Attach);
			
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
			
			this._value = undefined;
			Object.defineProperty(this, "value", {
				get: function() {
					return this._value;
				},
				set: function(value) {
					this._value = value;
					if (value === undefined) {
						this.menu.unselectAll();
						return;
					}
					var items = this.menu.getItems();
					var item = null;
					for (var i = 0; i < items.length; ++i)
						if (this.getItemValue(items[i]) == value) {
							item = items[i];
							break;
						}
					if (item)
						this.menu.selectItem(item);
				}
			});
			
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-dropdown",
			value: null,
			$emptySelection: null,
			
			configure: function() {
				this.registerEvents(["selectionChanged", "change"]);
				// TODO if name attribute, create a hidden input with this select value
				
				this.popin.getExtension(lc.ui.Popin.AutoHide).ignoreClickOnElements.push(this.container);

				this._width = 20;
				this._height = 15;
				this.$emptySelection = document.createElement("DIV");
				this.$emptySelection.appendChild(document.createTextNode("x"));
				this.$emptySelection.style.color = "transparent";

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
				this.container.appendChild(this.popin.container); // attach the pop-in to us
				this.popin.performBuild();
				this._computeSize();
				this.$setContentFromSelection();
				if (this.container.childNodes.length > 0) {
					this.container.childNodes[0].style.minWidth = this._width + 'px';
					this.container.childNodes[0].style.minHeight = this._height + 'px';
				}
				if (this._value) this.value = this._value;
			},
			
			getItemValue: function(item) {
				if (typeof item.value !== 'undefined') return item.value;
				var e = item.itemElement;
				if (e.hasAttribute("value"))
					return e.getAttribute("value");
				if (typeof e["value"] !== 'undefined')
					return e.value;
				return undefined;
			},
			
			_menuItemSelected: function() {
				this.$setContentFromSelection();
				if (this.container.childNodes.length > 0) {
					this.container.childNodes[0].style.minWidth = this._width + 'px';
					this.container.childNodes[0].style.minHeight = this._height + 'px';
				}
				var sel = this.menu.getSelection();
				this._value = sel.length == 0 ? undefined : this.getItemValue(sel[0]);
				this.trigger("selectionChanged");
				this.trigger("change");
			},
			
			$setContentFromSelection: function() {
				var sel = this.menu.getSelection();
				var item = sel.length > 0 ? sel[0] : null;
				lc.html.empty(this.container);
				if (item) {
					var element = item.itemElement.cloneNode(true);
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
				if (this._value && this._value == this.getItemValue(item))
					item.selected = true;
			},
			
			_computeItemSize: function(item) {
				var e = item.itemElement.cloneNode(true);
				e.style.position = "fixed";
				e.style.top = "-10000px";
				e.style.left = "-10000px";
				document.body.appendChild(e);
				var r = e.getBoundingClientRect();
				item.element.__select_menu_item_width = r.width;
				item.element.__select_menu_item_height = r.height;
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
				if (this.menu == null) return;
				lc.ui.Component.prototype.destroy.call(this);
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