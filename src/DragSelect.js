// v 1.15.1
// @ts-check
/* 
    ____                   _____      __          __ 
   / __ \_________ _____ _/ ___/___  / /__  _____/ /_
  / / / / ___/ __ `/ __ `/\__ \/ _ \/ / _ \/ ___/ __/
 / /_/ / /  / /_/ / /_/ /___/ /  __/ /  __/ /__/ /_  
/_____/_/   \__,_/\__, //____/\___/_/\___/\___/\__/  
                 /____/                              

 {*} {*} STAR THIS PLUGIN ON GITHUB: {*} {*}

 https://github.com/ThibaultJanBeyer/DragSelect
 Please give it a like, this is what makes me happy :-)
 Thank You

 {*} {*} STAR THIS PLUGIN ON GITHUB: {*} {*}

 ******************************************
 ********* The MIT License (MIT) **********
 ******************************************
 Copyright (c) 2017 ThibaultJanBeyer
 web: http://www.thibaultjanbeyer.com/
 github: https://github.com/ThibaultJanBeyer/DragSelect
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 --- Notes ---
 Checking types using JS-Docs inspired by this post:
 https://medium.com/@trukrs/type-safe-javascript-with-jsdoc-7a2a63209b76
 ---
*/

import './types'

// Setup
//////////////////////////////////////////////////////////////////////////////////////

class DragSelect {

    /** @type {boolean} */
    _multiSelectKeyPressed = false;
    /** @type {{x: number, y: number}} */
    _initialCursorPos = { x: 0, y: 0 };
    /** @type {{x: number, y: number}} */
    _newCursorPos = { x: 0, y: 0 };
    /** @type {{x: number, y: number}} */
    _previousCursorPos = { x: 0, y: 0 };
    /** @type {{x: number, y: number}} */
    _initialScroll = { x: 0, y: 0 };
    /** @type {Array.<(SVGElement|HTMLElement)>} */
    _selected = [];
    /** @type {Array.<(SVGElement|HTMLElement)>} */
    _prevSelected = []; // memory to fix #9
    _lastTouch;
    /** @type {number|null} */
    _autoScrollInterval = null;
    _areaMaxScroll = { width: 0, height: 0 };

    /**
     * @constructor
     * @param {Settings} settings
     */
    constructor({
        area = document,
        autoScrollSpeed = 1,
        callback = () => { },
        customStyles = false,
        hoverClass = 'ds-hover',
        multiSelectKeys = ['ctrlKey', 'shiftKey', 'metaKey'],
        multiSelectMode = false,
        onDragMove = function () { },
        onDragStart = function () { },
        onDragStartBegin = function () { },
        onDragEnd = function () { },
        onElementSelect = function () { },
        onElementUnselect = function () { },
        selectableClass = 'ds-selectable',
        selectables = [],
        selectedClass = 'ds-selected',
        selector = undefined,
        selectorClass = 'ds-selector',
        zoom = 1
    }) {
        this.selectedClass = selectedClass;
        this.hoverClass = hoverClass;
        this.selectorClass = selectorClass;
        this.selectableClass = selectableClass;
        this.selectables = [];
        this._initialSelectables = this._toArray(selectables);
        this.multiSelectKeys = multiSelectKeys;
        this.multiSelectMode = multiSelectMode;
        this.autoScrollSpeed = autoScrollSpeed === 0 ? 0 : autoScrollSpeed;
        this.selectCallback = onElementSelect;
        this.unselectCallback = onElementUnselect;
        this.onDragStartBegin = onDragStartBegin;
        this.moveStartCallback = onDragStart;
        this.moveCallback = onDragMove;
        this.onDragEnd = onDragEnd;
        this.callback = callback;
        this.area = this._handleArea(area);
        this.customStyles = customStyles;
        this.zoom = zoom;

        // Selector
        this.selector = selector || this._createSelector();
        this.selector.classList.add(this.selectorClass);
        this.start();
    }

    /**
     * @param {(HTMLElement|SVGElement|any)} area
     * @private
     */
    _handleArea(area) {
        if (area === document) return area;

        // Area has to have a special position attribute for calculations
        const computedStyles = getComputedStyle(area);
        area.computedBorder = parseInt(computedStyles.borderWidth);
        const position = computedStyles.position;
        const isPositioned =
            position === 'absolute' ||
            position === 'relative' ||
            position === 'fixed';
        if (!isPositioned) {
            area.style.position = 'relative';
        }
        return area;
    }

    /**
     * Add/Remove Selectables also handles css classes and event listeners.
     * @param {HTMLElement[]|SVGElement[]} selectables - selectable elements.
     * @param {boolean} [remove] - if elements should be removed.
     * @param {boolean} [fromSelection] - if elements should also be added/removed to the selection.
     * @private
     */
    _handleSelectables(selectables, remove, fromSelection) {
        for (var index = 0; index < selectables.length; index++) {
            var selectable = selectables[index];
            var indexOf = this.selectables.indexOf(selectable);

            if (indexOf < 0 && !remove) {
                this._addSelectable(selectable, fromSelection);
            } else if (indexOf > -1 && remove) {
                this._removeSelectable(selectable, indexOf, fromSelection);
            }
        }
    }

