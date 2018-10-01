lc.app.onDefined("lc.ui.Grid", function() {
	
	lc.core.extendClass("lc.ui.Grid.MoveColumn", lc.ui.Grid.Extension, function() {}, {
		extensionName: "move-column",
		
		postConfigure: function(grid) {
			for (var i = 0; i < grid.columns.length; ++i)
				this.afterAddColumn(grid, grid.columns[i]);
			lc.events.listen(grid.columnsHeadersRow.container, "dragover", new lc.async.Callback(grid, this.dragover));
		},
		
		afterAddColumn: function(grid, col) {
			if (!col.canBeMovedOrRemoved) return;
			col.headerCell.container.style.cursor = "move";
			col.headerCell.container.draggable = true;
			lc.events.listen(col.headerCell.container, "dragstart", new lc.async.Callback(col, this.dragstart));
			lc.events.listen(col.headerCell.container, "dragend", new lc.async.Callback(col, this.dragend));
			// TODO
		},
		
		dragstart: function(event) {
			// this = col
			var element = lc.html.clone(this.headerCell.container);
			element.style.position = "static";
			var parent = this.headerCell.container.parentNode;
			do {
				var container = document.createElement("DIV");
				container.className = parent.className;
				container.appendChild(element);
				element = container;
				element.style.position = "static";
				if (parent == this.grid.container)
					break;
				parent = parent.parentNode;
			} while (true);
			element.style.position = "absolute";
			element.style.top = "-10000px";
			document.body.appendChild(element);
			event.dataTransfer.setDragImage(element, element.offsetWidth/2, 0);
			lc.ui.Grid.MoveColumn.DraggedColumn = this;
			lc.ui.Grid.MoveColumn.DraggedElement = element;
		},
		
		dragend: function(event) {
			if (lc.ui.Grid.MoveColumn.DraggedColumn != this)
				return;
			document.body.removeChild(lc.ui.Grid.MoveColumn.DraggedElement);
			lc.ui.Grid.MoveColumn.DraggedColumn = null;
			lc.ui.Grid.MoveColumn.DraggedElement = null;
		},
		
		dragover: function(event) {
			// this = grid
			if (!lc.ui.Grid.MoveColumn.DraggedColumn || lc.ui.Grid.MoveColumn.DraggedColumn.grid != this)
				return;
			event.preventDefault();
			var e = event.target;
			var x = event.offsetX;
			while (!lc.css.hasClass(e, "lc-grid-row-container") && e != document.body) {
				x += e.offsetLeft;
				e = e.parentNode;
			}
			while (!lc.css.hasClass(e, "lc-grid") && e != document.body)
				e = e.parentNode;
			if (e == document.body) return; // ??
			var grid = lc.Context.get(e)["lc.ui.Component"];
			var nearestIndex = -1;
			var nearestDist = 1000;
			var index = -1;
			for (var i = 0; i < grid.columns.length; ++i) {
				var header = grid.columns[i].headerCell.container;
				var hx = header.offsetLeft + header.parentNode.offsetLeft;
				if (x >= hx && x < hx+header.offsetWidth) {
					if (x > hx+header.offsetWidth-10)
						index = i+1;
					else
						index = i;
					break;
				} else {
					var dist = x < hx ? hx-x : x - (hx+header.offsetWidth);
					if (dist < nearestDist) {
						nearestIndex = i;
						nearestDist = dist;
					}
				}
			}
			if (index == -1) index = nearestIndex;
			if (index == -1) return;
			if (index == grid.columns.indexOf(lc.ui.Grid.MoveColumn.DraggedColumn)) return;
			if (!grid.columns[index].canBeMovedOrRemoved) return;
			grid.moveColumn(lc.ui.Grid.MoveColumn.DraggedColumn, index);
		},
		
		destroy: function(grid) {
			// TODO
		}
	});
	lc.Extension.Registry.register(lc.ui.Grid, lc.ui.Grid.MoveColumn);
});