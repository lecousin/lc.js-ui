lc.html.processor.addPreProcessor(function(element, elementStatus, globalStatus) {
	
	if (element.nodeType == 1) {
		
		if (element.hasAttribute("lc-if")) {
			var expression = element.getAttribute("lc-if");
			var value;
			try {
				value = lc.ui.expression.evaluate(expression, element, element);
			} catch (e) {
				lc.log.error("Invalid lc-if expression: " + expression, e);
			}
			if (!value) {
				element.parentNode.removeChild(element);
				elementStatus.stop();
				return;
			}
		}
		
		for (var attrIndex = 0; attrIndex < element.attributes.length; ++attrIndex) {
			var a = element.attributes.item(attrIndex);
			a.nodeValue = lc.ui.expression.resolve(a.nodeValue, element);
		}
		
		if (element.nodeName == "LC-REQUIRES") {
			var urls = [];
			// get urls from attributes
			if (element.hasAttribute("resource"))
				urls.push(element.getAttribute("resource"));
			if (element.hasAttribute("url"))
				urls.push(element.getAttribute("url"));
			if (element.hasAttribute("resources"))
				urls.pushAll(element.getAttribute("resources").split(/;/g));
			if (element.hasAttribute("urls"))
				urls.pushAll(element.getAttribute("urls").split(/;/g));
			// resolve urls
			for (var i = 0; i < urls.length; ++i)
				urls[i] = lc.ui.navigation.resolveUrl(element, urls[i]);
			var future = lc.resources.loadInParallel(urls);
			if (!future.isDone()) {
				elementStatus.interrupt();
				future.onsuccess(function() {
					elementStatus.resume();
				});
			}
		}
		
	}
	
}, 10000);