    /**
     * @param {(HTMLElement|SVGElement)} selectable
     * @param {boolean} toSelection also adds it to the current selection
     * @private
     */
    _addSelectable(selectable, toSelection) {
        selectable.classList.add(this.selectableClass);
        selectable.addEventListener('click', this._onClick);
        this.selectables.push(selectable);

        // also add to current selection
        if (toSelection && this._selected.indexOf(selectable) < 0) {
            selectable.classList.add(this.selectedClass);
            this._selected.push(selectable);
        }
    }

    /**
     * @param {(HTMLElement|SVGElement)} selectable
     * @param {number} indexOf
     * @param {boolean} [fromSelection] also adds it to the current selection
     * @private
     */
    _removeSelectable(selectable, indexOf, fromSelection) {
        selectable.classList.remove(this.hoverClass);
        selectable.classList.remove(this.selectableClass);
        selectable.removeEventListener('click', this._onClick);
        this.selectables.splice(indexOf, 1);

        // also remove from current selection
        if (fromSelection && this._selected.indexOf(selectable) > -1) {
            selectable.classList.remove(this.selectedClass);
            this._selected.splice(this._selected.indexOf(selectable), 1);
        }
    }

    /**
     * @param {MouseEvent} event
     * @private
     */
    _onClick = event => this.handleClick(event);

    /**
     * Triggers when a node is actively selected.
     *
     * This might be an "onClick" method but it also triggers when
     * <button> nodes are pressed via the keyboard.
     * Making DragSelect accessible for everyone!
     *
     * @param {MouseEvent} event
     * @private
     */
    handleClick(event) {
        if (this.mouseInteraction) {
            return;
        } // fix firefox doubleclick issue
        if (this._isRightClick(event)) {
            return;
        }

        /** @type {any} */
        const node = event.target;

        if (this._isMultiSelectKeyPressed(event)) {
            this._prevSelected = this._selected.slice();
        } // #9
        else {
            this._prevSelected = [];
        } // #9

        this.checkIfInsideSelection(true); // reset selection if no multiselectionkeypressed

        if (this.selectables.indexOf(node) > -1) {
            this.toggle(node);
        }

        this._end(event);
    }

    /**
     * Create the selector node when not provided by options object.
     * @return {HTMLElement}
     * @private
     */
    _createSelector() {
        var selector = document.createElement('div');

        selector.style.position = 'absolute';
        if (!this.customStyles) {
            selector.style.background = 'rgba(0, 0, 255, 0.1)';
            selector.style.border = '1px solid rgba(0, 0, 255, 0.45)';
            selector.style.display = 'none';
            selector.style.pointerEvents = 'none'; // fix for issue #8 (ie11+)
        }

        var _area = this.area === document ? document.body : this.area;
        _area.appendChild(selector);

        return selector;
    }

    // Start
    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Starts the functionality. Automatically triggered when created.
     * Also, reset the functionality after a teardown
     */
    start() {
        this._handleSelectables(this._initialSelectables);
        this.area.addEventListener('mousedown', this._startUp);
        this.area.addEventListener('touchstart', this._startUp, { passive: false });
    }

    /**
     * @param {Object} event - The event object.
     * @private
     */
    _startUp = event => this.startUp(event);

    /**
     * Startup when the area is clicked.
     * @param {Object} event - The event object.
     * @private
     */
    startUp(event) {
        // touchmove handler
        if (event.type === 'touchstart')
            // Call preventDefault() to prevent double click issue, see https://developer.mozilla.org/vi/docs/Web/API/Touch_events/Supporting_both_TouchEvent_and_MouseEvent
            event.preventDefault();

        if (this._isRightClick(event)) return;
        if (this._isScrollbarClick(event, this.area)) return;
        // callback
        this.onDragStartBegin(event);
        if (this._breaked) return false;

        this.mouseInteraction = true;
        this.selector.style.display = 'block';

        if (this._isMultiSelectKeyPressed(event))
            this._prevSelected = this._selected.slice();
        // #9
        else this._prevSelected = []; // #9

        // move element on location
        this._getStartingPositions(event);
        this.checkIfInsideSelection(true);

        this.selector.style.display = 'none'; // hidden unless moved, fix for issue #8

        // callback
        this.moveStartCallback(event);
        if (this._breaked) return false;

        // set max scroll values
        this._areaMaxScroll = {
            width: this.area.scrollWidth,
            height: this.area.scrollHeight,
        }

        // event listeners
        this.area.removeEventListener('mousedown', this._startUp);
        this.area.removeEventListener('touchstart', this._startUp, {
            passive: false
        });
        document.addEventListener('mousemove', this._handleMove);
        document.addEventListener('touchmove', this._handleMove, {
            passive: false
        });
        document.addEventListener('mouseup', this._end);
        document.addEventListener('touchend', this._end);
    }

    /**
     * Check if some multiselection modifier key is pressed
     * @param {Object} event - The event object.
     * @return {boolean} this._isMultiSelectKeyPressed
     * @private
     */
    _isMultiSelectKeyPressed(event) {
        this._multiSelectKeyPressed = false;

        if (this.multiSelectMode) {
            this._multiSelectKeyPressed = true;
        } else {
            for (var index = 0; index < this.multiSelectKeys.length; index++) {
                var mKey = this.multiSelectKeys[index];
                if (event[mKey]) {
                    this._multiSelectKeyPressed = true;
                }
            }
        }

        return this._multiSelectKeyPressed;
    }

