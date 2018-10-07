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
			item.$added();
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
		
		removeAllItems: function() {
			while (this._items.length > 0) {
				this.removeItem(this._items[0]);
			}
		},
		
		getLeaves: function(list) {
			for (var i = 0; i < this._items.length; ++i) {
				if (lc.core.instanceOf(this._items[i], lc.ui.Choice.ItemContainer))
					this._items[i].getLeaves(list);
				else
					list.push(this._items[i]);
			}
		},
		
		getAllItems: function() {
			var list = [];
			this._getAllItems(list);
			return list;
		},
		
		_getAllItems: function(list) {
			for (var i = 0; i < this._items.length; ++i) {
				list.push(this._items[i]);
				if (lc.core.instanceOf(this._items[i], lc.ui.Choice.ItemContainer))
					this._items[i]._getAllItems(list);
			}
		},
		
		$childCreated: function(item) {
			// nothing by default
		},
		
		buildItem: function(element) {
			// by default, create a simple item
			var item = new lc.ui.Choice.Item(this, element);
			this.addItem(item);
		},
		
		destroy: function() {
			if (this._items === null) return;
			for (var i = 0; i < this._items.length; ++i)
				this._items[i].destroy();
			this._items = null;
			lc.events.Producer.prototype.destroy.call(this);
		}
	}
);
