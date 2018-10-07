lc.app.onDefined("lc.ui.View.TypeHandler", function() {
	
	lc.core.extendClass("lc.ui.View.TypeHandler.Static", [lc.ui.View.TypeHandler],
		function() {
			lc.ui.View.TypeHandler.call(this, "static");
		}, {
			initPage: function(view, page) {
				
			},
			
			initPageFromElement: function(view, page, element) {
				page.element = element;
				page.processed = false;
			},
			
			load: function(view, page) {
				var future = new lc.async.Future();
				future.success();
				return future;
			},
			
			show: function(view, page, container) {
				if (page.keepInstance)
					container.appendChild(page.element);
				else {
					page._clone = page.element.cloneNode(true);
					container.appendChild(page._clone);
					page.processed = false;
				}
				if (!page.processed) {
					lc.html.processor.process(page.element);
					page.processed = true;
				}
				return lc.async.Future.alreadySuccess();
			},
			
			hide: function(view, page, container) {
				if (page._clone) {
					page.processed = false;
					lc.html.remove(page._clone);
					page._clone = null;
				} else
					container.removeChild(page.element);
				return lc.async.Future.alreadySuccess();
			},
			
			isSamePageReference: function(page1, page2) {
				if (!page1.element || !page2.element) return false;
				return page1.element == page2.element;
			},
			
			destroyPage: function(view, page) {
				if (!page.element) return;
				if (page._clone) {
					lc.html.remove(page._clone);
					page._clone = null;
				}
				lc.events.destroyed(page.element);
				page.element = null;
			}
		}
	);
	
	lc.ui.View.TypeHandler.Registry.register(new lc.ui.View.TypeHandler.Static());
	
});