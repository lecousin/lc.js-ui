lc.core.namespace("lc.ui.style", {
	
	_componentStyles: [],
	_themes: [],
	
	registerComponentStyle: function(componentClass, styleName, requiredTheme) {
		lc.ui.style._componentStyles.push({ componentClass: componentClass, styleName: styleName, requiredTheme: requiredTheme });
	},
	
	registerTheme: function(themeName) {
		lc.ui.style._themes.push(themeName);
	},
	
	_getClass: function(element, start) {
		var list = lc.css.getClasses(element);
		for (var i = 0; i < list.length; ++i)
			if (list[i].startsWith(start))
				return list[i].substring(start.length);
		return null;
	},
	
	getThemes: function() {
		return lc.ui.style._themes.slice();
	},
	
	getGlobalTheme: function() {
		return lc.ui.style.getAppliedTheme(document.body);
	},
	
	setGlobalTheme: function(name) {
		lc.ui.style.applyTheme(document.body, name);
	},
	
	removeGlobalTheme: function() {
		lc.ui.style.removeAppliedTheme(document.body);
	},
	
	getActiveTheme: function(element) {
		do {
			var theme = lc.ui.style.getAppliedTheme(element);
			if (theme) return theme;
			if (element == document.body || !element.parentNode) return null;
			element = element.parentNode;
		} while (true);
	},
	
	getAppliedTheme: function(element) {
		return lc.ui.style._getClass(element, "lc-theme-");
	},
	
	applyTheme: function(element, themeName) {
		lc.ui.style.removeAppliedTheme(element);
		lc.css.addClass(element, "lc-theme-" + themeName);
	},
	
	removeAppliedTheme: function(element) {
		do {
			var theme = lc.ui.style.getAppliedTheme(element);
			if (!theme) return;
			lc.css.removeClass(element, "lc-theme-" + theme);
		} while (true);
	},
	
	getAvailableStyles: function(component) {
		var theme = lc.ui.style.getActiveTheme(component.container);
		var list = [];
		for (var i = 0; i < lc.ui.style._componentStyles.length; ++i) {
			var s = lc.ui.style._componentStyles[i];
			if (component.constructor == s.componentClass || lc.core.isExtending(component.constructor, s.componentClass))
				if (!s.requiredTheme || s.requiredTheme == theme)
					list.push(s.styleName);
		}
		return list;
	},
	
	getActiveStyle: function(component) {
		var element = component.container;
		do {
			var style = lc.ui.style.getAppliedStyle(element);
			if (style) return style;
			if (element == document.body || !element.parentNode) return null;
			element = element.parentNode;
		} while (true);
	},
	
	getAppliedStyle: function(component) {
		return lc.ui.style._getClass(component.container, component.componentName + "-style-");
	},
	
	applyStyle: function(component, styleName) {
		lc.ui.style.removeAppliedStyle(component);
		lc.css.addClass(component.container, component.componentName + "-style-" + styleName);
	},
	
	removeAppliedStyle: function(component) {
		do {
			var style = lc.ui.style.getAppliedStyle(component);
			if (!style) return;
			lc.css.removeClass(component.container, component.componentName + "-style-" + style);
		} while (true);
	}
	
});