    /**
     * Grabs the starting position of all needed elements
     * @param {Object} event - The event object.
     * @private
     */
    _getStartingPositions(event) {
        this._initialCursorPos = this._newCursorPos = this._getCursorPos(
            this.area,
            event,
        );
        this._initialScroll = this._getScroll(this.area);

        var selectorPos = {};
        selectorPos.x = this._initialCursorPos.x + this._initialScroll.x;
        selectorPos.y = this._initialCursorPos.y + this._initialScroll.y;
        selectorPos.w = 0;
        selectorPos.h = 0;
        this._updatePos(this.selector, selectorPos);
    }

    // Movements/Sizing of selection
    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * @param {Object} event - The event object.
     * @private
     */
    _handleMove = event => this.handleMove(event);

    /**
     * Handles what happens while the mouse is moved
     * @param {Object} event - The event object.
     * @private
     */
    handleMove(event) {
        const selectorPos = this._getPosition(event);

        // callback
        this.moveCallback(event);
        if (this._breaked) return false;

        this.selector.style.display = 'block'; // hidden unless moved, fix for issue #8

        // move element on location
        this._updatePos(this.selector, selectorPos);
        this.checkIfInsideSelection(null);

        // scroll area if area is scrollable
        this._setScrollState(event);
    }

    /**
     * Calculates and returns the exact x,y,w,h positions of the selector element
     * @param {object} [event] - The event object.
     * @returns {{x:number,y:number,w:number,h:number}}
     * @private
     */
    _getPosition(event) {
        var cursorPosNew = this._getCursorPos(this.area, event);
        var scrollNew = this._getScroll(this.area);

        // save for later retrieval
        this._newCursorPos = cursorPosNew;

        // if area or document is scrolled those values have to be included as well
        var scrollAmount = {
            x: scrollNew.x - this._initialScroll.x,
            y: scrollNew.y - this._initialScroll.y
        };

        /** check for direction
         *
         * This is quite complicated math, so also quite complicated to explain. Lemme’ try:
         *
         * Problem #1:
         * Sadly in HTML we can not have negative sizes.
         * so if we want to scale our element 10px to the right then it is easy,
         * we just have to add +10px to the width. But if we want to scale the element
         * -10px to the left then things become more complicated, we have to move
         * the element -10px to the left on the x axis and also scale the element
         * by +10px width to fake a negative sizing.
         *
         * One solution to this problem is using css-transforms scale() with
         * transform-origin of top left. BUT we can’t use this since it will size
         * everything, then when your element has a border for example, the border will
         * get inanely huge. Also transforms are not widely supported in IE.
         *
         * Example #1:
         * Unfortunately, things get even more complicated when we are inside a scrollable
         * DIV. Then, let’s say we scroll to the right by 10px and move the cursor right by 5px in our
         * checks we have to subtract 10px from the initialcursor position in our check
         * (since the initial position is moved to the left by 10px) so in our example:
         * 1. cursorPosNew.x (5) > initialCursorPos.x (0) - scrollAmount.x (10) === 5 > -10 === true
         * then reset the x position to its initial position (since we might have changed that
         * position when scrolling to the left before going right) in our example:
         * 2. selectorPos.x = initialCursorPos.x (0) + initialScroll.x (0) === 0;
         * then we cann calculate the elements width, which is
         * the new cursor position minus the initial one plus the scroll amount, so in our example:
         * 3. selectorPos.w = cursorPosNew.x (5) - initialCursorPos.x (0) + scrollAmount.x (10) === 15;
         *
         * let’s say after that movement we now scroll 20px to the left and move our cursor by 30px to the left:
         * 1b. cursorPosNew.x (-30) > initialCursorPos.x (0) - scrollAmount.x (-20) === -30 > -20 === false;
         * 2b. selectorPos.x = cursorPosNew.x (-30) + scrollNew.x (-20)
         *                   === -50;  // move left position to cursor (for more info see Problem #1)
         * 3b. selectorPos.w = initialCursorPos.x (0) - cursorPosNew.x (-30) - scrollAmount.x (-20)
         *                   === 0--30--20 === 0+30+20 === 50;  // scale width to original left position (for more info see Problem #1)
         *
         * same thing has to be done for top/bottom
         *
         * I hope that makes sense. Try stuff out and play around with variables to get a hang of it.
         */
        var selectorPos = {};

        // right
        if (cursorPosNew.x > this._initialCursorPos.x - scrollAmount.x) {
            // 1.
            selectorPos.x = this._initialCursorPos.x + this._initialScroll.x; // 2.
            selectorPos.w =
                cursorPosNew.x - this._initialCursorPos.x + scrollAmount.x; // 3.
            // left
        } else {
            // 1b.
            selectorPos.x = cursorPosNew.x + scrollNew.x; // 2b.
            selectorPos.w =
                this._initialCursorPos.x - cursorPosNew.x - scrollAmount.x; // 3b.
        }

        // bottom
        if (cursorPosNew.y > this._initialCursorPos.y - scrollAmount.y) {
            selectorPos.y = this._initialCursorPos.y + this._initialScroll.y;
            selectorPos.h =
                cursorPosNew.y - this._initialCursorPos.y + scrollAmount.y;
            // top
        } else {
            selectorPos.y = cursorPosNew.y + scrollNew.y;
            selectorPos.h =
                this._initialCursorPos.y - cursorPosNew.y - scrollAmount.y;
        }

        return selectorPos;
    }

