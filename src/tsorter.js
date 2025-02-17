/*!
 * tsorter 2.0.0 - Copyright 2015 Terrill Dent, http://terrill.ca
 * JavaScript HTML Table Sorter
 * Released under MIT license, http://terrill.ca/sorting/tsorter/LICENSE
 */
var tsorter = (function () {
  'use strict';

  var sorterPrototype,
    addEvent,
    removeEvent,
    hasEventListener = !!document.addEventListener,
    getDataType,
    isNumeric,
    getLastChild,
    style;

  // Add the styles.
  style = document.createElement('style');
  document.head.appendChild(style);

  style.sheet.insertRule('.tsorterSortable th { cursor: pointer }', 0);
  style.sheet.insertRule('.tsorterSortable th.descend:after { content: " \u25b2" }', 0);
  style.sheet.insertRule('.tsorterSortable th.ascend:after { content: " \u25bc" }', 0);

  if (!Object.create) {
    // Define Missing Function
    Object.create = function (prototype) {
      var Obj = function () { return undefined; };
      Obj.prototype = prototype;
      return new Obj();
    };
  }

  // Cross Browser event binding
  addEvent = function (element, eventName, callback) {
    if (hasEventListener) {
      element.addEventListener(eventName, callback, false);
    } else {
      element.attachEvent('on' + eventName, callback);
    }
  };

  // Cross Browser event removal
  removeEvent = function (element, eventName, callback) {
    if (hasEventListener) {
      element.removeEventListener(eventName, callback, false);
    } else {
      element.detachEvent('on' + eventName, callback);
    }
  };

  getDataType = function (element, cell) {
    var lastChild = getLastChild(element, cell),
      lastChildValue = lastChild ? lastChild.innerHTML : '',
      numeric;

    if (lastChild) {
      numeric = isNumeric(lastChildValue);

      if (numeric) {
        return numeric;
      }
    }
  };

  isNumeric = function (text) {
    if (/^[\+\-]?(?:\d*\.)?\d+$/.test(text)) {
      return 'numeric';
    }

    return null;
  };

  getLastChild = function (element, cell) {
    var child = element;

    while (child.children && child.children.length > 0) {
      child = child.children[cell];
    }

    return child;
  };

  sorterPrototype = {

    getCell: function (row) {
      var that = this;
      return that.trs[row].cells[that.column];
    },

    /* SORT
     * Sorts a particular column. If it has been sorted then call reverse
     * if not, then use quicksort to get it sorted.
     * Sets the arrow direction in the headers.
     * @param oTH - the table header cell (<th>) object that is clicked
     */
    sort: function (e) {
      var that = this,
        th = e.target,
        parent = th.parentNode.tagName,
        sortType = th.getAttribute('data-tsorter') || getDataType(that.trs[1], th.cellIndex),
        hasClassList = !!document.body.classList,
        classes;

      if (parent.toLowerCase() === 'th') {
        return;
      }

      // set the data retrieval function for this column
      that.column = that.getHeaderIndex(that.table, th);
      that.get = that.getAccessor(sortType);
      console.log("Sorting by column number " + that.column);


      if (hasClassList) {
        classes = th.classList;

        if (classes.contains('descend')) {
          classes.add('ascend');
          classes.remove('descend');

          that.sortAscending = true;
        }
        else if (classes.contains('ascend')) {
          classes.remove('ascend');
          classes.add('descend');

          that.sortAscending = false;
        }
        else {
          classes.add('descend');

          that.sortAscending = false;
        }

        // Cleanup the previous column.
        if (that.prevCol !== -1 && that.prevCol !== that.column) {
          that.ths[that.prevCol].classList.remove('ascend');
          that.ths[that.prevCol].classList.remove('descend');
        }
      } else {
        classes = th.className.split(' ');

        if (classes.indexOf('descend') > -1) {
          th.className = th.className.replace('descend', 'ascend');

          that.sortAscending = true;
        } else if (classes.indexOf('ascend') > -1) {
          th.className = th.className.replace('ascend', 'descend');

          that.sortAscending = false;
        } else {
          th.className += ' descend';

          that.sortAscending = false;
        }

        // Cleanup the previous column.
        if (that.prevCol !== -1 && that.prevCol !== that.column) {
          that.ths[that.prevCol].className.replace('ascend', '');
          that.ths[that.prevCol].className.replace('descend', '');
        }
      }

      that.quicksort(0, that.trs.length);

      that.prevCol = that.column;
    },

    /*
     * Choose Data Accessor Function
     * @param: the html structure type (from the data-type attribute)
     */
    getAccessor: function (sortType) {
      var that = this,
        accessors = that.accessors;

      if (accessors && accessors[sortType]) {
        return accessors[sortType];
      }

      switch (sortType) {
        case "link":
          return function (row) {
            return that.getCell(row).firstChild.firstChild.nodeValue;
          };
        case "input":
          return function (row) {
            return that.getCell(row).firstChild.value;
          };
        case "numeric":
          return function (row) {
            return parseFloat(that.getCell(row).firstChild.nodeValue);
          };
        default: /* Plain Text */
          return function (row) {
            if (typeof (that.getCell(row)) != "undefined" && that.getCell(row).firstChild != null) {
              return that.getCell(row).firstChild.nodeValue;
            } else {
              return '';
            }
          };
      }
    },

    /* Exchange
     * A complicated way of exchanging two rows in a table.
     * Exchanges rows at index i and j
     */
    exchange: function (i, j) {
      var that = this,
        tbody = that.tbody,
        trs = that.trs,
        tmpNode;

      if (i === j + 1) {
        tbody.insertBefore(trs[i], trs[j]);
      } else if (j === i + 1) {
        tbody.insertBefore(trs[j], trs[i]);
      } else {
        tmpNode = tbody.replaceChild(trs[i], trs[j]);
        if (!trs[i]) {
          tbody.appendChild(tmpNode);
        } else {
          tbody.insertBefore(tmpNode, trs[i]);
        }
      }
    },

    /*
     * QUICKSORT
     * @param: lo - the low index of the array to sort
     * @param: hi - the high index of the array to sort
     */
    quicksort: function (lo, hi) {
      var i, j, pivot,
        that = this;

      if (hi <= lo + 1) { return; }

      i = lo + 1;
      j = hi - 1;

      if (that.get(lo) > that.get(i)) { that.exchange(i, lo); }
      if (that.get(j) > that.get(lo)) { that.exchange(lo, j); }
      if (that.get(lo) > that.get(i)) { that.exchange(i, lo); }

      pivot = that.get(lo);

      while (true) {
        if (that.sortAscending) {
          while (pivot > that.get(j)) { j--; }
          while (that.get(i) > pivot) { i++; }
        } else {
          while (pivot < that.get(j)) { j--; }
          while (that.get(i) < pivot) { i++; }
        }

        if (j <= i) { break; }

        // JSLint is forcing '===', but that doesn't work with strings.
        if (that.get(i) > that.get(j) || that.get(i) < that.get(j)) {
          that.exchange(i, j);
        }

        i++;
        j--;
      }

      // JSLint is forcing '===', but that doesn't work with strings.
      if (that.get(lo) > that.get(j) || that.get(lo) < that.get(j)) {
        that.exchange(lo, j);
      }

      if ((j - lo) < (hi - j)) {
        that.quicksort(lo, j);
        that.quicksort(j + 1, hi);
      } else {
        that.quicksort(j + 1, hi);
        that.quicksort(lo, j);
      }
    },

    getHeaderIndex: function (table, th) {
      var ths = table.tHead.getElementsByTagName("th");
      var index = 0;
      for (var i = 0; i < ths.length; i++) {
        var headerCell = ths[i];
        if (headerCell.innerHTML === th.innerHTML) {
          return index;
        }
        index += headerCell.colSpan;
      }
    },

    readHeaders: function (table) {
      var ths = table.tHead.getElementsByTagName("th");
      var headers = [];
      var index = 0;
      for (var i = 0; i < ths.length; i++) {
        var th = ths[i];
        for (var j = 0; j < th.colSpan; j++) {
          headers[index] = th;
          index++;
          console.log("Adding a header at index " + index + " for header " + th.innerHTML);
        }
      }
      return headers;
    },

    init: function (table, initialSortedColumn, customDataAccessors) {
      var that = this,
        i,
        sortType,
        th;

      if (typeof table === 'string') {
        table = document.getElementById(table);
      }

      if (!table || table == null) {
        return;
      }

      // Add the sortable class.
      if (table.className.indexOf('tsorterSortable') <= -1) {
        table.className += ' tsorterSortable';
      }

      that.table = table;
      that.ths = that.readHeaders(table);
      that.tbody = table.tBodies[0];
      that.trs = that.tbody.getElementsByTagName("tr");
      that.prevCol = (initialSortedColumn && initialSortedColumn > 0) ? initialSortedColumn : -1;
      that.accessors = customDataAccessors;
      that.boundSort = that.sort.bind(that);

      for (i = 0; i < that.ths.length; i++) {
        addEvent(that.ths[i], 'click', that.boundSort);
      }

      // Add the ascending arrow to the initially sorted column (if applicable).
      if (initialSortedColumn !== undefined && that.ths.length >= initialSortedColumn) {
        that.ths[initialSortedColumn].className += ' ascend';

        th = that.ths[initialSortedColumn];
        sortType = th.getAttribute('data-tsorter') || getDataType(that.trs[1], th.cellIndex);

        // set the data retrieval function for this column
        that.column = th.cellIndex;
        that.get = that.getAccessor(sortType);

        that.quicksort(1, that.ths.length);

        that.prevCol = that.column;
      }
    },

    destroy: function () {
      var that = this,
        i;

      if (that.ths) {
        for (i = 0; i < that.ths.length; i++) {
          removeEvent(that.ths[i], 'click', that.boundSort);
        }
      }
    }
  };

  // Create a new sorter given a table element
  return {
    create: function (table, initialSortedColumn, customDataAccessors) {
      var sorter = Object.create(sorterPrototype);
      sorter.init(table, initialSortedColumn, customDataAccessors);
      return sorter;
    }
  };
}());
