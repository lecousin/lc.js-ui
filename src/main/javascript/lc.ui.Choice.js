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
		lc.events.listen(this.element, "click", new lc.async.Callback(this, function(event) {
			if (this.disabled) return;
			var c = this.getChoice();
			if (c) c.toggleSelection(this);
			event.stopPropagation();
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
		
		getNbItems: function() {
			return this._items.length;
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
						this.unselectItem(this._selection[1]);
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
