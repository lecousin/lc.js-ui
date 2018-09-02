lc.core.createClass("lc.ui.Choice.Group",
	function(element, parent) {
		this.element = element;
		Object.defineProperty(this, "parent", { value: parent, writable: false });
		this._elements = [];
	}, {
		element: null,
		parent: null,
		title: null,
		_elements: null,
		
		getItem: function(value) {
			for (var i = 0; i < this._elements.length; ++i) {
				if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Item)) {
					if (this._elements[i].value == value)
						return this._elements[i];
				} else if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Group)) {
					var item = this._elements[i].getItem(value);
					if (item) return item;
				}
			}
			return undefined;
		},
		
		getElements: function() {
			return this._element.slice();
		},
		
		indexOfElement: function(element) {
			return this._elements.indexOf(element);
		},
		
		getItems: function() {
			var items = [];
			this._getItems(items);
			return items;
		},
		
		_getItems: function(list) {
			for (var i = 0; i < this._elements.length; ++i) {
				if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Item)) {
					list.push(this._elements[i]);
				} else if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Group)) {
					this._elements[i]._getItems(list);
				}
			}
		},
		
		addElement: function(element, index) {
			if (typeof index != 'number' || index >= this._elements.length)
				this._elements.push(element);
			else
				this._elements.splice(index, 0, element);
			var p = this;
			do {
				if (lc.core.instanceOf(p, lc.ui.Choice)) {
					p._elementAdded(element, this);
					break;
				}
				p = p.parent;
			} while (p);
		},
		
		removeElement: function(element) {
			var i = this._elements.indexOf(element);
			if (i >= 0) {
				this._elements.splice(i, 1);
				return true;
				var p = this;
				do {
					if (lc.core.instanceOf(p, lc.ui.Choice)) {
						p._elementRemoved(element, this);
						break;
					}
					p = p.parent;
				} while (p);
				return true;
			} else {
				for (var i = 0; i < this._elements.length; ++i)
					if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Group)) {
						if (this._elements[i].removeElement(element))
							return true;
					}
				return false;
			}
		},
		
		destroy: function() {
			if (this._elements === null) return;
			for (var i = 0; i < this._elements.length; ++i)
				if (typeof this._elements[i]["destroy"] === 'function')
					this._elements[i].destroy();
			this._elements = null;
			this.parent = null;
		}
		
	}
);

lc.core.extendClass("lc.ui.Choice", [lc.ui.Choice.Group, lc.events.Producer],
	function(element, singleSelection) {
		lc.ui.Choice.Group.call(this, element, null);
		lc.events.Producer.call(this);
		this._singleSelection = singleSelection;
		this.registerEvents(["selectionChanged", "elementAdded", "elementRemoved", "itemAdded", "itemRemoved"]);
		this._selection = [];
	}, {
		_selection: null,
		_singleSelection: false,
		
		_select: function(item) {
			if (!item) return false;
			if (item.selected) return false;
			if (this._singleSelection)
				while (this._selection.length > 0)
					this.unselectItem(this._selection[0]);
			this._selection.push(item);
			lc.css.addClass(item.element, "selected");
			// TODO
			item.trigger("selectionChanged", item);
			return true;
		},
		
		selectItem: function(item) {
			var changed;
			if (changed = this._selectItem(item))
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		selectValue: function(value) {
			return this.selectItem(this.getItem(value));
		},

		_selectValue: function(value) {
			return this._selectItem(this.getItem(value));
		},
		
		selectItems: function(items) {
			var changed = false;
			for (var i = 0; i < items.length; ++i)
				changed |= this._selectItem(items[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		selectValues: function(values) {
			var changed = false;
			for (var i = 0; i < values.length; ++i)
				changed |= this._selectValue(values[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		selectAll: function() {
			if (this._singleSelection)
				throw new Error("Cannot call selectAll on single selection choice");
			return this.selectItems(this.getItems());
		},
		
		_unselectItem: function(item) {
			if (!item) return false;
			if (!item.selected) return false;
			var i = this._selection.indexOf(item);
			if (i < 0) return false;
			this._selection.splice(i, 1);
			lc.css.removeClass(item.element, "selected");
			// TODO
			item.trigger("selectionChanged", item);
			return true;
		},
		
		unselectItem: function(item) {
			var changed;
			if (changed = this._unselectItem(item))
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		_unselectValue: function(value) {
			return this._unselectItem(this.getItem(value));
		},
		
		unselectValue: function(value) {
			return this.unselectItem(this.getItem(value));
		},
		
		unselectItems: function(items) {
			var changed = false;
			for (var i = 0; i < items.length; ++i)
				changed |= this._unselectItem(items[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		unselectValues: function(values) {
			var changed = false;
			for (var i = 0; i < values.length; ++i)
				changed |= this._unselectValue(values[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		unselectAll: function() {
			return this.unselectItems(this.getItems());
		},
		
		isSelected: function(item) {
			return this._selection.indexOf(item) >= 0;
		},
		
		getSelection: function() {
			return this._selection.slice();
		},
		
		_elementAdded: function(element, group) {
			var items = [];
			if (lc.core.instanceOf(element, lc.ui.Choice.Group)) {
				element._getItems(items);
			} else if (lc.core.instanceOf(element, lc.ui.Choice.Item)) {
				items.push(element);
			}
			for (var i = 0; i < items.length; ++i)
				items[i]._choice = this;
			this.trigger("elementAdded", [element, group]);
			for (var i = 0; i < items.length; ++i)
				this.trigger("itemAdded", [items[i], group]);
		},
		
		_elementRemoved: function(element, group) {
			var items = [];
			if (lc.core.instanceOf(element, lc.ui.Choice.Group)) {
				element._getItems(items);
			} else if (lc.core.instanceOf(element, lc.ui.Choice.Item)) {
				items.push(element);
			}
			this.unselectItems(items);
			this.trigger("elementRemoved", [element, group]);
			for (var i = 0; i < items.length; ++i)
				this.trigger("itemRemoved", [items[i], group]);
		},
		
		destroy: function() {
			lc.ui.Choice.Group.prototype.destroy.call(this);
			lc.events.Producer.prototype.destroy.call(this);
			this._selection = null;
		}
		
	}
);

lc.core.extendClass("lc.ui.Choice.Item", [lc.events.Producer],
	function(group, value, element) {
		lc.events.Producer.call(this);
		this.group = group;
		if (typeof element === 'string') element = document.createTextNode(element);
		this.element = element;
		this._choice = null;
		Object.defineProperty(this, "value", { value: value, writable: false });
		Object.defineProperty(this, "selected", {
			get: function() { return this._choice ? this._choice.isSelected(this) : false; },
			set: function(value) {
				if (!this._choice) throw new Error("An item must be attached to a choice to be selected");
				if (value) this._choice.selectItem(this);
				else this._choice.unselectItem(this);
			}
		});
		this.registerEvents(["selectionChanged"]);
	}, {
		
		group: null,
		value: null,
		element: null,
		selected: false,
		
		destroy: function() {
			lc.events.Producer.prototype.destroy.call(this);
			if (this._choice) this._choice.removeElement(this);
			this._choice = null;
			if (this.element) lc.html.remove(this.element);
			this.element = null;
			delete this["value"];
		}
		
	}
);
