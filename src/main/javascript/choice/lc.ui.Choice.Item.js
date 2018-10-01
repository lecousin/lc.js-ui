lc.core.createClass("lc.ui.Choice.Item",
	function(parent, element) {
		// parent cannot be changed
		Object.defineProperty(this, "parent", {
			writable: false,
			value: parent
		});

		var c = this.getChoice();
		if (!c) throw new Error("lc.ui.Choice.Item must be created in the scope of a lc.ui.Choice (its parent or ancestor must be a Choice)");
		
		// the element is wrapped inside a DIV, such as it is easier for extensions to add things around it
		this.itemElement = element;
		this.element = document.createElement("DIV");
		lc.css.addClass(this.element, "lc-choice-item-wrapper");
		this.element.appendChild(element);
		lc.css.addClass(element, "lc-choice-item");
		
		lc.Context.get(this.element).addProperty("lc.ui.Choice.Item", this);
		
		parent.$childCreated(this);
		c.$itemCreated(this);
	}, {
		parent: null,
		element: null,
		itemElement: null,
		
		getChoice: function() {
			var p = this.parent;
			while (p != null && lc.core.instanceOf(p, lc.ui.Choice.ItemContainer)) {
				if (lc.core.instanceOf(p, lc.ui.Choice))
					return p;
				p = p.parent;
			}
			return null;
		},
		
		insertBefore: function(element, priority) {
			var next = this.itemElement;
			while (next.previousSibling && next.previousSibling.priority < priority)
				next = next.previousSibling;
			this.itemElement.parentNode.insertBefore(element, next);
			element.priority = priority;
		},
		
		$added: function() {
		},
		
		destroy: function() {
			if (this.parent) this.parent.removeItem(this);
			this.parent = null;
			if (this.element) lc.html.remove(this.element);
			this.element = null;
		}
	}
);
