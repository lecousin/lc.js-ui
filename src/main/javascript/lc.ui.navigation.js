lc.core.namespace("lc.ui.navigation", {
	
	_handlers: [],
	_handlersEvents: new lc.events.Producer(),
	
	_addHandler: function(handler) {
		lc.ui.navigation._handlers.push(handler);
		lc.ui.navigation._handlersEvents.trigger("handlerAdded", [handler]);
	},
	_removeHandler: function(handler) {
		lc.ui.navigation._handlers.remove(handler);
		lc.ui.navigation._handlersEvents.trigger("handlerRemoved", [handler]);
	},
	
	getHandlers: function() {
		return lc.ui.navigation._handlers.slice();
	},
	
	addHandlerListener: function(addListener, removeListener) {
		for (var i = 0; i < lc.ui.navigation._handlers.length; ++i)
			lc.async.Callback.callListeners(addListener, [lc.ui.navigation._handlers[i]]);
		lc.ui.navigation._handlersEvents.listen("handlerAdded", addListener);
		lc.ui.navigation._handlersEvents.listen("handlerRemoved", removeListener);
	},
	
	removeHandlerListener: function(addListener, removeListener) {
		lc.ui.navigation._handlersEvents.unlisten("handlerAdded", addListener);
		lc.ui.navigation._handlersEvents.unlisten("handlerRemoved", removeListener);
	},
	
	getHandler: function(fromElement) {
		return lc.Context.searchValue(fromElement, "NavigationHandler");
	},
	
	goTo: function(fromElement, page) {
		if (typeof fromElement === 'string') fromElement = document.getElementById(fromElement);
		var handler = lc.ui.navigation.getHandler(fromElement);
		handler.navigate(page);
	},
	
	getUrl: function(element) {
		var base = lc.Context.searchValue(element, "url");
		if (!base) base = new lc.URL("");
		return base;
	},
	
	setUrl: function(element, url) {
		lc.Context.get(element).setProperty("url", url);
	},
	
	resolveUrl: function(fromElement, url) {
		if (typeof url === 'string') url = new lc.URL(url, true);
		if (!url.isRelative()) return url;
		var base = lc.Context.searchValue(fromElement, "url");
		if (!base) base = new lc.URL("");
		var absolute = base.applyRelative(url);
		return absolute;
	},
	
	getPage: function(fromElement) {
		var handler = lc.ui.navigation.getHandler(fromElement);
		if (!handler) return null;
		return handler.getCurrentPage();
	},
	
});

lc.ui.navigation._handlersEvents.registerEvents(["handlerAdded", "handlerRemoved"]);

lc.core.extendClass("lc.ui.navigation.NavigationHandler", [lc.events.Producer], 
	function(element) {
		lc.events.Producer.call(this);
		this.registerEvents(["pageShown"]);
		this._nav_handler_element = element;
		lc.Context.get(element).setProperty("NavigationHandler", this);
		lc.ui.navigation._addHandler(this);
	}, {
		navigate: function(page) {
			throw new Error("navigate method must be implemented.");
		},
		getCurrentPage: function() {
			throw new Error("getCurrentPage method must be implemented.");
		},
		destroy: function() {
			if (!this._nav_handler_element) return;
			var ctx = lc.Context.get(this._nav_handler_element, true);
			if (ctx)
				ctx.removeProperty("NavigationHandler");
			this._nav_handler_element = null;
			lc.ui.navigation._removeHandler(this);
		}
	}
);
