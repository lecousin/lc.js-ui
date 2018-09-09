lc.app.onDefined(["lc.Extendable","lc.events.Producer","lc.Context"], function() {
	
	lc.core.extendClass("lc.ui.Component", [lc.Extendable, lc.events.Producer],
		function(container, doNotConfigure, doNotBuild) {
			if (!this.componentName)
				throw "lc.ui.Component must declare its componentName";
			if (typeof container === 'string') {
				this.container = document.getElementById(container);
				if (!this.container) throw "Cannot find lc.ui.Component container id '" + container + "' for component type " + this.componentName;
			} else if (!container)
				this.container = document.createElement("DIV");
			else
				this.container = container;

			lc.Context.get(this.container).addProperty("lc.ui.Component", this);

			lc.events.listen(this.container, 'destroy', new lc.async.Callback(this, this.destroy));
			lc.css.addClass(this.container, this.componentName);
			lc.Extendable.call(this);
			lc.events.Producer.call(this);
			
			this.registerEvents([
				"configured",
				"built"
			]);
			
			if (!doNotConfigure) {
				this.performConfiguration();
				if (!doNotBuild)
					this.performBuild();
			}

		}, {
			componentName: null,
			styles: null,
			
			_configured: false,
			
			configure: function() {
			},
			
			isConfigured: function() {
				return this._configured;
			},
			
			_built: false,
			
			build: function() {
			},
			
			isBuilt: function() {
				return this._built;
			},
			
			performConfiguration: function() {
				this.callExtensions("preConfigure", this);
				this.createListenersFromElement(this.container);
				this.configure();
				this._configured = true;
				this.callExtensions("postConfigure", this);
				this.trigger("configured", this);
			},
			
			performBuild: function() {
				this.callExtensions("preBuild", this);
				this.build();
				this._built = true;
				this.callExtensions("postBuild", this);
				this.trigger("built", this);
			},
			
			applyStyle: function(name) {
				var classes = lc.css.getClasses(this.container);
				for (var i = 0; i < classes.length; ++i)
					if (classes[i].startsWith(this.componentName + "-style-"))
						lc.css.removeClass(this.container, classes[i]);
				if (name)
					lc.css.addClass(this.container, this.componentName + "-style-" + name);
			},
			
			destroy: function() {
				if (this._destroyed) return;
				this._destroyed = true;
				this.callExtensions("destroyed", this);
				lc.Extendable.prototype.destroy.call(this);
				var ctx = lc.Context.get(this.container, true);
				if (ctx) ctx.removeProperty("lc.ui.Component");
				while (this.container.childNodes.length > 0) {
					var child = this.container.removeChild(this.container.childNodes[0]);
					if (child.nodeType == 1)
						lc.events.destroyed(child);
				}
				this.container = null;
				lc.events.Producer.prototype.destroy.call(this);
			}
			
		}
	);

	lc.core.namespace("lc.ui.Component.Registry", {
		components: [],
		_listeners: [],
		
		register: function(constructor) {
			if (!constructor.prototype.componentName)
				throw "Missing componentName";
			lc.ui.Component.Registry.components.push(constructor);
			lc.async.Callback.callListeners(lc.ui.Component.Registry._listeners, constructor);
		},
		
		onComponentRegistered: function(listener) {
			for (var i = 0; i < lc.ui.Component.Registry.components.length; ++i)
				lc.async.Callback.callListeners(listener, lc.ui.Component.Registry.components[i]);
			lc.ui.Component.Registry._listeners.push(listener);
		}
	});

	lc.core.extendClass("lc.ui.Component.Extension", lc.Extension, function() {}, {
		extensionName: null,
		
		detect: function(component) {
			return lc.css.hasClass(component.container, component.componentName + "-" + this.extensionName) ||
				component.container.hasAttribute(component.componentName + "-" + this.extensionName);
		},
		
		init: function(component) {
			lc.css.addClass(component.container, component.componentName + "-" + this.extensionName);
			if (component.isConfigured())
				this.postConfigure(component);
			if (component.isBuilt())
				this.postBuild(component);
		},

		preConfigure: function(component) {},
		postConfigure: function(component) {},
		preBuild: function(component) {},
		postBuild: function(component) {},
		destroyed: function(component) {
			lc.css.removeClass(component.container, component.componentName + "-" + this.extensionName);
		}
	});
	
	lc.ui.Component.preProcessComponent = function(element, elementStatus, globalStatus) {
		if (element.nodeType != 1) return;
		var ctx = lc.Context.get(element, true);
		if (ctx && ctx.hasProperty("lc.ui.Component")) return;
		var newElement = null;
		for (var i = 0; i < lc.ui.Component.Registry.components.length; ++i) {
			if (element.nodeName.toLowerCase() == lc.ui.Component.Registry.components[i].prototype.componentName.toLowerCase()) {
				lc.log.trace("lc.ui.Component", "pre-processing component from element " + element.nodeName);
				newElement = new lc.ui.Component.Registry.components[i](element, true, true).container;
				break;
			}
			if (lc.css.hasClass(element, lc.ui.Component.Registry.components[i].prototype.componentName.toLowerCase())) {
				lc.log.trace("lc.ui.Component", "pre-processing component from element having CSS class " + lc.ui.Component.Registry.components[i].prototype.componentName.toLowerCase());
				newElement = new lc.ui.Component.Registry.components[i](element, true, true).container;
				break;
			}
		}
		if (!newElement) return;
		lc.Context.get(element)["lc.ui.Component"].performConfiguration();
		// if the component replaced the element, we must resume the HTML processing with the new element
		if (newElement != element)
			for (var i = 0; i < newElement.childNodes.length; ++i)
				if (newElement.childNodes[i].nodeType == 1)
					lc.html.processor.process(newElement.childNodes[i]);
	};
	
	lc.ui.Component.postProcessComponent = function(element, elementStatus, globalStatus) {
		var ctx = lc.Context.get(element, true);
		var component = lc.Context.getValue(element, "lc.ui.Component");
		if (!component) return;
		component.performBuild();
	};
	
	lc.html.processor.addPreProcessor(lc.ui.Component.preProcessComponent, 1000);
	lc.html.processor.addPostProcessor(lc.ui.Component.postProcessComponent, 1000);
	
	lc.ui.Component.getInstances = function(type, element) {
		var list = [];
		if (!element) element = document.body;
		lc.ui.Component.getInstancesRecursive(type, element, list);
		return list;
	};
	
	lc.ui.Component.getInstancesRecursive = function(type, element, found) {
		var component = lc.Context.getValue(element, "lc.ui.Component");
		if (component && (!type || lc.core.instanceOf(component, type)))
			found.push(component);
		for (var i = 0; i < element.childNodes.length; ++i)
			lc.ui.Component.getInstancesRecursive(type, element.childNodes[i], found);
	};
	
});