lc.app.onDefined("lc.locale", function() {
	var url = lc.core.getMyURL();
	var i = url.path.lastIndexOf('/');
	url = url.path.substring(0,i+1);
	lc.locale.declare(url+'locale/', ['lc-grid'], ['en','fr']);
});
lc.app.onDefined("lc.ui.Component", function() {
	
	lc.core.extendClass("lc.ui.Grid", [lc.ui.Component],
	function(container, doNotConfigure, doNotBuild) {
		lc.ui.Component.call(this, container, doNotConfigure, doNotBuild);
	}, {
		componentName: "lc-grid",
		
		header: null,
		headerPanelsContainer: null,
		headerRowsContainer: null,
		content: null,
		footer: null,
		footerRowsContainer: null,
		footerPanelsContainer: null,
		
		columns: null,
		pinnedColumnsLeft: -1,
		pinnedColumnsRight: Number.MAX_VALUE,
		columnsHeadersRow: null,
		
		rowsHeader: null,
		rows: null,
		rowsFooter: null,
		
		data: null,
		dataProvider: null,
		
		/* Configure */
		
		configure: function() {
			this.columns = [];
			this.rowsHeader = [];
			this.rows = [];
			this.rowsFooter = [];

			// 3 vertical parts: header/content/footer
			this.header = document.createElement("DIV");
			this.content = document.createElement("DIV");
			this.footer = document.createElement("DIV");
			lc.css.addClass(this.header, "lc-grid-header");
			lc.css.addClass(this.content, "lc-grid-content");
			lc.css.addClass(this.footer, "lc-grid-footer");
			
			this.headerPanelsContainer = document.createElement("DIV");
			lc.css.addClass(this.headerPanelsContainer, "lc-grid-header-panels");
			this.header.appendChild(this.headerPanelsContainer);
			this.headerRowsContainer = document.createElement("DIV");
			lc.css.addClass(this.headerRowsContainer, "lc-grid-header-rows");
			this.header.appendChild(this.headerRowsContainer);
			
			this.footerRowsContainer = document.createElement("DIV");
			lc.css.addClass(this.footerRowsContainer, "lc-grid-footer-rows");
			this.footer.appendChild(this.footerRowsContainer);
			this.footerPanelsContainer = document.createElement("DIV");
			lc.css.addClass(this.footerPanelsContainer, "lc-grid-footer-panels");
			this.footer.appendChild(this.footerPanelsContainer);
			
			this.columnsHeadersRow = new lc.ui.Grid.Row(this, null);
			this.columnsHeadersRow.renderer = new lc.ui.Grid.Row.DefaultRenderer(this.columnsHeadersRow);
			this.rowsHeader.push(this.columnsHeadersRow);
			this.headerRowsContainer.appendChild(this.columnsHeadersRow.container);
			
			this.horizontalScrollBarContainer = document.createElement("DIV");
			this.horizSB = new lc.ui.BrowserScrollbar(this.horizontalScrollBarContainer);
			this.horizSB.setDirection(true);
			this.footerPanelsContainer.appendChild(this.horizontalScrollBarContainer);
			this.horizSB.on("scroll", new lc.async.Callback(this, this._horizontalScrolling));
		},
		
		/* Columns */
		
		addColumn: function(col, index, doNotLayout) {
			if (typeof index === 'undefined') index = -1;
			if (index >= this.columns.length) index = -1;
			this.callExtensions("beforeAddColumn", this, col, index);
			if (index < 0)
				this.columns.push(col);
			else {
				this.columns.splice(index,0,col);
				if (index <= this.pinnedColumnsLeft)
					this.pinnedColumnsLeft++;
			}
			col.headerCellRenderer();
			this.columnsHeadersRow.renderer.addCell(col.headerCell);
			var rows = this.getAllRows();
			for (var i = 0; i < rows.length; ++i)
				if (rows[i] != this.columnsHeadersRow)
					rows[i].renderer.columnAdded(col);
			this.callExtensions("afterAddColumn", this, col);
			if (!doNotLayout)
				this.refreshLayout();
		},
		
		removeColumn: function(col, doNotLayout) {
			if (typeof col === 'string') col = this.getColumnById(col);
			if (typeof col === 'number') col = this.columns[col];
			this.callExtensions("beforeRemoveColumn", this, col);
			this.columnsHeadersRow.renderer.removeCell(col.headerCell);
			var index = this.columns.indexOf(col);
			this.columns.removeUnique(col);
			if (index <= this.pinnedColumnsLeft)
				this.pinnedColumnsLeft--;
			if (this.pinnedColumnsRight >= this.columns.length)
				this.pinnedColumnsRight = Number.MAX_VALUE;
			var rows = this.getAllRows();
			for (var i = 0; i < rows.length; ++i)
				if (rows[i] != this.columnsHeadersRow)
					rows[i].renderer.columnRemoved(col);
			this.callExtensions("afterRemoveColumn", this, col);
			if (!doNotLayout)
				this.refreshLayout();
		},
		
		moveColumn: function(col, newIndex, doNotLayout) {
			if (typeof col === 'string') col = this.getColumnById(col);
			if (typeof col === 'number') col = this.columns[col];
			this.callExtensions("beforeMoveColumn", this, col);
			var index = this.columns.indexOf(col);
			this.columns.splice(index,1);
			if (index <= this.pinnedColumnsLeft)
				this.pinnedColumnsLeft--;
			if (this.pinnedColumnsRight >= this.columns.length)
				this.pinnedColumnsRight = Number.MAX_VALUE;
			this.columns.splice(newIndex,0,col);
			if (newIndex <= this.pinnedColumnsLeft)
				this.pinnedColumnsLeft++;
			this.callExtensions("afterMoveColumn", this, col, index);
			if (!doNotLayout)
				this.refreshLayout();
		},
		
		getColumnById: function(id) {
			for (var i = 0; i < this.columns.length; ++i)
				if (this.columns[i].id == id)
					return this.columns[i];
			return null;
		},
		
		getColumnIndexById: function(id) {
			for (var i = 0; i < this.columns.length; ++i)
				if (this.columns[i].id == id)
					return i;
			return -1;
		},
		
		/** Returns an object {first:x,last:y} corresponding to the column range used by the given cell, or null if the cell is not visible */
		getCellColumnsRange: function(row, cellIndex) {
			// TODO the range cannot be one part in pinned and one part in scrollable
			if (row.cells[cellIndex].columnsIds != null && row.cells[cellIndex].columnsIds.length > 0) {
				// search first column
				var first = -1;
				for (var i = 0; i < this.columns.length && first == -1; ++i)
					if (row.cells[cellIndex].columnsIds.indexOf(this.columns[i].id) >= 0)
						first = i;
				if (first == -1)
					return null; // no column
				var last;
				for (last = first; last+1 < this.columns.length; ++last)
					if (row.cells[cellIndex].columnsIds.indexOf(this.columns[last+1].id) < 0)
						break;
				return {first:first,last:last};
			}
			// remaining cells
			var nb = 0;
			for (var i = 0; i < row.cells.length; ++i)
				if (i != cellIndex && (row.cells[i].columnsIds == null || row.cells[i].columnsIds.length == 0))
					return null; // several require remaining cells, this is not possible
			var taken = [];
			for (var i = 0; i < row.cells.length; ++i) {
				if (i == cellIndex) continue;
				var range = this.getCellColumnsRange(row, i);
				if (!range) continue;
				for (var j = range.first; j <= range.last; ++j)
					taken.push(j);
			}
			var range = null;
			for (var i = 0; i < this.columns.length; ++i) {
				if (taken.indexOf(i) >= 0) continue;
				// available column
				var last;
				for (last = i; last+1 < this.columns.length; ++last)
					if (taken.indexOf(last+1) >= 0)
						break;
				if (range == null || (range.last-range.first < last-i))
					range = {first:i, last:last};
			}
			return range;
		},
		
		/** Set the last column to be pin on the left side of the grid.
		 * col can be a column id, a column index, or a lc.ui.Grid.Column object. If null or undefined or negative value, no column is pinned
		 */
		pinColumnsUntil: function(col) {
			if (typeof col === 'string') {
				// by id
				var id = col;
				col = -1;
				for (var i = 0; i < this.columns.length && col < 0; ++i)
					if (this.columns[i].id == id)
						col = i;
			} else if (typeof col === 'number') {
				// by index
				if (col < 0) col = -1;
				if (col >= this.columns.length) col = this.columns.length-1;
			} else if (col === null || col === undefined) {
				col = -1;
			} else {
				// by object
				col = this.columns.indexOf(col);
			}
			this.callExtensions("beforePinLeft", this, col);
			// reset scrolling
			this.horizSB.setPosition(0);
			
			var previous = this.pinnedColumnsLeft;
			this.pinnedColumnsLeft = col;
			this._refreshPinnedColumns();
			this.callExtensions("afterPinLeft", this, col, previous);
			this.layout();
		},
		
		/** Set the first column to be pin on the right side of the grid.
		 * col can be a column id, a column index, or a lc.ui.Grid.Column object. If null or undefined or negative value, no column is pinned
		 */
		pinColumnsFrom: function(col) {
			if (typeof col === 'string') {
				// by id
				var id = col;
				col = -1;
				for (var i = 0; i < this.columns.length && col < 0; ++i)
					if (this.columns[i].id == id)
						col = i;
			} else if (typeof col === 'number') {
				// by index
				if (col < 0) col = -1;
			} else if (col === null || col === undefined) {
				col = -1;
				if (col >= this.columns.length) col = this.columns.length-1;
			} else {
				// by object
				col = this.columns.indexOf(col);
			}
			if (col >= 0 && col <= this.pinnedColumnsLeft)
				this.pinnedColumnsLeft = col-1;
			if (col < 0) col = Number.MAX_VALUE;

			this.callExtensions("beforePinRight", this, col);
			// reset scrolling
			this.horizSB.setPosition(0);
			
			var previous = this.pinnedColumnsRight;
			this.pinnedColumnsRight = col;
			this._refreshPinnedColumns();
			this.callExtensions("afterPinRight", this, col, previous);
			this.layout();
		},
		
		_refreshPinnedColumns: function() {
			var rows = this.getAllRows();
			for (var i = 0; i < rows.length; ++i)
				this.refreshPinnedColumns(rows[i]);
		},
		
		refreshPinnedColumns: function(row) {
			for (var i = 0; i < row.cells.length; ++i) {
				var cell = row.cells[i];
				var range = this.getCellColumnsRange(row, i);
				if (!range) continue;
				if (range.first <= this.pinnedColumnsLeft && row.pinLeft) {
					if (cell.container.parentNode != row.pinLeft)
						row.pinLeft.appendChild(cell.container.parentNode.removeChild(cell.container));
					continue;
				}
				if (range.first >= this.pinnedColumnsRight && row.pinRight) {
					if (cell.container.parentNode != row.pinRight)
						row.pinRight.appendChild(cell.container.parentNode.removeChild(cell.container));
					continue;
				}
				if (cell.container.parentNode != row.scrollable)
					row.scrollable.appendChild(cell.container.parentNode.removeChild(cell.container));
			}
		},
		
		/* Data / Rows */
		
		setData: function(data) {
			if (typeof data === 'string')
				data = new lc.URL(data);
			if (lc.core.instanceOf(data, lc.URL)) {
				this.dataProvider = new lc.ui.Grid.DataProviderFromURL(data);
			} else {
				this.data = data;
				this.dataProvider = null;
			}
			this.refreshData();
		},
		
		refreshData: function() {
			this.callExtensions("beforeRefreshData", this);
			// remove previous rows
			for (var i = 0; i < this.rows.length; ++i)
				this.rows[i].destroy();
			this.rows = [];
			// reset scrolling
			this.horizSB.setPosition(0);
			
			// new data
			if (this.dataProvider != null) {
				this.retrieveData().onsuccess(new lc.async.Callback(this, function(data) {
					if (!data) data = [];
					if (!Array.isArray(data)) data = [data];
					this.data = data;
					this.callExtensions("refreshData", this);
					this._renderData();
					this.callExtensions("afterRefreshData", this);
				}));
			} else if (this.data != null) {
				this.callExtensions("refreshData", this);
				this._renderData();
			}
		},
		retrieveData: function() {
			return this.dataProvider.getData(this);
		},
		_renderData: function() {
			for (var i = 0; i < this.data.length; ++i) {
				var row = this.createRow(this.data[i]);
				this.appendRow(row);
			}
			this.layout();
		},
		
		createRow: function(data) {
			var row = new lc.ui.Grid.Row(this, data);
			row.renderer = this.getRowRenderer(row);
			row.renderer.createCells();
			return row;
		},
		
		insertRow: function(row, index) {
			if (index < 0) index = 0;
			if (index >= this.rows.length) {
				this.appendRow(row);
				return;
			}
			var currentRow = this.rows[index];
			this.rows.splice(index, 0, row);
			this.content.insertBefore(row.container, currentRow.container);
		},
		insertRowAfter: function(row, previousSibling) {
			var index = this.rows.indexOf(previousSibling);
			this.insertRow(row, index + 1);
		},
		insertRowBefore: function(row, nextSibling) {
			var index = this.rows.indexOf(nextSibling);
			this.insertRow(row, index);
		},
		appendRow: function(row) {
			this.rows.push(row);
			this.content.appendChild(row.container);
		},
		
		removeRow: function(row) {
			this.rows.remove(row);
			this.content.removeChild(row.container);
			row.destroy();
		},
		
		getRowRenderer: function(row) {
			return new lc.ui.Grid.Row.DefaultRenderer(row);
		},
		
		getAllRows: function() {
			return this.rowsHeader.concat(this.rows, this.rowsFooter);
		},
		
		getRowForData: function(data) {
			for (var i = 0; i < this.rows.length; ++i)
				if (this.rows[i].data == data)
					return this.rows[i];
		},
		
		/* Build from DOM */
		
		build: function() {
			// if data attribute => data from URL
			if (this.container.hasAttribute("data"))
				this.dataProvider = new lc.ui.Grid.DataProviderFromURL(this.container.getAttribute("data"));
			// if data-context attribute => data from context
			else if (this.container.hasAttribute("data-context"))
				this.dataProvider = new lc.ui.Grid.DataProviderFromContext(this.container.getAttribute("data-context"));

			for (var i = 0; i < this.container.childNodes.length; ++i) {
				var node = this.container.childNodes[i];
				if (node.nodeType != 1) continue;
				if (node.nodeName == "COLUMN") {
					this.addColumn(this.buildColumn(node), -1, true);
					this.container.removeChild(node);
					i--;
				}
			}
			
			this.container.appendChild(this.header);
			this.container.appendChild(this.content);
			this.container.appendChild(this.footer);
			
			if (this.dataProvider)
				this.refreshData();
			else
				this.layout();
		},
		
		buildColumn: function(element) {
			var col = new lc.ui.Grid.Column(this, element.id);
			for (var i = 0; i < element.attributes.length; ++i)
				col[element.attributes[i].name] = element.attributes[i].value;
			if (typeof col.title === 'string')
				col.title = document.createTextNode(col.title);
			else if (lc.xml.getChildByName(element, "HEADER")) {
				var e = lc.xml.getChildByName(element, "HEADER");
				col.title = document.createElement("SPAN");
				while (e.childNodes.length > 0) col.title.appendChild(e.removeChild(e.childNodes[0]));
			}
			
			if (typeof col.formatter === 'string') {
				var format = lc.ui.Formatter.Registry.get(col.formatter);
				if (format)
					col.formatter = new format();
				else
					col.formatter = null;
			}
			if (!col.formatter && element.hasAttribute("formatter")) {
				var format = lc.ui.Formatter.Registry.get(element.getAttribute("formatter"));
				if (format)
					col.formatter = new format();
			}
			if (col.formatter)
				col.formatter.configureFromAttributes(element);
			
			if (element.hasAttribute("cellRenderer"))
				col.cellRenderer = lc.Context.expression.evaluate(element.getAttribute("cellRenderer"), element, col);
			if (element.hasAttribute("headerCellRenderer"))
				col.headerCellRenderer = lc.Context.expression.evaluate(element.getAttribute("headerCellRenderer"), element, col);
				
			return col;
		},
		
		/* Layout */
		
		refreshLayout: function() {
			var rows = this.getAllRows();
			for (var i = 0; i < rows.length; ++i)
				this.refreshPinnedColumns(rows[i]);
			this.layout();
		},
		
		layout: function() {
			//var start = new Date().getTime();
			// reset
			var rows = this.getAllRows();
			for (var i = rows.length-1; i >= 0; --i)
				rows[i].renderer.resetLayout();
			
			//var t1 = new Date().getTime();
			
			this.callExtensions("beforeLayout", this);

			// calculate widths of columns
			
			var columnsIndexes = {};
			var maxWidths = [];
			for (var i = this.columns.length-1; i >= 0; --i) {
				maxWidths.push(0);
				columnsIndexes[this.columns[i].id] = i;
			}
			//var t2 = new Date().getTime();
			for (var j = rows.length-1; j >= 0; --j) {
				var row = rows[j];
				for (var k = row.cells.length-1; k >= 0; --k) {
					var element = row.cells[k].container;
					element.style.width = "";
					element.style.height = "";
					element.style.left = "";
					element.style.position = "fixed";
					element.style.display = "";
				}
			}
			//var t3 = new Date().getTime();
			for (var j = rows.length-1; j >= 0; --j) {
				for (var k = rows[j].cells.length-1; k >= 0; --k) {
					var cell = rows[j].cells[k];
					if (cell.columnsIds && cell.columnsIds.length == 1) {
						var w = columnsIndexes[cell.columnsIds[0]];
						if (typeof w === 'undefined') continue;
						var element = cell.container;
						var r = element.getBoundingClientRect();
						if (r.width > maxWidths[w]) maxWidths[w] = r.width;
					}
					// TODO merged cells: grow if widths are too small
				}
			}
			//var t4 = new Date().getTime();
			
			var widths = this._calculateColumnsWidths(maxWidths);

			// rows
			//var t5 = new Date().getTime();
			var rowsElements = [];
			for (var rowIndex = 0; rowIndex < rows.length; ++rowIndex) {
				var row = rows[rowIndex];
				// get elements to be layout, and set the x and width
				var elements = [];
				for (var j = row.cells.length-1; j >= 0; --j) {
					var cell = row.cells[j];
					var range;
					if (cell.columnsIds && cell.columnsIds.length == 1) {
						var index = columnsIndexes[cell.columnsIds[0]];
						if (typeof index === 'undefined') range = null;
						else range = {first:index,last:index};
					} else
						range = this.getCellColumnsRange(row, j);
					if (!range) {
						cell.container.style.display = "none";
						cell.container.style.position = "";
						continue;
					}
					cell.container.style.display = "";
					cell.container.style.position = "fixed";
					cell.container.style.bottom = "auto";
					//set width
					var width = 0;
					for (var k = range.first; k <= range.last; ++k)
						width += widths[k];
					cell.container.style.width = width+'px';
					// calculate X in parent container
					var x = 0;
					if (range.first <= this.pinnedColumnsLeft && row.pinLeft) {
						for (var k = 0; k < range.first; ++k)
							x += widths[k];
					} else if (range.first >= this.pinnedColumnsRight && row.pinRight) {
						for (var k = this.pinnedColumnsRight; k < range.first; ++k)
							x += widths[k];
					} else {
						var k = 0;
						if (row.pinLeft) k = this.pinnedColumnsLeft+1;
						for (; k < range.first; ++k)
							x += widths[k];
					}
					cell.container.style.left = x+"px";
					elements.push(cell.container);
				}
				// re-order cells based on their x
				if (row.pinLeft)
					this._reorderCells(row.pinLeft);
				if (row.pinRight)
					this._reorderCells(row.pinRight);
				this._reorderCells(row.scrollable);
				rowsElements.push(elements);
			}
			//var t6 = new Date().getTime();
			// calculate height
			var heights = [];
			for (var rowIndex = 0; rowIndex < rowsElements.length; ++rowIndex) {
				var elements = rowsElements[rowIndex];
				var height = 0;
				for (var i = elements.length-1; i >= 0; --i) {
					var r = elements[i].getBoundingClientRect();
					if (r.height > height) height = r.height;
				}
				heights.push(height);
			}
			//var t7 = new Date().getTime();
			for (var rowIndex = 0; rowIndex < rowsElements.length; ++rowIndex) {
				var elements = rowsElements[rowIndex];
				for (var i = elements.length-1; i >= 0; --i) {
					var cell = elements[i];
					cell.style.position = "";
					cell.style.bottom = "";
					cell.style.height = heights[rowIndex]+'px';
				}
			}					
			//var t8 = new Date().getTime();
				
			// layout pinLeft and pinRight
			var pinLeftWidth = 0;
			for (var i = 0; i <= this.pinnedColumnsLeft; ++i)
				pinLeftWidth += widths[i];
			var pinRightWidth = 0;
			for (var i = this.pinnedColumnsRight; i < this.columns.length; ++i)
				pinRightWidth += widths[i];
			for (var rowIndex = rows.length-1; rowIndex >= 0; --rowIndex) {
				var row = rows[rowIndex];
				if (row.pinLeft)
					row.pinLeft.style.width = pinLeftWidth+"px";
				if (row.pinRight)
					row.pinRight.style.width = pinRightWidth+"px";
				// set height of row
				row.container.style.height = heights[rowIndex]+'px';
				// TODO: here, if there is a column in pinRight, and there is a total width larger than needed, the scrollable part is too large
				// FIX: add a minWidth to the pinRight in that case
			}
			//var t9 = new Date().getTime();
			
			// scrolling
			this.horizSB.scrollBar.style.left = pinLeftWidth+"px";
			this.horizSB.scrollBar.style.right = pinRightWidth+"px";
			this.header.style.marginRight = "0px";
			this.footer.style.marginRight = "0px";
			lc.css.removeClass(this.container, "has-vertical-scrolling");
			var verticalAmount = this.content.scrollHeight;
			var verticalVisible = this.content.clientHeight;
			var horizAmount = this.columnsHeadersRow.scrollable.scrollWidth;
			var horizVisible = this.columnsHeadersRow.scrollable.clientWidth;
			// in case of vertical scrolling
			if (verticalAmount > verticalVisible) {
				var diff = (this.header.clientWidth - this.content.clientWidth);
				this.header.style.marginRight = diff+"px";
				this.footer.style.marginRight = diff+"px";
				lc.css.addClass(this.container, "has-vertical-scrolling");
			}	
			// horizontal scroll bar amount
			this.horizSB.setAmount(horizAmount, horizVisible);

			//var t10 = new Date().getTime();
			
			this.callExtensions("afterLayout", this);

			//var end = new Date().getTime();
			//console.log("lc-grid layout: "+(end-start)+"ms. = "+(t1-start)+"/"+(t2-t1)+"/"+(t3-t2)+"/"+(t4-t3)+"/"+(t5-t4)+"/"+(t6-t5)+"/"+(t7-t6)+"/"+(t8-t7)+"/"+(t9-t8)+"/"+(t10-t9)+"/"+(end-t10));
		},
		_calculateColumnsWidths: function(maxWidths) {
			var widths = [];
			for (var i = 0; i < this.columns.length; ++i) {
				var col = this.columns[i];
				var w = maxWidths[i];
				if (col.width) w = col.width;
				if (col.minWidth && w < col.minWidth) w = col.minWidth;
				if (col.maxWidth && w > col.maxWidth) w = col.maxWidth;
				widths.push(w);
			}
			return widths;
		},
		_reorderCells: function(container) {
			for (var i = 0; i < container.childNodes.length-1; ++i) {
				var cell = container.childNodes[i];
				var x = parseInt(cell.style.left);
				if (isNaN(x)) continue;
				for (var j = i+1; j < container.childNodes.length; ++j) {
					var cell2 = container.childNodes[j];
					var x2 = parseInt(cell2.style.left);
					if (isNaN(x2)) continue;
					if (x2 >= x) continue;
					// cell2 is before cell
					container.insertBefore(cell2, cell);
					i--;
					break;
				}
			}
		},
		
		_horizontalScrolling: function(event) {
			var amount = event.target.scrollLeft;
			var rows = this.getAllRows();
			for (var i = rows.length-1; i >= 0; --i)
				rows[i].scrollable.scrollLeft = amount;
		},
		
		/* Cleanup */
		
		destroy: function() {
			lc.ui.Component.prototype.destroy.call(this);
			
			this.header = null;
			this.headerPanelsContainer = null;
			this.headerRowsContainer = null;
			this.content = null;
			this.footer = null;
			this.footerRowsContainer = null;
			this.footerPanelsContainer = null;
			
			for (var i = 0; i < this.columns.length; ++i)
				this.columns[i].destroy();
			this.columns = null;
			this.columnsHeadersRow = null;
			
			var rows = this.getAllRows();
			for (var i = 0; i < rows.length; ++i)
				rows[i].destroy();
			this.rowsHeader = null;
			this.rows = null;
			this.rowsFooter = null;
			
			this.data = null;
			this.dataProvider = null;
		}
		
	});
	lc.ui.Component.Registry.register(lc.ui.Grid);
	
	lc.core.extendClass("lc.ui.Grid.Extension", lc.ui.Component.Extension, function() {}, {
		beforeLayout: function(grid) {},
		afterLayout: function(grid) {},
		beforeAddColumn: function(grid, column, index) {},
		afterAddColumn: function(grid, column) {},
		beforeRemoveColumn: function(grid, column) {},
		afterRemoveColumn: function(grid, column) {},
		beforeMoveColumn: function(grid, column) {},
		afterMoveColumn: function(grid, column, previousIndex) {},
		beforePinLeft: function(grid, columnIndex) {},
		afterPinLeft: function(grid, columnIndexBefore, columnIndexAfter) {},
		beforePinRight: function(grid, columnIndex) {},
		afterPinRight: function(grid, columnIndexBefore, columnIndexAfter) {},
		beforeRefreshData: function(grid) {},
		refreshData: function(grid) {},
		afterRefreshData: function(grid) {},
	});
	
});