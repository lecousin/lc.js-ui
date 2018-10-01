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
				container.appendChild(page.element);
				if (!page.processed) {
					lc.html.processor.process(page.element);
					page.processed = true;
				}
				return lc.async.Future.alreadySuccess();
			},
			
			hide: function(view, page, container) {
				container.removeChild(page.element);
				return lc.async.Future.alreadySuccess();
			},
			
			isSamePageReference: function(page1, page2) {
				if (!page1.element || !page2.element) return false;
				return page1.element == page2.element;
			},
			
			destroyPage: function(view, page) {
				lc.events.destroyed(page.element);
				page.element = null;
			}
		}
	);
	
	lc.ui.View.TypeHandler.Registry.register(new lc.ui.View.TypeHandler.Static());
	
});