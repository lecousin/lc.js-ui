lc.core.namespace("lc.ui.template", {
	
	_templates: [],
	
	addTemplate: function(name, element) {
		lc.ui.template._templates.push({
			name: name,
			html: element.innerHTML
		});
		var comment = document.createComment("lc-template: " + name);
		element.parentNode.insertBefore(comment, element);
		lc.html.remove(element);
		lc.events.listen(comment, "destroy", function() {
			lc.ui.template.removeTemplate(name);
		});
	},
	
	removeTemplate: function(name) {
		for (var i = 0; i < lc.ui.template._templates.length; ++i)
			if (lc.ui.template._templates[i].name == name) {
				lc.ui.template._templates.splice(i, 1);
				break;
			}
	},
	
	useTemplate: function(name, element) {
		var variables = {};
		for (var i = 0; i < element.childNodes.length; ++i) {
			var child = element.childNodes[i];
			if (child.nodeType != 1) continue;
			if (child.nodeName != "VARIABLE") continue;
			variables[child.getAttribute("name")] = child.innerHTML;
		}
		var t = null;
		for (var i = 0; i < lc.ui.template._templates.length; ++i)
			if (lc.ui.template._templates[i].name == name) {
				t = lc.ui.template._templates[i];
				break;
			}
		var div = document.createElement("DIV");
		element.parentNode.insertBefore(div, element);
		lc.html.remove(element);
		if (t) {
			var html = t.html;
			var i = 0;
			while ((i = html.indexOf("${", i)) >= 0) {
				var j = html.indexOf("}", i + 2);
				if (j < 0) break;
				html = html.substring(0, i) + variables[html.substring(i + 2, j).trim()] + html.substring(j + 1);
			}
			div.innerHTML = html;
			lc.html.processor.process(div);
		}
	}
	
});

lc.html.processor.addPreProcessor(function(element, elementStatus, globalStatus) {
	
	if (element.nodeType == 1) {
		
		if (element.nodeName == "LC-TEMPLATE") {
			lc.ui.template.addTemplate(element.getAttribute("name"), element);
			elementStatus.stop();
			return;
		}
		
		if (element.nodeName == "LC-TEMPLATE-USE") {
			lc.ui.template.useTemplate(element.getAttribute("name"), element);
			elementStatus.stop();
			return;
		}
		
	}
	
}, 10000);