var tsorter = (function()
{
    'use strict';

    var sorterPrototype,
        addEvent,
        removeEvent,
        hasEventListener = !!document.addEventListener,
        getDataType,
        isNumeric,
        getLastChild;

    if( !Object.create ){
        // Define Missing Function
        Object.create = function( prototype ) {
            var Obj = function(){return undefined;};
            Obj.prototype = prototype;
            return new Obj();
        };
    }

    // Cross Browser event binding
    addEvent = function( element, eventName, callback ) { 
        if( hasEventListener ) { 
            element.addEventListener(eventName, callback, false ); 
        } else {
            element.attachEvent( 'on' + eventName, callback); 
        }
    };

    // Cross Browser event removal
    removeEvent = function( element, eventName, callback ) { 
        if( hasEventListener ) { 
            element.removeEventListener(eventName, callback, false ); 
        } else {
            element.detachEvent( 'on' + eventName, callback); 
        }
    };

    getDataType = function(element, cell) {
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

    isNumeric = function(text) {
        if (/^\d+$/.test(text)) {
            return 'numeric';
        }

        return null;
    };

    getLastChild = function(element, cell) {
        var child = element;

        while (child.children.length > 0) {
            child = child.children[cell];
        }

        return child;
    };

    sorterPrototype = {

        getCell: function(row)
        {
            var that = this;
            return that.trs[row].cells[that.column];
        },

        /* SORT
         * Sorts a particular column. If it has been sorted then call reverse
         * if not, then use quicksort to get it sorted.
         * Sets the arrow direction in the headers.
         * @param oTH - the table header cell (<th>) object that is clicked
         */
        sort: function( e )
        {   
            var that = this,
                th = e.target,
                parent = th.parentNode.tagName,
                sortType = th.getAttribute('data-tsorter') || getDataType(that.trs[1], th.cellIndex),
                hasClassList = !!document.body.classList;

            if (parent.toLowerCase() === 'th') {
                return;
            }

            // set the data retrieval function for this column 
            that.column = th.cellIndex;
            that.get = that.getAccessor(sortType);

            if (hasClassList) {
                if (th.classList.contains('descend')) {
                    th.classList.add('ascend');
                    th.classList.remove('descend');
                }
                else if (th.classList.contains('ascend'))
                {
                    th.classList.remove('ascend');
                    th.classList.add('descend');
                }
                else {
                    th.classList.add('descend');
                }
            } else {
                if (th.className.split(' ').indexOf('descend') > -1) {
                    th.className = th.className.replace('descend', 'ascend');
                } else if (th.className.split(' ').indexOf('ascend') > -1) {
                    th.className = th.className.replace('ascend', 'descend');
                } else {
                    th.className += ' descend';
                }
            }

            that.sortAscending = th.className.split(' ').indexOf('descend') > -1;

            that.quicksort(1, that.trs.length);

            that.prevCol = that.column;
        },
        
        /* 
         * Choose Data Accessor Function
         * @param: the html structure type (from the data-type attribute)
         */
        getAccessor: function(sortType)
        {
            var that = this,
                accessors = that.accessors;

            if( accessors && accessors[ sortType ] ){
                return accessors[ sortType ];
            }

            switch( sortType )
            {   
                case "link":
                    return function(row){
                        return that.getCell(row).firstChild.firstChild.nodeValue;
                    };
                case "input":
                    return function(row){  
                        return that.getCell(row).firstChild.value;
                    };
                case "numeric":
                    return function(row){  
                        return parseFloat( that.getCell(row).firstChild.nodeValue.replace(/\D/g,''), 10 );
                    };
                default: /* Plain Text */
                    return function(row){  
                        return that.getCell(row).firstChild.nodeValue.toLowerCase();
                    };
            }
        },

        /* 
         * Exchange
         * A complicated way of exchanging two rows in a table.
         * Exchanges rows at index i and j
         */
        exchange: function(i, j)
        {
            var that = this,
                tbody = that.tbody,
                trs = that.trs,
                tmpNode;

            if( i === j+1 ) {
                tbody.insertBefore(trs[i], trs[j]);
            } else if( j === i+1 ) {
                tbody.insertBefore(trs[j], trs[i]);
            } else {
                tmpNode = tbody.replaceChild(trs[i], trs[j]);
                if( !trs[i] ) {
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
        quicksort: function(lo, hi)
        {
            var i, j, pivot,
                that = this;

            if( hi <= lo+1 ){ return; }

            if( (hi - lo) === 2 ) {
                if(that.get(hi-1) > that.get(lo)) {
                    that.exchange(hi-1, lo);
                }
                return;
            }

            i = lo + 1;
            j = hi - 1;

            if( that.get(lo) > that.get( i) ){ that.exchange( i, lo); }
            if( that.get( j) > that.get(lo) ){ that.exchange(lo,  j); }
            if( that.get(lo) > that.get( i) ){ that.exchange( i, lo); }

            pivot = that.get(lo);

            while(true) {
                if (that.sortAscending) {
                    while (pivot > that.get(j)) { j--; }
                    while (that.get(i) > pivot) { i++; }
                } else {
                    while (pivot < that.get(j)) { j--; }
                    while (that.get(i) < pivot) { i++; }
                }

                if(j <= i){ break; }

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

            if((j-lo) < (hi-j)) {
                that.quicksort(lo, j);
                that.quicksort(j+1, hi);
            } else {
                that.quicksort(j+1, hi);
                that.quicksort(lo, j);
            }
        },

        init: function( table, initialSortedColumn, customDataAccessors ){
            var that = this,
                i;

            if( typeof table === 'string' ){
                table = document.getElementById(table);
            }

            that.table = table;
            that.ths   = table.getElementsByTagName("th");
            that.tbody = table.tBodies[0];
            that.trs   = that.tbody.getElementsByTagName("tr");
            that.prevCol = ( initialSortedColumn && initialSortedColumn > 0 ) ? initialSortedColumn : -1;
            that.accessors = customDataAccessors;
            that.boundSort = that.sort.bind( that );

            for( i = 0; i < that.ths.length; i++ ) {
                addEvent( that.ths[i], 'click', that.boundSort );

                // Make the cursor a pointer.
                that.ths[i].style.cursor = 'pointer';
            }
        },

        destroy: function(){
            var that = this,
                i;

            if( that.ths ){
                for( i = 0; i < that.ths.length; i++ ) {
                    removeEvent( that.ths[i], 'click', that.boundSort );
                }
            }
        }
    };

    // Create a new sorter given a table element
    return {
        create: function( table, initialSortedColumn, customDataAccessors )
        {
            var sorter = Object.create( sorterPrototype );
            sorter.init( table, initialSortedColumn, customDataAccessors );
            return sorter;
        }
    };
}());
