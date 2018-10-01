// load from template
// static
// load from url

// can be changed from hash
// from history
// links to change a view

lc.app.onDefined("lc.ui.Component", function() {

	lc.core.extendClass("lc.ui.View", [lc.ui.Component, lc.ui.navigation.NavigationHandler],
		function(container, doNotConfigure, doNotBuild){
			this._pages = [];
			lc.ui.navigation.NavigationHandler.call(this, container);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		},{
			componentName: "lc-view",
			_pages: null,
			_currentPage: null,
			_pageShown: null,
			_pageShownHandler: null,
			
			configure: function() {
				this._loader = new lc.ui.Loader(document.createElement("DIV"));
				this._pageContainer = document.createElement("DIV");
				this._loader.container.style.display = "none";
			},
			
			build: function() {
				var selectedPage = null;
				while (this.container.childNodes.length > 0) {
					var node = this.container.removeChild(this.container.childNodes[0]);
					if (node.nodeType == 1) {
						var selected = node.hasAttribute("selected");
						var page = this.createPageFromElement(node);
						if (selected)
							selectedPage = page;
						continue;
					}
					lc.events.destroyed(node);
				}
				this.container.appendChild(this._loader.container);
				this.container.appendChild(this._pageContainer);
				if (!selectedPage && this._pages.length > 0)
					selectedPage = this._pages[0];
				if (selectedPage && !this._currentPage)
					this.showPage(selectedPage);
			},
			
			createPageFromElement: function(element) {
				var type = element.getAttribute("view-type");
				if (!type) type = "static";
				var handler = lc.ui.View.TypeHandler.Registry.get(type);
				if (!handler) {
					lc.log.warn("lc.ui.View", "Unknown view type: " + type);
					return;
				}
				var page = {
					type: type,
					name: element.getAttribute("view-name"),
					loading: null
				};
				handler.initPageFromElement(this, page, element);
				page.init = true;
				this.addPage(page);
				return page;
			},

			addPage: function(page) {
				this._pages.push(page);
			},

			showPage: function(pageOrNameOrIndex, reloadIfCurrent) {
				var future = new lc.async.Future();
				var page;
				if (typeof pageOrNameOrIndex === 'number')
					page = this._pages[pageOrNameOrIndex];
				else if (typeof pageOrNameOrIndex === 'string') {
					for (var i = 0; i < this._pages.length; ++i)
						if (this._pages[i].name == pageOrNameOrIndex) {
							page = this._pages[i];
							break;
						}
				} else
					page = pageOrNameOrIndex;
				if (typeof page === 'undefined')
					throw new Error("Unknown view page: " + pageOrNameOrIndex);
				// if same as current, do nothing
				if (page === this._currentPage && !reloadIfCurrent) {
					future.success();
					return future;
				}
				// get handler
				var handler = lc.ui.View.TypeHandler.Registry.get(page.type);
				if (!handler)
					throw new Error("Unknown view page type: " + page.type);
				// init page
				if (!page.init) {
					handler.initPage(this, page);
					page.init = true;
				}
				// load page
				if (!page.loading)
					page.loading = handler.load(this, page);
				// hide current page and show loading
				this._pageContainer.style.display = "none";
				this._loader.container.style.display = "";
				var hidePrevious;
				if (this._pageShown)
					hidePrevious = this._pageShownHandler.hide(this, this._pageShown, this._pageContainer);
				else
					hidePrevious = lc.async.Future.alreadySuccess();
				hidePrevious.ondone(new lc.async.Callback(this, function() {
					this._currentPage = page;
					page.loading.ondone(new lc.async.Callback(this, function() {
						if (this._currentPage != page) {
							// already another one
							// future.success();
							return;
						}
						this._pageContainer.style.display = "";
						this._loader.container.style.display = "none";
						if (page.loading.getError()) {
							// TODO show error
							future.error(page.loading.getError());
						} else {
							var show = handler.show(this, page, this._pageContainer);
							this._pageShown = page;
							this._pageShownHandler = handler;
							show.forwardTo(future);
							show.onsuccess(new lc.async.Callback(this, function() {
								this.trigger("pageShown", [this, page]);
							}));
						}
					}));
				}));
				return future;
			},
			
			navigate: function(page) {
				return this.showPage(page);
			},
			
			getCurrentPage: function() {
				return this._currentPage;
			},
			
			destroy: function() {
				// TODO destroyPage
				lc.ui.navigation.NavigationHandler.prototype.destroy.call(this);
				lc.ui.Component.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.View);

	lc.core.createClass("lc.ui.View.TypeHandler",
		function(type){
			this.type = type;
		},{
			type: null,
			
			initPage: function(view, page) {
				throw new Error("lc.ui.View.TypeHandler.initPage must be implemented on type " + this.type + ".")
			},
			
			initPageFromElement: function(view, page, element) {
				throw new Error("lc.ui.View.TypeHandler.initPageFromElement must be implemented on type " + this.type + ".")
			},
		
			load: function(view, page) {
				throw new Error("lc.ui.View.TypeHandler.load must be implemented on type " + this.type + ".")
			},
			
			show: function(view, page, container) {
				throw new Error("lc.ui.View.TypeHandler.show must be implemented on type " + this.type + ".")
			},
			
			hide: function(view, page, container) {
				throw new Error("lc.ui.View.TypeHandler.hide must be implemented on type " + this.type + ".")
			},
			
			isSamePageReference: function(page1, page2) {
				return false;
			},
			
			destroyPage: function(view, page) {
			}
			
		}
	);

	lc.ui.View.TypeHandler.Registry = {
		_types: {},
		
		register: function(handler) {
			lc.ui.View.TypeHandler.Registry._types[handler.type] = handler;
		},
		
		get: function(type) {
			if (typeof lc.ui.View.TypeHandler.Registry._types[type] === 'undefined')
				return null;
			return lc.ui.View.TypeHandler.Registry._types[type];
		}
	};
	
	lc.ui.View.searchView = function(viewName, parentView) {
		var byId = document.getElementById(viewName);
		if (byId != null) byId = lc.Context.getValue(byId, "lc.ui.Component");
		if (byId != null && !lc.core.instanceOf(byId, lc.ui.View)) byId = null;
		if (byId != null) {
			if (parentView == null) return byId;
			if (lc.xml.isAncestorOf(parentView.container, byId.container)) return byId;
		}
		return lc.ui.View._searchView(viewName, parentView ? parentView.container : document.body);
	};
	
	lc.ui.View._searchView = function(viewName, element) {
		for (var i = 0; i < element.childNodes.length; ++i) {
			var child = element.childNodes[i];
			if (child.nodeType != 1) continue;
			var component = lc.Context.getValue(child, "lc.ui.Component");
			if (component && lc.core.instanceOf(component, lc.ui.View) && component.name == viewName)
				return component;
			var view = lc.ui.View._searchView(viewName, child);
			if (view) return view;
		}
		return null;
	};
});
