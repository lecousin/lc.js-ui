lc.app.onDefined(["lc.ui.Component", "lc.ui.Choice"], function() {
	
	lc.core.extendClass("lc.ui.Menu", [lc.ui.Component, lc.ui.Choice], 
		function(container, doNotConfigure, doNotBuild) {
			lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
			lc.ui.Choice.call(this, this.container, true);
		}, {
			componentName: "lc-menu",
			
			configure: function() {
				this.on("elementAdded", new lc.async.Callback(this, this._createElement));
			},
			
			build: function() {
				this.buildGroupContent(this.container, this);
			},
			
			buildElement: function(node, parent) {
				var element;
				if (node.nodeType != 1 || node.hasAttribute("not-item"))
					element = node;
				else if (node.hasAttribute("item-group"))
					element = this.buildGroup(node, parent);
				else
					element = this.buildItem(node, parent);
				return element;
			},
			
			buildGroup: function(node, parent) {
				var group = new lc.ui.Choice.Group(document.createElement("DIV"), parent);
				this.buildGroupContent(node, group);
				return group;
			},
			
			buildGroupContent: function(node, group) {
				var content = [];
				while (node.childNodes.length > 0) content.push(node.removeChild(node.childNodes[0]));
				for (var i = 0; i < content.length; ++i) {
					if (content[i].nodeType == 1 && content[i].nodeName == "TITLE") {
						var div = document.createElement("DIV");
						while (content[i].childNodes.length > 0) div.appendChild(content[i].childNodes[0]);
						group.title = div;
					} else
						group.addElement(this.buildElement(content[i], group));
				}
			},
			
			buildItem: function(node, parent) {
				var value = node.getAttribute("value");
				var item = new lc.ui.Choice.Item(parent, value, node);
				return item;
			},
			
			_createElement: function(element, group) {
				var elem = this.createHTMLFromElement(element, group);
				var index = group.indexOfElement(element);
				if (index >= group.element.childNodes.length)
					group.element.appendChild(elem);
				else
					group.element.insertBefore(elem, group.element.childNodes[index]);
			},
			
			createHTMLFromElement: function(element, group) {
				if (lc.core.instanceOf(element, lc.ui.Choice.Group))
					return this.createHTMLFromGroup(element, group);
				if (lc.core.instanceOf(element, lc.ui.Choice.Item))
					return this.createHTMLFromItem(element, group);
				return this.createHTMLFromHTML(element, group);
			},
			
			createHTMLFromGroup: function(group, parent) {
				var div = document.createElement("DIV");
				div.className = "lc-menu-group";
				if (group.title) {
					lc.css.addClass(group.title, "lc-menu-group-title");
					div.appendChild(group.title);
				}
				lc.css.addClass(group.element, "lc-menu-group-content");
				div.appendChild(group.element);
				return div;
			},
			
			createHTMLFromItem: function(item, group) {
				lc.css.addClass(item.element, "lc-menu-item");
				return item.element;
			},
			
			createHTMLFromHTML: function(html, group) {
				if (html.nodeType == 1) {
					lc.css.addClass(html, "lc-menu-not-item");
				}
				return html;
			},
			
			destroy: function() {
				// TODO
				lc.ui.Component.prototype.destroy.call(this);
				lc.ui.Choice.prototype.destroy.call(this);
			}
		}
	);
	
	lc.ui.Component.Registry.register(lc.ui.Menu);
	
	lc.core.extendClass("lc.ui.Menu.Extension", lc.ui.Component.Extension, function() {}, {
		// TODO
	});
});
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
lc.core.createClass("lc.ui.Choice.Group",
	function(element, parent) {
		this.element = element;
		Object.defineProperty(this, "parent", { value: parent, writable: false });
		this._elements = [];
	}, {
		element: null,
		parent: null,
		title: null,
		_elements: null,
		
		getItem: function(value) {
			for (var i = 0; i < this._elements.length; ++i) {
				if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Item)) {
					if (this._elements[i].value == value)
						return this._elements[i];
				} else if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Group)) {
					var item = this._elements[i].getItem(value);
					if (item) return item;
				}
			}
			return undefined;
		},
		
		getElements: function() {
			return this._element.slice();
		},
		
		indexOfElement: function(element) {
			return this._elements.indexOf(element);
		},
		
		getItems: function() {
			var items = [];
			this._getItems(items);
			return items;
		},
		
		_getItems: function(list) {
			for (var i = 0; i < this._elements.length; ++i) {
				if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Item)) {
					list.push(this._elements[i]);
				} else if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Group)) {
					this._elements[i]._getItems(list);
				}
			}
		},
		
		addElement: function(element, index) {
			if (typeof index != 'number' || index >= this._elements.length)
				this._elements.push(element);
			else
				this._elements.splice(index, 0, element);
			var p = this;
			do {
				if (lc.core.instanceOf(p, lc.ui.Choice)) {
					p._elementAdded(element, this);
					break;
				}
				p = p.parent;
			} while (p);
		},
		
		removeElement: function(element) {
			var i = this._elements.indexOf(element);
			if (i >= 0) {
				this._elements.splice(i, 1);
				return true;
				var p = this;
				do {
					if (lc.core.instanceOf(p, lc.ui.Choice)) {
						p._elementRemoved(element, this);
						break;
					}
					p = p.parent;
				} while (p);
				return true;
			} else {
				for (var i = 0; i < this._elements.length; ++i)
					if (lc.core.instanceOf(this._elements[i], lc.ui.Choice.Group)) {
						if (this._elements[i].removeElement(element))
							return true;
					}
				return false;
			}
		},
		
		destroy: function() {
			if (this._elements === null) return;
			for (var i = 0; i < this._elements.length; ++i)
				if (typeof this._elements[i]["destroy"] === 'function')
					this._elements[i].destroy();
			this._elements = null;
			this.parent = null;
		}
		
	}
);

