lc.app.onDefined("lc.ui.Choice.Item", function() {
	
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
			
			$added: function() {
				if (this.itemElement.hasAttribute("disabled") && this.itemElement.getAttribute("disabled") != "false")
					this.disabled = true;
				else if (this.element.hasAttribute("disabled") && this.element.getAttribute("disabled") != "false")
					this.disabled = true;
				if (this.itemElement.hasAttribute("selected") && this.itemElement.getAttribute("selected") != "false")
					this.selected = true;
				else if (this.element.hasAttribute("selected") && this.element.getAttribute("selected") != "false")
					this.selected = true;
			},
			
			destroy: function() {
				lc.events.Producer.prototype.destroy.call(this);
				lc.ui.Choice.Item.prototype.destroy.call(this);
			}
		}
	);

});