    // Colision detection
    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Checks if any selectable element is inside selection.
     * @param {boolean} [force] forces through. Handles first clicks and accessibility. Here is user is clicking directly onto some element at start, (contrary to later hovers) we can assume that he really wants to select/deselect that item.
     * @return {boolean}
     */
    checkIfInsideSelection(force) {
        var anyInside = false;
        for (var i = 0, il = this.selectables.length; i < il; i++) {
            var selectable = this.selectables[i];

            var scroll = this._getScroll(this.area);
            var selectionRect = {
                y: this.selector.getBoundingClientRect().top / this.zoom + scroll.y,
                x: this.selector.getBoundingClientRect().left / this.zoom + scroll.x,
                h: this.selector.offsetHeight,
                w: this.selector.offsetWidth
            };
            if (this._isElementTouching(selectable, selectionRect, scroll)) {
                this._handleSelection(selectable, force);
                anyInside = true;
            } else {
                this._handleUnselection(selectable, force);
            }
        }
        return anyInside;
    }

    /**
     * Logic when an item is selected
     * @param {(HTMLElement|SVGElement)} item selected item.
     * @param {boolean} [force] forces through.
     * @private
     */
    _handleSelection(item, force) {
        if (item.classList.contains(this.hoverClass) && !force) {
            return false;
        }
        var posInSelectedArray = this._selected.indexOf(item);

        if (posInSelectedArray < 0) {
            this.select(item);
        } else if (posInSelectedArray > -1 && this._multiSelectKeyPressed) {
            this.unselect(item);
        }

        item.classList.add(this.hoverClass);
    }

    /**
     * Logic when an item is de-selected
     * @param {(HTMLElement|SVGElement)} item selected item.
     * @param {boolean} [force] forces through.
     * @private
     */
    _handleUnselection(item, force) {
        if (!item.classList.contains(this.hoverClass) && !force) {
            // return false;
        }
        var posInSelectedArray = this._selected.indexOf(item);
        var isInPrevSelection = this._prevSelected.indexOf(item); // #9

        /**
         * Special algorithm for issue #9.
         * if a multiselectkey is pressed, ds 'remembers' the last selection and reverts
         * to that state if the selection is not kept, to mimic the natural OS behaviour
         * = if item was selected and is not in selection anymore, reselect it
         * = if item was not selected and is not in selection anymore, unselect it
         */
        if (posInSelectedArray > -1 && isInPrevSelection < 0) {
            this.unselect(item);
        } else if (posInSelectedArray < 0 && isInPrevSelection > -1) {
            this.select(item);
        }

        item.classList.remove(this.hoverClass);
    }

    /**
     * Adds an item to the selection.
     * @param {(HTMLElement|SVGElement)} item selected item.
     * @return {(HTMLElement|SVGElement|false)} item
     */
    select(item) {
        if (this._selected.indexOf(item) > -1) return false;

        this._selected.push(item);
        item.classList.add(this.selectedClass);

        this.selectCallback(item);
        if (this._breaked) return false;

        return item;
    }

    /**
     * Removes an item from the selection.
     * @param {(HTMLElement|SVGElement)} item selected item.
     * @return {(HTMLElement|SVGElement|false)} item
     */
    unselect(item) {
        if (this._selected.indexOf(item) < 0) return false;

        this._selected.splice(this._selected.indexOf(item), 1);
        item.classList.remove(this.selectedClass);

        this.unselectCallback(item);
        if (this._breaked) return false;

        return item;
    }

    /**
     * Adds/Removes an item to the selection.
     * If it is already selected = remove, if not = add.
     * @param {(HTMLElement|SVGElement)} item – item to select.
     * @return {(HTMLElement|SVGElement)} item
     */
    toggle(item) {
        if (this._selected.indexOf(item) > -1) {
            this.unselect(item);
        } else {
            this.select(item);
        }

        return item;
    }

    /**
     * Checks if element is touched by the selector (and vice-versa)
     * @param {(HTMLElement|SVGElement)} element – item.
     * @param {Object} selectionRect – Container bounds:
       Example: {
        y: this.selector.getBoundingClientRect().top + scroll.y,
        x: this.selector.getBoundingClientRect().left + scroll.x,
        h: this.selector.offsetHeight,
        w: this.selector.offsetWidth
      };
     * @param {Object} scroll – Scroll x, y values.
     * @return {boolean}
     * @private
     */
    _isElementTouching(element, selectionRect, scroll) {
        const rect = element.getBoundingClientRect();
        const elementRect = {
            y: rect.top / this.zoom + scroll.y,
            x: rect.left / this.zoom + scroll.x,
            h: rect.height / this.zoom,
            w: rect.width / this.zoom
        };

        // Axis-Aligned Bounding Box Colision Detection.
        // Imagine following Example:
        //    b01
        // a01[1]a02
        //    b02      b11
        //          a11[2]a12
        //             b12
        // to check if those two boxes collide we do this AABB calculation:
        //& a01 < a12 (left border pos box1 smaller than right border pos box2)
        //& a02 > a11 (right border pos box1 larger than left border pos box2)
        //& b01 < b12 (top border pos box1 smaller than bottom border pos box2)
        //& b02 > b11 (bottom border pos box1 larger than top border pos box2)
        // See: https://en.wikipedia.org/wiki/Minimum_bounding_box#Axis-aligned_minimum_bounding_box and https://developer.mozilla.org/en-US/docs/Games/Techniques/2D_collision_detection
        if (
            selectionRect.x < elementRect.x + elementRect.w &&
            selectionRect.x + selectionRect.w > elementRect.x &&
            selectionRect.y < elementRect.y + elementRect.h &&
            selectionRect.h + selectionRect.y > elementRect.y
        ) {
            return true; // collision detected!
        } else {
            return false;
        }
    }