lc.core.extendClass("lc.ui.Choice", [lc.ui.Choice.Group, lc.events.Producer],
	function(element, singleSelection) {
		lc.ui.Choice.Group.call(this, element, null);
		lc.events.Producer.call(this);
		this._singleSelection = singleSelection;
		this.registerEvents(["selectionChanged", "elementAdded", "elementRemoved", "itemAdded", "itemRemoved"]);
		this._selection = [];
	}, {
		_selection: null,
		_singleSelection: false,
		
		_select: function(item) {
			if (!item) return false;
			if (item.selected) return false;
			if (this._singleSelection)
				while (this._selection.length > 0)
					this.unselectItem(this._selection[0]);
			this._selection.push(item);
			lc.css.addClass(item.element, "selected");
			// TODO
			item.trigger("selectionChanged", item);
			return true;
		},
		
		selectItem: function(item) {
			var changed;
			if (changed = this._selectItem(item))
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		selectValue: function(value) {
			return this.selectItem(this.getItem(value));
		},

		_selectValue: function(value) {
			return this._selectItem(this.getItem(value));
		},
		
		selectItems: function(items) {
			var changed = false;
			for (var i = 0; i < items.length; ++i)
				changed |= this._selectItem(items[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		selectValues: function(values) {
			var changed = false;
			for (var i = 0; i < values.length; ++i)
				changed |= this._selectValue(values[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		selectAll: function() {
			if (this._singleSelection)
				throw new Error("Cannot call selectAll on single selection choice");
			return this.selectItems(this.getItems());
		},
		
		_unselectItem: function(item) {
			if (!item) return false;
			if (!item.selected) return false;
			var i = this._selection.indexOf(item);
			if (i < 0) return false;
			this._selection.splice(i, 1);
			lc.css.removeClass(item.element, "selected");
			// TODO
			item.trigger("selectionChanged", item);
			return true;
		},
		
		unselectItem: function(item) {
			var changed;
			if (changed = this._unselectItem(item))
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		_unselectValue: function(value) {
			return this._unselectItem(this.getItem(value));
		},
		
		unselectValue: function(value) {
			return this.unselectItem(this.getItem(value));
		},
		
		unselectItems: function(items) {
			var changed = false;
			for (var i = 0; i < items.length; ++i)
				changed |= this._unselectItem(items[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		unselectValues: function(values) {
			var changed = false;
			for (var i = 0; i < values.length; ++i)
				changed |= this._unselectValue(values[i]);
			if (changed)
				this.trigger("selectionChanged", this);
			return changed;
		},
		
		unselectAll: function() {
			return this.unselectItems(this.getItems());
		},
		
		isSelected: function(item) {
			return this._selection.indexOf(item) >= 0;
		},
		
		getSelection: function() {
			return this._selection.slice();
		},
		
		_elementAdded: function(element, group) {
			var items = [];
			if (lc.core.instanceOf(element, lc.ui.Choice.Group)) {
				element._getItems(items);
			} else if (lc.core.instanceOf(element, lc.ui.Choice.Item)) {
				items.push(element);
			}
			for (var i = 0; i < items.length; ++i)
				items[i]._choice = this;
			this.trigger("elementAdded", [element, group]);
			for (var i = 0; i < items.length; ++i)
				this.trigger("itemAdded", [items[i], group]);
		},
		
		_elementRemoved: function(element, group) {
			var items = [];
			if (lc.core.instanceOf(element, lc.ui.Choice.Group)) {
				element._getItems(items);
			} else if (lc.core.instanceOf(element, lc.ui.Choice.Item)) {
				items.push(element);
			}
			this.unselectItems(items);
			this.trigger("elementRemoved", [element, group]);
			for (var i = 0; i < items.length; ++i)
				this.trigger("itemRemoved", [items[i], group]);
		},
		
		destroy: function() {
			lc.ui.Choice.Group.prototype.destroy.call(this);
			lc.events.Producer.prototype.destroy.call(this);
			this._selection = null;
		}
		
	}
);

lc.core.extendClass("lc.ui.Choice.Item", [lc.events.Producer],
	function(group, value, element) {
		lc.events.Producer.call(this);
		this.group = group;
		if (typeof element === 'string') element = document.createTextNode(element);
		this.element = element;
		this._choice = null;
		Object.defineProperty(this, "value", { value: value, writable: false });
		Object.defineProperty(this, "selected", {
			get: function() { return this._choice ? this._choice.isSelected(this) : false; },
			set: function(value) {
				if (!this._choice) throw new Error("An item must be attached to a choice to be selected");
				if (value) this._choice.selectItem(this);
				else this._choice.unselectItem(this);
			}
		});
		this.registerEvents(["selectionChanged"]);
	}, {
		
		group: null,
		value: null,
		element: null,
		selected: false,
		
		destroy: function() {
			lc.events.Producer.prototype.destroy.call(this);
			if (this._choice) this._choice.removeElement(this);
			this._choice = null;
			if (this.element) lc.html.remove(this.element);
			this.element = null;
			delete this["value"];
		}
		
	}
);

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