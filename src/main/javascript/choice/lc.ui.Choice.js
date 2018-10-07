lc.app.onDefined("lc.ui.Choice.ItemContainer", function() {

	lc.core.extendClass("lc.ui.Choice", [lc.ui.Choice.ItemContainer, lc.events.Producer, lc.Extendable],
		function(singleSelection) {
			lc.ui.Choice.ItemContainer.call(this);
			lc.Extendable.call(this);
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
			
			this.on("itemAdded", function(that, item) { that.$itemAdded(item); });
			this.on("itemRemoved", function(that, item) { that.$itemRemoved(item); });
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
				this.callExtensions("itemCreated", this, item);
			},
			
			$itemAdded: function(item) {
				this.callExtensions("beforeItemAdded", this, item);
				this.$addItemElement(item);
				this.callExtensions("afterItemAdded", this, item);
			},
			
			$addItemElement: function(item) {
				// nothing by default, must be implemented
			},
			
			$itemRemoved: function(item) {
				this.callExtensions("itemRemoved", this, item);
			},
			
			destroy: function() {
				if (this._selection == null) return;
				lc.ui.Choice.ItemContainer.prototype.destroy.call(this);
				lc.events.Producer.prototype.destroy.call(this);
				this._selection = null;
			}
			
		}
	);
	
	lc.core.extendClass("lc.ui.Choice.Extension", lc.Extension, function() {}, {
		itemCreated: function(choice, item) {},
		beforeItemAdded: function(choice, item) {},
		afterItemAdded: function(choice, item) {},
		itemRemoved: function(choice, item) {}
	});
	
});
