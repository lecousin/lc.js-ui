lc.app.onDefined("lc.ui.Panel", function() {

	lc.core.extendClass("lc.ui.Panel.Closeable", lc.ui.Panel.Extension,
			function() {
	},{
		priority: -10000, // at the end to ensure the close button will be after other buttons
		extensionName: "closeable",

		postConfigure: function(panel) {
			panel.closeDiv = document.createElement("DIV");
			panel.closeDiv.className = "lc-panel-close";
		},
		
		postBuild: function(panel) {
			lc.events.listen(panel.closeDiv, "click", function() {
				lc.html.remove(panel.container);
			});
			panel.rightDiv.appendChild(panel.closeDiv);
		},
		
		destroy: function(panel) {
			if (!panel.closeDiv) return;
			lc.html.remove(panel.closeDiv);
			panel.closeDiv = null;
			lc.ui.Component.Extension.call(this, panel);
		}
	});
	
	lc.Extension.Registry.register(lc.ui.Panel, lc.ui.Panel.Closeable);
	
});
lc.app.onDefined("lc.ui.Panel", function() {

	lc.core.extendClass("lc.ui.Panel.Collapsible", lc.ui.Panel.Extension,
	function() {
	},{
		priority: -1000,
		extensionName: "collapsible",
		
		postConfigure: function(panel) {
			panel.collapseDiv = document.createElement("DIV");
			panel.collapseDiv.className = "lc-panel-collapse lc-panel-expanded";

			panel.collapse = function() {
				lc.animation.collapseHeight(this.content, 500).ondone(new lc.async.Callback(this, function() {
					this.content.style.height = "0px";
					this.content.style.paddingTop = "0px";
					this.content.style.paddingBottom = "0px";
					this.content.style.overflow = "hidden";
				}));
				lc.css.removeClass(this.collapseDiv, "lc-panel-expanded");
				lc.css.addClass(this.collapseDiv, "lc-panel-collapsed");
			};
			
			panel.expand = function() {
				this.content.style.height = "";
				this.content.style.paddingTop = "";
				this.content.style.paddingBottom = "";
				this.content.style.overflow = "";
				lc.animation.expandHeight(this.content, 500);
				lc.css.addClass(this.collapseDiv, "lc-panel-expanded");
				lc.css.removeClass(this.collapseDiv, "lc-panel-collapsed");
			};
			
			panel.toggleCollapsed = function() {
				if (this.isExpanded())
					this.collapse();
				else
					this.expand();
			};
			
			panel.isCollapsed = function() {
				return lc.css.hasClass(this.collapseDiv, "lc-panel-collapsed");
			};
			
			panel.isExpanded = function() {
				return !this.isCollapsed();
			};
		},
		
		postBuild: function(panel) {
			lc.events.listen(panel.collapseDiv, "click", new lc.async.Callback(panel, panel.toggleCollapsed));
			panel.rightDiv.appendChild(panel.collapseDiv);
		},
		
		destroy: function(panel) {
			if (!panel.collapseDiv) return;
			lc.html.remove(panel.collapseDiv);
			panel.collapseDiv = null;
			lc.ui.Component.Extension.call(this, panel);
		}
	});

	lc.Extension.Registry.register(lc.ui.Panel, lc.ui.Panel.Collapsible);
	
});
lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.Panel", lc.ui.Component, 
		function(container, doNotConfigure, doNotBuild) {
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-panel",
			
			configure: function() {
				this.header = document.createElement("DIV");
				this.header.className = "lc-panel-header";
				this.content = document.createElement("DIV");
				this.content.className = "lc-panel-content";
				
				this.titleDiv = document.createElement("DIV");
				this.titleDiv.className = "lc-panel-title";
				this.header.appendChild(this.titleDiv);
				this.leftDiv = document.createElement("DIV");
				this.leftDiv.className = "lc-panel-header-left";
				this.header.appendChild(this.leftDiv);
				this.rightDiv = document.createElement("DIV");
				this.rightDiv.className = "lc-panel-header-right";
				this.header.appendChild(this.rightDiv);
			},
			
			build: function() {
				while (this.container.childNodes.length > 0) {
					var e = this.container.removeChild(this.container.childNodes[0]);
					if (e.nodeType != 1) continue;
					if (e.nodeName == "TITLE") {
						while (e.childNodes.length > 0)
							this.titleDiv.appendChild(e.removeChild(e.childNodes[0]));
					} else if (e.nodeName == "CONTENT") {
						while (e.childNodes.length > 0)
							this.content.appendChild(e.removeChild(e.childNodes[0]));
					}
				}
				this.container.appendChild(this.header);
				this.container.appendChild(this.content);
			},
			
			destroy: function() {
				lc.events.destroyed(this.header);
				this.header = null;
				this.titleDiv = null;
				this.leftDiv = null;
				this.rightDiv = null;
				lc.events.destroyed(this.content);
				this.content = null;
				lc.ui.Component.prototype.destroy.call(this);
			}
			
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Panel);

	lc.core.extendClass("lc.ui.Panel.Extension", lc.ui.Component.Extension, function() {}, {
	});

});
lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.ProgressBar", [lc.ui.Component, lc.Configurable],
		function(container, doNotConfigure, doNotBuild) {
			var properties = {
				total: {
					types: ["integer"],
					value: 1,
					set: function(total, properties) {
						if (!total) total = 1;
						if (typeof total == 'string')
							total = parseInt(total);
						if (total <= 0) total = 1;
						properties.total.value = total;
						this.updateBar();
					}
				},
				position: {
					types: ["integer"],
					value: 0,
					set: function(pos, properties) {
						if (!pos) pos = 0;
						if (typeof pos == 'string')
							pos = parseInt(pos);
						properties.position.value = pos;
						this.updateBar();
					}
				},
				percentTextVisible: {
					types: ["boolean"],
					value: false,
					set: function(visible, properties) {
						properties.percentTextVisible.value = visible ? true : false;
						this.percentTextContainer.style.display = visible ? "" : "none";
					}
				},
				text: {
					types: ["string","Node"],
					value: "",
					set: function(text, properties) {
						if (!text) text = '';
						properties.text.value = text;
						if (typeof text == 'string')
							text = document.createTextNode(text);
						lc.html.empty(this.textContainer);
						this.textContainer.appendChild(text);
					}
				},
				subText: {
					types: ["string","Node"],
					value: "",
					set: function(text, properties) {
						if (!text) text = '';
						properties.subText.value = text;
						if (typeof text == 'string')
							text = document.createTextNode(text);
						lc.html.empty(this.subTextContainer);
						this.subTextContainer.appendChild(text);
					}
				}
			};
			lc.Configurable.call(this, properties);
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
		}, {
			componentName: "lc-progress-bar",

			configure: function() {
				this.textContainer = document.createElement("DIV");
				this.textContainer.className = "progressText";
				this.barContainer = document.createElement("DIV");
				this.barContainer.className = "progressBarContainer";
				this.bar = document.createElement("DIV");
				this.bar.className = "progressBar";
				this.barContainer.appendChild(this.bar);
				this.subTextContainer = document.createElement("DIV");
				this.subTextContainer.className = "progressSubText";
				this.percentTextContainer = document.createElement("DIV");
				this.percentTextContainer.className = "progressPercentTextContainer";
				this.barContainer.appendChild(this.percentTextContainer);
				this.percentText = document.createElement("DIV");
				this.percentText.className = "progressPercentText";
				this.percentTextContainer.appendChild(this.percentText);
				if (this.container.hasAttribute("percent-text"))
					this.percentTextVisible = this.container.getAttribute("percent-text") == "true";
				this.percentTextContainer.style.display = this.percentTextVisible ? "" : "none";
			},
			
			build: function() {
				var a;
				a = this.container.getAttribute("text");
				if (a) this.text = a;
				a = this.container.getAttribute("subText");
				if (a) this.subText = a;
				a = this.container.getAttribute("total");
				if (a) this.total = a;
				a = this.container.getAttribute("position");
				if (a) this.position = a;
				this.container.appendChild(this.textContainer);
				this.container.appendChild(this.barContainer);
				this.container.appendChild(this.subTextContainer);
				this.updateBar();
				// TODO listen to resize
			},
			
			updateBar: function() {
				this.bar.style.width = (this.position * (this.barContainer.clientWidth - this.bar.clientLeft*2) / this.total)+'px';
				var percent = Math.floor(this.position * 100 / this.total);
				this.percentText.innerHTML = percent + ' %';
			},
			
			destroy: function() {
				lc.UIComponent.prototype.destroy.call(this);
				this.textContainer = null;
				this.barContainer = null;
				this.bar = null;
				this.subTextContainer = null;
				this.percentTextContainer = null;
				this.percentText = null;
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.ProgressBar);

	lc.core.extendClass("lc.ui.ProgressBar.Extension", lc.ui.Component.Extension, function() {}, {
	});

});
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
//# sourceMappingURL=lc-ui.js.map