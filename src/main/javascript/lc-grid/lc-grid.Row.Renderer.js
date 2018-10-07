lc.app.onDefined("lc.ui.Grid", function() {
	
	lc.core.createClass("lc.ui.Grid.Row.Renderer", function(row) {
		this.row = row;
	}, {
		row: null,
		addCell: function(cell) {
			cell.container.style.marginLeft = "";
			this.row.cells.push(cell);
		},
		removeCell: function(cell) {
			if (cell.container.parentNode)
				cell.container.parentNode.removeChild(cell.container);
			this.row.cells.removeUnique(cell);
		},
		createCells: function() {
			for (var i = 0; i < this.row.grid.columns.length; ++i) {
				var cell = new lc.ui.Grid.Cell(this.row, this.row.grid.columns[i]);
				this.row.grid.columns[i].cellRenderer(this.row, cell);
				this.addCell(cell);
			}
		},
		columnAdded: function(col) {
			for (var i = 0; i < this.row.cells.length; ++i)
				if (this.row.cells[i].columnsIds.indexOf(col.id) >= 0)
					return;
			var cell = new lc.ui.Grid.Cell(this.row, col);
			col.cellRenderer(this.row, cell);
			this.addCell(cell);
		},
		columnRemoved: function(col) {
		},
		resetLayout: function() {
			this.row.scrollable.style.width = "";
			this.row.scrollable.style.height = "";
		},
		destroy: function() {
			this.row = null;
		}
	});

});