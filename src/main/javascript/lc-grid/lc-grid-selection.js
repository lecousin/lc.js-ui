lc.app.onDefined("lc.ui.Grid", function() {
	
	lc.core.extendClass("lc.ui.Grid.Selection", lc.ui.Grid.Extension, function() {
		
	},{
		extensionName: "selection",
		
		postConfigure: function(grid) {
			grid.registerEvent("selectionChanged");
			grid.selection = [];
		},
		
		postBuild: function(grid) {
			this.col = new lc.ui.Grid.Column(grid, 'selection');
			this.col._select_cb = document.createElement("INPUT");
			this.col._select_cb.type = "checkbox";
			this.col.headerCellRenderer = function() {
				this.headerCell.container.appendChild(this._select_cb);
				lc.css.addClass(this.headerCell.container, "lc-grid-selection-checkbox-container");
				lc.events.listen(this._select_cb, "change", new lc.async.Callback(grid.getExtension(lc.ui.Grid.Selection), function() {
					this.selectAllChanged(grid);
				}));
			};
			this.col.cellRenderer = function(row, cell) {
				if (!cell._select_cb) {
					cell._select_cb = document.createElement("INPUT");
					cell._select_cb.type = "checkbox";
					lc.events.listen(cell._select_cb, "change", new lc.async.Callback(grid.getExtension(lc.ui.Grid.Selection), function() {
						if (cell._select_cb.checked) lc.css.addClass(row.container, "selected");
						else lc.css.removeClass(row.container, "selected");
						this.selectionChanged(grid);
					}));
				}
				cell.container.appendChild(cell._select_cb);
				lc.css.addClass(cell.container, "lc-grid-selection-checkbox-container");
			};
			grid.addColumn(this.col, 0);
		},
		
		selectionChanged: function(grid) {
			grid.selection = [];
			for (var i = 0; i < grid.rows.length; ++i) {
				var row = grid.rows[i];
				var cell = row.getCellForColumnId('selection');
				if (cell._select_cb.checked) grid.selection.push(row);
			}
			if (grid.selection.length == 0) this.col._select_cb.checked = false;
			else if (grid.selection.length == grid.rows.length) this.col._select_cb.checked = true;
			else this.col._select_cb.indeterminate = true;
			grid.trigger("selectionChanged");
		},
		
		selectAllChanged: function(grid) {
			grid.selection = [];
			for (var i = 0; i < grid.rows.length; ++i) {
				var row = grid.rows[i];
				var cell = row.getCellForColumnId('selection');
				if (this.col._select_cb.checked) {
					cell._select_cb.checked = true;
					lc.css.addClass(row.container, "selected");
					grid.selection.push(row);
				} else {
					cell._select_cb.checked = false;
					lc.css.removeClass(row.container, "selected");
				}
			}
			grid.trigger("selectionChanged");
		},
		
		destroy: function(grid) {
			// TODO
		}
	});
	lc.Extension.Registry.register(lc.ui.Grid, lc.ui.Grid.Selection);
	
});