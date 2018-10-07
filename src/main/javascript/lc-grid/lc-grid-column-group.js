lc.app.onDefined(["lc.ui.Grid.Extension", "lc.ui.Grid.Row.DefaultRenderer"], function() {
	
	lc.core.extendClass("lc.ui.Grid.ColumnGroup", lc.ui.Grid.Extension, function() {
	}, {
		extensionName: "column-group",
		
		postConfigure: function(grid) {
			this.grid = grid;
			grid.columnGroupsRow = new lc.ui.Grid.Row(grid, null);
			lc.css.addClass(grid.columnGroupsRow.container, "lc-grid-column-group-row");
			grid.columnGroupsRow.renderer = new lc.ui.Grid.ColumnGroup.RowRenderer(grid.columnGroupsRow);
			grid.rowsHeader.splice(grid.rowsHeader.indexOf(grid.columnsHeadersRow),0,grid.columnGroupsRow);
			grid.headerRowsContainer.insertBefore(grid.columnGroupsRow.container, grid.columnsHeadersRow.container);
			grid.addColumnGroup = this._addColumnGroup;
			this.noGroupCells = [];
			for (var i = 0; i < grid.columns.length; ++i)
				this._addNoGroupCell(grid, grid.columns[i]);
		},
		
		_addColumnGroup: function(headerCell, columnsIds) {
			// this = grid
			if (!lc.core.instanceOf(headerCell, lc.ui.Grid.Cell)) {
				if (typeof headerCell === 'string') {
					var span = document.createElement("SPAN");
					span.appendChild(document.createTextNode(headerCell));
					headerCell = span;
				}
				var cell = new lc.ui.Grid.Cell(this.columnGroupsRow, columnsIds);
				cell.container.appendChild(headerCell);
				headerCell = cell;
			}
			headerCell.row = this.columnGroupRow;
			lc.css.addClass(headerCell.container, "lc-grid-column-header");
			lc.css.addClass(headerCell.container, "lc-grid-column-group-header");
			this.columnGroupsRow.renderer.addCell(headerCell);
			for (var i = 0; i < headerCell.columnsIds.length; ++i)
				this.getExtension(lc.ui.Grid.ColumnGroup)._removeNoGroupCell(headerCell.columnsIds[i]);
		},
		
		_addNoGroupCell: function(grid, col) {
			var cell = new lc.ui.Grid.Cell(grid.columnGroupsRow, [col.id]);
			lc.css.addClass(cell.container, "lc-grid-column-group-no-group-cell");
			lc.css.addClass(cell.container, "lc-grid-column-header");
			grid.columnGroupsRow.renderer.addCell(cell);
			this.noGroupCells.push(cell);
		},
		
		_removeNoGroupCell: function(colId) {
			for (var i = 0; i < this.noGroupCells.length; ++i) {
				var cell = this.noGroupCells[i];
				if (colId == cell.columnsIds[0]) {
					this.grid.columnGroupsRow.renderer.removeCell(cell);
					this.noGroupCells.splice(i,1);
					return;
				}
			}
		},
		
		_getGroup: function(colId) {
			return this.grid.columnGroupsRow.getCellForColumnId(colId);
		},
		
		afterAddColumn: function(grid, col) {
			var group = this._getGroup(col.id);
			if (!group) {
				this._addNoGroupCell(grid, col);
				return;
			}
			var first = -1;
			var last = -1;
			for (var i = 0; i < grid.columns.length; ++i) {
				var c = grid.columns[i];
				if (c == col) {
					if (first != -1) return;
					first = i;
					continue;
				}
				if (group.columnsIds.indexOf(c.id) >= 0) {
					if (first < 0)
						first = i;
					else
						last = i;
					continue;
				}
				if (first != -1) break;
			}
			if (first == -1) return;
			if (last == -1) last = first;
			var index = grid.columns.indexOf(col);
			if (index >= first && index <= last) return;
			grid.moveColumn(col, last+1, true);
		},
		
		afterRemoveColumn: function(grid, col) {
			this._removeNoGroupCell(col.id);
		},
		
		afterMoveColumn: function(grid, col, previousIndex) {
			// TODO move all columns if in a group
			// TODO if not in a group, but moved inside a group, move it away from the group
		},
		
		afterPinLeft: function(grid, columnIndexBefore, columnIndexAfter) {
			// TODO pin/unpin full group
		},
		
		afterPinRight: function(grid, columnIndexBefore, columnIndexAfter) {
			// TODO pin/unpin full group
		},
		
		destroy: function(grid) {
			// TODO
		}
	});
	lc.Extension.Registry.register(lc.ui.Grid, lc.ui.Grid.ColumnGroup);
	
	lc.core.extendClass("lc.ui.Grid.ColumnGroup.RowRenderer", lc.ui.Grid.Row.DefaultRenderer, function(row) {
		lc.ui.Grid.Row.DefaultRenderer.call(this, row);
	}, {
		createCells: function() {
			// TODO this.addCell()
		},
		
		columnAdded: function() {}
	});
	
});
