lc.core.namespace("lc.ui.route", {
	
	// TODO use NavigationHandler instead of View
	
	_routing: {},
	
	setViewsRouting: function(routing) {
		lc.ui.route._routing = routing;
	},
	
	startFromHash: function() {
		lc.ui.route.navigateFromHash();
		lc.ui.route.updateHashFromRoute();
		lc.events.listen(window, "hashchange", lc.ui.route.navigateFromHash);
		lc.ui.navigation.addHandlerListener(function(handler) {
			handler.on("pageShown", function() {
				lc.ui.route.updateHashFromRoute();
			});
		}, function(handler) {
		});
	},
	
	navigateFromHash: function() {
		var route = location.hash;
		if (route.length <= 1) return;
		route = route.substring(1);
		var views = [];
		views = lc.ui.route._searchRoute(route, views, lc.ui.route._routing);
		if (!views) {
			lc.log.warn("lc.ui.route", "Route not found from hash: " + route);
			return;
		}
		lc.ui.route._applyViews(views);
	},
	
	updateHashFromRoute: function() {
		var route = lc.ui.route._searchCurrentRoute(lc.ui.route._routing);
		if (route) location.hash = "#" + route;
	},
	
	_searchCurrentRoute: function(routing, parentView) {
		for (var viewName in routing) {
			var view = lc.ui.View.searchView(viewName, parentView);
			if (!view) continue;
			for (var i = 0; i < routing[viewName].length; ++i) {
				var page = routing[viewName][i];
				if (!lc.ui.route.isPageMatching(page, view.getCurrentPage())) continue;
				if (page.route) return page.route;
				if (page.views) {
					var result = lc.ui.route._searchCurrentRoute(page.views, view);
					if (result) return result;
				}
			}
		}
		return null;
	},
	
	_searchRoute: function(routeName, viewsPath, routing) {
		for (var viewName in routing) {
			var routes = routing[viewName];
			for (var i = 0; i < routes.length; ++i) {
				var route = routes[i];
				if (route.route == routeName) {
					// we have it
					viewsPath.push({
						name: viewName,
						page: route
					});
					return viewsPath;
				}
				if (route.views) {
					var views = viewsPath.slice();
					views.push({
						name: viewName,
						page: route
					});
					var result = lc.ui.route._searchRoute(routeName, views, route.views);
					if (result) return result;
				}
			}
		}
		return null;
	},
	
	_applyViews: function(views, parentView) {
		if (views.length == 0) return;
		var view = views.shift();
		var v = lc.ui.View.searchView(view.name, parentView);
		if (!v) {
			lc.log.warn("lc.ui.route", "Unable to find view " + view.name);
			return;
		}
		var future = lc.ui.route._applyPageToView(v, view.page);
		future.onsuccess(function() {
			lc.ui.route._applyViews(views, v);
		});
	},
	
	_applyPageToView: function(view, page) {
		if (lc.ui.route.isPageMatching(page, view.getCurrentPage())) {
			var future = new lc.async.Future();
			future.success();
			return future;
		}
		try {
			if (page.name)
				return view.showPage(page.name);
			return view.showPage(page);
		} catch (error) {
			lc.log.error("lc.ui.route", "Unable to route to the correct page: " + error, error);
			var future = new lc.async.Future();
			future.error(error);
			return future;
		}
	},
	
	isPageMatching: function(page, pageDescr) {
		// if they have a name and its the same name, we consider as the same page
		if (pageDescr.name && pageDescr.name == page.name) return true;
		// they must have the same type
		if (page.type != pageDescr.type) return false;
		// they must have the same reference (depending on the type)
		var handler = lc.ui.View.TypeHandler.Registry.get(page.type);
		if (!handler) return false;
		if (!handler.isSamePageReference(page, pageDescr)) return false;
		// the parameters must be compatible
		if (!pageDescr.parameters) return true;
		if (!page.parameters) return false;
		for (var name in pageDescr.parameters) {
			if (typeof page.parameters[name] === undefined) return false;
			if (pageDescr.parameters[name] != page.parameters[name]) return false;
		}
		return true;
	}
	
});