    // Autoscroll
    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Creates an interval that autoscrolls while the cursor
     * is near the edge
     * @param {Object} event – event object.
     * @private
     */
    _setScrollState(event) {
        const edge = this.isCursorNearEdge(this.area, event);

        if (edge) {
            if (this._autoScrollInterval)
                window.clearInterval(this._autoScrollInterval);

            this._autoScrollInterval = window.setInterval(() => {
                this._updatePos(this.selector, this._getPosition(event));
                this.checkIfInsideSelection(null);
                this._autoScroll(edge);
            });
        } else if (!edge && this._autoScrollInterval) {
            window.clearInterval(this._autoScrollInterval);
            this._autoScrollInterval = null;
        }
    }

    /**
     * Scroll the area in the direction of edge
     * @param {('top'|'bottom'|'left'|'right'|false)} edge
     * @private
     */
    _autoScroll(edge) {
        var docEl =
            document &&
            document.documentElement &&
            document.documentElement.scrollTop &&
            document.documentElement;
        var _area = this.area === document ? docEl || document.body : this.area;
        var maxVerScrollReached = (_area.clientHeight + _area.scrollTop) >= this._areaMaxScroll.height;
        var maxHorScrollReached = (_area.clientWidth + _area.scrollLeft) >= this._areaMaxScroll.width;

        if (maxVerScrollReached) {
            this.area.style.overflowY = "hidden";
        } else {
            this.area.style.overflowY = "scroll";
        }
        if (maxHorScrollReached) {
            this.area.style.overflowX = "hidden";
        } else {
            this.area.style.overflowX = "scroll";
        }

        if (edge === 'top' && _area.scrollTop > 0) {
            _area.scrollTop -= this.autoScrollSpeed;
        } else if (edge === 'bottom' && !maxVerScrollReached) {
            _area.scrollTop += this.autoScrollSpeed;
        } else if (edge === 'left' && _area.scrollLeft > 0) {
            _area.scrollLeft -= this.autoScrollSpeed;
        } else if (edge === 'right' && !maxHorScrollReached) {
            _area.scrollLeft += this.autoScrollSpeed;
        }
    }

    /**
     * Check if the selector is near an edge of the area
     * @param {(HTMLElement|SVGElement)} area the area.
     * @param {Object} [event] event object.
     * @return {('top'|'bottom'|'left'|'right'|false)}
     */
    isCursorNearEdge(area, event) {
        // @TODO DEPRECATION: remove support on next major release
        if (typeof area === "object" && this._isElement(event)) {
            console.warn("[DragSelect] DEPRECATION warning: this method signature is changing. From isCursorNearEdge(event, area) to isCursorNearEdge(area, event). Please use area as first argument and event as second. It will still work for now but functionality be removed soon")
            const _event = event
            const _area = area
            area = _event
            event = _area
        }

        var cursorPosition = this._getCursorPos(area, event);
        var areaRect = this._getAreaRect(area);

        var tolerance = {
            x: Math.max(areaRect.width / 10, 30),
            y: Math.max(areaRect.height / 10, 30)
        };

        if (cursorPosition.y < tolerance.y) {
            return 'top';
        } else if (areaRect.height - cursorPosition.y < tolerance.y) {
            return 'bottom';
        } else if (areaRect.width - cursorPosition.x < tolerance.x) {
            return 'right';
        } else if (cursorPosition.x < tolerance.x) {
            return 'left';
        }

        return false;
    }

    // Ending
    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Triggered on mouse click release (end of dragging a selection).
     * Calls the callback method & unbind functions.
     * @param {Object} event - The event object.
     * @private
     */
    _end = event => this.reset(event, true);

    /**
     * Unbind functions i.e. when mouse click is released
     * @param {Object} [event] - The event object.
     * @param {boolean} [withCallback] - whether or not the callback should be called
     */
    reset(event, withCallback) {
        this._previousCursorPos = this._getCursorPos(this.area, event);
        document.removeEventListener('mouseup', this._end);
        document.removeEventListener('touchend', this._end);
        document.removeEventListener('mousemove', this._handleMove);
        document.removeEventListener('touchmove', this._handleMove);
        this.area.addEventListener('mousedown', this._startUp);
        this.area.addEventListener('touchstart', this._startUp, { passive: false });

        // Reset overflow styles
        this.area.style.removeProperty('overflow');
        this.area.style.removeProperty('overflow-y');
        this.area.style.removeProperty('overflow-x');

        // callback
        this.onDragEnd(event);

        if (withCallback) this.callback(this.getSelection(), event);
        if (this._breaked) return false;

        this.selector.style.width = '0';
        this.selector.style.height = '0';
        this.selector.style.display = 'none';

        if (this._autoScrollInterval) {
            window.clearInterval(this._autoScrollInterval);
            this._autoScrollInterval = null;
        }

        setTimeout(
            () =>
                // debounce in order "onClick" to work
                (this.mouseInteraction = false),
            100
        );
    }

