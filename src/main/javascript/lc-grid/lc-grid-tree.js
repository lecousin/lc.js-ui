lc.app.onDefined("lc.ui.Grid", function() {
	
	lc.core.extendClass("lc.ui.Grid.Tree", lc.ui.Grid.Extension, function() {
	}, {
		extensionName: "tree",
		priority: -1000, // very low so other extensions already made what they need
		
		postConfigure: function(grid) {
			grid.setTreeChildrenField = function(field) {
				this._treeChildrenField = field;
			};
			if (grid.container.hasAttribute("tree-children-field"))
				grid.setTreeChildrenField(grid.container.getAttribute("tree-children-field"));
		},
		
		beforeAddColumn: function(grid, col, index) {
			// if first column, this is ours
			if (grid.columns.length == 0) {
				col.canBeMovedOrRemoved = false;
				var prevRenderer = col.cellRenderer;
				col.cellRenderer = function(row, cell) {
					prevRenderer.call(this, row, cell);
					
					if (!row.data._treeDepth) row.data._treeDepth = 0;
					
					var container = document.createElement("DIV");
					container.className = "lc-grid-tree-container";

					for (var i = 0; i < row.data._treeDepth; ++i) {
						var div = document.createElement("DIV");
						div.className = "lc-grid-tree-depth";
						container.appendChild(div);
					}
					
					var collapser = document.createElement("DIV");
					collapser.className = "lc-grid-tree-collapser";
					row.collapser = collapser;
					var content = document.createElement("DIV");
					content.className = "lc-grid-tree-content";
					while (cell.container.childNodes.length > 0)
						content.appendChild(cell.container.childNodes[0]);
					
					container.appendChild(collapser);
					container.appendChild(content);
					cell.container.appendChild(container);
					
					if (row.grid._treeChildrenField &&
						typeof row.data[row.grid._treeChildrenField] !== 'undefined' &&
						Array.isArray(row.data[row.grid._treeChildrenField]) &&
						row.data[row.grid._treeChildrenField].length > 0) {
						// has children
						lc.css.addClass(collapser, "has-children");
						lc.css.addClass(collapser, "collapsed");
						lc.events.listen(collapser, "click", function() {
							row.grid.getExtension(lc.ui.Grid.Tree).toggleCollapse(row);
						});
					}
				};
			}
		},
		
		toggleCollapse: function(row) {
			if (this.isExpanded(row)) this.collapse(row);
			else this.expand(row);
		},
		
		expand: function(row) {
			if (this.isExpanded(row)) return;
			lc.css.removeClass(row.collapser, "collapsed");
			lc.css.addClass(row.collapser, "expanded");
			row.grid.getExtension(lc.ui.Grid.Tree).createChildren(row);
			row.grid.refreshLayout();
		},
		
		collapse: function(row) {
			if (!this.isExpanded(row)) return;
			lc.css.removeClass(row.collapser, "expanded");
			lc.css.addClass(row.collapser, "collapsed");
			row.grid.getExtension(lc.ui.Grid.Tree).removeChildren(row);
			row.grid.refreshLayout();
		},
		
		isExpanded: function(row) {
			return lc.css.hasClass(row.collapser, "expanded");
		},
		
		createChildren: function(row) {
			var previous = row;
			for (var i = 0; i < row.data[row.grid._treeChildrenField].length; ++i) {
				var data = row.data[row.grid._treeChildrenField][i];
				data._treeDepth = row.data._treeDepth + 1;
				var child = row.grid.createRow(data);
				child.parent = row;
				row.grid.insertRowAfter(child, previous);
				previous = child;
			}
		},
		
		removeChildren: function(row) {
			for (var i = 0; i < row.data[row.grid._treeChildrenField].length; ++i) {
				var childData = row.data[row.grid._treeChildrenField][i];
				var child = row.grid.getRowForData(childData);
				this.collapse(child);
				row.grid.removeRow(child);
			}
		},
		
		destroy: function(grid) {
			// TODO
		}
	});
	lc.Extension.Registry.register(lc.ui.Grid, lc.ui.Grid.Tree);
	
});
