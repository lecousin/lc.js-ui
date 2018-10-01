lc.core.extendClass("lc.ui.DynamicContentBuilder", [lc.events.Producer],
	function(container) {
		lc.events.Producer.call(this);
		this.registerEvents(["nodeAdded", "nodeRemoved"]);

		this.originalContainer = container;
		this.fakeContainer = document.createElement("DIV");
		while (container.childNodes.length > 0)
			this.fakeContainer.appendChild(container.childNodes[0]);
		
		this.observer = new MutationObserver(function(mutations, observer) {
			for (var i = 0; i < mutations.length; ++i) {
				var mutation = mutations[i];
				switch(mutation.type) {
				case 'childList':
					for (var j = 0; j < mutation.addedNodes.length; ++j)
						this._that.trigger("nodeAdded", [mutation.addedNodes[j]]);
					for (var j = 0; j < mutation.removedNodes.length; ++j)
						this._that.trigger("nodeRemoved", [mutation.removedNodes[j]]);
					break;
				}
			}
		});
		this.observer._that = this;
	}, {
		start: function() {
			for (var i = 0; i < this.fakeContainer.childNodes.length; ++i)
				this.trigger("nodeAdded", [this.fakeContainer.childNodes[i]]);
			this.observer.observe(this.fakeContainer, {
				childList: true
			});
		},
		
		destroy: function() {
			this.observer.disconnect()
			this.observer = null;
			this.originalContainer = null;
			lc.html.empty(this.fakeContainer);
			this.fakeContainer = null;
			lc.events.Producer.prototype.destroy.call(this);
		}
	}
);