    /**
     * Function break: used in callbacks to disable the execution of the upcoming code at the specific moment
     * In contrary to stop():
     * - Event listeners, callback calls and calculation will continue working
     * - Selector won’t display and will not select
     */
    break() {
        this._breaked = true;
        setTimeout(
            // debounce the break should only break once instantly after call
            () => (this._breaked = false),
            100
        );
    }

    /**
     * Complete function teardown
     * Will teardown/stop the whole functionality
     * @param {boolean} [remove=true] - if elements should be removed.
     * @param {boolean} [fromSelection=true] - if elements should also be added/removed to the selection.
     * @param {boolean} [withCallback] - if elements should also be added/removed to the selection.
     */
    stop(remove = true, fromSelection = true, withCallback) {
        this.reset(false, withCallback);
        this.area.removeEventListener('mousedown', this._startUp);
        this.area.removeEventListener('touchstart', this._startUp, {
            passive: false
        });
        document.removeEventListener('mouseup', this._end);
        document.removeEventListener('touchend', this._end);

        this._handleSelectables([...this.selectables], remove, fromSelection);
    }

    // Useful methods for the user
    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Returns the current selected nodes
     * @return {Array.<(HTMLElement|SVGElement)>}
     */
    getSelection() {
        return [...this._selected];
    }

    /**
     * Returns cursor x, y position based on event object
     * Will be relative to an area including the scroll unless advised otherwise
     * @param {Object} [event]
     * @param {(HTMLElement|SVGElement|false)} [_area] containing area / this.area if === undefined / document if === false
     * @param {boolean} [ignoreScroll] if true, the scroll will be ignored
     * @return {{x:number,y:number}} cursor { x/y }
     */
    getCursorPos(event, _area, ignoreScroll) {
        if (!event) return { x: 0, y: 0 };

        var area = _area || (_area !== false && this.area);
        var pos = this._getCursorPos(area, event);
        var scroll = ignoreScroll ? { x: 0, y: 0 } : this._getScroll(area);

        return {
            x: pos.x + scroll.x,
            y: pos.y + scroll.y
        };
    }

    /**
     * Adds several items to the selection list
     * also adds the specific classes and take into account all calculations.
     * Does not clear the selection, in contrary to .setSelection
     * Can add multiple nodes at once, in contrary to .select
     * @param {Array.<(HTMLElement|SVGElement)>} _nodes one or multiple nodes
     * @param {boolean} [triggerCallback] - if callback should be called
     * @param {boolean} [dontAddToSelectables] - if element should not be added to the list of selectable nodes
     * @return {Array.<(HTMLElement|SVGElement)>} all selected nodes
     */
    addSelection(_nodes, triggerCallback, dontAddToSelectables) {
        var nodes = this._toArray(_nodes);

        for (var index = 0, il = nodes.length; index < il; index++) {
            var node = nodes[index];
            this.select(node);
        }

        if (!dontAddToSelectables) {
            this.addSelectables(nodes);
        }
        if (triggerCallback) {
            this.callback(this._selected);
        }

        return this._selected;
    }

    /**
     * Removes specific nodes from the selection
     * Multiple nodes can be given at once, in contrary to unselect
     * @param {Array.<(HTMLElement|SVGElement)>} _nodes one or multiple nodes
     * @param {boolean} [triggerCallback] - if callback should be called
     * @param {boolean} [removeFromSelectables] - if element should be removed from the list of selectable nodes
     * @return {Array} all selected nodes
     */
    removeSelection(_nodes, triggerCallback, removeFromSelectables) {
        var nodes = this._toArray(_nodes);

        for (var index = 0, il = nodes.length; index < il; index++) {
            var node = nodes[index];
            this.unselect(node);
        }

        if (removeFromSelectables) {
            this.removeSelectables(nodes);
        }
        if (triggerCallback) {
            this.callback(this._selected);
        }

        return this._selected;
    }

    /**
     * Toggles specific nodes from the selection:
     * If element is not in selection it will be added, if it is already selected, it will be removed.
     * Multiple nodes can be given at once.
     * @param {Array.<(HTMLElement|SVGElement)>} _nodes one or multiple nodes
     * @param {boolean} [triggerCallback] - if callback should be called
     * @param {boolean} [special] - if true, it also removes selected elements from possible selectable nodes & don’t add them to selectables if they are not
     * @return {Array} all selected nodes
     */
    toggleSelection(_nodes, triggerCallback, special) {
        var nodes = this._toArray(_nodes);

        for (var index = 0, il = nodes.length; index < il; index++) {
            var node = nodes[index];

            if (this._selected.indexOf(node) < 0) {
                this.addSelection(node, triggerCallback, special);
            } else {
                this.removeSelection(node, triggerCallback, special);
            }
        }

        return this._selected;
    }

    /**
     * Sets the current selected nodes and optionally run the callback
     * By default, adds new elements also to the list of selectables
     * @param {Array.<(HTMLElement|SVGElement)>} _nodes – dom nodes
     * @param {boolean} [triggerCallback] - if callback should be called
     * @param {boolean} [dontAddToSelectables] - if element should not be added to the list of selectable nodes
     * @return {Array.<(HTMLElement|SVGElement)>}
     */
    setSelection(_nodes, triggerCallback, dontAddToSelectables) {
        this.clearSelection();
        this.addSelection(_nodes, triggerCallback, dontAddToSelectables);

        return this._selected;
    }

