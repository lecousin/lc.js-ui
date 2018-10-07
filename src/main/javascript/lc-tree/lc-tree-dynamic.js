lc.app.onDefined("lc.ui.Tree", function() {
	
	lc.core.extendClass("lc.ui.Tree.Dynamic", lc.ui.Tree.Extension, function() {}, {
		
		init: function(tree) {
			this.tree = tree;
			tree.setDynamicProvider = function(provider) {
				this.getExtension(lc.ui.Tree.Dynamic).setProvider(provider);
			};
			
			this.provider = null;
			this.alwaysRefresh = true;
		},
		
		postBuild: function(tree) {
			if (tree.container.hasAttribute("lc-tree-dynamic-provider")) {
				var provider = lc.Context.expression.evaluate(tree.container.getAttribute("lc-tree-dynamic-provider"), tree.container, tree.container);
				if (lc.core.instanceOf(provider, lc.ui.Tree.Dynamic.Provider))
					this.setProvider(provider);
				else
					lc.log.error("lc-tree-dynamic","Invalid provider: "+tree.container.getAttribute("lc-tree-dynamic-provider"));
			}
		},
		
		setProvider: function(provider) {
			this.provider = provider;
			this.provider.init(this.tree, this);
			this.refreshRoot();
		},
		
		refreshRoot: function() {
			// remove any previous content
			this.tree.removeAllItems();
			// load
			var loader = new lc.ui.Loader(document.createElement("DIV"), false, true);
			loader.template = "roller";
			loader.size = 16;
			loader.performBuild();
			this.tree.container.appendChild(loader.container);
			this.provider.getRootItems(this.tree, new lc.async.Callback(this, function(items) {
				loader.destroy();
				for (var i = 0; i < items.length; ++i) {
					var item = items[i];
					this._buildDynamicItem(item);
					this.tree.addItem(item);
				}
			}));
		},
		
		refresh: function(item) {
			// TODO
		},
		
		_buildDynamicItem: function(item) {
			if (item.leaf) return;
			lc.css.addClass(item.element, "has-children");
			item._dyn_expand = item.expand;
			item.expand = function() {
				if (this.isExpanded()) return;
				lc.css.removeClass(this.element, "has-children");
				var loader = new lc.ui.Loader(document.createElement("DIV"), false, true);
				loader.template = "roller";
				loader.size = 14;
				this.collapserDiv.appendChild(loader.container);
				loader.performBuild();
				var dynTree = this.getTree().getExtension(lc.ui.Tree.Dynamic);
				
				var id = lc.core.generateId();
				this.loadId = id;
				this.removeAllItems();
				dynTree.provider.getChildren(this, id, new lc.async.Callback(this, function(loadId, children) {
					if (id != this.loadId) {
						return; // a new loading request has been made
					}
					for (var i = 0; i < children.length; ++i) {
						var child = children[i];
						dynTree._buildDynamicItem(child);
						this.addItem(child);
					}
					loader.destroy();
					lc.css.addClass(this.element, "has-children");
					this._dyn_expand();
				}));
			};
		},
		
		destroy: function(tree) {
			// TODO restore items as non dynamic
			this.tree.setDynamicProvider = null;
			this.tree = null;
			this.provider = null;
		}
		
	});
	
	lc.core.createClass("lc.ui.Tree.Dynamic.Provider", function() {}, {
		init: function(tree, dynamicTree) {},
		getRootItems: function(tree, callback) {
			lc.async.Callback.callListeners(callback, [[]]);
		},
		getChildren: function(item, loadId, callback) {
			lc.async.Callback.callListeners(callback, [loadId, []]);
		}
	});
	
});