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