    /**
     * Unselect / Deselect all current selected Nodes
     * @param {boolean} [triggerCallback] - if callback should be called
     * @return {Array.<(HTMLElement|SVGElement)>} this.selected, should be empty
     */
    clearSelection(triggerCallback) {
        var selection = this._selected.slice();
        for (var index = 0, il = selection.length; index < il; index++) {
            var node = selection[index];
            this.unselect(node);
        }

        if (triggerCallback) {
            this.callback(this._selected);
        }

        return this._selected;
    }

    /**
     * Add nodes that can be selected.
     * The algorithm makes sure that no node is added twice
     * @param {Array.<(HTMLElement|SVGElement)>} _nodes dom nodes
     * @param {boolean} [addToSelection] if elements should also be added to current selection
     * @return {Array.<(HTMLElement|SVGElement)>} _nodes the added node(s)
     */
    addSelectables(_nodes, addToSelection) {
        var nodes = this._toArray(_nodes);
        this._handleSelectables(nodes, false, addToSelection);
        return _nodes;
    }

    /**
     * Gets all nodes that can be selected
     * @return {Array.<(HTMLElement|SVGElement)>} this.selectables
     */
    getSelectables() {
        return this.selectables;
    }

    /**
     * Sets all elements that can be selected.
     * Removes all current selectables (& their respective classes).
     * Adds the new set to the selectables set, thus replacing the original set.
     * @param {Array.<(HTMLElement|SVGElement)>} nodes – dom nodes
     * @param {boolean} [removeFromSelection] if elements should also be removed from current selection
     * @param {boolean} [addToSelection] if elements should also be added to current selection
     * @return {Array.<(HTMLElement|SVGElement)>} nodes – the added node(s)
     */
    setSelectables(nodes, removeFromSelection, addToSelection) {
        this.removeSelectables(this.getSelectables(), removeFromSelection);
        return this.addSelectables(nodes, addToSelection);
    }

    /**
     * Remove nodes from the nodes that can be selected.
     * @param {Array.<(HTMLElement|SVGElement)>} _nodes – dom nodes
     * @param {boolean} [removeFromSelection] if elements should also be removed from current selection
     * @return {Array.<(HTMLElement|SVGElement)>} _nodes – the removed node(s)
     */
    removeSelectables(_nodes, removeFromSelection) {
        var nodes = this._toArray(_nodes);
        this._handleSelectables(nodes, true, removeFromSelection);
        return _nodes;
    }

    // Helpers
    //////////////////////////////////////////////////////////////////////////////////////

    /**
     * Based on a click event object,
     * checks if the right mouse button was pressed.
     * (found @ https://stackoverflow.com/a/2405835)
     * @param {object} event
     * @return {boolean}
     * @private
     */
    _isRightClick(event) {
        var isRightMB = false;

        if ('which' in event) {
            // Gecko (Firefox), WebKit (Safari/Chrome) & Opera
            isRightMB = event.which === 3;
        } else if ('button' in event) {
            // IE, Opera
            isRightMB = event.button === 2;
        }

        return isRightMB;
    }

    /**
     * Based on a click event object in an area,
     * checks if the click was triggered onto a scrollbar.
     * @param {object} event – the event object
     * @param {(HTMLElement|SVGElement|any)} area – containing area / document if none
     * @return {boolean}
     * @private
     */
    _isScrollbarClick(event, area) {
        const cPos = this._getCursorPos(area, event);
        const areaRect = this._getAreaRect(area);
        const border = area.computedBorder || 0;

        if (areaRect.width + border <= cPos.x) return true;
        if (areaRect.height + border <= cPos.y) return true;
        return false;
    }

    /**
     * Transforms a nodelist or single node to an array
     * so user doesn’t have to care.
     * @param {any} nodes
     * @return {array}
     * @private
     */
    _toArray(nodes) {
        if (!nodes) return [];
        if (!nodes.length && this._isElement(nodes)) return [nodes];

        const array = [];
        for (let i = nodes.length - 1; i >= 0; i--) {
            array[i] = nodes[i];
        }

        return array;
    }

    /**
     * Checks if a node is of type element
     * all credits to vikynandha: https://gist.github.com/vikynandha/6539809
     * @param {HTMLElement|SVGElement} node
     * @return {boolean}
     * @private
     */
    _isElement(node) {
        try {
            // Using W3 DOM2 (works for FF, Opera and Chrome), also checking for SVGs
            return node instanceof HTMLElement || node instanceof SVGElement;
        } catch (e) {
            // Browsers not supporting W3 DOM2 don't have HTMLElement and
            // an exception is thrown and we end up here. Testing some
            // properties that all elements have. (works even on IE7)
            return (
                typeof node === 'object' &&
                node.nodeType === 1 &&
                typeof node.style === 'object' &&
                typeof node.ownerDocument === 'object'
            );
        }
    }

