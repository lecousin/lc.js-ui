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