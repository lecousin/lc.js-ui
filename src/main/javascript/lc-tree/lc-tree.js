lc.app.onDefined(["lc.ui.Component", "lc.ui.Choice", "lc.ui.Choice.Item.Selectable", "lc.ui.Choice.ItemContainer"], function() {
	
	lc.core.extendClass("lc.ui.Tree", [lc.ui.Component, lc.ui.Choice],
		function(container, doNotConfigure, doNotBuild) {
			lc.ui.Choice.call(this, true);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: 'lc-tree',
			
			configure: function() {
				this.registerEvents(["itemExpanded", "itemCollapsed"]);
			},
			
			build: function() {
				var elements = [];
				while (this.container.childNodes.length > 0)
					elements.push(this.container.removeChild(this.container.childNodes[0]));
				
				for (var i = 0; i < elements.length; ++i) {
					if (elements[i].nodeType == 1) {
						if (elements[i].nodeName == "NODE") {
							var item = this.createItemFromElement(this, elements[i]);
							this.addItem(item);
							continue;
						}
					}
					lc.events.destroyed(elements[i]);
				}
			},
			
			createItemFromElement: function(parent, element) {
				var div = document.createElement("DIV");
				var item = new lc.ui.Tree.Item(parent, div);
				while (element.childNodes.length > 0) {
					var node = element.removeChild(element.childNodes[0]);
					if (node.nodeType == 1) {
						if (node.nodeName == "NODE") {
							var subItem = this.createItemFromElement(item, node);
							item.addItem(subItem);
							continue;
						}
					}
					div.appendChild(node);
				}
				return item;
			},
			
			$addItemElement: function(item) {
				var index = item.parent.indexOf(item);
				var container = item.parent === this ? this.container : item.parent.itemContent;
				if (index >= container.childNodes.length)
					container.appendChild(item.element);
				else
					container.insertBefore(item.element, item.parent.getItemAt(index).element);
				if (item.parent !== this)
					lc.css.addClass(item.parent.element, "has-children");
			},
			
			$itemRemoved: function(item) {
				if (item.parent !== this)
					if (item.parent.getNbItems() == 0)
						lc.css.removeClass(item.parent.element, "has-children");
				lc.ui.Choice.prototype.$itemRemoved.call(this, item);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Tree);
	
	lc.core.extendClass("lc.ui.Tree.Item", [lc.ui.Choice.Item.Selectable, lc.ui.Choice.ItemContainer],
		function(parent, element) {
			lc.ui.Choice.Item.Selectable.call(this, parent, element);
			
			this.itemTitleContainer = document.createElement("DIV");
			this.itemTitleContainer.className = "lc-tree-item-title-container";
			this.itemTitleContainer.appendChild(this.itemElement);
			this.element.appendChild(this.itemTitleContainer);
			
			this.collapserDiv = document.createElement("DIV");
			this.collapserDiv.className = "lc-tree-item-collapser";
			this.collapserDiv.priority = Number.MAX_VALUE;
			this.itemTitleContainer.insertBefore(this.collapserDiv, this.itemElement);
			
			this.itemContent = document.createElement("DIV");
			this.itemContent.className = "lc-tree-item-content";
			this.element.appendChild(this.itemContent);
			
			lc.css.addClass(this.element, "collapsed");
			
			lc.ui.Choice.ItemContainer.call(this);
			
			this.registerEvents(["expanded", "collapsed"]);
			
			this.on("itemAdded", function(that, item) { that.getTree().$itemAdded(item); });
			this.on("itemRemoved", function(that, item) { that.getTree().$itemRemoved(item); });
			lc.events.listen(this.collapserDiv, "click", new lc.async.Callback(this, function(event) {
				this.toggleExpanded();
				event.stopPropagation();
			}));
		}, {
			getTree: function() {
				return this.getChoice();
			},
			
			isExpanded: function() {
				return lc.css.hasClass(this.element, "expanded");
			},
			
			isCollapsed: function() {
				return !this.isExpanded();
			},
			
			expand: function() {
				if (this.isExpanded()) return;
				lc.css.removeClass(this.element, "collapsed");
				lc.css.addClass(this.element, "expanded");
				this.trigger("expanded", this);
				this.getTree().trigger("itemExpanded", this);
			},
			
			collapse: function() {
				if (this.isCollapsed()) return;
				lc.css.removeClass(this.element, "expanded");
				lc.css.addClass(this.element, "collapsed");
				this.trigger("collapsed", this);
				this.getTree().trigger("itemCollapsed", this);
			},
			
			toggleExpanded: function() {
				if (this.isCollapsed()) this.expand();
				else this.collapse();
			},
			
			toggleCollapsed: function() {
				this.toggleExpanded();
			},
			
			destroy: function() {
				lc.ui.Choice.Item.Selectable.prototype.destroy.call(this);
				lc.ui.Choice.ItemContainer.prototype.destroy.call(this);
				this.itemTitleContainer = null;
				this.collapserDiv = null;
				this.itemContent = null;
			}
		}
	);
	
	lc.core.extendClass("lc.ui.Tree.Extension", lc.ui.Component.Extension, function() {}, {
		itemRemoved: function(item) {}
	});

});