    /**
     * Returns cursor x, y position based on event object
     * /!\ for internal calculation reasons it does _not_ take
     * the AREA scroll into consideration unless it’s the outer Document.
     * Use the public .getCursorPos() from outside, it’s more flexible
     * @param {(HTMLElement|SVGElement)} area – containing area / document if none
     * @param {MouseEvent|TouchEvent|any} [event]
     * @return {{x: number, y: number}} cursor X/Y
     * @private
     */
    _getCursorPos(area, event) {
        if (!event) return { x: 0, y: 0 };

        // touchend has not touches. so we take the last toucb if a touchevent, we need to store the positions on the prototype
        if ('touches' in event && event.type !== 'touchend') {
            this._lastTouch = event;
        }
        //if a touchevent, return the last touch rather than the regular event
        // we need .touches[0] from that event instead
        event = 'touches' in event ? this._lastTouch.touches[0] : event;

        var cPos = {
            // event.clientX/Y fallback for <IE8
            x: event.pageX || event.clientX,
            y: event.pageY || event.clientY
        };

        var areaRect = this._getAreaRect(area || document);
        var docScroll = this._getScroll(); // needed when document is scrollable but area is not
        return {
            // if it’s constrained in an area the area should be subtracted calculate
            x: (cPos.x - areaRect.left - docScroll.x) / this.zoom,
            y: (cPos.y - areaRect.top - docScroll.y) / this.zoom
        };
    }

    /**
     * Returns the starting/initial position of the cursor/selector
     * @return {{x:number,y:number}}
     */
    getInitialCursorPosition() {
        return this._initialCursorPos;
    }

    /**
     * Returns the last seen position of the cursor/selector
     * @return {{x:number,y:number}}
     */
    getCurrentCursorPosition() {
        return this._newCursorPos;
    }

    /**
     * Returns the previous position of the cursor/selector
     * @return {{x:number,y:number}}
     */
    getPreviousCursorPosition() {
        return this._previousCursorPos;
    }

    /**
     * Returns the cursor position difference between start and now
     * If usePreviousCursorDifference is passed,
     * it will output the cursor position difference between the previous selection and now
     * @param {boolean} [usePreviousCursorDifference]
     * @return {{x:number,y:number}}
     */
    getCursorPositionDifference(usePreviousCursorDifference) {
        var posA = this.getCurrentCursorPosition();
        var posB = usePreviousCursorDifference
            ? this.getPreviousCursorPosition()
            : this.getInitialCursorPosition();

        return {
            x: posA.x - posB.x,
            y: posA.y - posB.y
        };
    }

    /**
     * Returns the current x, y scroll value of a container
     * If container has no scroll it will return 0
     * @param {(HTMLElement|SVGElement)} [area]
     * @return {{x:number,y:number}} scroll X/Y
     * @deprecated
     */
    getScroll(area) {
        console.warn('[DragSelect]: .getScroll is being deprecated soon. Please do not use it any longer. If you have a real use-case for this, please let us know at https://github.com/ThibaultJanBeyer/DragSelect')
        return this._getScroll(area)
    }

    /**
     * Returns the current x, y scroll value of a container
     * If container has no scroll it will return 0
     * @param {(HTMLElement|SVGElement)} [area]
     * @return {{x:number,y:number}} scroll X/Y
     */
    _getScroll(area) {
        var body = {
            top:
                document.body.scrollTop > 0
                    ? document.body.scrollTop
                    : document.documentElement.scrollTop,
            left:
                document.body.scrollLeft > 0
                    ? document.body.scrollLeft
                    : document.documentElement.scrollLeft
        };

        var scroll = {
            // when the rectangle is bound to the document, no scroll is needed
            y: area && area.scrollTop >= 0 ? area.scrollTop : body.top,
            x: area && area.scrollLeft >= 0 ? area.scrollLeft : body.left
        };

        return scroll;
    }

    /**
     * Returns the top/left/bottom/right/width/height
     * values of a node. If Area is document then everything
     * except the sizes will be nulled.
     * @param {HTMLElement|SVGElement|any} area
     * @returns {{top:number,left:number,bottom:number,right:number,width:number,height:number}}
     * @deprecated
     */
    getAreaRect(area) {
        console.warn('[DragSelect]: .getAreaRect is being deprecated soon. Please do not use it any longer. If you have a real use-case for this, please let us know at https://github.com/ThibaultJanBeyer/DragSelect')
        return this._getAreaRect(area)
    }

    /**
     * Returns the top/left/bottom/right/width/height
     * values of a node. If Area is document then everything
     * except the sizes will be nulled.
     * @param {HTMLElement|SVGElement|any} area
     * @returns {{top:number,left:number,bottom:number,right:number,width:number,height:number}}
     */
    _getAreaRect(area) {
        if (area === document) {
            var size = {
                y:
                    area.documentElement.clientHeight > 0
                        ? area.documentElement.clientHeight
                        : window.innerHeight,
                x:
                    area.documentElement.clientWidth > 0
                        ? area.documentElement.clientWidth
                        : window.innerWidth
            };
            return {
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                width: size.x,
                height: size.y
            };
        }

        const rect = area.getBoundingClientRect();
        return {
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right,
            width: area.clientWidth || rect.width,
            height: area.clientHeight || rect.height
        };
    }

    /**
     * Updates the node style left, top, width,
     * height values accordingly.
     * @param {(HTMLElement|SVGElement)} node
     * @param {Object} pos { x, y, w, h }
     * @return {(HTMLElement|SVGElement)}
     * @private
     */
    _updatePos(node, pos) {
        node.style.left = pos.x + 'px';
        node.style.top = pos.y + 'px';
        node.style.width = pos.w + 'px';
        node.style.height = pos.h + 'px';
        return node;
    }
}

export default DragSelect