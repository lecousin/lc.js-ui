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
		lc.ui.route.goTo(route);
	},
	
	updateHashFromRoute: function() {
		var route = lc.ui.route._searchCurrentRoute(lc.ui.route._routing);
		if (route) location.hash = "#" + route;
	},
	
	goTo: function(route) {
		var views = [];
		views = lc.ui.route._searchRoute(route, views, lc.ui.route._routing);
		if (!views) {
			lc.log.warn("lc.ui.route", "Route not found: " + route);
			return;
		}
		return lc.ui.route._applyViews(views);
	},
	
	_searchCurrentRoute: function(routing, parentView) {
		for (var viewName in routing) {
			var view = lc.ui.View.searchView(viewName, parentView);
			if (!view) continue;
			for (var i = 0; i < routing[viewName].length; ++i) {
				var page = routing[viewName][i];
				if (!lc.ui.route.isPageMatching(view.getCurrentPage(), page)) continue;
				if (page.route) return lc.ui.route.resolveRouteParameters(page.route, view.getCurrentPage());
				if (page.views) {
					var result = lc.ui.route._searchCurrentRoute(page.views, view);
					if (result) return result;
				}
			}
		}
		return null;
	},
	
	resolveRouteParameters: function(route, page) {
		if (!page.parameters) return route;
		for (var name in page.parameters)
			route = route.replace("{" + name + "}", page.parameters[name]);
		return route;
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
				// we may have parameters
				var params = route.route ? lc.ui.route.createParametersFromRoute(route.route, routeName) : null;
				if (params) {
					viewsPath.push({
						name: viewName,
						page: route,
						parameters: params
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
	
	createParametersFromRoute: function(originalRoute, routeWithParams) {
		var parts = [];
		var pos = 0;
		do {
			var i = originalRoute.indexOf('{', pos);
			if (i < 0) break;
			var j = originalRoute.indexOf('}', i + 1);
			if (j < 0) break;
			parts.push(originalRoute.substring(pos, i));
			parts.push(originalRoute.substring(i + 1, j));
			pos = j + 1;
		} while (pos < originalRoute.length);
		parts.push(originalRoute.substring(pos));
		
		if (parts.length < 2) return null; // no parameters
		
		pos = 0;
		var i = 0;
		var params = {};
		do {
			var fix = parts[i];
			if (parts.length == i + 1) {
				// final part
				if (routeWithParams.substring(pos) != fix)
					return null;
				break;
			}
			var name = parts[i + 1];
			if (routeWithParams.indexOf(fix, pos) != pos) return null;
			var nextFix = parts[i + 2];
			var j;
			if (nextFix.length == 0) {
				if (routeWithParams.indexOf('/', pos + fix.length) > 0)
					return null;
				j = routeWithParams.length;
			} else
				j = routeWithParams.indexOf(nextFix, pos + fix.length);
			if (j < 0) return null;
			params[name] = routeWithParams.substring(pos + fix.length, j);
			pos = j;
			i += 2;
		} while (pos < routeWithParams.length);
		return params;
	},
	
	_applyViews: function(views, parentView) {
		if (views.length == 0) return lc.async.Future.alreadySuccess();
		var view = views.shift();
		var v = lc.ui.View.searchView(view.name, parentView);
		if (!v) {
			lc.log.warn("lc.ui.route", "Unable to find view " + view.name);
			return lc.async.Future.alreadyError("Unable to find view " + view.name);
		}
		var future = lc.ui.route._applyPageToView(v, view.page, view.parameters);
		var result = new lc.async.Future();
		future.onsuccess(function() {
			lc.ui.route._applyViews(views, v).forwardTo(result);
		}).onerror(result);
		return result;
	},
	
	_applyPageToView: function(view, page, params) {
		var p = lc.core.copyDeep(page);
		if (params) {
			if (!p.parameters) p.parameters = {};
			for (var name in params) p.parameters[name] = params[name];
		}
		if (lc.ui.route.isPageMatching(view.getCurrentPage(), p)) {
			var future = new lc.async.Future();
			future.success();
			return future;
		}
		try {
			if (page.name)
				return view.showPage(page.name); // what about parameters ?
			return view.showPage(p);
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