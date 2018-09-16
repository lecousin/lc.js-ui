// load from template
// static
// load from url

// can be changed from hash
// from history
// links to change a view

lc.app.onDefined("lc.ui.Component", function() {

	lc.core.extendClass("lc.ui.View", [lc.ui.Component],
		function(container, doNotConfigure, doNotBuild){
			this._pages = [];
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		},{
			componentName: "lc-view",
			_pages: null,
			_currentPage: null,
			_currentHandler: null,
			
			configure: function() {
				this._loader = new lc.ui.Loader(document.createElement("DIV"));
				this._pageContainer = document.createElement("DIV");
				this._loader.container.style.display = "none";
			},
			
			build: function() {
				while (this.container.childNodes.length > 0) {
					var node = this.container.removeChild(this.container.childNodes[0]);
					if (node.nodeType == 1) {
						this.createPageFromElement(node);
						continue;
					}
					lc.events.destroyed(node);
				}
				this.container.appendChild(this._loader.container);
				this.container.appendChild(this._pageContainer);
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
				handler.initPageFromElement(page, element);
				this.addPage(page);
				return page;
			},

			addPage: function(page) {
				this._pages.push(page);
			},

			showPage: function(pageOrNameOrIndex, reloadIfCurrent) {
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
				if (page === this._currentPage && !reloadIfCurrent)
					return;
				// get handler
				var handler = lc.ui.View.TypeHandler.Registry.get(page.type);
				if (!handler)
					throw new Error("Unknown view page type: " + page.type);
				// load page
				if (!page.loading)
					page.loading = handler.load(page);
				// hide current page and show loading
				this._pageContainer.style.display = "none";
				this._loader.container.style.display = "";
				if (this._currentPage && this._currentHandler && !this._currentPage.loading.getError())
					this._currentHandler.hide(this._currentPage, this._pageContainer);
				this._currentPage = page;
				this._currentHandler = handler;
				page.loading.ondone(new lc.async.Callback(this, function() {
					this._pageContainer.style.display = "";
					this._loader.container.style.display = "none";
					if (this._currentPage.loading.getError()) {
						// TODO error
					} else {
						this._currentHandler.show(this._currentPage, this._pageContainer);
					}
				}));
			},
			
			destroy: function() {
				// TODO destroyPage
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
			
			initPage: function(page, attributes) {
				throw new Error("lc.ui.View.TypeHandler.initPage must be implemented on type " + this.type + ".")
			},
			
			initPageFromElement: function(page, element) {
				throw new Error("lc.ui.View.TypeHandler.initPageFromElement must be implemented on type " + this.type + ".")
			},
		
			load: function(page) {
				throw new Error("lc.ui.View.TypeHandler.load must be implemented on type " + this.type + ".")
			},
			
			show: function(page, container) {
				throw new Error("lc.ui.View.TypeHandler.show must be implemented on type " + this.type + ".")
			},
			
			hide: function(page, container) {
				throw new Error("lc.ui.View.TypeHandler.hide must be implemented on type " + this.type + ".")
			},
			
			destroyPage: function(page) {
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
});
